import { useQuery } from "@tanstack/react-query";
import {
	AlertTriangle,
	Bell,
	CheckCircle2,
	Loader2,
	Plus,
	RefreshCw,
	Webhook,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNotificationChannelsByOrg } from "@/modules/integrations/integrations.api";

import { ChannelAddDialog } from "./channel-add-dialog";
import { ChannelList } from "./channel-list";

export function IntegrationsManager() {
	const {
		data: channels,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ["channels"],
		queryFn: getNotificationChannelsByOrg,
	});

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-16 gap-4">
				<div className="relative">
					<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				</div>
				<p className="text-muted-foreground text-sm">Loading integrations...</p>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex flex-col items-center justify-center p-16 gap-4 text-center">
				<div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
					<AlertTriangle className="w-8 h-8 text-destructive" />
				</div>
				<div>
					<p className="font-semibold text-destructive">
						Failed to load integrations
					</p>
					<p className="text-muted-foreground text-sm mt-1">
						Please try again later.
					</p>
				</div>
				<Button variant="outline" onClick={() => refetch()}>
					<RefreshCw className="w-4 h-4 mr-2" />
					Retry
				</Button>
			</div>
		);
	}

	const totalCount = channels?.length || 0;

	return (
		<div className="mx-auto space-y-8 animate-in fade-in duration-500">
			{/* Header Card */}
			<div className="mt-2 bg-red relative overflow-hidden rounded-2xl border bg-linear-to-br from-primary/5 via-background to-background p-6">
				<div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

				<div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div className="flex items-start gap-4">
						<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
							<Webhook className="w-6 h-6 text-primary" />
						</div>
						<div>
							<h2 className="text-xl font-bold flex items-center gap-2">
								Notification Channels
								{totalCount > 0 && (
									<Badge variant="secondary" className="font-mono">
										{totalCount}
									</Badge>
								)}
							</h2>
							<p className="text-muted-foreground text-sm mt-0.5">
								Configure where you want to receive alerts when monitors detect
								issues.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto">
						<ChannelAddDialog allowPro>
							<Button className="w-full sm:w-auto shadow-lg gap-2">
								<Plus className="w-4 h-4" />
								New Integration
							</Button>
						</ChannelAddDialog>
					</div>
				</div>

				{!channels || channels.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 px-8 text-center">
						<div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
							<Bell className="w-10 h-10 text-muted-foreground/50" />
						</div>
						<h3 className="font-semibold text-lg mb-1">No integrations yet</h3>
						<p className="text-muted-foreground text-sm max-w-sm mb-6">
							Add your first notification channel to start receiving alerts when
							your monitors detect problems.
						</p>
						<ChannelAddDialog allowPro>
							<Button>
								<Plus className="w-4 h-4 mr-2" />
								Add Your First Channel
							</Button>
						</ChannelAddDialog>
					</div>
				) : (
					<div className="p-4">
						<ChannelList channels={channels} allowDelete />
					</div>
				)}
			</div>

			{/* Info Section */}
			{channels && channels.length > 0 && (
				<div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border text-sm">
					<CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
					<div>
						<p className="font-medium">
							Channels are shared across all monitors
						</p>
						<p className="text-muted-foreground">
							Configure your channels once here, then select which ones to use
							for each monitor during setup.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
