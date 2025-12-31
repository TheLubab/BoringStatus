import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { getSession } from "@/modules/auth/auth.api";
import { heartbeat } from "@/modules/heartbeats/heartbeats.schema";
import type { HeartbeatMetrics, HeartbeatStatus } from "@/modules/heartbeats/heartbeats.zod";
import { monitor } from "@/modules/monitors/monitors.schema";
import type { MonitorType, MonitorStatus, DashboardMonitor } from "@/modules/monitors/monitors.zod";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const requireAuth = async () => {
    const session = await getSession();
    if (!session?.activeOrganizationId) throw new Error("Unauthorized");
    return session.activeOrganizationId;
};

const requireDev = () => {
    if (process.env.NODE_ENV === "production") throw new Error("Dev only");
};

const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ─────────────────────────────────────────────────────────────────────────────
// Monitor CRUD
// ─────────────────────────────────────────────────────────────────────────────

export const getMonitorsForDevtools = createServerFn({ method: "GET" }).handler(
    async (): Promise<Pick<DashboardMonitor, "id" | "name" | "status" | "target" | "type">[]> => {
        const orgId = await requireAuth();
        return db.query.monitor.findMany({
            where: eq(monitor.organizationId, orgId),
            orderBy: [desc(monitor.createdAt)],
            columns: { id: true, name: true, status: true, target: true, type: true },
        });
    },
);

const RANDOM_DOMAINS = ["api", "app", "dashboard", "auth", "payments", "cdn", "static", "ws", "graphql", "webhook"];
const RANDOM_TLDS = ["com", "io", "dev", "co", "app"];
const RANDOM_HTTP_PATHS = ["/health", "/api/v1/status", "/ping", "/_health", "/healthz", "/api/health"];
const RANDOM_TCP_PORTS = [22, 80, 443, 3306, 5432, 6379, 27017, 9200];

export const createRandomMonitor = createServerFn({ method: "POST" })
    .inputValidator(z.object({ type: z.enum(["http", "tcp", "ping"]) }))
    .handler(async ({ data }) => {
        const orgId = await requireAuth();
        requireDev();

        const domain = randomFrom(RANDOM_DOMAINS);
        const tld = randomFrom(RANDOM_TLDS);
        const baseName = domain.charAt(0).toUpperCase() + domain.slice(1);

        let name: string;
        let target: string;
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic config
        let config: any;

        switch (data.type) {
            case "http": {
                const path = randomFrom(RANDOM_HTTP_PATHS);
                name = `${baseName} API`;
                target = `https://${domain}.example.${tld}${path}`;
                config = {
                    method: randomFrom(["GET", "POST", "HEAD"]),
                    expectedStatus: String(randomFrom([200, 201, 204])),
                    followRedirects: Math.random() > 0.5,
                };
                if (Math.random() > 0.7) config.includesKeyword = "ok";
                break;
            }
            case "tcp": {
                const port = randomFrom(RANDOM_TCP_PORTS);
                name = `${baseName} TCP:${port}`;
                target = `${domain}.example.${tld}`;
                config = { port, protocol: randomFrom(["TCP", "UDP"]) };
                break;
            }
            case "ping": {
                name = `${baseName} Ping`;
                target = `${domain}.example.${tld}`;
                config = {};
                break;
            }
        }

        const [newMonitor] = await db
            .insert(monitor)
            .values({
                name,
                target,
                type: data.type as MonitorType,
                frequency: randomFrom([60, 120, 300]),
                timeout: randomFrom([15, 30, 60]),
                organizationId: orgId,
                active: true,
                status: "pending" as MonitorStatus,
                regions: ["default"],
                alertRules: [],
                config,
            })
            .returning({ id: monitor.id, name: monitor.name, type: monitor.type });

        return newMonitor;
    });

