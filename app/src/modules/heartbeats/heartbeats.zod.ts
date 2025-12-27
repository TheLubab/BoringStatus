import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { heartbeat } from "./heartbeats.schema";

// DATA
export const heartbeatStatusSchema = z.enum([
	"up",
	"down",
	"degraded",
	"error",
]);

export const httpMetricsSchema = z.object({
	dns: z.number(),
	connect: z.number(),
	ttfb: z.number(),
	total: z.number(),
	statusCode: z.number(),
	tls: z.number().optional(),
	contentLength: z.number().optional(),
	includesKeyword: z.boolean().optional(),
	excludesKeyword: z.boolean().optional(),
});

export const pingMetricsSchema = z.object({
	latency: z.number(),
	jitter: z.number().optional(),
	packetLoss: z.number(),
});

export const tcpMetricsSchema = z.object({
	connect: z.number(),
	success: z.boolean(),
});

export const heartbeatMetricsSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("http"), ...httpMetricsSchema.shape }),
	z.object({ type: z.literal("ping"), ...pingMetricsSchema.shape }),
	z.object({ type: z.literal("tcp"), ...tcpMetricsSchema.shape }),
]);

export type HeartbeatStatus = z.infer<typeof heartbeatStatusSchema>;
export type HttpMetrics = z.infer<typeof httpMetricsSchema>;
export type PingMetrics = z.infer<typeof pingMetricsSchema>;
export type TcpMetrics = z.infer<typeof tcpMetricsSchema>;
export type HeartbeatMetrics = z.infer<typeof heartbeatMetricsSchema>;

// API FUNCTIONS

export const insertHeartbeatSchema = createInsertSchema(heartbeat, {
	monitorId: z.uuid(),
	metrics: heartbeatMetricsSchema,
	status: heartbeatStatusSchema,
	time: z.coerce.date().optional(),
});

export const getHeartbeatsSchema = z.object({
	monitorId: z.uuid(),
	from: z.coerce.date(),
	to: z.coerce.date(),
});

export type InsertHeartbeat = z.infer<typeof insertHeartbeatSchema>;
export type GetHeartbeatsParams = z.infer<typeof getHeartbeatsSchema>;
