import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { getSession } from "@/modules/auth/auth.api";

import { monitor, monitorsToChannels } from "./monitors.schema";
import { type DashboardMonitor, insertMonitorSchema } from "./monitors.zod";
import { notificationChannel } from "../integrations/integrations.schema";

// Helper to ensure auth and org
const requireAuth = async () => {
  const session = await getSession();
  const activeOrgId = session?.activeOrganizationId;

  if (!session || !activeOrgId) {
    throw new Error("Unauthorized: You must be in an active Organization.");
  }
  return activeOrgId;
};

// Create a Monitor
export const createMonitor = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => insertMonitorSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await getSession();
    const activeOrgId = session?.activeOrganizationId;

    if (!session || !activeOrgId) {
      throw new Error("Unauthorized: You must be in an active Organization.");
    }

    const { channelIds, ...monitorData } = data;

    return await db.transaction(async (tx) => {
      // 1. Create the Monitor
      const [newMonitor] = await tx
        .insert(monitor)
        .values({
          ...monitorData,
          status: "pending",
          organizationId: activeOrgId,
        })
        .returning({ id: monitor.id });

      if (!newMonitor) {
        throw new Error("Failed to create monitor record");
      }

      // 2. Link Channels
      if (channelIds && channelIds.length > 0) {
        const channels = await tx.query.notificationChannel.findMany({
          where: and(
            inArray(notificationChannel.id, channelIds),
            eq(notificationChannel.organizationId, activeOrgId),
          ),
        });
        if (channels.length !== channelIds.length) {
          throw new Error("One or more channels not found or unauthorized");
        }
        await tx.insert(monitorsToChannels).values(
          channels.map((channel) => ({
            monitorId: newMonitor.id,
            channelId: channel.id,
          })),
        );
      }

      return { success: true, id: newMonitor.id };
    });
  });

// GET ALL MONITORS
export const getMonitorsByOrg = createServerFn({ method: "GET" }).handler(
  async () => {
    const activeOrgId = await requireAuth();

    const results = await db.query.monitor.findMany({
      where: eq(monitor.organizationId, activeOrgId),
      orderBy: [desc(monitor.createdAt)],
      with: {
        channels: {
          with: {
            channel: true,
          },
        },
      },
    });

    return results;
  },
);

export const getMonitorsByOrgForDashboard = createServerFn({
  method: "GET",
}).handler(async (): Promise<DashboardMonitor[]> => {
  const activeOrgId = await requireAuth();

  // 1. Get monitors
  const monitors = await db.query.monitor.findMany({
    where: eq(monitor.organizationId, activeOrgId),
    orderBy: [desc(monitor.createdAt)],
  });

  if (monitors.length === 0) return [];

  const monitorIds = monitors.map((m) => m.id);

  // 2. Aggregate uptime from continuous aggregate
  const uptimeStats = await db.execute<{
    monitor_id: string;
    uptime: number | null;
  }>(sql`
        SELECT
            monitor_id,
						CASE
								WHEN SUM(total_checks) IS NULL OR SUM(total_checks) = 0 THEN NULL
								ELSE ROUND((SUM(up_count)::numeric / SUM(total_checks)::numeric) * 100, 2)::int
						END AS uptime
        FROM monitor_stats_hourly
        WHERE monitor_id IN (${sql.join(monitorIds, sql`, `)})
          AND bucket >= NOW() - INTERVAL '24 hours'
        GROUP BY monitor_id
    `);

  // 3. Get recent latencies
  const latencyStats = await db.execute<{
    monitor_id: string;
    history: Array<{
      x: string;
      y: number | null; // null = no data for this hour
      up: boolean | null; // null = no data, false = was down, true = was up
    }>;
  }>(sql`
				SELECT
						monitor_id,
						json_agg(
										json_build_object(
												'x', hour,
												'y', avg_latency,
												'up', CASE
													WHEN total_checks IS NULL OR total_checks = 0 THEN NULL
													WHEN up_count > 0 THEN TRUE
													ELSE FALSE
												END
										) ORDER BY hour
						) as history
				FROM (
						SELECT
								time_bucket_gapfill('1 hour', bucket, NOW() - INTERVAL '23 hours', NOW()) AS hour,
								monitor_id,
								AVG(avg_latency) as avg_latency,
								SUM(up_count) as up_count,
								SUM(total_checks) as total_checks
						FROM monitor_stats_hourly
						WHERE monitor_id IN (${sql.join(monitorIds, sql`, `)})
							AND bucket >= NOW() - INTERVAL '24 hours'
						GROUP BY hour, monitor_id
				) AS filled_data
				GROUP BY monitor_id;
    `);

  // 4. Build lookup maps
  const uptimeMap = new Map(
    uptimeStats.rows.map((s) => [s.monitor_id, s.uptime]),
  );
  const latencyMap = new Map(
    latencyStats.rows.map((s) => [s.monitor_id, s.history]),
  );

  // 5. Get recent issues (down/error heartbeats)
  // TODO: remove, instead add new table for incidents
  const issueHeartbeats = await db.execute<{
    monitor_id: string;
    message: string | null;
    status: string;
  }>(sql`
        SELECT DISTINCT ON (monitor_id)
            monitor_id, message, status
        FROM heartbeat
        WHERE monitor_id IN (${sql.join(monitorIds, sql`, `)})
          AND status IN ('down', 'error')
          AND time > NOW() - INTERVAL '24 hours'
        ORDER BY monitor_id, time DESC
    `);

  const issuesMap = new Map(
    issueHeartbeats.rows.map((h) => [
      h.monitor_id,
      [{ message: h.message ?? `Status: ${h.status}` }],
    ]),
  );

  // 6. Map to DashboardMonitor
  return monitors.map((m) => ({
    ...m,
    uptime: uptimeMap.get(m.id) ?? null,
    history: latencyMap.get(m.id) ?? null,
    issues: issuesMap.get(m.id) ?? [],
  }));
});

