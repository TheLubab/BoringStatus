import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { organization } from "@/modules/auth/auth-schema";
import { monitorsToChannels } from "@/modules/monitors/monitors-schema";

export const notificationChannel = pgTable("notification_channel", {
	id: uuid("id").defaultRandom().primaryKey(),

	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	name: text("name").notNull(),
	type: text("type").notNull(), // 'email', 'slack', 'webhook', 'discord'

	config: jsonb("config").notNull().$type<{
		webhookUrl?: string;
		email?: string;
		channel?: string;
		apiKey?: string;
	}>(),

	verified: boolean("verified").default(false).notNull(),

	lastFailureAt: timestamp("last_failure_at"),
	failureCount: integer("failure_count").default(0),

	createdAt: timestamp("created_at").defaultNow(),
});

export const notificationChannelRelations = relations(
	notificationChannel,
	({ many }) => ({
		monitors: many(monitorsToChannels),
	}),
);
