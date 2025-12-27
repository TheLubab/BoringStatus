import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { getSession } from "@/modules/auth/auth.api";

import {
	statusPage,
	statusPageToMonitors,
} from "./statuspages.schema";
import {
	createStatusPageSchema,
	deleteStatusPageSchema,
	getPublicStatusPageSchema,
	getStatusPageByIdSchema,
	updateStatusPageSchema,
} from "./statuspages.zod";

// Helper to ensure auth and org
const requireAuth = async () => {
	const session = await getSession();
	const activeOrgId = session?.activeOrganizationId;

	if (!session || !activeOrgId) {
		throw new Error("Unauthorized: You must be in an active Organization.");
	}
	return activeOrgId;
};

// GET ALL STATUS PAGES
export const getStatusPagesByOrg = createServerFn({ method: "GET" }).handler(
	async () => {
		const activeOrgId = await requireAuth();

		const results = await db.query.statusPage.findMany({
			where: eq(statusPage.organizationId, activeOrgId),
			orderBy: [desc(statusPage.createdAt)],
			with: {
				monitors: {
					with: {
						monitor: {
							columns: {
								id: true,
								name: true,
								status: true,
							},
						},
					},
				},
			},
		});

		return results;
	},
);

// GET SINGLE STATUS PAGE
export const getStatusPageById = createServerFn({ method: "GET" })
	.inputValidator(getStatusPageByIdSchema)
	.handler(async ({ data: { id } }) => {
		const activeOrgId = await requireAuth();

		const result = await db.query.statusPage.findFirst({
			where: and(
				eq(statusPage.id, id),
				eq(statusPage.organizationId, activeOrgId),
			),
			with: {
				monitors: {
					with: {
						monitor: {
							columns: {
								id: true,
								name: true,
								status: true,
							},
						},
					},
				},
			},
		});

		if (!result) {
			throw new Error("Status page not found");
		}

		return {
			...result,
			monitorIds: result.monitors.map((m) => m.monitorId),
		};
	});

// CREATE STATUS PAGE
export const createStatusPage = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => createStatusPageSchema.parse(data))
	.handler(async ({ data }) => {
		const activeOrgId = await requireAuth();

		const { monitorIds, ...statusPageData } = data;

		return await db.transaction(async (tx) => {
			// 1. Create the Status Page
			const [newStatusPage] = await tx
				.insert(statusPage)
				.values({
					...statusPageData,
					organizationId: activeOrgId,
					customDomain: statusPageData.customDomain || null,
					password: statusPageData.password || null,
				})
				.returning({ id: statusPage.id });

			if (!newStatusPage) {
				throw new Error("Failed to create status page record");
			}

			// 2. Link Monitors
			if (monitorIds && monitorIds.length > 0) {
				await tx.insert(statusPageToMonitors).values(
					monitorIds.map((monitorId) => ({
						statusPageId: newStatusPage.id,
						monitorId,
					})),
				);
			}

			return { success: true, id: newStatusPage.id };
		});
	});

// UPDATE STATUS PAGE
export const updateStatusPage = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => updateStatusPageSchema.parse(data))
	.handler(async ({ data: { id, data: formData } }) => {
		const activeOrgId = await requireAuth();
		const { monitorIds, ...statusPageData } = formData;

		return await db.transaction(async (tx) => {
			// 1. Update the base status page record
			const [updatedStatusPage] = await tx
				.update(statusPage)
				.set({
					...statusPageData,
					customDomain: statusPageData.customDomain || null,
					password: statusPageData.password || null,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(statusPage.id, id),
						eq(statusPage.organizationId, activeOrgId),
					),
				)
				.returning();

			if (!updatedStatusPage) {
				throw new Error("Failed to update status page or unauthorized");
			}

			// 2. Handle Monitors Update

			// A. Delete existing links
			await tx
				.delete(statusPageToMonitors)
				.where(eq(statusPageToMonitors.statusPageId, id));

			// B. Insert new links if provided
			if (monitorIds && monitorIds.length > 0) {
				await tx.insert(statusPageToMonitors).values(
					monitorIds.map((monitorId) => ({
						statusPageId: id,
						monitorId,
					})),
				);
			}

			return { success: true, id };
		});
	});

// DELETE STATUS PAGE
export const deleteStatusPage = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => deleteStatusPageSchema.parse(data))
	.handler(async ({ data: { id } }) => {
		const activeOrgId = await requireAuth();

		const [deleted] = await db
			.delete(statusPage)
			.where(
				and(
					eq(statusPage.id, id),
					eq(statusPage.organizationId, activeOrgId),
				),
			)
			.returning({ id: statusPage.id });

		if (!deleted) {
			throw new Error("Failed to delete status page or unauthorized");
		}

		return { success: true, id: deleted.id };
	});

// GET PUBLIC STATUS PAGE (BY SLUG) - No auth required
export const getPublicStatusPage = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => getPublicStatusPageSchema.parse(data))
	.handler(async ({ data: { slug } }) => {
		const result = await db.query.statusPage.findFirst({
			where: eq(statusPage.slug, slug),
			with: {
				monitors: {
					with: {
						monitor: {
							columns: {
								id: true,
								name: true,
								status: true,
							},
						},
					},
				},
			},
		});

		if (!result) {
			return null;
		}

		// Don't return sensitive information like password
		return {
			id: result.id,
			name: result.name,
			slug: result.slug,
			description: result.description,
			customDomain: result.customDomain,
			// Don't return password
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
			monitors: result.monitors.map((m) => ({
				monitorId: m.monitorId,
				monitor: m.monitor,
			})),
		};
	});