// GET SINGLE MONITOR
export const getMonitorById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data: { id } }) => {
    const activeOrgId = await requireAuth();

    const result = await db.query.monitor.findFirst({
      where: and(eq(monitor.id, id), eq(monitor.organizationId, activeOrgId)),
      with: {
        channels: true,
      },
    });

    if (!result) {
      throw new Error("Monitor not found");
    }

    return {
      ...result,
      channelIds: result.channels.map((c) => c.channelId),
    };
  });

// UPDATE MONITOR
export const updateMonitor = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      data: insertMonitorSchema,
    }),
  )
  .handler(async ({ data: { id, data: formData } }) => {
    const activeOrgId = await requireAuth();
    const { channelIds, ...monitorData } = formData;

    return await db.transaction(async (tx) => {
      // 1. Update the base monitor record
      const [updatedMonitor] = await tx
        .update(monitor)
        .set({
          ...monitorData,
          updatedAt: new Date(),
        })
        .where(and(eq(monitor.id, id), eq(monitor.organizationId, activeOrgId)))
        .returning();

      if (!updatedMonitor) {
        throw new Error("Failed to update monitor or unauthorized");
      }

      // 2. Handle Channels Update

      // A. Delete existing links
      await tx
        .delete(monitorsToChannels)
        .where(eq(monitorsToChannels.monitorId, id));

      // B. Insert new links if provided
      if (channelIds && channelIds.length > 0) {
        const channels = await tx.query.notificationChannel.findMany({
          where: and(
            inArray(notificationChannel.id, channelIds),
            eq(notificationChannel.organizationId, activeOrgId),
          ),
        });
        if (channels.length !== channelIds.length) {
          throw new Error("One or more channels not found or unauthorized");
        }
        await tx.insert(monitorsToChannels).values(
          channels.map((channel) => ({
            monitorId: id,
            channelId: channel.id,
          })),
        );
      }

      return { success: true, id };
    });
  });

// DELETE MONITOR
export const deleteMonitor = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data: { id } }) => {
    const activeOrgId = await requireAuth();

    const [deleted] = await db
      .delete(monitor)
      .where(and(eq(monitor.id, id), eq(monitor.organizationId, activeOrgId)))
      .returning({ id: monitor.id });

    if (!deleted) {
      throw new Error("Failed to delete monitor or unauthorized");
    }

    return { success: true, id: deleted.id };
  });

// TOGGLE ACTIVE STATUS
export const toggleMonitorActive = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      active: z.boolean(),
    }),
  )
  .handler(async ({ data: { id, active } }) => {
    const activeOrgId = await requireAuth();

    const [updated] = await db
      .update(monitor)
      .set({ active })
      .where(and(eq(monitor.id, id), eq(monitor.organizationId, activeOrgId)))
      .returning({ id: monitor.id, active: monitor.active });

    if (!updated) {
      throw new Error("Failed to update status");
    }

    return { success: true, active: updated.active };
  });
