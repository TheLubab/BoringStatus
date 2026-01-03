import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { getSession } from "@/modules/auth/auth.api";

import { monitor, monitorsToChannels } from "./monitors.schema";
import {
	type DashboardMonitor,
	type MonitorDetails,
	type MonitorDetailsCheck,
	type MonitorDetailsHistoryEntry,
	type MonitorDetailsStats,
	insertMonitorSchema,
} from "./monitors.zod";
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

// GET MONITOR DETAILS (For View Page)
export const getMonitorDetails = createServerFn({ method: "GET" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data: { id } }): Promise<MonitorDetails> => {
		const activeOrgId = await requireAuth();

		// 1. Fetch monitor with channels
		const monitorResult = await db.query.monitor.findFirst({
			where: and(eq(monitor.id, id), eq(monitor.organizationId, activeOrgId)),
			with: {
				channels: true,
			},
		});

		if (!monitorResult) {
			throw new Error("Monitor not found");
		}

		const monitorId = monitorResult.id;

		// 2. Get aggregated stats from continuous aggregate
		const statsResult = await db.execute<{
			avg_latency: number | null;
			min_latency: number | null;
			max_latency: number | null;
			uptime_24h: number | null;
			uptime_7d: number | null;
			uptime_30d: number | null;
			total_checks_24h: number | null;
			up_checks_24h: number | null;
			down_checks_24h: number | null;
		}>(sql`
      WITH stats_24h AS (
        SELECT
          AVG(avg_latency) as avg_latency,
          MIN(min_latency) as min_latency,
          MAX(max_latency) as max_latency,
          SUM(total_checks)::int as total_checks,
          SUM(up_count)::int as up_count,
          SUM(CASE WHEN total_checks > up_count THEN total_checks - up_count ELSE 0 END)::int as down_count
        FROM monitor_stats_hourly
        WHERE monitor_id = ${monitorId}
          AND bucket >= NOW() - INTERVAL '24 hours'
      ),
      stats_7d AS (
        SELECT
          CASE
            WHEN SUM(total_checks) IS NULL OR SUM(total_checks) = 0 THEN NULL
            ELSE ROUND((SUM(up_count)::numeric / SUM(total_checks)::numeric) * 100, 2)
          END AS uptime
        FROM monitor_stats_hourly
        WHERE monitor_id = ${monitorId}
          AND bucket >= NOW() - INTERVAL '7 days'
      ),
      stats_30d AS (
        SELECT
          CASE
            WHEN SUM(total_checks) IS NULL OR SUM(total_checks) = 0 THEN NULL
            ELSE ROUND((SUM(up_count)::numeric / SUM(total_checks)::numeric) * 100, 2)
          END AS uptime
        FROM monitor_stats_hourly
        WHERE monitor_id = ${monitorId}
          AND bucket >= NOW() - INTERVAL '30 days'
      )
      SELECT
        COALESCE(s24.avg_latency, 0) as avg_latency,
        s24.min_latency,
        s24.max_latency,
        CASE
          WHEN s24.total_checks IS NULL OR s24.total_checks = 0 THEN NULL
          ELSE ROUND((s24.up_count::numeric / s24.total_checks::numeric) * 100, 2)
        END AS uptime_24h,
        s7.uptime as uptime_7d,
        s30.uptime as uptime_30d,
        COALESCE(s24.total_checks, 0) as total_checks_24h,
        COALESCE(s24.up_count, 0) as up_checks_24h,
        COALESCE(s24.down_count, 0) as down_checks_24h
      FROM stats_24h s24
      CROSS JOIN stats_7d s7
      CROSS JOIN stats_30d s30
    `);

		const statsRow = statsResult.rows[0];

		// 3. Get recent checks
		const recentChecksResult = await db.execute<{
			time: Date;
			status: string;
			latency: number | null;
			status_code: number | null;
			message: string | null;
		}>(sql`
      SELECT
        time,
        status,
        latency,
        (metrics->>'statusCode')::int as status_code,
        message
      FROM heartbeat
      WHERE monitor_id = ${monitorId}
      ORDER BY time DESC
      LIMIT 30
    `);

		// 4. Get hourly history for chart (24h with gap fill)
		const historyResult = await db.execute<{
			x: string;
			y: number | null;
			up: boolean | null;
			min_latency: number | null;
			max_latency: number | null;
			up_count: number;
			down_count: number;
		}>(sql`
      SELECT
        hour as x,
        avg_latency as y,
        CASE
          WHEN total_checks IS NULL OR total_checks = 0 THEN NULL
          WHEN up_count > 0 THEN TRUE
          ELSE FALSE
        END as up,
        min_latency,
        max_latency,
        COALESCE(up_count, 0)::int as up_count,
        COALESCE(CASE WHEN total_checks > up_count THEN total_checks - up_count ELSE 0 END, 0)::int as down_count
      FROM (
        SELECT
          time_bucket_gapfill('1 hour', bucket, NOW() - INTERVAL '23 hours', NOW()) AS hour,
          AVG(avg_latency) as avg_latency,
          MIN(min_latency) as min_latency,
          MAX(max_latency) as max_latency,
          SUM(up_count) as up_count,
          SUM(total_checks) as total_checks
        FROM monitor_stats_hourly
        WHERE monitor_id = ${monitorId}
          AND bucket >= NOW() - INTERVAL '24 hours'
        GROUP BY hour
      ) AS filled_data
      ORDER BY hour ASC
    `);

		// 5. Build the response
		const stats: MonitorDetailsStats = {
			avgLatency: Math.round(Number(statsRow?.avg_latency) || 0),
			minLatency: statsRow?.min_latency
				? Math.round(Number(statsRow.min_latency))
				: null,
			maxLatency: statsRow?.max_latency
				? Math.round(Number(statsRow.max_latency))
				: null,
			uptime24h: statsRow?.uptime_24h ? Number(statsRow.uptime_24h) : null,
			uptime7d: statsRow?.uptime_7d ? Number(statsRow.uptime_7d) : null,
			uptime30d: statsRow?.uptime_30d ? Number(statsRow.uptime_30d) : null,
			totalChecks24h: Number(statsRow?.total_checks_24h) || 0,
			successfulChecks24h: Number(statsRow?.up_checks_24h) || 0,
			failedChecks24h: Number(statsRow?.down_checks_24h) || 0,
			lastCheckAt: monitorResult.lastCheckAt,
		};

		const recentChecks: MonitorDetailsCheck[] = recentChecksResult.rows.map(
			(row) => ({
				time: row.time,
				status: row.status as MonitorDetailsCheck["status"],
				latency: row.latency,
				statusCode: row.status_code,
				message: row.message,
			}),
		);

		const history24h: MonitorDetailsHistoryEntry[] = historyResult.rows.map(
			(row) => ({
				x: row.x,
				y: row.y ? Math.round(Number(row.y)) : null,
				up: row.up,
				minLatency: row.min_latency
					? Math.round(Number(row.min_latency))
					: null,
				maxLatency: row.max_latency
					? Math.round(Number(row.max_latency))
					: null,
				upCount: Number(row.up_count),
				downCount: Number(row.down_count),
			}),
		);

		const { channels: _, ...monitorData } = monitorResult;

		return {
			...monitorData,
			channelIds: monitorResult.channels.map((c) => c.channelId),
			stats,
			recentChecks,
			history24h,
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
