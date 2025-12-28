import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { notificationChannel } from "./integrations.schema";

// DATA

export const notificationChannelTypeSchema = z.enum([
	"email",
	"webhook",
	"slack",
	"discord",
]);

const emailConfigSchema = z.object({
	email: z.email("Invalid email address"),
});
const webhookConfigSchema = z.object({
	webhookUrl: z.url("Must be a valid URL"),
});
const slackConfigSchema = z.object({
	webhookUrl: z.url("Must be a valid Slack Webhook URL"),
	channel: z.string().optional(),
});
const discordConfigSchema = z.object({
	webhookUrl: z.url("Must be a valid Discord Webhook URL"),
});

export type NotificationChannelType = z.infer<
	typeof notificationChannelTypeSchema
>;

export type EmailConfig = z.infer<typeof emailConfigSchema>;
export type WebhookConfig = z.infer<typeof webhookConfigSchema>;
export type SlackConfig = z.infer<typeof slackConfigSchema>;
export type DiscordConfig = z.infer<typeof discordConfigSchema>;
export type NotificationChannelConfig =
	| EmailConfig
	| WebhookConfig
	| SlackConfig
	| DiscordConfig;

// API Functions

export const baseNotificationChannelSchema = createInsertSchema(
	notificationChannel,
	{
		type: notificationChannelTypeSchema,
	},
).omit({
	organizationId: true,
});

export const insertNotificationChannelSchema = z.discriminatedUnion("type", [
	baseNotificationChannelSchema.extend({
		type: z.literal("email"),
		...emailConfigSchema.shape,
	}),
	baseNotificationChannelSchema.extend({
		type: z.literal("webhook"),
		...webhookConfigSchema.shape,
	}),
	baseNotificationChannelSchema.extend({
		type: z.literal("slack"),
		...slackConfigSchema.shape,
	}),
	baseNotificationChannelSchema.extend({
		type: z.literal("discord"),
		...discordConfigSchema.shape,
	}),
]);

export type InsertNotificationChannel = z.infer<
	typeof insertNotificationChannelSchema
>;
