import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { getSession } from "@/modules/auth/auth.api";
import { heartbeat } from "@/modules/heartbeats/heartbeats.schema";
import type {
    HeartbeatMetrics,
    HeartbeatStatus,
} from "@/modules/heartbeats/heartbeats.zod";
import { monitor } from "@/modules/monitors/monitors.schema";
import type { MonitorType } from "@/modules/monitors/monitors.zod";

// ─────────────────────────────────────────────────────────────────────────────
// DEV UTILITIES - Not for production use!
// ─────────────────────────────────────────────────────────────────────────────

const requireAuth = async () => {
    const session = await getSession();
    const activeOrgId = session?.activeOrganizationId;

    if (!session || !activeOrgId) {
        throw new Error("Unauthorized: Access restricted to organization members.");
    }
    return activeOrgId;
};

// Types for generation options
const generateHeartbeatsInputSchema = z.object({
    monitorId: z.string().uuid(),
    count: z.number().min(1).max(500).default(50),
    intervalMinutes: z.number().min(1).max(60).default(5),
    // Probability of different statuses (should sum to ~1)
    upProbability: z.number().min(0).max(1).default(0.92),
    degradedProbability: z.number().min(0).max(1).default(0.05),
    // down = 1 - up - degraded
});

// Helper to generate random HTTP metrics
const generateHttpMetrics = (status: HeartbeatStatus): HeartbeatMetrics => {
    const baseLatency = status === "up" ? 100 : status === "degraded" ? 400 : 2000;
    const variance = baseLatency * 0.3;

    const dns = Math.round(10 + Math.random() * 30);
    const connect = Math.round(20 + Math.random() * 50);
    const tls = Math.round(30 + Math.random() * 60);
    const ttfb = Math.round(baseLatency + (Math.random() - 0.5) * variance);
    const total = dns + connect + tls + ttfb + Math.round(Math.random() * 50);

    return {
        dns,
        connect,
        tls,
        ttfb,
        total,
        statusCode: status === "up" ? 200 : status === "degraded" ? 500 : 0,
        contentLength: 12500 + Math.round(Math.random() * 5000),
    };
};

// Helper to generate random Ping metrics
const generatePingMetrics = (status: HeartbeatStatus): HeartbeatMetrics => {
    const baseLatency = status === "up" ? 25 : status === "degraded" ? 150 : 500;
    const variance = baseLatency * 0.4;

    return {
        latency: Math.round(baseLatency + (Math.random() - 0.5) * variance),
        jitter: Math.round(2 + Math.random() * 10),
        packetLoss: status === "up" ? 0 : status === "degraded" ? 5 : 100,
    };
};

// Helper to generate random TCP metrics
const generateTcpMetrics = (status: HeartbeatStatus): HeartbeatMetrics => {
    const baseConnect = status === "up" ? 15 : status === "degraded" ? 100 : 5000;
    const variance = baseConnect * 0.3;

    return {
        connect: Math.round(baseConnect + (Math.random() - 0.5) * variance),
        success: status !== "down" && status !== "error",
    };
};

// Generate metrics based on monitor type
const generateMetrics = (
    type: MonitorType,
    status: HeartbeatStatus,
): HeartbeatMetrics => {
    switch (type) {
        case "http":
            return generateHttpMetrics(status);
        case "ping":
            return generatePingMetrics(status);
        case "tcp":
            return generateTcpMetrics(status);
        default:
            return generateHttpMetrics(status);
    }
};

// Determine status based on probabilities
const determineStatus = (
    upProb: number,
    degradedProb: number,
): HeartbeatStatus => {
    const rand = Math.random();
    if (rand < upProb) return "up";
    if (rand < upProb + degradedProb) return "degraded";
    if (rand < upProb + degradedProb + (1 - upProb - degradedProb) / 2)
        return "down";
    return "error";
};

// Get latency from metrics
const getLatencyFromMetrics = (metrics: HeartbeatMetrics): number => {
    if ("total" in metrics) return metrics.total;
    if ("latency" in metrics) return metrics.latency;
    if ("connect" in metrics) return metrics.connect;
    return 0;
};

