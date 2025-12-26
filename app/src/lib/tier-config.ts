// Tier Configuration for Boring Status
// This defines the limits and features available for each subscription tier

export type TierType = "trial" | "starter" | "pro";

export interface TierLimits {
	// Channel limits
	maxChannels: number;
	maxEmailChannels: number;
	maxSlackChannels: number;
	maxDiscordChannels: number;
	maxTeamsChannels: number;
	maxTelegramChannels: number;
	maxWebhookChannels: number;
	
	// Feature flags
	allowCustomWebhooks: boolean;
	allowTelegram: boolean;
	allowTeams: boolean;
	
	// Monitor limits
	maxMonitors: number;
	minCheckInterval: number; // in minutes
	
	// Additional
	trialDays?: number;
}

export interface TierConfig {
	id: TierType;
	name: string;
	description: string;
	limits: TierLimits;
}

export const TIER_CONFIGS: Record<TierType, TierConfig> = {
	trial: {
		id: "trial",
		name: "Trial",
		description: "7-day free trial with Starter features",
		limits: {
			maxChannels: 3,
			maxEmailChannels: 2,
			maxSlackChannels: 1,
			maxDiscordChannels: 1,
			maxTeamsChannels: 0,
			maxTelegramChannels: 0,
			maxWebhookChannels: 0,
			allowCustomWebhooks: false,
			allowTelegram: false,
			allowTeams: false,
			maxMonitors: 10,
			minCheckInterval: 5,
			trialDays: 7,
		},
	},
	starter: {
		id: "starter",
		name: "Starter",
		description: "Essential monitoring for small teams",
		limits: {
			maxChannels: 5,
			maxEmailChannels: 3,
			maxSlackChannels: 2,
			maxDiscordChannels: 2,
			maxTeamsChannels: 0,
			maxTelegramChannels: 0,
			maxWebhookChannels: 0,
			allowCustomWebhooks: false,
			allowTelegram: false,
			allowTeams: false,
			maxMonitors: 25,
			minCheckInterval: 5,
		},
	},
	pro: {
		id: "pro",
		name: "Pro",
		description: "Advanced monitoring with all integrations",
		limits: {
			maxChannels: 25,
			maxEmailChannels: 10,
			maxSlackChannels: 10,
			maxDiscordChannels: 10,
			maxTeamsChannels: 5,
			maxTelegramChannels: 5,
			maxWebhookChannels: 10,
			allowCustomWebhooks: true,
			allowTelegram: true,
			allowTeams: true,
			maxMonitors: 100,
			minCheckInterval: 1,
		},
	},
};

// Helper function to get tier config
export function getTierConfig(tier: TierType): TierConfig {
	return TIER_CONFIGS[tier];
}

// Helper to check if a channel type is allowed for a tier
export function isChannelTypeAllowed(tier: TierType, channelType: string): boolean {
	const config = TIER_CONFIGS[tier];
	switch (channelType) {
		case "email":
		case "slack":
		case "discord":
			return true;
		case "teams":
			return config.limits.allowTeams;
		case "telegram":
			return config.limits.allowTelegram;
		case "webhook":
			return config.limits.allowCustomWebhooks;
		default:
			return false;
	}
}

// Helper to get max channels for a specific type
export function getMaxChannelsForType(tier: TierType, channelType: string): number {
	const config = TIER_CONFIGS[tier];
	switch (channelType) {
		case "email":
			return config.limits.maxEmailChannels;
		case "slack":
			return config.limits.maxSlackChannels;
		case "discord":
			return config.limits.maxDiscordChannels;
		case "teams":
			return config.limits.maxTeamsChannels;
		case "telegram":
			return config.limits.maxTelegramChannels;
		case "webhook":
			return config.limits.maxWebhookChannels;
		default:
			return 0;
	}
}

// Helper to check if user can add more channels of a type
export function canAddChannelType(
	tier: TierType,
	channelType: string,
	currentCount: number,
): { allowed: boolean; reason?: string; limit: number } {
	const config = TIER_CONFIGS[tier];
	const maxForType = getMaxChannelsForType(tier, channelType);
	
	// Check if type is allowed at all
	if (!isChannelTypeAllowed(tier, channelType)) {
		return {
			allowed: false,
			reason: `${channelType} channels require a Pro plan`,
			limit: 0,
		};
	}
	
	// Check type-specific limit
	if (currentCount >= maxForType) {
		return {
			allowed: false,
			reason: `Maximum ${maxForType} ${channelType} channel${maxForType !== 1 ? 's' : ''} on ${config.name} plan`,
			limit: maxForType,
		};
	}
	
	return { allowed: true, limit: maxForType };
}

// Helper to check total channel limit
export function canAddMoreChannels(
	tier: TierType,
	currentTotalCount: number,
): { allowed: boolean; reason?: string; limit: number } {
	const config = TIER_CONFIGS[tier];
	const maxTotal = config.limits.maxChannels;
	
	if (currentTotalCount >= maxTotal) {
		return {
			allowed: false,
			reason: `Maximum ${maxTotal} total channels on ${config.name} plan`,
			limit: maxTotal,
		};
	}
	
	return { allowed: true, limit: maxTotal };
}
