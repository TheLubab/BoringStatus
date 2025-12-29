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
	} catch (_) {}
	return (
		<div className="flex flex-col py-1">
			<span className="font-semibold text-sm text-foreground tracking-tight">
				{name}
			</span>
			{link ? (
				<a
					href={link.toString()}
					target="_blank"
					rel="noopener noreferrer nofollow"
					onClick={(e) => e.stopPropagation()}
					className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors mt-0.5 w-fit"
				>
					{url}
					<ExternalLink className="h-2.5 w-2.5 opacity-50" />
				</a>
			) : (
				<span className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 w-fit">
					{url}
				</span>
			)}
		</div>
	);
};

export const UptimeCell = ({ uptime }: { uptime?: number }) => {
	if (uptime === undefined || uptime === null) {
		return (
			<span className="font-mono font-bold text-xs text-muted-foreground">
				-
			</span>
		);
	}

	let colorClass = "text-emerald-600 dark:text-emerald-400";
	if (uptime < 98) colorClass = "text-amber-600 dark:text-amber-400";
	if (uptime < 95) colorClass = "text-rose-600 dark:text-rose-400";

	return (
		<span className={cn("font-mono font-bold text-xs", colorClass)}>
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
					className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
					onClick={(e) => e.stopPropagation()}
				>
					<span className="sr-only">Open menu</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40">
				<DropdownMenuItem onClick={() => onViewDetails?.(monitor)}>
					View Details
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem>Pause Monitor</DropdownMenuItem>
				<DropdownMenuItem className="text-destructive focus:text-destructive">
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
				<span className="text-muted-foreground text-xs font-mono">-</span>
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
		<div className="flex items-center gap-3 w-full">
			<div className="relative flex-1 pt-3">
				<span
					className={cn(
						"absolute top-0 right-0 font-mono font-bold text-xs whitespace-nowrap z-10",
						currentLatency < 200
							? "text-emerald-600 dark:text-emerald-400"
							: currentLatency < 500
								? "text-amber-600 dark:text-amber-400"
								: "text-rose-600 dark:text-rose-400",
					)}
				>
					{currentLatency}ms
				</span>
				<ChartContainer config={chartConfig} className="h-10 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={chartData}>
							<Area
								type="monotone"
								dataKey="latency"
								strokeWidth={1.5}
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
