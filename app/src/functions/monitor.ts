import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { heartbeat, monitor, monitorsToChannels } from "@/db/saas-schema";
import { insertMonitorSchema } from "@/db/zod";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";

export type MonitorData = typeof monitor.$inferSelect;

export interface DashboardMonitor {
	id: string;
	name: string;
	target: string;
	status: "up" | "down" | "maintenance" | "pending";
	uptime: number;
	latencyHistory: number[];
	issues: {
		id: string;
		message: string;
		severity: "high" | "medium" | "low";
	}[];
}

// --- 1. GET DASHBOARD LIST ---

export const getMonitorsData = createServerFn({ method: "GET" }).handler(
	async (): Promise<DashboardMonitor[]> => {
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});
		if (!session) throw new Error("Unauthorized");

		// Get all monitors for the user
		const userMonitors = await db.query.monitor.findMany({
			where: eq(monitor.userId, session.user.id),
			orderBy: [desc(monitor.createdAt)],
		});

		// Fetch heartbeat data for each monitor
		const monitorsWithData = await Promise.all(
			userMonitors.map(async (m) => {
				const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

				// Get heartbeats from last 24 hours only
				const last24hHeartbeats = await db
					.select({
						latency: heartbeat.latency,
						statusCode: heartbeat.statusCode,
						status: heartbeat.status,
						message: heartbeat.message,
						time: heartbeat.time,
					})
					.from(heartbeat)
					.where(
						and(
							eq(heartbeat.monitorId, m.id),
							sql`${heartbeat.time} >= ${twentyFourHoursAgo}`,
						),
					)
					.orderBy(heartbeat.time); // Order ascending for time-series

				// Calculate uptime percentage (last 24 hours)
				const total = last24hHeartbeats.length;
				const upCount = last24hHeartbeats.filter(
					(hb) => hb.status === "up",
				).length;
				const uptime = total > 0 ? (upCount / total) * 100 : 100;

				// Get recent issues (down status in last 24 hours)
				const recentIssues = last24hHeartbeats
					.filter((hb) => hb.status === "down" && hb.message)
					.slice(-3) // Get last 3 issues
					.reverse()
					.map((hb, idx) => ({
						id: `issue-${m.id}-${idx}`,
						message: hb.message || "Unknown error",
						severity: (hb.statusCode && hb.statusCode >= 500 ? "high" : "medium") as
							| "high"
							| "medium"
							| "low",
					}));

				// Build latency history using TimescaleDB time_bucket for better performance
				// Group into hourly buckets for cleaner visualization
				const latencyBuckets = await db.execute<{ avg_latency: number }>(sql`
					SELECT 
						AVG(latency)::int as avg_latency
					FROM ${heartbeat}
					WHERE monitor_id = ${m.id}
						AND time >= ${twentyFourHoursAgo}
					GROUP BY time_bucket('1 hour', time)
					ORDER BY time_bucket('1 hour', time) ASC
					LIMIT 24
				`);

				const latencyHistory = latencyBuckets.rows.map(
					(row) => row.avg_latency,
				);

				return {
					id: m.id,
					name: m.name,
					target: m.target,
					status: (m.status || "pending") as
						| "up"
						| "down"
						| "maintenance"
						| "pending",
					uptime: Math.round(uptime * 10) / 10,
					latencyHistory,
					issues: recentIssues,
				};
			}),
		);

		return monitorsWithData;
	},
);

