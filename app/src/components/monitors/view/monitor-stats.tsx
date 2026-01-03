import { Activity, ArrowDown, ArrowUp, TrendingUp, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SelectMonitor } from "@/modules/monitors/monitors.schema";
import type { MonitorDetailsStats } from "@/modules/monitors/monitors.zod";
import { StatusBadge } from "@/components/ui/status-badge";

interface StatsGridProps {
	monitor: SelectMonitor;
	stats: MonitorDetailsStats;
}

export function StatsGrid({ monitor, stats }: StatsGridProps) {
	const status = monitor.status || "pending";

	return (
		<div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
			{/* Status */}
			<StatCard label="Status">
				<div className="flex items-center gap-2">
					<StatusBadge status={status} className="text-lg" size="md">
						{status.toUpperCase()}
					</StatusBadge>
				</div>
				<p className="text-[11px] text-slate-500 mt-1">
					{stats.lastCheckAt
						? formatRelativeTime(new Date(stats.lastCheckAt))
						: "Awaiting first check"}
				</p>
			</StatCard>

			{/* Response Time */}
			<StatCard label="Response Time" icon={<Zap className="h-3.5 w-3.5" />}>
				<div className="flex items-baseline gap-1">
					<span className="text-lg font-semibold tabular-nums">
						{stats.avgLatency}
					</span>
					<span className="text-xs text-slate-500">ms</span>
				</div>
				{stats.minLatency != null && stats.maxLatency != null ? (
					<div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
						<span className="flex items-center gap-0.5">
							{stats.minLatency} min
						</span>
						<span className="flex items-center gap-0.5">
							{stats.maxLatency} max
						</span>
					</div>
				) : (
					<p className="text-[11px] text-slate-500 mt-1">Last 24h</p>
				)}
			</StatCard>

			{/* 24h Uptime */}
			<StatCard label="24h Uptime" icon={<Activity className="h-3.5 w-3.5" />}>
				<div className="flex items-baseline gap-1">
					<span
						className={cn(
							"text-lg font-semibold tabular-nums",
							stats.uptime24h != null &&
							(stats.uptime24h >= 99.9
								? "text-emerald-600"
								: stats.uptime24h >= 95
									? "text-amber-600"
									: "text-red-600"),
						)}
					>
						{stats.uptime24h != null ? stats.uptime24h : "—"}
					</span>
					{stats.uptime24h != null && (
						<span className="text-xs text-slate-500">%</span>
					)}
				</div>
				<div className="flex items-center gap-2 mt-1.5">
					<UptimeBar
						successful={stats.successfulChecks24h}
						total={stats.totalChecks24h}
					/>
					<span className="text-[10px] text-slate-400 tabular-nums shrink-0">
						{stats.successfulChecks24h}/{stats.totalChecks24h} checks
					</span>
				</div>
			</StatCard>

			{/* 30d Uptime */}
			<StatCard
				label="30d Uptime"
				icon={<TrendingUp className="h-3.5 w-3.5" />}
			>
				<div className="flex items-baseline gap-1">
					<span className="text-lg font-semibold tabular-nums">
						{stats.uptime30d != null ? stats.uptime30d : "—"}
					</span>
					{stats.uptime30d != null && (
						<span className="text-xs text-slate-500">%</span>
					)}
				</div>
				{stats.uptime7d != null ? (
					<p className="text-[11px] text-slate-500 mt-1">
						7d {stats.uptime7d}%
					</p>
				) : (
					<p className="text-[11px] text-slate-500 mt-1">Rolling window</p>
				)}
			</StatCard>
		</div>
	);
}

function StatCard({
	label,
	icon,
	variant = "neutral",
	children,
}: {
	label: string;
	icon?: React.ReactNode;
	variant?: "neutral" | "success" | "danger";
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"rounded-lg border p-3.5 transition-shadow hover:shadow-sm",
				variant === "success" && "bg-emerald-50/50 border-emerald-200",
				variant === "danger" && "bg-red-50/50 border-red-200",
				variant === "neutral" && "bg-white border-slate-200",
			)}
		>
			<div className="flex items-center justify-between mb-2">
				<span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
					{label}
				</span>
				{icon && <span className="text-slate-400">{icon}</span>}
			</div>
			{children}
		</div>
	);
}

function UptimeBar({
	successful,
	total,
}: {
	successful: number;
	total: number;
}) {
	if (total === 0)
		return <div className="flex-1 h-1.5 bg-slate-100 rounded-full" />;

	const percent = (successful / total) * 100;

	return (
		<div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
			<div
				className={cn(
					"h-full rounded-full transition-all",
					percent >= 99.9
						? "bg-emerald-500"
						: percent >= 95
							? "bg-amber-500"
							: "bg-red-500",
				)}
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
}

function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);

	if (diffSecs < 60) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	return date.toLocaleDateString();
}
