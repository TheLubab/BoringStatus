import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { getSession } from "@/modules/auth/auth.api";
import {
	monitor,
	monitorsToChannels,
} from "@/modules/monitors/monitors.schema";

import { matchChannel as matchNotificationChannel } from "./integrations.fn";
import { notificationChannel } from "./integrations.schema";
import { insertNotificationChannelSchema } from "./integrations.zod";

const requireAuth = async () => {
	const session = await getSession();
	const activeOrgId = session?.activeOrganizationId;
	if (!session || !activeOrgId) {
		throw new Error("Unauthorized: You must be in an active Organization.");
	}
	return activeOrgId;
};

// GET CHANNELS
export const getNotificationChannelsByOrg = createServerFn({
	method: "GET",
}).handler(async () => {
	const activeOrgId = await requireAuth();

	return await db.query.notificationChannel.findMany({
		where: eq(notificationChannel.organizationId, activeOrgId),
		orderBy: [desc(notificationChannel.createdAt)],
	});
});

// CREATE CHANNEL
export const createChannel = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) =>
		insertNotificationChannelSchema.parse(data),
	)
	.handler(async ({ data }) => {
		const activeOrgId = await requireAuth();

		const [newChannel] = await db
			.insert(notificationChannel)
			.values({
				...data,
				// TODO: implement actual verification
				lastFailureAt: null,
				failureCount: 0,
				verified: false,

				organizationId: activeOrgId, // IMPORTANT: should stay last
			})
			.returning();

		return newChannel;
	});

// UPDATE CHANNEL
export const updateChannel = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			id: z.string(),
			data: insertNotificationChannelSchema,
		}),
	)
	.handler(async ({ data: { id, data: updateData } }) => {
		const activeOrgId = await requireAuth();

		const [updated] = await db
			.update(notificationChannel)
			.set({
				...updateData,
				// Reset verification
				verified: false,
				lastFailureAt: null,
				failureCount: 0,
			})
			.where(
				and(
					eq(notificationChannel.id, id),
					eq(notificationChannel.organizationId, activeOrgId),
				),
			)
			.returning();

		if (!updated) throw new Error("Channel not found");
		return updated;
	});

// DELETE CHANNEL
export const deleteChannel = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data: { id } }) => {
		const activeOrgId = await requireAuth();

		const [deleted] = await db
			.delete(notificationChannel)
			.where(
				and(
					eq(notificationChannel.id, id),
					eq(notificationChannel.organizationId, activeOrgId),
				),
			)
			.returning({ id: notificationChannel.id });

		if (!deleted) throw new Error("Channel not found");
		return deleted;
	});

// SEND TEST NOTIFICATION
export const sendTestNotification = createServerFn({ method: "POST" })
	.inputValidator(z.object({ channelId: z.string() }))
	.handler(async ({ data: { channelId } }) => {
		const activeOrgId = await requireAuth();

		// 1. Fetch Channel to get config
		const channel = await db.query.notificationChannel.findFirst({
			where: and(
				eq(notificationChannel.id, channelId),
				eq(notificationChannel.organizationId, activeOrgId),
			),
		});

		if (!channel) throw new Error("Channel not found");

		// 2. Mock Sending Logic
		// TODO: use an actual NotificationService here
		try {
			console.log(`[TEST NOTIFICATION] Sending to ${channel.type}...`);

			// Simulate network delay
			await new Promise((resolve) => setTimeout(resolve, 500));

			await matchNotificationChannel(channel, {
				email: async (config) => {
					if (!config.email) throw new Error("Missing email config");
					console.log(`mock email sent to ${config.email}`);
					// await mailer.send({ to: config.email, ... })
				},
				webhook: async (config) => {
					if (!config.webhookUrl) throw new Error("Missing Webhook URL");
					console.log(`mock webhook called: ${config.webhookUrl}`);
					// await fetch(config.webhookUrl, ...)
				},
				slack: async (config) => {
					if (!config.webhookUrl) throw new Error("Missing Webhook URL");
					console.log(`mock webhook called: ${config.webhookUrl}`);
				},
				discord: async (config) => {
					if (!config.webhookUrl) throw new Error("Missing Webhook URL");
					console.log(`mock webhook called: ${config.webhookUrl}`);
				},
			});

			// 3. Mark as verified if successful
			if (!channel.verified) {
				await db
					.update(notificationChannel)
					.set({ verified: true, lastFailureAt: null })
					.where(eq(notificationChannel.id, channelId));
			}

			return { success: true, message: `Test sent to ${channel.type}` };
		} catch (error) {
			// Log failure
			await db
				.update(notificationChannel)
				.set({
					lastFailureAt: new Date(),
					failureCount: (channel.failureCount || 0) + 1,
				})
				.where(eq(notificationChannel.id, channelId));

			throw new Error(`Failed to send test: ${(error as Error).message}`);
		}
	});

// LINK / UNLINK MONITOR
export const linkMonitorToChannel = createServerFn({ method: "POST" })
	.inputValidator(z.object({ monitorId: z.string(), channelId: z.string() }))
	.handler(async ({ data }) => {
		const activeOrgId = await requireAuth();

		// Verify ownership of channel
		const channel = await db.query.notificationChannel.findFirst({
			where: and(
				eq(notificationChannel.id, data.channelId),
				eq(notificationChannel.organizationId, activeOrgId),
			),
		});
		if (!channel) throw new Error("Channel not found or unauthorized");

		// Verify ownership of monitor
		const monitor_ = await db.query.monitor.findFirst({
			where: and(
				eq(monitor.id, data.monitorId),
				eq(monitor.organizationId, activeOrgId),
			),
		});
		if (!monitor_) throw new Error("Monitor not found or unauthorized");

		await db
			.insert(monitorsToChannels)
			.values({
				monitorId: monitor_.id,
				channelId: channel.id,
			})
			.onConflictDoNothing();

		return { success: true };
	});

export const unlinkMonitorFromChannel = createServerFn({ method: "POST" })
	.inputValidator(z.object({ monitorId: z.string(), channelId: z.string() }))
	.handler(async ({ data }) => {
		const activeOrgId = await requireAuth();

		// check channel we are unlinking belongs to the active org
		const channelOwner = await db.query.notificationChannel.findFirst({
			where: and(
				eq(notificationChannel.id, data.channelId),
				eq(notificationChannel.organizationId, activeOrgId),
			),
		});

		if (!channelOwner) throw new Error("Unauthorized");

		await db
			.delete(monitorsToChannels)
			.where(
				and(
					eq(monitorsToChannels.monitorId, data.monitorId),
					eq(monitorsToChannels.channelId, data.channelId),
				),
			);

		return { success: true };
	});
