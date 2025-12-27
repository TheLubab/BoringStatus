import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "@/modules/auth/auth.schema";

export const subscription = pgTable("subscription", {
	organizationId: text("organization_id")
		.primaryKey()
		.references(() => organization.id, { onDelete: "cascade" }),

	// Billing provider
	provider: text("provider").notNull(),
	providerCustomerId: text("provider_customer_id").notNull(),
	providerSubscriptionId: text("provider_subscription_id").unique(),
	billingEmail: text("billing_email"),
	metadata: jsonb("metadata").$type<Record<string, unknown>>(),

	// Plan & Status (WIP)
	plan: text("plan").notNull().$type<
		| "starter" // $9,  20 monitors, 3min, 60day, 3 status pages, 1 seat
		| "pro" // $24, 75 monitors, 1min, 90day, 10 status pages, 3 seats
		| "business" // $79, 300 monitors, 30s, 1year, unlimited pages, 10 seats
	>(),
	status: text("status")
		.notNull()
		.$type<"trial" | "active" | "past_due" | "canceled">(),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),

	// Hard Limits (Cached from Plan)
	limits: jsonb("limits").notNull().default({}).$type<{
		monitorLimit?: number;
		checkIntervalSeconds?: number;
		dataRetentionDays?: number;
		statusPagesLimit?: number;
		statusPagesCustomDomain?: boolean;
		teamMembersLimit?: number;
	}>(),

	// Billing Periods
	currentPeriodStart: timestamp("current_period_start"),
	currentPeriodEnd: timestamp("current_period_end"),

	// Cancel
	canceledAt: timestamp("canceled_at"),
	cancelReason: text("cancel_reason"),

	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
