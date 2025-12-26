import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notificationChannel } from "@/db/saas-schema";
import {
	insertNotificationChannelSchema,
	type NotificationChannelFormValues,
} from "@/db/zod";
import { auth } from "@/lib/auth/auth";

export type Channel = typeof notificationChannel.$inferSelect;

/**
 * GET CHANNELS
 * Fetches all notification channels for the logged-in user.
 */
export const getChannels = createServerFn({ method: "GET" }).handler(
	async (): Promise<Channel[]> => {
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});

		if (!session?.user?.id) {
			throw new Error("Unauthorized");
		}

		const channels = await db
			.select()
			.from(notificationChannel)
			.where(eq(notificationChannel.userId, session.user.id))
			.orderBy(desc(notificationChannel.createdAt));

		return channels;
	},
);

/**
 * CREATE CHANNEL
 * Validates input using the Zod schema and inserts into DB.
 */
export const createChannel = createServerFn({ method: "POST" })
	.inputValidator((data: NotificationChannelFormValues) =>
		insertNotificationChannelSchema.parse(data),
	)
	.handler(async ({ data }): Promise<Channel> => {
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});

		if (!session?.user?.id) {
			throw new Error("Unauthorized");
		}

		// Insert into DB
		const [newChannel] = await db
			.insert(notificationChannel)
			.values({
				...data,
				userId: session.user.id,
				config: {
					...(data.config as Record<string, unknown>),
					verified: true,
				},
			})
			.returning();

		return newChannel;
	});

/**
 * DELETE CHANNEL
 * Deletes a channel by ID, ensuring ownership.
 */
export const deleteChannel = createServerFn({ method: "POST" })
	.inputValidator((id: string) => z.string().parse(id))
	.handler(async ({ data: id }): Promise<void> => {
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});

		if (!session?.user?.id) {
			throw new Error("Unauthorized");
		}

		await db
			.delete(notificationChannel)
			.where(
				and(
					eq(notificationChannel.id, id),
					eq(notificationChannel.userId, session.user.id),
				),
			);
	});
