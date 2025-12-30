import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { ChannelAddDialog } from "@/components/channels/channel-add-dialog";
import { FormDescription, FormField, FormLabel } from "@/components/ui/form";
import { getNotificationChannelsByOrg } from "@/modules/integrations/integrations.api";
import type { InsertMonitor } from "@/modules/monitors/monitors.zod";

import { ChannelList } from "../../channels/channel-list";

export function MonitorSelectChannels() {
	const form = useFormContext<InsertMonitor>();

	const { data: channels, isLoading } = useQuery({
		queryKey: ["channels"],
		queryFn: getNotificationChannelsByOrg,
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
		<div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-500">
			<div className="flex items-center justify-between">
				<FormLabel>Notification Channels</FormLabel>
				<ChannelAddDialog
					onSuccess={(c) => {
						form.setValue("channelIds", [
							...(form?.getValues("channelIds") || []),
							c.id,
						]);
					}}
				/>
			</div>
			<FormDescription>
				Select channels to receive alerts for this monitor.
			</FormDescription>

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
						/>
					</div>
				)}
			/>
		</div>
	);
}
