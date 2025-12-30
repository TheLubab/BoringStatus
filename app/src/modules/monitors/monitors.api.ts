import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { getSession } from "@/modules/auth/auth.api";

import { monitor, monitorsToChannels } from "./monitors.schema";
import { insertMonitorSchema, type DashboardMonitor } from "./monitors.zod";
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
	const uptimeStats = await db.execute<{ monitor_id: string; uptime: number }>(sql`
        SELECT 
            monitor_id,
            COALESCE(SUM(up_count)::float / NULLIF(SUM(total_checks), 0) * 100, 100) AS uptime
        FROM monitor_stats_hourly
        WHERE monitor_id IN (${sql.join(monitorIds, sql`, `)})
          AND bucket > NOW() - INTERVAL '24 hours'
        GROUP BY monitor_id
    `);

	// 3. Get recent latencies 
	const latencyStats = await db.execute<{ monitor_id: string; latency_history: number[] }>(sql`
        SELECT 
            monitor_id,
            COALESCE(ARRAY_AGG(latency ORDER BY time DESC), ARRAY[]::int[]) AS latency_history
        FROM (
            SELECT monitor_id, latency, time
            FROM heartbeat
            WHERE monitor_id IN (${sql.join(monitorIds, sql`, `)})
              AND time > NOW() - INTERVAL '4 hours'
            ORDER BY time DESC
            LIMIT 50
        ) recent
        GROUP BY monitor_id
    `);

	// 4. Build lookup maps
	const uptimeMap = new Map(uptimeStats.rows.map((s) => [s.monitor_id, s.uptime]));
	const latencyMap = new Map(latencyStats.rows.map((s) => [s.monitor_id, s.latency_history]));

	// 5. Get recent issues (down/error heartbeats)
	const issueHeartbeats = await db.execute<{ monitor_id: string; message: string | null; status: string }>(sql`
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
		uptime: uptimeMap.get(m.id) ?? 100,
		latencyHistory: latencyMap.get(m.id)?.slice(0, 50) ?? [],
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
