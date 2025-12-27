import type { notificationChannel } from "./integrations.schema";
import type {
	DiscordConfig,
	EmailConfig,
	SlackConfig,
	WebhookConfig,
} from "./integrations.zod";

export async function matchChannel<T>(
	channel: typeof notificationChannel.$inferSelect,
	handlers: {
		email: (config: EmailConfig) => T;
		webhook: (config: WebhookConfig) => T;
		slack: (config: SlackConfig) => T;
		discord: (config: DiscordConfig) => T;
	},
): Promise<T> {
	return await handlers[channel.type](channel.config as any);
}
