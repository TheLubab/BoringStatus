import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { statusPage } from "./statuspages.schema";

// Base insert schema with validation
export const insertStatusPageSchema = createInsertSchema(statusPage, {
	organizationId: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	slug: z
		.string()
		.min(1, "Slug is required")
		.regex(
			/^[a-z0-9-]+$/,
			"Slug must only contain lowercase letters, numbers, and hyphens",
		),
	description: z.string().optional(),
	customDomain: z
		.string()
		.regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, "Must be a valid domain")
		.optional()
		.or(z.literal("")),
	password: z.string().optional(),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

// Schema for creating status page with monitor IDs
export const createStatusPageSchema = insertStatusPageSchema.and(
	z.object({
		monitorIds: z.array(z.uuid()).optional(),
	}),
);

// Schema for updating status page
export const updateStatusPageSchema = z.object({
	id: z.uuid(),
	data: insertStatusPageSchema.and(
		z.object({
			monitorIds: z.array(z.uuid()).optional(),
		}),
	),
});

// Schema for getting status page by ID
export const getStatusPageByIdSchema = z.object({
	id: z.uuid(),
});

// Schema for getting public status page by slug
export const getPublicStatusPageSchema = z.object({
	slug: z.string().min(1),
	password: z.string().optional(),
});

// Schema for deleting status page
export const deleteStatusPageSchema = z.object({
	id: z.uuid(),
});

export type InsertStatusPage = z.infer<typeof insertStatusPageSchema>;
export type CreateStatusPage = z.infer<typeof createStatusPageSchema>;
export type UpdateStatusPage = z.infer<typeof updateStatusPageSchema>;
export type GetStatusPageById = z.infer<typeof getStatusPageByIdSchema>;
export type GetPublicStatusPage = z.infer<typeof getPublicStatusPageSchema>;
export type DeleteStatusPage = z.infer<typeof deleteStatusPageSchema>;
