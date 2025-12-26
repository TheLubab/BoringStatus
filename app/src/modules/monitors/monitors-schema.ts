import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { organization, user } from "@/modules/auth/auth-schema";
import { heartbeat } from "@/modules/heartbeats/heartbeats-schema";
import { notificationChannel } from "@/modules/integrations/integrations-schema";

export const monitorTypeEnum = pgEnum("monitor_type", [
	"http", // Standard Web Check
	"ping", // ICMP Ping
	"port", // Port Check (e.g. is MySQL port 3306 open?)
	"dns", // DNS Resolution check
	"keyword", // HTML scraping check
	"docker", // Check container health
	"lighthouse", // Google Lighthouse Audit
	"disk_space", // Server Agent Resource Check
	"custom", // Generic API push
]);

export const monitor = pgTable(
	"monitor",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdById: text("created_by_id").references(() => user.id),

		// Identity
		type: monitorTypeEnum("type").notNull(),
		name: text("name").notNull(),
		// Target is generic: URL for HTTP, Container Name for Docker, Hostname for Ping...
		target: text("target").notNull(),

		// Scheduling
		active: boolean("active").default(true).notNull(),
		frequency: integer("frequency").default(300).notNull(), // Seconds
		timeout: integer("timeout").default(10).notNull(), // Seconds

		// Regions (SaaS: ["us-east", "eu-west"], OSS: ["local"])
		regions: jsonb("regions").default(["default"]).$type<string[]>(),

		// POLYMORPHIC CONFIGURATION
		// This column stores the specific settings for the chosen type.
		config: jsonb("config").default({}).notNull().$type<{
			// HTTP / Keyword
			method?: string; // "GET", "POST"
			headers?: Record<string, string>;
			body?: string;
			expectedStatus?: string; // "200-299"
			followRedirects?: boolean;

			// Keyword
			searchString?: string; // "Welcome to Dashboard"
			shouldNotExist?: boolean;

			// TCP / Ping
			port?: number;

			// Docker
			containerName?: string;
			host?: string; // "unix:///var/run/docker.sock"

			// Lighthouse
			strategies?: ("mobile" | "desktop")[];
			minScore?: number; // Alert if performance < 80
		}>(),

		// ADVANCED ALERTING RULES
		// Allows flexible rules: "Alert if latency > 2000ms" OR "Alert if CPU > 90%"
		alertRules: jsonb("alert_rules").default([]).$type<
			{
				metric: string; // "latency", "status_code", "metrics.cpu", "metrics.performance"
				operator: "gt" | "lt" | "eq" | "contains";
				value: number | string;
			}[]
		>(),

		// State (cache)
		status: text("status").default("pending"), // 'up', 'down', 'maintenance'
		lastCheckAt: timestamp("last_check_at"),
		nextCheckAt: timestamp("next_check_at"),

		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("idx_monitor_org").on(t.organizationId),
		index("idx_monitor_next_check").on(t.nextCheckAt),
	],
);

// Monitor <-> Integrations
export const monitorsToChannels = pgTable(
	"monitors_to_channels",
	{
		monitorId: uuid("monitor_id")
			.notNull()
			.references(() => monitor.id, { onDelete: "cascade" }),
		channelId: uuid("channel_id")
			.notNull()
			.references(() => notificationChannel.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.monitorId, t.channelId] })],
);

// Relations
export const monitorRelations = relations(monitor, ({ many, one }) => ({
	organization: one(organization, {
		fields: [monitor.organizationId],
		references: [organization.id],
	}),
	createdBy: one(user, {
		fields: [monitor.createdById],
		references: [user.id],
	}),
	channels: many(monitorsToChannels),
	heartbeats: many(heartbeat),
}));

export const monitorsToChannelsRelations = relations(
	monitorsToChannels,
	({ one }) => ({
		monitor: one(monitor, {
			fields: [monitorsToChannels.monitorId],
			references: [monitor.id],
		}),
		channel: one(notificationChannel, {
			fields: [monitorsToChannels.channelId],
			references: [notificationChannel.id],
		}),
	}),
);