export const deleteMonitorDev = createServerFn({ method: "POST" })
    .inputValidator(z.object({ monitorId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const orgId = await requireAuth();
        requireDev();

        const m = await db.query.monitor.findFirst({
            where: eq(monitor.id, data.monitorId),
            columns: { id: true, organizationId: true },
        });
        if (!m || m.organizationId !== orgId) throw new Error("Monitor not found");

        await db.transaction(async (tx) => {
            await tx.delete(heartbeat).where(eq(heartbeat.monitorId, data.monitorId));
            await tx.delete(monitor).where(eq(monitor.id, data.monitorId));
        });

        return { deleted: true };
    });

// ─────────────────────────────────────────────────────────────────────────────
// Heartbeats
// ─────────────────────────────────────────────────────────────────────────────

export const clearHeartbeats = createServerFn({ method: "POST" })
    .inputValidator(z.object({ monitorId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const orgId = await requireAuth();
        requireDev();

        const m = await db.query.monitor.findFirst({
            where: eq(monitor.id, data.monitorId),
            columns: { id: true, organizationId: true },
        });
        if (!m || m.organizationId !== orgId) throw new Error("Monitor not found");

        await db.transaction(async (tx) => {
            await tx.delete(heartbeat).where(eq(heartbeat.monitorId, data.monitorId));
            await tx.update(monitor).set({ status: "pending", lastCheckAt: null, nextCheckAt: null }).where(eq(monitor.id, data.monitorId));
        });

        return { cleared: true };
    });

// Pattern-based heartbeat simulation
type Pattern = "stable" | "degrading" | "incident" | "recovery" | "intermittent" | "maintenance";

const patternGenerators: Record<Pattern, (pos: number) => { status: HeartbeatStatus; latencyMult: number }> = {
    stable: () => {
        if (Math.random() > 0.98) return { status: "degraded", latencyMult: 1.5 };
        return { status: "up", latencyMult: 0.8 + Math.random() * 0.4 };
    },
    degrading: (pos) => {
        const chance = pos * 0.6;
        const r = Math.random();
        if (r < chance * 0.3) return { status: "down", latencyMult: 5 + pos * 5 };
        if (r < chance) return { status: "degraded", latencyMult: 2 + pos * 3 };
        return { status: "up", latencyMult: 1 + pos * 2 };
    },
    incident: (pos) => {
        if (pos < 0.33) return { status: "up", latencyMult: 0.8 + Math.random() * 0.3 };
        if (pos < 0.66) {
            const p = (pos - 0.33) / 0.33;
            if (p < 0.1 || p > 0.9) return { status: "degraded", latencyMult: 2.5 };
            return { status: Math.random() > 0.1 ? "down" : "error", latencyMult: 10 };
        }
        const p = (pos - 0.66) / 0.34;
        if (p < 0.3) return { status: Math.random() > 0.3 ? "up" : "degraded", latencyMult: 1.5 };
        return { status: "up", latencyMult: 1 };
    },
    recovery: (pos) => {
        if (pos < 0.2) return { status: "down", latencyMult: 10 };
        if (pos < 0.4) return { status: Math.random() > 0.5 ? "down" : "degraded", latencyMult: 5 };
        if (pos < 0.6) return { status: Math.random() > 0.3 ? "degraded" : "up", latencyMult: 2 };
        if (pos < 0.8) return { status: Math.random() > 0.2 ? "up" : "degraded", latencyMult: 1.3 };
        return { status: "up", latencyMult: 1 };
    },
    intermittent: () => {
        const r = Math.random();
        if (r > 0.85) return { status: "down", latencyMult: 8 };
        if (r > 0.7) return { status: "degraded", latencyMult: 3 };
        if (r > 0.6) return { status: "error", latencyMult: 10 };
        return { status: "up", latencyMult: 1 + Math.random() * 2 };
    },
    maintenance: (pos) => {
        if (pos > 0.4 && pos < 0.6) return { status: "down", latencyMult: 0 };
        return { status: "up", latencyMult: 0.9 + Math.random() * 0.2 };
    },
};

const generateMetrics = (type: MonitorType, latencyMult: number, status: HeartbeatStatus): HeartbeatMetrics => {
    const base = type === "ping" ? 25 : type === "tcp" ? 15 : 100;
    const latency = Math.round(base * latencyMult * (0.8 + Math.random() * 0.4));

    if (type === "http") {
        return {
            dns: Math.round(10 + Math.random() * 20),
            connect: Math.round(20 + Math.random() * 30),
            tls: Math.round(30 + Math.random() * 40),
            ttfb: Math.round(latency * 0.6),
            total: latency,
            statusCode: status === "up" ? 200 : status === "degraded" ? 503 : 0,
            contentLength: status === "up" ? 12000 + Math.round(Math.random() * 5000) : 0,
        };
    }
    if (type === "ping") {
        return {
            latency,
            jitter: Math.round(2 + Math.random() * 10 * latencyMult),
            packetLoss: status === "up" ? 0 : status === "degraded" ? 20 : 100,
        };
    }
    return { connect: latency, success: status === "up" || status === "degraded" };
};

const simulateSchema = z.object({
    monitorId: z.string().uuid(),
    pattern: z.enum(["stable", "degrading", "incident", "recovery", "intermittent", "maintenance"]),
    minutes: z.number(),
    interval: z.number(),
    label: z.string().optional(),
});

export const simulateRealisticHeartbeats = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => simulateSchema.parse(data))
    .handler(async ({ data }) => {
        const orgId = await requireAuth();
        requireDev();

        const mon = await db.query.monitor.findFirst({
            where: eq(monitor.id, data.monitorId),
            columns: { id: true, type: true, frequency: true, organizationId: true },
        });
        if (!mon || mon.organizationId !== orgId) throw new Error("Monitor not found");

        const now = Date.now();
        const intervalMs = data.interval * 60 * 1000;
        const count = Math.floor(data.minutes / data.interval);
        const generator = patternGenerators[data.pattern];

        const heartbeats: Array<{
            time: Date;
            monitorId: string;
            region: string;
            status: HeartbeatStatus;
            latency: number;
            message: string | null;
            metrics: HeartbeatMetrics;
        }> = [];

        let totalLatency = 0;
        let upCount = 0;

        for (let i = 0; i < count; i++) {
            const pos = i / count;
            const time = new Date(now - (count - i) * intervalMs);
            const { status, latencyMult } = generator(pos);
            const metrics = generateMetrics(mon.type as MonitorType, latencyMult, status);
            const latency = "total" in metrics ? metrics.total : "latency" in metrics ? metrics.latency : metrics.connect;

            heartbeats.push({
                time,
                monitorId: data.monitorId,
                region: "default",
                status,
                latency,
                message: status === "down" ? "Connection refused" : status === "error" ? "Timeout" : null,
                metrics,
            });

            totalLatency += latency;
            if (status === "up") upCount++;
        }

        await db.transaction(async (tx) => {
            await tx.delete(heartbeat).where(eq(heartbeat.monitorId, data.monitorId));
            await tx.insert(heartbeat).values(heartbeats);

            const latest = heartbeats[heartbeats.length - 1];
            await tx.update(monitor).set({
                status: latest.status,
                lastCheckAt: latest.time,
                nextCheckAt: sql`NOW() + INTERVAL '1 second' * ${mon.frequency}`,
            }).where(eq(monitor.id, data.monitorId));
        });

        return {
            count: heartbeats.length,
            uptime: Math.round((upCount / count) * 100),
            avgLatency: Math.round(totalLatency / count),
            pattern: data.pattern,
        };
    });

// ─────────────────────────────────────────────────────────────────────────────
// Aggregates
// ─────────────────────────────────────────────────────────────────────────────

export const refreshAggregates = createServerFn({ method: "POST" }).handler(async () => {
    await requireAuth();
    requireDev();

    await db.execute(sql`
		CALL refresh_continuous_aggregate('monitor_stats_hourly', 
			(NOW() - INTERVAL '3 days')::TIMESTAMP, 
			NOW()::TIMESTAMP
		)
	`);

    return { success: true };
});
