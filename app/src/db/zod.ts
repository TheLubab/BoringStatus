import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { monitor, notificationChannel } from "./saas-schema";

// ---------------------------------------------------------
// ZOD Schema
// ---------------------------------------------------------
//

const baseMonitorSchema = createInsertSchema(monitor, {
	userId: z.string().optional(),
	// Use callback functions to extend types properly (preserves type inference)

	expectedStatus: (schema) =>
		schema.regex(
			/^(\d{3}(-\d{3})?)(,\s*\d{3}(-\d{3})?)*$/,
			"Format: 200 or 200,201 or 200-299",
		),
	target: z.string().min(1, "Target is required"),

	headers: z
		.array(
			z.object({
				key: z.string().min(1, "key is required"),
				value: z.string(),
			}),
		)
		.optional(),
}).extend({
	frequency: z.coerce
		.number()
		.min(60, "Minimum check interval is 60 seconds")
		.max(86400, "Maximum check interval is 24 hours")
		.optional(),
	port: z.coerce
		.number()
		.min(1, "Smallest port is 1")
		.max(65535, "Biggest port is 65535")
		.optional()
		.nullable(),
	timeout: z.coerce.number().min(1).max(60).optional(),
	retries: z.coerce.number().min(0).max(10).optional(),
});

export const insertMonitorSchema = baseMonitorSchema
	.extend({
		channelIds: z.array(z.string()).optional(),
	})
	.superRefine((data, ctx) => {
		// WEBSITE: must be valid URL
		if (data.type === "http") {
			try {
				new URL(data.target);
			} catch {
				ctx.addIssue({
					code: "custom",
					message: "Please enter a valid URL (e.g., https://boringstatus.com)",
					path: ["target"],
				});
			}
		}

		// PING: hostname or IP
		if (data.type === "ping") {
			const hostnameRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
			const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
			if (!hostnameRegex.test(data.target) && !ipRegex.test(data.target)) {
				ctx.addIssue({
					code: "custom",
					message: "Please enter a valid hostname or IP address",
					path: ["target"],
				});
			}
		}

		// TCP/PORT: must be IP and port required
		if (data.type === "tcp") {
			const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
			if (!ipRegex.test(data.target)) {
				ctx.addIssue({
					code: "custom",
					message: "Please enter a valid IP address",
					path: ["target"],
				});
			}
			if (!data.port) {
				ctx.addIssue({
					code: "custom",
					message: "Port is required for TCP monitors",
					path: ["port"],
				});
			}
		}
	});

export type MonitorFormValues = z.infer<typeof insertMonitorSchema>;

// ---------------------------------------------------------
// ZOD Schema for Notification Channels
// ---------------------------------------------------------

export const insertNotificationChannelSchema = createInsertSchema(
	notificationChannel,
	{
		userId: z.string().optional(),
		name: z
			.string()
			.min(1, "Channel name is required")
			.max(100, "Name too long"),

		type: z.string(),

		// Allows any JSON structure, validated by superRefine
		config: z.object({
			email: z.email().optional(),
			webhookUrl: z.url().optional(),
			verified: z.boolean().optional(),
		}),
	},
).superRefine((data, ctx) => {
	const config = data.config;

	switch (data.type) {
		case "email":
			if (!config.email || !z.email().safeParse(config.email).success) {
				ctx.addIssue({
					code: "custom",
					message: "Valid email address is required",
					path: ["config", "email"],
				});
			}
			break;

		case "slack":
		case "webhook":
		case "discord":
			if (!config.webhookUrl || !z.url().safeParse(config.webhookUrl).success) {
				ctx.addIssue({
					code: "custom",
					message: "Valid webhook URL is required",
					path: ["config", "webhookUrl"],
				});
			}
			break;
	}
});

export type NotificationChannelFormValues = z.infer<
	typeof insertNotificationChannelSchema
>;