// --- 2. GET SINGLE MONITOR DETAILS (Chart + Stats) ---
export const getMonitorDetails = createServerFn({ method: "GET" })
	.inputValidator((data: { monitorId: string }) => data)
	.handler(async ({ data }) => {
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});
		if (!session) throw new Error("Unauthorized");

		const monitorId = data.monitorId;

		// A. Fetch Basic Info
		const monitorr = await db.query.monitor.findFirst({
			where: and(
				eq(monitor.id, monitorId),
				eq(monitor.userId, session.user.id),
			),
		});

		if (!monitorr) throw new Error("Monitor not found");

		// B. Fetch Chart Data (TimescaleDB magic)
		// We use sql`` to call the specific Timescale function 'time_bucket'
		// Grouping by 1 hour for the last 24 hours
		const chartResult = await db.execute(sql`
  SELECT 
    time_bucket('1 hour', time) AS bucket,
    ROUND(AVG(latency))::int AS avg_latency,
    ROUND(COUNT(*) FILTER (WHERE status = 'up') * 100.0 / NULLIF(COUNT(*), 0), 2) AS uptime_pct
  FROM heartbeat
  WHERE monitor_id = ${monitorId}
    AND time > NOW() - INTERVAL '24 hours'
  GROUP BY time_bucket('1 hour', time)
  ORDER BY bucket ASC
`);

		const chart = chartResult.rows.map((row: any) => ({
			time: new Date(row.bucket).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			}),
			latency: row.avg_latency || 0,
			status: (row.uptime_pct || 0) < 100 ? "down" : "up",
		}));

		// C. Fetch Recent Logs
		const recentChecks = await db.query.heartbeat.findMany({
			where: eq(heartbeat.monitorId, monitorId),
			orderBy: [desc(heartbeat.time)],
			limit: 20,
		});

		// D. Calculate 24h Uptime & Avg Latency
		const stats24hResult: any = await db.execute(sql`
      SELECT 
        count(*) as total,
        count(*) filter (where status = 'up') as up_count,
        AVG(latency)::int as avg_latency
      FROM ${heartbeat}
      WHERE ${heartbeat.monitorId} = ${monitorId}
      AND ${heartbeat.time} > NOW() - INTERVAL '24 hours'
    `);

		const total24h = Number(stats24hResult.rows[0]?.total) || 1;
		const up24h = Number(stats24hResult.rows[0]?.up_count) || 0;
		const uptime24h = total24h > 0 ? ((up24h / total24h) * 100).toFixed(2) : "100.00";
		const avgLatency = Math.round(Number(stats24hResult.rows[0]?.avg_latency) || 0);

		// E. Calculate 30d Uptime
		const stats30dResult: any = await db.execute(sql`
      SELECT 
        count(*) as total,
        count(*) filter (where status = 'up') as up_count
      FROM ${heartbeat}
      WHERE ${heartbeat.monitorId} = ${monitorId}
      AND ${heartbeat.time} > NOW() - INTERVAL '30 days'
    `);

		const total30d = Number(stats30dResult.rows[0]?.total) || 1;
		const up30d = Number(stats30dResult.rows[0]?.up_count) || 0;
		const uptime30d = total30d > 0 ? ((up30d / total30d) * 100).toFixed(2) : "100.00";

		// F. Get Connected Channels
		const connected = await db.query.monitorsToChannels.findMany({
			where: eq(monitorsToChannels.monitorId, monitorId),
		});

		return {
			monitor: monitorr,
			chart,
			recentChecks,
			stats: {
				uptime24h,
				uptime30d,
				avgLatency,
			},
			connectedValue: connected.map((c) => c.channelId),
		};
	});

// --- 3. CREATE MONITOR ACTION ---
// --- 3. CREATE MONITOR ACTION ---
export const createMonitor = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => insertMonitorSchema.parse(data))
	.handler(async ({ data }) => {
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});
		if (!session) throw new Error("Unauthorized");

		const { channelIds, ...monitorData } = data;

		// 1. Create Monitor
		const [newMonitor] = await db
			.insert(monitor)
			.values({
				...monitorData,
				userId: session.user.id,
				status: "pending",
			})
			.returning({ id: monitor.id });

		if (!newMonitor) {
			throw new Error("Failed to create monitor");
		}

		// 2. Link Channels if any
		if (channelIds && channelIds.length > 0) {
			await db.insert(monitorsToChannels).values(
				channelIds.map((channelId) => ({
					monitorId: newMonitor.id,
					channelId,
				})),
			);
		}

		return { success: true, id: newMonitor.id };
	});

// --- 4. UPDATE MONITOR ACTION ---
export const updateMonitor = createServerFn({ method: "POST" })
	.inputValidator((data: any) =>
		insertMonitorSchema.partial().extend({ monitorId: z.string() }).parse(data),
	)
	.handler(async ({ data }) => {
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});
		if (!session) throw new Error("Unauthorized");

		const { monitorId, channelIds, ...updateData } = data;

		// 1. Verify ownership
		const existing = await db.query.monitor.findFirst({
			where: and(
				eq(monitor.id, monitorId),
				eq(monitor.userId, session.user.id),
			),
		});
		if (!existing) throw new Error("Monitor not found");

		// 2. Update Monitor
		await db
			.update(monitor)
			.set(updateData)
			.where(eq(monitor.id, monitorId));

		// 3. Update Channels if provided
		if (channelIds !== undefined) {
			// Remove all existing
			await db
				.delete(monitorsToChannels)
				.where(eq(monitorsToChannels.monitorId, monitorId));

			// Add new ones
			if (channelIds.length > 0) {
				await db.insert(monitorsToChannels).values(
					channelIds.map((channelId: string) => ({
						monitorId,
						channelId,
					})),
				);
			}
		}

		return { success: true };
	});

// --- 5. TOGGLE MONITOR STATUS ---
export const toggleMonitorActive = createServerFn({ method: "POST" })
	.inputValidator((data: { monitorId: string; active: boolean }) =>
		z.object({ monitorId: z.string(), active: z.boolean() }).parse(data),
	)
	.handler(async ({ data }) => {
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});
		if (!session) throw new Error("Unauthorized");

		const { monitorId, active } = data;

		// Update
		await db
			.update(monitor)
			.set({ active })
			.where(
				and(
					eq(monitor.id, monitorId),
					eq(monitor.userId, session.user.id),
				),
			);

		return { success: true };
	});

// --- 6. DELETE MONITOR ---
export const deleteMonitor = createServerFn({ method: "POST" })
	.inputValidator((data: { monitorId: string }) =>
		z.object({ monitorId: z.string() }).parse(data),
	)
	.handler(async ({ data }) => {
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});
		if (!session) throw new Error("Unauthorized");

		const { monitorId } = data;

		await db
			.delete(monitor)
			.where(
				and(
					eq(monitor.id, monitorId),
					eq(monitor.userId, session.user.id),
				),
			);

		return { success: true };
	});
