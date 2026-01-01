import { SiDiscord, SiSlack, SiTelegram } from "@icons-pack/react-simple-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, LucideMail, Trash2, Webhook } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NotificationChannel } from "@/db/schema";
import { cn } from "@/lib/utils";
import { deleteChannel } from "@/modules/integrations/integrations.api";

interface ChannelListProps {
	channels: NotificationChannel[];
	selectedIds?: string[];
	onSelectionChange?: (ids: string[]) => void;
	allowDelete?: boolean;
}

export function ChannelList({
	channels,
	selectedIds,
	onSelectionChange,
	allowDelete = false,
}: ChannelListProps) {
	const Comp = onSelectionChange ? "label" : "div";
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: deleteChannel,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["channels"] });
			toast.success("Channel removed");
		},
		onError: () => {
			toast.error("Failed to remove channel");
		},
	});

	if (channels.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-md bg-muted/5 text-muted-foreground">
				<AlertCircle className="size-6 mb-1.5 opacity-40" />
				<p className="text-[13px] font-medium">
					No notification channels configured.
				</p>
				<p className="text-[11px] text-muted-foreground/70">
					Add one to get alerts.
				</p>
			</div>
		);
	}

	return (
		<div className={"space-y-1"}>
			{channels.map((channel) => {
				const isSelected = selectedIds?.includes(channel.id) ?? false;
				return (
					<Comp
						key={channel.id}
						className={cn(
							"p-2 flex items-center gap-2.5 cursor-pointer border rounded-md transition-all duration-100 group",
							isSelected
								? "border-primary/40 bg-primary/5"
								: "bg-card hover:border-foreground/15",
						)}
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						{onSelectionChange && (
							<input
								checked={isSelected}
								type="radio"
								onChange={() => {}}
								onClick={() => {
									if (isSelected) {
										onSelectionChange?.(
											selectedIds?.filter((cid) => cid !== channel.id) || [],
										);
									} else {
										onSelectionChange?.([...(selectedIds || []), channel.id]);
									}
								}}
								className={cn(
									"shrink-0 cursor-pointer peer size-3.5 appearance-none rounded-full border transition-all duration-100",
									"border-input bg-transparent",
									"checked:border-primary checked:bg-primary",
									"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
								)}
							/>
						)}

						<div
							className={cn(
								"size-7 flex items-center justify-center rounded-md shrink-0",
								getTypeColor(channel.type),
							)}
						>
							{getChannelIcon(channel.type, "size-4")}
						</div>

						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1.5">
								<p
									className={cn(
										"font-semibold truncate tracking-tight text-[13px]",
									)}
								>
									{channel.name}
								</p>
								<Badge
									variant="outline"
									className="uppercase shrink-0 text-[8px] h-3.5 px-1"
								>
									{channel.type}
								</Badge>
							</div>
							<p className={"text-[10px] text-muted-foreground/70 truncate"}>
								{(channel.config as any)?.email ||
									(channel.config as any)?.webhookUrl ||
									"??"}
							</p>
						</div>

						{allowDelete && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="shrink-0 size-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors duration-100"
								disabled={deleteMutation.isPending}
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									if (
										confirm("Are you sure you want to remove this channel?")
									) {
										deleteMutation.mutate({ data: { id: channel.id } });
									}
								}}
							>
								{deleteMutation.isPending ? (
									<div className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
								) : (
									<Trash2 className="size-3" />
								)}
							</Button>
						)}
					</Comp>
				);
			})}
		</div>
	);
}

function getChannelIcon(type: string, className = "w-5 h-5") {
	switch (type.toLowerCase()) {
		case "email":
			return <LucideMail className={className} />;
		case "slack":
			return <SiSlack className={className} color="currentColor" />;
		case "discord":
			return <SiDiscord className={className} color="currentColor" />;
		case "telegram":
			return <SiTelegram className={className} color="currentColor" />;
		case "teams":
			return (
				<svg
					stroke="currentColor"
					fill="currentColor"
					strokeWidth="0"
					viewBox="0 0 16 16"
					xmlns="http://www.w3.org/2000/svg"
					className={className}
				>
					<title>teams</title>
					<path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z"></path>
					<path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z"></path>
				</svg>
			);
		default:
			return <Webhook className={className} />;
	}
}

function getTypeColor(type: string) {
	switch (type) {
		case "email":
			return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
		case "slack":
			return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
		case "discord":
			return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
		case "telegram":
			return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
		case "teams":
			return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
		default:
			return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
	}
}
