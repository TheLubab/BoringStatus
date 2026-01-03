import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { monitor, SelectMonitor } from "./monitors.schema";
import type { HeartbeatStatus } from "../heartbeats/heartbeats.zod";

// Re-export for convenience
export type { SelectMonitor } from "./monitors.schema";

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
	operator: z.enum(["gt", "lt", "eq", "neq", "contains", "not_contains"]),
	value: z.coerce.string<any>(),
});

export const monitorAlertRulesSchema = z
	.array(monitorAlertRuleSchema)
	.max(256)
	.transform((rules) => {
		const seen = new Set<string>();
		const rules_ = rules
			.filter((rule) => {
				// dedup
				const key = JSON.stringify(rule);
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			})
			.filter((rule) => {
				// remove body rules (we make them part of config.in/excludesKeyword)
				return rule.metric !== "body";
			});

		return rules_;
	});

export type MonitorType = z.infer<typeof monitorTypeSchema>;
export type MonitorAlertRules = z.infer<typeof monitorAlertRulesSchema>;

export type MonitorStatus = HeartbeatStatus | "pending";

// MONITOR CONFIGS

const httpConfigSchema = z.object({
	method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
	expectedStatus: z
		.string()
		.regex(
			/^(\d{3}(-\d{3})?)(,\s*\d{3}(-\d{3})?)*$/,
			"Format: 200 or 200,201 or 200-299",
		),
	followRedirects: z.boolean(),
	headers: z.record(z.string(), z.string()).optional(),
	body: z.string().optional(),
	includesKeyword: z.string().optional(),
	excludesKeyword: z.string().optional(),
});

const tcpConfigSchema = z.object({
	port: z.coerce
		.number<any>()
		.min(1)
		.max(65535, "Port must be between 1 and 65535"),
	protocol: z.enum(["TCP", "UDP"]),
});

const pingConfigSchema = z.object({});

export type HttpConfig = z.infer<typeof httpConfigSchema>;
export type TcpConfig = z.infer<typeof tcpConfigSchema>;
export type PingConfig = z.infer<typeof pingConfigSchema>;

export type MonitorConfig = HttpConfig | TcpConfig | PingConfig;

// THE BASE MONITOR SCHEMA

const baseMonitorSchema = createInsertSchema(monitor, {
	frequency: z.number().min(60).max(86400),
	timeout: z.number().min(1).max(60),
	alertRules: monitorAlertRulesSchema,
}).omit({
	id: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	lastCheckAt: true,
	nextCheckAt: true,
	organizationId: true,
});

// THE DISCRIMINATED UNION
export const insertMonitorSchema = z
	.discriminatedUnion("type", [
		// HTTP
		baseMonitorSchema.extend({
			type: z.literal("http"),
			config: httpConfigSchema,
			target: z.url("Must be a valid URL"),
		}),

		// PING
		baseMonitorSchema
			.extend({
				type: z.literal("ping"),
				config: pingConfigSchema,
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

// DASHBOARD TYPES (Read Models)

export interface MonitorIssue {
	message: string;
}

export interface DashboardHistoryEntry {
	x: string; // ISO Timestamp
	y: number | null; // Latency (null = no data for this hour)
	up: boolean | null; // Was it up? (null = no data, false = down, true = up)
}

export interface DashboardMonitor extends SelectMonitor {
	uptime: number | null;
	history: Array<DashboardHistoryEntry> | null;
	issues: MonitorIssue[] | null;
}

// MONITOR DETAILS TYPES (For View Page)

export interface MonitorDetailsStats {
	avgLatency: number;
	minLatency: number | null;
	maxLatency: number | null;
	uptime24h: number | null;
	uptime7d: number | null;
	uptime30d: number | null;
	totalChecks24h: number;
	successfulChecks24h: number;
	failedChecks24h: number;
	lastCheckAt: Date | null;
}

export interface MonitorDetailsCheck {
	time: Date;
	status: HeartbeatStatus;
	latency: number | null;
	statusCode: number | null;
	message: string | null;
}

export interface MonitorDetailsHistoryEntry {
	x: string; // ISO Timestamp (hourly bucket)
	y: number | null; // Avg latency (null = no data)
	up: boolean | null; // Was it up? (null = no data, false = had failures, true = all up)
	minLatency: number | null;
	maxLatency: number | null;
	upCount: number;
	downCount: number;
}

export interface MonitorDetails extends SelectMonitor {
	channelIds: string[];
	stats: MonitorDetailsStats;
	recentChecks: MonitorDetailsCheck[];
	history24h: MonitorDetailsHistoryEntry[];
}
