import { ExternalLink, MoreHorizontal } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DashboardMonitor } from "@/modules/monitors/monitors.zod";

export const MonitorNameCell = ({
	name,
	url,
}: {
	name: string;
	url: string;
}) => {
	let link: URL | undefined;
	try {
		link = new URL(url);
	} catch (_) { }
	return (
		<div className="flex flex-col py-0.5">
			<span className="font-semibold text-[13px] text-foreground tracking-tight leading-tight">
				{name}
			</span>
			{link ? (
				<a
					href={link.toString()}
					target="_blank"
					rel="noopener noreferrer nofollow"
					onClick={(e) => e.stopPropagation()}
					className="flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-primary transition-colors duration-100 w-fit"
				>
					{url}
					<ExternalLink className="size-2 opacity-40" />
				</a>
			) : (
				<span className="flex items-center gap-1 text-[10px] text-muted-foreground/70 w-fit">
					{url}
				</span>
			)}
		</div>
	);
};

export const UptimeCell = ({ uptime }: { uptime?: number }) => {
	if (uptime === undefined || uptime === null) {
		return (
			<span className="font-mono font-semibold text-[11px] text-muted-foreground/60">
				-
			</span>
		);
	}

	let colorClass = "text-emerald-600 dark:text-emerald-400";
	if (uptime < 98) colorClass = "text-amber-600 dark:text-amber-400";
	if (uptime < 95) colorClass = "text-rose-600 dark:text-rose-400";

	return (
		<span className={cn("font-mono font-semibold text-[11px]", colorClass)}>
			{uptime.toFixed(2)}%
		</span>
	);
};

export const ActionsCell = ({
	monitor,
	onViewDetails,
}: {
	monitor: DashboardMonitor;
	onViewDetails?: (m: DashboardMonitor) => void;
}) => (
	<div className="flex justify-end">
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="size-7 p-0 text-muted-foreground/60 hover:text-foreground transition-colors duration-100"
					onClick={(e) => e.stopPropagation()}
				>
					<span className="sr-only">Open menu</span>
					<MoreHorizontal className="size-3.5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-36">
				<DropdownMenuItem onClick={() => onViewDetails?.(monitor)} className="text-[13px]">
					View Details
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="text-[13px]">Pause Monitor</DropdownMenuItem>
				<DropdownMenuItem className="text-destructive focus:text-destructive text-[13px]">
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
);

export const LatencyChart = ({ data }: { data: number[] }) => {
	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-between w-full">
				<div className="flex-1" />
				<span className="text-muted-foreground/60 text-[11px] font-mono">-</span>
			</div>
		);
	}

	const currentLatency = data[data.length - 1];

	const chartData = data.map((value, index) => ({
		index,
		latency: value,
	}));

	const chartConfig = {
		latency: {
			label: "Latency",
		},
	};

	return (
		<div className="flex items-center gap-2 w-full">
			<div className="relative flex-1 pt-2.5">
				<span
					className={cn(
						"absolute top-0 right-0 font-mono font-semibold text-[11px] whitespace-nowrap z-10",
						currentLatency < 200
							? "text-emerald-600 dark:text-emerald-400"
							: currentLatency < 500
								? "text-amber-600 dark:text-amber-400"
								: "text-rose-600 dark:text-rose-400",
					)}
				>
					{currentLatency}ms
				</span>
				<ChartContainer config={chartConfig} className="h-8 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={chartData}>
							<Area
								type="monotone"
								dataKey="latency"
								strokeWidth={1}
								dot={false}
								fill="var(--color-green-100)"
								stroke="var(--color-green-300)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</ChartContainer>
			</div>
		</div>
	);
};
