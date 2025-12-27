import {
	boolean,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { organization } from "@/modules/auth/auth.schema";

export const apiKey = pgTable("api_key", {
	id: uuid("id").defaultRandom().primaryKey(),

	// null if it's a system key
	// TODO: this may be an attack surface, careful with that
	organizationId: text("organization_id").references(() => organization.id),

	key: text("key").notNull().unique(),

	name: text("name").notNull(),

	tags: jsonb("tags").default(["default"]).$type<string[]>(),

	scopes: jsonb("scopes").default([]).$type<string[]>(),

	// Meta
	lastUsedAt: timestamp("last_used_at"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow(),
});
