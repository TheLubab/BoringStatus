import { type InferSelectModel, relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { organization } from "@/modules/auth/auth.schema";
import { heartbeat } from "@/modules/heartbeats/heartbeats.schema";
import { notificationChannel } from "@/modules/integrations/integrations.schema";

import type {
	MonitorAlertRules,
	MonitorConfig,
	MonitorStatus,
	MonitorType,
} from "./monitors.zod";

export const monitor = pgTable(
	"monitor",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		// Identity
		type: text("type").notNull().$type<MonitorType>(),
		name: text("name").notNull(),
		target: text("target").notNull(),

		// Scheduling
		active: boolean("active").notNull(),
		frequency: integer("frequency").notNull(), // Seconds
		timeout: integer("timeout").notNull(), // Seconds

		regions: jsonb("regions").notNull().$type<string[]>(),

		// POLYMORPHIC CONFIGURATION
		config: jsonb("config").notNull().$type<MonitorConfig>(),

		// flexible rules: "Alert if latency > 2000ms" OR "Alert if CPU > 90%"
		alertRules: jsonb("alert_rules").notNull().$type<MonitorAlertRules>(),

		// State (cache)
		status: text("status").notNull().$type<MonitorStatus>(),
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

export type SelectMonitor = InferSelectModel<typeof monitor>;
