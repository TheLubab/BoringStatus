import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { getSession } from "@/modules/auth/auth.api";

import { monitor, monitorsToChannels } from "./monitors.schema";
import { insertMonitorSchema } from "./monitors.zod";
import { notificationChannel } from "../integrations/integrations.schema";

// Helper to ensure auth and org
const requireAuth = async () => {
	const session = await getSession();
	const activeOrgId = session?.activeOrganizationId;

	if (!session || !activeOrgId) {
		throw new Error("Unauthorized: You must be in an active Organization.");
	}
	return activeOrgId;
};

// Create a Monitor
export const createMonitor = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => insertMonitorSchema.parse(data))
	.handler(async ({ data }) => {
		const session = await getSession();
		const activeOrgId = session?.activeOrganizationId;

		if (!session || !activeOrgId) {
			throw new Error("Unauthorized: You must be in an active Organization.");
		}

		const { channelIds, ...monitorData } = data;

		return await db.transaction(async (tx) => {
			// 1. Create the Monitor
			const [newMonitor] = await tx
				.insert(monitor)
				.values({
					...monitorData,
					organizationId: activeOrgId,
				})
				.returning({ id: monitor.id });

			if (!newMonitor) {
				throw new Error("Failed to create monitor record");
			}

			// 2. Link Channels
			if (channelIds && channelIds.length > 0) {
				const channels = await tx.query.notificationChannel.findMany({
					where: and(
						inArray(notificationChannel.id, channelIds),
						eq(notificationChannel.organizationId, activeOrgId)
					)
				});
				if (channels.length !== channelIds.length) {
					throw new Error("One or more channels not found or unauthorized");
				}
				await tx.insert(monitorsToChannels).values(
					channels.map((channel) => ({
						monitorId: newMonitor.id,
						channelId: channel.id,
					})),
				);
			}

			return { success: true, id: newMonitor.id };
		});
	});

// GET ALL MONITORS
export const getMonitorsByOrg = createServerFn({ method: "GET" }).handler(
	async () => {
		const activeOrgId = await requireAuth();

		const results = await db.query.monitor.findMany({
			where: eq(monitor.organizationId, activeOrgId),
			orderBy: [desc(monitor.createdAt)],
			with: {
				channels: {
					with: {
						channel: true,
					},
				},
			},
		});

		return results;
	},
);

// GET SINGLE MONITOR
export const getMonitorById = createServerFn({ method: "GET" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data: { id } }) => {
		const activeOrgId = await requireAuth();

		const result = await db.query.monitor.findFirst({
			where: and(eq(monitor.id, id), eq(monitor.organizationId, activeOrgId)),
			with: {
				channels: true,
			},
		});

		if (!result) {
			throw new Error("Monitor not found");
		}

		return {
			...result,
			channelIds: result.channels.map((c) => c.channelId),
		};
	});

// UPDATE MONITOR
export const updateMonitor = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			id: z.string(),
			data: insertMonitorSchema,
		}),
	)
	.handler(async ({ data: { id, data: formData } }) => {
		const activeOrgId = await requireAuth();
		const { channelIds, ...monitorData } = formData;

		return await db.transaction(async (tx) => {
			// 1. Update the base monitor record
			const [updatedMonitor] = await tx
				.update(monitor)
				.set({
					...monitorData,
					updatedAt: new Date(),
				})
				.where(and(eq(monitor.id, id), eq(monitor.organizationId, activeOrgId)))
				.returning();

			if (!updatedMonitor) {
				throw new Error("Failed to update monitor or unauthorized");
			}

			// 2. Handle Channels Update

			// A. Delete existing links
			await tx
				.delete(monitorsToChannels)
				.where(eq(monitorsToChannels.monitorId, id));

			// B. Insert new links if provided
			if (channelIds && channelIds.length > 0) {
				await tx.insert(monitorsToChannels).values(
					channelIds.map((channelId) => ({
						monitorId: id,
						channelId,
					})),
				);
			}

			return { success: true, id };
		});
	});

// DELETE MONITOR
export const deleteMonitor = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data: { id } }) => {
		const activeOrgId = await requireAuth();

		const [deleted] = await db
			.delete(monitor)
			.where(and(eq(monitor.id, id), eq(monitor.organizationId, activeOrgId)))
			.returning({ id: monitor.id });

		if (!deleted) {
			throw new Error("Failed to delete monitor or unauthorized");
		}

		return { success: true, id: deleted.id };
	});

// TOGGLE ACTIVE STATUS
export const toggleMonitorActive = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			id: z.string(),
			active: z.boolean(),
		}),
	)
	.handler(async ({ data: { id, active } }) => {
		const activeOrgId = await requireAuth();

		const [updated] = await db
			.update(monitor)
			.set({ active })
			.where(and(eq(monitor.id, id), eq(monitor.organizationId, activeOrgId)))
			.returning({ id: monitor.id, active: monitor.active });

		if (!updated) {
			throw new Error("Failed to update status");
		}

		return { success: true, active: updated.active };
	});
