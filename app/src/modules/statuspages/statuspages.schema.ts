import { relations } from "drizzle-orm";
import {
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { organization } from "@/modules/auth/auth.schema";
import { monitor } from "@/modules/monitors/monitors.schema";

export const statusPage = pgTable("status_page", {
	id: uuid("id").defaultRandom().primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id),

	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),

	customDomain: text("custom_domain").unique(),
	password: text("password"),

	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

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

// Relations
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
