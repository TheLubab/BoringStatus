import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "@/modules/auth/auth-schema";

export const subscription = pgTable("subscription", {
	organizationId: text("organization_id")
		.primaryKey()
		.references(() => organization.id, { onDelete: "cascade" }),

	// Plan Limits
	plan: text("plan").default("pro").notNull(),
	status: text("status").default("active"), // 'active', 'past_due'

	// Hard Limits (Cached from Plan)
	monitorLimit: integer("monitor_limit").default(5),
	checkIntervalLimit: integer("check_interval_limit").default(60),
	seatLimit: integer("seat_limit").default(10),

	currentPeriodEnd: timestamp("current_period_end"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),

	// TODO: use polar.sh
});
