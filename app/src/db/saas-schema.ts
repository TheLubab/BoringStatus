import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	smallint,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// ---------------------------------------------------------
// ENUMS & TYPES
// ---------------------------------------------------------
export const monitorTypeEnum = pgEnum("monitor_type", ["http", "ping", "tcp"]);

// ---------------------------------------------------------
// 1. NOTIFICATION CHANNELS (Global for the user)
// ---------------------------------------------------------
export const notificationChannel = pgTable("notification_channel", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	name: text("name").notNull(), // e.g., "DevOps Slack"
	type: text("type").notNull(), // 'email', 'slack', 'webhook', 'discord'
	config: jsonb("config").notNull().$type<{
		webhookUrl?: string;
		email?: string;
		[key: string]: any;
	}>(), // { webhookUrl: "...", email: "..." }
	createdAt: timestamp("created_at").defaultNow(),
});

// ---------------------------------------------------------
// 2. MONITORS (The Configuration)
// ------------------------------r--------------------------
export const monitor = pgTable(
	"monitor",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id),

		// Identity
		type: monitorTypeEnum("type").notNull(),
		name: text("name").notNull(),
		target: text("target").notNull(), // URL, hostname...

		// -------------------------------------------------
		// CONFIGURATION MAPPING
		// -------------------------------------------------
		active: boolean("active").default(true).notNull(),
		frequency: integer("frequency")
			.default(60 * 5)
			.notNull(), // seconds
		timeout: integer("timeout").default(20), // seconds
		retries: smallint("retries").default(0),

		// TCP Specific
		port: integer("port"), // Nullable (only for TCP)

		// HTTP Specific
		method: text("method").default("GET"),
		// Storing as text allows ranges like "200-299" or lists "200,201"
		expectedStatus: text("expected_status").default("200-299"),
		// Store headers as JSONB
		headers: jsonb("headers").default([]).$type<any>(),
		keyword_found: text("keyword_found"), // "Must contain this text"
		keyword_missing: text("keyword_missing"), // "Must NOT contain this text"

		// -------------------------------------------------
		// FEATURE FLAGS (future release)
		// -------------------------------------------------
		// checkSsl: boolean("check_ssl").default(false),
		// checkDomain: boolean("check_domain").default(false),
		// checkDns: boolean("check_dns").default(false),

		// -------------------------------------------------
		// ALERTING CONFIG
		// -------------------------------------------------
		alertOnDown: boolean("alert_on_down").default(true),
		alertOnRecovery: boolean("alert_on_recovery").default(true),

		// -------------------------------------------------
		// OPERATIONAL STATE (Updated by Workers)
		// -------------------------------------------------
		status: text("status").default("pending"), // 'up', 'down', 'maintenance', 'pending'
		nextCheckAt: timestamp("next_check_at"),

		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [
		index("idx_monitor_user").on(table.userId),
		index("idx_monitor_next_check").on(table.nextCheckAt),
	],
);

// ---------------------------------------------------------
// 3. MANY-TO-MANY: MONITORS <-> CHANNELS
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 4. HEARTBEATS (TimescaleDB)
// ---------------------------------------------------------
export const heartbeat = pgTable(
	"heartbeat",
	{
		time: timestamp("time").defaultNow().notNull(),
		monitorId: uuid("monitor_id")
			.notNull()
			.references(() => monitor.id, { onDelete: "cascade" }),

		latency: integer("latency").notNull(),
		statusCode: integer("status_code"), // Nullable for Ping/TCP
		status: text("status").notNull(), // 'up', 'down'
		message: text("message"), // "Connection refused", "Timeout"

		// Add location if we have multi-region workers
		region: text("region").default("default"),
	},
	(table) => [
		index("idx_heartbeat_monitor_time").on(table.monitorId, table.time),
	],
);

// ---------------------------------------------------------
// Drizzle Relations (For Querying)
// ---------------------------------------------------------
export const monitorRelations = relations(monitor, ({ many }) => ({
	channels: many(monitorsToChannels),
	heartbeats: many(heartbeat),
}));

export const channelRelations = relations(notificationChannel, ({ many }) => ({
	monitors: many(monitorsToChannels),
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

// ---------------------------------------------------------
// 5. STATUS PAGES
// ---------------------------------------------------------
export const statusPage = pgTable("status_page", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(), // e.g. "my-status" -> status.boringstatus.com/my-status
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// ---------------------------------------------------------
// 6. MANY-TO-MANY: STATUS PAGES <-> MONITORS
// ---------------------------------------------------------
export const statusPageToMonitors = pgTable(
	"status_page_to_monitors",
	{
		statusPageId: uuid("status_page_id")
			.notNull()
			.references(() => statusPage.id, { onDelete: "cascade" }),
		monitorId: uuid("monitor_id")
			.notNull()
			.references(() => monitor.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.statusPageId, t.monitorId] })],
);

// ---------------------------------------------------------
// Status Page Relations
// ---------------------------------------------------------
export const statusPageRelations = relations(statusPage, ({ many }) => ({
	monitors: many(statusPageToMonitors),
}));

export const statusPageToMonitorsRelations = relations(
	statusPageToMonitors,
	({ one }) => ({
		statusPage: one(statusPage, {
			fields: [statusPageToMonitors.statusPageId],
			references: [statusPage.id],
		}),
		monitor: one(monitor, {
			fields: [statusPageToMonitors.monitorId],
			references: [monitor.id],
		}),
	}),
);
