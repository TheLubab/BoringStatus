import { useQuery } from "@tanstack/react-query";
import { 
	TierType, 
	TierConfig, 
	getTierConfig, 
	canAddChannelType, 
	canAddMoreChannels,
	isChannelTypeAllowed,
	getMaxChannelsForType,
} from "@/lib/tier-config";
import { getChannels } from "@/functions/channels";
import { Channel, ChannelType } from "@/components/channels/channel-schema";

// MOCK: In production, this would come from auth/subscription context
const MOCK_CURRENT_TIER: TierType = "starter";
const MOCK_TRIAL_DAYS_LEFT = 5;

interface ChannelUsage {
	total: number;
	byType: Record<string, number>;
}

interface UseTierResult {
	tier: TierType;
	config: TierConfig;
	isLoading: boolean;
	trialDaysLeft?: number;
	
	// Channel usage
	channelUsage: ChannelUsage;
	
	// Limit checks
	canAddChannel: (type: ChannelType) => { allowed: boolean; reason?: string; limit: number };
	canAddAnyChannel: () => { allowed: boolean; reason?: string; limit: number };
	isTypeAllowed: (type: ChannelType) => boolean;
	getTypeLimit: (type: ChannelType) => number;
	
	// Usage strings
	getUsageLabel: (type?: ChannelType) => string;
	getLimitLabel: (type?: ChannelType) => string;
}

export function useTier(): UseTierResult {
	const tier = MOCK_CURRENT_TIER;
	const config = getTierConfig(tier);
	
	const { data: channels, isLoading } = useQuery({
		queryKey: ["channels"],
		queryFn: getChannels,
	});
	
	// Calculate usage by type
	const channelUsage: ChannelUsage = {
		total: channels?.length || 0,
		byType: {},
	};
	
	if (channels) {
		for (const channel of channels) {
			channelUsage.byType[channel.type] = (channelUsage.byType[channel.type] || 0) + 1;
		}
	}
	
	const canAddChannel = (type: ChannelType) => {
		const totalCheck = canAddMoreChannels(tier, channelUsage.total);
		if (!totalCheck.allowed) {
			return totalCheck;
		}
		return canAddChannelType(tier, type, channelUsage.byType[type] || 0);
	};
	
	const canAddAnyChannel = () => {
		return canAddMoreChannels(tier, channelUsage.total);
	};
	
	const isTypeAllowed = (type: ChannelType) => {
		return isChannelTypeAllowed(tier, type);
	};
	
	const getTypeLimit = (type: ChannelType) => {
		return getMaxChannelsForType(tier, type);
	};
	
	const getUsageLabel = (type?: ChannelType) => {
		if (type) {
			const current = channelUsage.byType[type] || 0;
			const max = getMaxChannelsForType(tier, type);
			return `${current}/${max}`;
		}
		return `${channelUsage.total}/${config.limits.maxChannels}`;
	};
	
	const getLimitLabel = (type?: ChannelType) => {
		if (type) {
			const max = getMaxChannelsForType(tier, type);
			return `Max ${max} ${type} channels`;
		}
		return `Max ${config.limits.maxChannels} total channels`;
	};
	
	return {
		tier,
		config,
		isLoading,
		trialDaysLeft: tier === "trial" ? MOCK_TRIAL_DAYS_LEFT : undefined,
		channelUsage,
		canAddChannel,
		canAddAnyChannel,
		isTypeAllowed,
		getTypeLimit,
		getUsageLabel,
		getLimitLabel,
	};
}
