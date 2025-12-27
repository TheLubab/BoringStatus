import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { monitor } from "./monitors.schema";
import type { HeartbeatStatus } from "../heartbeats/heartbeats.zod";

// Data
export const monitorTypeSchema = z.enum([
	"http", // Standard Web Check
	"ping", // ICMP Ping
	"tcp", // Port Check

	// future maybe?
	// "dns", // DNS Resolution check
	// "docker", // Check container health
	// "lighthouse", // Google Lighthouse Audit
	// "disk_space", // Server Agent Resource Check
	// "custom",
]);

export const monitorAlertRuleSchema = z.object({
	metric: z.string(),
	operator: z.enum(["gt", "lt", "eq", "contains"]),
	value: z.coerce.string(),
});

export type MonitorType = z.infer<typeof monitorTypeSchema>;
export type MonitorAlertRule = z.infer<typeof monitorAlertRuleSchema>;

export type MonitorStatus = HeartbeatStatus | "pending";

// MONITOR CONFIGS

const httpConfigSchema = z.object({
	method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
	expectedStatus: z
		.string()
		.regex(
			/^(\d{3}(-\d{3})?)(,\s*\d{3}(-\d{3})?)*$/,
			"Format: 200 or 200,201 or 200-299",
		)
		.default("200-299"),
	followRedirects: z.boolean().default(true),
	headers: z.record(z.string(), z.string()).optional(),
	body: z.string().optional(),
	includesKeyword: z.string().optional(),
	excludesKeyword: z.string().optional(),
});

const tcpConfigSchema = z.object({
	port: z.coerce.number().min(1).max(65535, "Port must be between 1 and 65535"),
});

const pingConfigSchema = z.object({
	port: z.coerce.number().min(1).max(65535, "Port must be between 1 and 65535"),
});

export type HttpConfig = z.infer<typeof httpConfigSchema>;
export type TcpConfig = z.infer<typeof tcpConfigSchema>;
export type PingConfig = z.infer<typeof pingConfigSchema>;

export type MonitorConfig = HttpConfig | TcpConfig | PingConfig;

// THE BASE MONITOR SCHEMA

const baseMonitorSchema = createInsertSchema(monitor, {
	organizationId: z.string().optional(),

	frequency: z.coerce.number().min(60).max(86400),
	timeout: z.coerce.number().min(1).max(60),

	regions: z.array(z.string()).default(["default"]),
	config: z.any(),
}).omit({
	id: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	lastCheckAt: true,
	nextCheckAt: true,
});

// THE DISCRIMINATED UNION

export const insertMonitorSchema = z
	.discriminatedUnion("type", [
		// HTTP
		baseMonitorSchema
			.extend({
				type: z.literal("http"),
				config: httpConfigSchema,
			})
			.refine(
				(data) => {
					try {
						new URL(data.target);
						return true;
					} catch {
						return false;
					}
				},
				{ message: "Must be a valid URL", path: ["target"] },
			),

		// PING
		baseMonitorSchema
			.extend({
				type: z.literal("ping"),
				config: pingConfigSchema, // No extra config needed
			})
			.refine(
				(data) => {
					const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(data.target);
					const isHost = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(
						data.target,
					);
					return isIp || isHost;
				},
				{ message: "Must be a valid Hostname or IP", path: ["target"] },
			),

		// TCP
		baseMonitorSchema
			.extend({
				type: z.literal("tcp"),
				config: tcpConfigSchema,
			})
			.refine(
				(data) => {
					const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(data.target);
					const isHost = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(
						data.target,
					);
					return isIp || isHost;
				},
				{ message: "Must be a valid Hostname or IP", path: ["target"] },
			),
	])
	.and(
		z.object({
			channelIds: z.array(z.string()).optional(),
		}),
	);

export type InsertMonitor = z.infer<typeof insertMonitorSchema>;
