import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { Bell, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { ChannelAddDialog } from "@/components/channels/channel-add-dialog";
import { FormField } from "@/components/ui/form";
import type { MonitorFormValues } from "@/db/zod";
import { getChannels } from "@/functions/channels";
import { ChannelList } from "../../channels/channel-list";

export function MonitorStepAlerting() {
	const form = useFormContext<MonitorFormValues>();

	const { data: channels, isLoading } = useQuery({
		queryKey: ["channels"],
		queryFn: getChannels,
	});

	const search = useSearch({ strict: false });
	const newChannelId = search.newChannelId as string | undefined;

	useEffect(() => {
		if (newChannelId) {
			const currentIds = form.getValues("channelIds") || [];
			if (!currentIds.includes(newChannelId)) {
				form.setValue("channelIds", [...currentIds, newChannelId], {
					shouldValidate: true,
					shouldDirty: true,
				});
				toast.success("New channel selected");
			}
		}
	}, [newChannelId, form]);

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
			{/* Header */}
			<div className="space-y-2">
				<h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
					<Bell className="w-5 h-5 text-primary" />
					Notification Channels
				</h3>
				<p className="text-muted-foreground">
					Configure how you want to be notified about incidents.
				</p>
			</div>

			{/* Channel Selection */}
			<div className="bg-muted/30 border rounded-xl p-5 space-y-4">
				<div className="flex items-center justify-between">
					<p className="text-xs text-muted-foreground mt-0.5">
						Select channels to receive alerts for this monitoLLr.
					</p>
					<ChannelAddDialog
						onSuccess={(c) => {
							form.setValue("channelIds", [
								...(form?.getValues("channelIds") || []),
								c.id,
							]);
						}}
					/>
				</div>

				<FormField
					control={form.control}
					name="channelIds"
					render={({ field }) => (
						<div className="relative min-h-25">
							{isLoading && (
								<div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
									<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
								</div>
							)}
							<ChannelList
								channels={channels || []}
								selectedIds={field.value || []}
								onSelectionChange={field.onChange}
								compact
							/>
						</div>
					)}
				/>

				{channels && channels.length > 0 && (
					<div className="text-xs text-muted-foreground border-t pt-2">
						Manage all channels in Integrations
					</div>
				)}
			</div>
		</div>
	);
}
