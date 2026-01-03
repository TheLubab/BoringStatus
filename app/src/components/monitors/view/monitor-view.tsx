import { Activity, BarChart3, Clock, Settings, Zap } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { MonitorEditForm } from "@/components/monitors/edit/monitor-edit-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type {
	MonitorDetails,
	MonitorDetailsHistoryEntry,
} from "@/modules/monitors/monitors.zod";

import { MonitorHeader } from "./monitor-header";
import { StatsGrid } from "./monitor-stats";
import { RecentChecksCard } from "./recent-checks-card";

interface MonitorViewProps {
	monitor: MonitorDetails;
	onToggleActive: () => Promise<void>;
	onDelete: () => Promise<void>;
}

export function MonitorView({
	monitor,
	onToggleActive,
	onDelete,
}: MonitorViewProps) {
	const isActive = monitor.active;

	const handleToggle = async () => {
		try {
			await onToggleActive();
			toast.success(isActive ? "Monitor paused" : "Monitor resumed");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleDelete = async () => {
		try {
			await onDelete();
			toast.success("Monitor deleted");
		} catch {
			toast.error("Failed to delete monitor");
		}
	};

	return (
		<div className="space-y-5 max-w-6xl mx-auto pb-16">
			<MonitorHeader
				monitor={monitor}
				isActive={isActive}
				onToggle={handleToggle}
				onDelete={handleDelete}
			/>

			<Tabs defaultValue="overview" className="space-y-5">
				<TabsList className="bg-slate-100 p-0.5 h-8">
					<TabsTrigger
						value="overview"
						className="gap-1.5 h-7 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
					>
						<Activity className="h-3.5 w-3.5" />
						Overview
					</TabsTrigger>
					<TabsTrigger
						value="configuration"
						className="gap-1.5 h-7 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
					>
						<Settings className="h-3.5 w-3.5" />
						Configuration
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4 mt-0">
					<StatsGrid monitor={monitor} stats={monitor.stats} />
					<ChartCard historyData={monitor.history24h} stats={monitor.stats} />
					<RecentChecksCard recentChecks={monitor.recentChecks} />
				</TabsContent>

				<TabsContent value="configuration" className="mt-0">
					<MonitorEditForm
						monitor={monitor}
						connectedChannelIds={monitor.channelIds}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function ChartCard({
	historyData,
	stats,
}: {
	historyData: MonitorDetailsHistoryEntry[];
	stats: MonitorDetails["stats"];
}) {
	const downHours = historyData.filter((e) => e.up === false).length;

	return (
		<div className="rounded-lg border border-slate-200 bg-white">
			<div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
				<div className="flex items-center gap-2">
					<BarChart3 className="h-4 w-4 text-slate-400" />
					<h3 className="text-sm font-medium text-slate-900">Response Time</h3>
				</div>

				<div className="flex items-center gap-4 text-xs text-slate-500">
					<span className="flex items-center gap-1">
						<Zap className="h-3 w-3 text-blue-500" />
						Avg:{" "}
						<span className="font-medium text-slate-700">
							{stats.avgLatency}ms
						</span>
					</span>
					{stats.minLatency != null && stats.maxLatency != null && (
						<span className="hidden sm:flex items-center gap-1">
							<Clock className="h-3 w-3" />
							{stats.minLatency}–{stats.maxLatency}ms
						</span>
					)}
					{downHours > 0 && (
						<span className="flex items-center gap-1 text-red-600">
							<span className="h-1.5 w-1.5 rounded-full bg-red-500" />
							{downHours}h down
						</span>
					)}
				</div>
			</div>

			<div className="px-4 pt-4 pb-3">
				<FullWidthChart data={historyData} />
				<div className="flex justify-between mt-3 text-[10px] text-slate-400">
					<span>24h ago</span>
					<span>12h ago</span>
					<span>Now</span>
				</div>
			</div>
		</div>
	);
}

// Full-width responsive chart for the details page
function FullWidthChart({ data }: { data: MonitorDetailsHistoryEntry[] }) {
	const gradientId = useId();
	const [hovered, setHovered] = useState<{
		index: number;
		clientX: number;
		clientY: number;
	} | null>(null);

	const { points, segments } = useMemo(() => {
		if (!data.length) return { points: [], segments: [], yMax: 0 };

		const values = data.map((d) => d.y).filter((v): v is number => v !== null);
		const yMax = values.length ? Math.max(...values) * 1.2 : 100;

		const points = data.map((entry, i) => ({
			x: (i / (data.length - 1)) * 100,
			y: entry.y !== null ? 100 - (entry.y / yMax) * 100 : null,
			entry,
			index: i,
		}));

		// Build path segments for continuous data
		const segments: { path: string; areaPath: string }[] = [];
		let currentPoints: { x: number; y: number }[] = [];

		for (const p of points) {
			if (p.y !== null) {
				currentPoints.push({ x: p.x, y: p.y });
			} else if (currentPoints.length >= 2) {
				segments.push(buildSegment(currentPoints));
				currentPoints = [];
			} else {
				currentPoints = [];
			}
		}
		if (currentPoints.length >= 2) {
			segments.push(buildSegment(currentPoints));
		}

		return { points, segments, yMax };
	}, [data]);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<SVGSVGElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100;

			let closest = 0;
			let minDist = Infinity;
			points.forEach((p, i) => {
				const d = Math.abs(p.x - x);
				if (d < minDist) {
					minDist = d;
					closest = i;
				}
			});

			if (minDist < 5) {
				setHovered({ index: closest, clientX: e.clientX, clientY: e.clientY });
			} else {
				setHovered(null);
			}
		},
		[points],
	);

	const handleMouseLeave = useCallback(() => setHovered(null), []);

	if (!data.length) {
		return (
			<div className="h-[160px] flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
				<span className="text-xs text-slate-400">No data available</span>
			</div>
		);
	}

	const hoveredPoint = hovered ? points[hovered.index] : null;
	const lastValid = points.filter((p) => p.y !== null).pop();

	// Determine color based on average
	const avgLatency =
		data.filter((d) => d.y !== null).reduce((s, d) => s + (d.y || 0), 0) /
		data.filter((d) => d.y !== null).length || 0;
	const color =
		avgLatency < 200
			? "rgb(16, 185, 129)"
			: avgLatency < 500
				? "rgb(245, 158, 11)"
				: "rgb(244, 63, 94)";

	return (
		<div className="relative">
			<svg
				viewBox="0 0 100 40"
				preserveAspectRatio="none"
				className="w-full h-[160px] cursor-crosshair"
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
			>
				<title>Response time chart</title>
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={color} stopOpacity={0.2} />
						<stop offset="100%" stopColor={color} stopOpacity={0.02} />
					</linearGradient>
				</defs>

				{/* Grid lines */}
				<line
					x1="0"
					y1="50"
					x2="100"
					y2="50"
					stroke="rgb(226, 232, 240)"
					strokeWidth="0.2"
					vectorEffect="non-scaling-stroke"
				/>

				{/* Area fills */}
				{segments.map((seg, i) => (
					<path
						key={`area-${i}`}
						d={seg.areaPath}
						fill={`url(#${gradientId})`}
					/>
				))}

				{/* Lines */}
				{segments.map((seg, i) => (
					<path
						key={`line-${i}`}
						d={seg.path}
						fill="none"
						stroke={color}
						strokeWidth="0.5"
						vectorEffect="non-scaling-stroke"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				))}

				{/* Down indicators */}
				{points
					.filter((p) => p.entry.up === false)
					.map((p) => (
						<circle
							key={`down-${p.index}`}
							cx={p.x}
							cy="38"
							r="0.8"
							fill="rgb(239, 68, 68)"
						/>
					))}

				{/* Hover line */}
				{hoveredPoint && hoveredPoint.y !== null && (
					<>
						<line
							x1={hoveredPoint.x}
							y1="0"
							x2={hoveredPoint.x}
							y2="40"
							stroke={color}
							strokeWidth="0.3"
							strokeDasharray="1 1"
							vectorEffect="non-scaling-stroke"
						/>
						<circle
							cx={hoveredPoint.x}
							cy={(hoveredPoint.y / 100) * 40}
							r="1"
							fill="white"
							stroke={color}
							strokeWidth="0.4"
							vectorEffect="non-scaling-stroke"
						/>
					</>
				)}

				{/* Last point indicator */}
				{lastValid && !hoveredPoint && lastValid.y !== null && (
					<circle
						cx={lastValid.x}
						cy={(lastValid.y / 100) * 40}
						r="0.8"
						fill={color}
					/>
				)}
			</svg>

			{/* Tooltip - positioned fixed to avoid scroll issues */}
			{hovered && hoveredPoint && (
				<ChartTooltip
					entry={hoveredPoint.entry}
					clientX={hovered.clientX}
					clientY={hovered.clientY}
				/>
			)}
		</div>
	);
}

function buildSegment(pts: { x: number; y: number }[]) {
	const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${(p.y / 100) * 40}`).join(" ");
	const first = pts[0];
	const last = pts[pts.length - 1];
	const areaPath = `${path} L ${last.x} 40 L ${first.x} 40 Z`;
	return { path, areaPath };
}

function ChartTooltip({
	entry,
	clientX,
	clientY,
}: {
	entry: MonitorDetailsHistoryEntry;
	clientX: number;
	clientY: number;
}) {
	const isUp = entry.up === true && entry.y !== null;
	const isDown = entry.up === false;

	const color = isDown
		? "rgb(239, 68, 68)"
		: isUp
			? entry.y! < 200
				? "rgb(16, 185, 129)"
				: entry.y! < 500
					? "rgb(245, 158, 11)"
					: "rgb(244, 63, 94)"
			: "rgb(100, 116, 139)";

	return (
		<div
			className="fixed z-50 pointer-events-none"
			style={{
				left: clientX + 12,
				top: clientY - 40,
			}}
		>
			<div
				className="bg-white border border-slate-200 rounded-md shadow-lg px-2.5 py-1.5"
				style={{ borderLeftColor: color, borderLeftWidth: 3 }}
			>
				<div className="flex items-baseline gap-1.5">
					<span
						className="font-mono font-semibold text-sm"
						style={{ color }}
					>
						{isDown ? "DOWN" : entry.y !== null ? entry.y : "—"}
					</span>
					{isUp && <span className="text-slate-400 text-[10px]">ms</span>}
				</div>
				<div className="text-slate-500 text-[10px] mt-0.5">
					{new Date(entry.x).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</div>
			</div>
		</div>
	);
}