// Server function to generate fake heartbeats
export const generateFakeHeartbeats = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => generateHeartbeatsInputSchema.parse(data))
    .handler(async ({ data }) => {
        const activeOrgId = await requireAuth();

        // Check if we're in development mode
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                "This function is only available in development mode for testing purposes.",
            );
        }

        // Verify monitor ownership
        const monitorRecord = await db.query.monitor.findFirst({
            where: eq(monitor.id, data.monitorId),
            columns: { id: true, type: true, frequency: true, organizationId: true },
        });

        if (!monitorRecord) {
            throw new Error("Monitor not found");
        }

        if (monitorRecord.organizationId !== activeOrgId) {
            throw new Error("Unauthorized: Monitor belongs to another organization");
        }

        // Generate heartbeats
        const heartbeats: Array<{
            time: Date;
            monitorId: string;
            region: string;
            status: HeartbeatStatus;
            latency: number;
            message: string | null;
            metrics: HeartbeatMetrics;
        }> = [];

        const now = new Date();
        const intervalMs = data.intervalMinutes * 60 * 1000;

        for (let i = 0; i < data.count; i++) {
            const time = new Date(now.getTime() - i * intervalMs);
            const status = determineStatus(
                data.upProbability,
                data.degradedProbability,
            );
            const metrics = generateMetrics(
                monitorRecord.type as MonitorType,
                status,
            );
            const latency = getLatencyFromMetrics(metrics);

            heartbeats.push({
                time,
                monitorId: data.monitorId,
                region: "default",
                status,
                latency,
                message:
                    status === "down"
                        ? "Connection refused"
                        : status === "error"
                            ? "Timeout exceeded"
                            : null,
                metrics,
            });
        }

        // Insert all heartbeats in a transaction
        await db.transaction(async (tx) => {
            // Batch insert heartbeats
            await tx.insert(heartbeat).values(heartbeats);

            // Update the monitor's last check time and status
            const latestHeartbeat = heartbeats[0]; // Most recent
            await tx
                .update(monitor)
                .set({
                    status: latestHeartbeat.status,
                    lastCheckAt: latestHeartbeat.time,
                    nextCheckAt: sql`NOW() + INTERVAL '1 second' * ${monitorRecord.frequency}`,
                })
                .where(eq(monitor.id, data.monitorId));
        });

        return {
            success: true,
            generated: heartbeats.length,
            monitorId: data.monitorId,
            timeRange: {
                from: heartbeats[heartbeats.length - 1].time.toISOString(),
                to: heartbeats[0].time.toISOString(),
            },
            statusBreakdown: {
                up: heartbeats.filter((h) => h.status === "up").length,
                degraded: heartbeats.filter((h) => h.status === "degraded").length,
                down: heartbeats.filter((h) => h.status === "down").length,
                error: heartbeats.filter((h) => h.status === "error").length,
            },
        };
    });

// Server function to clear all heartbeats for a monitor (for testing reset)
export const clearHeartbeatsForMonitor = createServerFn({ method: "POST" })
    .inputValidator(z.object({ monitorId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const activeOrgId = await requireAuth();

        // Check if we're in development mode
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                "This function is only available in development mode for testing purposes.",
            );
        }

        // Verify monitor ownership
        const monitorRecord = await db.query.monitor.findFirst({
            where: eq(monitor.id, data.monitorId),
            columns: { id: true, organizationId: true },
        });

        if (!monitorRecord) {
            throw new Error("Monitor not found");
        }

        if (monitorRecord.organizationId !== activeOrgId) {
            throw new Error("Unauthorized: Monitor belongs to another organization");
        }

        // Delete all heartbeats for this monitor
        await db.delete(heartbeat).where(eq(heartbeat.monitorId, data.monitorId));

        // Reset the monitor's status
        await db
            .update(monitor)
            .set({
                status: "pending",
                lastCheckAt: null,
                nextCheckAt: null,
            })
            .where(eq(monitor.id, data.monitorId));

        return { success: true, monitorId: data.monitorId };
    });
