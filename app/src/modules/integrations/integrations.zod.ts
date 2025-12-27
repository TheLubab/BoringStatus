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

export const notificationChannelConfigSchema = z
	.discriminatedUnion("type", [
		z.object({ type: z.literal("email"), ...emailConfigSchema.shape }),
		z.object({ type: z.literal("webhook"), ...webhookConfigSchema.shape }),
		z.object({ type: z.literal("slack"), ...slackConfigSchema.shape }),
		z.object({ type: z.literal("discord"), ...discordConfigSchema.shape }),
	])
	.transform(({ type, ...rest }) => rest);

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

export const insertNotificationChannelSchema = createInsertSchema(
	notificationChannel,
	{
		organizationId: z.undefined(),
		type: notificationChannelTypeSchema,
		config: notificationChannelConfigSchema,
	},
);

export type InsertNotificationChannel = z.infer<
	typeof insertNotificationChannelSchema
>;
