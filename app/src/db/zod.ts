//FIX: delete
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { monitor, notificationChannel } from "./schema";

// ----------------------------------------------------------------------
// 1. MONITOR CONFIGURATION SCHEMAS
// ----------------------------------------------------------------------

// HTTP Specific Config
const httpConfigSchema = z.object({
	method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
	expectedStatus: z
		.string()
		.regex(
			/^(\d{3}(-\d{3})?)(,\s*\d{3}(-\d{3})?)*$/,
			"Format: 200 or 200,201 or 200-299",
		)
		.default("200-299"),
	followRedirects: z.boolean().default(true),
	headers: z.record(z.string()).optional(), // { "Authorization": "Bearer..." }
	body: z.string().optional(),
});

// TCP / Ping Specific Config
const tcpConfigSchema = z.object({
	port: z.coerce.number().min(1).max(65535, "Port must be between 1 and 65535"),
});

// Keyword Specific Config
const keywordConfigSchema = httpConfigSchema.extend({
	searchString: z.string().min(1, "Keyword is required"),
	shouldNotExist: z.boolean().default(false),
});

// Docker Specific Config
const dockerConfigSchema = z.object({
	containerName: z.string().min(1, "Container name is required"),
	host: z.string().default("local"),
});

// ----------------------------------------------------------------------
// 2. THE BASE MONITOR SCHEMA
// ----------------------------------------------------------------------
// We use createInsertSchema to get the "common" fields (name, active, frequency)
const baseMonitorSchema = createInsertSchema(monitor, {
	organizationId: z.string().optional(), // Inferred from session usually

	// Validation for common fields
	target: z.string().min(1, "Target is required"),
	frequency: z.coerce.number().min(60).max(86400),
	timeout: z.coerce.number().min(1).max(60),

	// Override these to avoid Zod inference issues with JSONB/Arrays
	regions: z.array(z.string()).default(["default"]),
	config: z.any(), // ⚠️ We will overwrite this in the union below
});

// ----------------------------------------------------------------------
// 3. THE DISCRIMINATED UNION (The Magic)
// ----------------------------------------------------------------------
// This creates a schema that changes shape based on the 'type' field
export const insertMonitorSchema = z
	.discriminatedUnion("type", [
		// HTTP
		baseMonitorSchema
			.extend({
				type: z.literal("http"),
				config: httpConfigSchema,
			})
			.refine(
				(data) => {
					try {
						new URL(data.target);
						return true;
					} catch {
						return false;
					}
				},
				{ message: "Must be a valid URL", path: ["target"] },
			),

		// PING
		baseMonitorSchema
			.extend({
				type: z.literal("ping"),
				config: z.object({}), // No extra config needed
			})
			.refine(
				(data) => {
					const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(data.target);
					const isHost = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(
						data.target,
					);
					return isIp || isHost;
				},
				{ message: "Must be a valid Hostname or IP", path: ["target"] },
			),

		// TCP
		baseMonitorSchema
			.extend({
				type: z.literal("tcp"),
				config: tcpConfigSchema,
			})
			.refine(
				(data) => {
					const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(data.target);
					const isHost = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(
						data.target,
					);
					return isIp || isHost;
				},
				{ message: "Must be a valid Hostname or IP", path: ["target"] },
			),

		// KEYWORD
		baseMonitorSchema
			.extend({
				type: z.literal("keyword"),
				config: keywordConfigSchema,
			})
			.refine(
				(data) => {
					try {
						new URL(data.target);
						return true;
					} catch {
						return false;
					}
				},
				{ message: "Must be a valid URL", path: ["target"] },
			),

		// DOCKER
		baseMonitorSchema.extend({
			type: z.literal("docker"),
			config: dockerConfigSchema,
		}),
	])
	.and(
		// Add global extra fields not in DB but needed for UI (e.g. channel selection)
		z.object({
			channelIds: z.array(z.string()).optional(),
		}),
	);

export type MonitorFormValues = z.infer<typeof insertMonitorSchema>;

// ----------------------------------------------------------------------
// 4. NOTIFICATION CHANNELS
// ----------------------------------------------------------------------

export const insertNotificationChannelSchema = createInsertSchema(
	notificationChannel,
	{
		organizationId: z.string().optional(),
		name: z.string().min(1, "Name is required"),

		// We override config to be generic at first, then refine it below
		config: z.any(),
	},
).superRefine((data, ctx) => {
	const { type, config } = data;

	// EMAIL VALIDATION
	if (type === "email") {
		const result = z.object({ email: z.string().email() }).safeParse(config);
		if (!result.success) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Valid email required",
				path: ["config", "email"],
			});
		}
	}

	// WEBHOOK / SLACK / DISCORD VALIDATION
	if (["webhook", "slack", "discord"].includes(type)) {
		const result = z.object({ webhookUrl: z.string().url() }).safeParse(config);
		if (!result.success) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Valid Webhook URL required",
				path: ["config", "webhookUrl"],
			});
		}
	}
});

export type NotificationChannelFormValues = z.infer<
	typeof insertNotificationChannelSchema
>;
