import { useCallback, useMemo, useState } from "react";

import { Sparkline, type SparklinePoint } from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";

type HistoryEntry = {
	x: string;
	y: number | null;
	up: boolean | null;
};

const COLORS = {
	fast: { stroke: "rgb(16, 185, 129)", class: "text-emerald-500" },
	medium: { stroke: "rgb(245, 158, 11)", class: "text-amber-500" },
	slow: { stroke: "rgb(244, 63, 94)", class: "text-rose-500" },
	down: "rgb(244, 63, 94)",
	noData: "rgb(100, 116, 139)",
};

function getThemeByLatency(avg: number) {
	if (avg < 200) return COLORS.fast;
	if (avg < 500) return COLORS.medium;
	return COLORS.slow;
}

function computeStats(data: HistoryEntry[]) {
	const validEntries = data.filter(
		(e): e is { x: string; y: number; up: true } =>
			e.up === true && e.y !== null,
	);
	const latencies = validEntries.map((e) => e.y);
	const avg = latencies.length
		? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
		: 0;

	const recent = validEntries.slice(-3);
	const recentAvg = recent.length
		? recent.reduce((s, e) => s + e.y, 0) / recent.length
		: 0;
	const diff = recentAvg - avg;
	const trend = Math.abs(diff) > 20 ? (diff > 0 ? "↗" : "↘") : null;

	return { avg, trend };
}

function toSparklineData(data: HistoryEntry[]): SparklinePoint[] {
	return data.map((e) => ({
		value: e.up === true ? e.y : null,
		label: e.x,
		state: e.up === true ? "up" : e.up === false ? "down" : null,
	}));
}

export const LatencyChart = ({ data }: { data?: HistoryEntry[] | null }) => {
	const [hovered, setHovered] = useState<{
		index: number;
		point: SparklinePoint;
	} | null>(null);

	const computed = useMemo(() => {
		if (!data?.length) return null;

		const { avg, trend } = computeStats(data);
		const theme = getThemeByLatency(avg);
		const sparklineData = toSparklineData(data);

		const latest = data[data.length - 1];
		let latestTxt = "—";
		let latestCls = "text-muted-foreground/50";

		if (latest.up === false) {
			latestTxt = "DOWN";
			latestCls = "text-rose-500";
		} else if (latest.up && latest.y !== null) {
			latestTxt = `${latest.y}ms`;
			latestCls = theme.class;
		}

		return {
			avg,
			trend,
			theme,
			sparklineData,
			latestTxt,
			latestCls,
			rawData: data,
		};
	}, [data]);

	const handleHover = useCallback(
		(index: number | null, point: SparklinePoint | null) => {
			if (index !== null && point !== null) {
				setHovered({ index, point });
			} else {
				setHovered(null);
			}
		},
		[],
	);

	if (!data?.length || !computed) {
		return (
			<div className="flex items-center gap-2 w-full">
				<div className="flex-1 h-7 rounded bg-muted/20 flex items-center justify-center border border-dashed border-muted-foreground/10">
					<span className="text-muted-foreground/40 text-[9px] font-mono uppercase tracking-wider">
						No data
					</span>
				</div>
				<span className="text-muted-foreground/40 text-[11px] font-mono min-w-13 text-right">
					—
				</span>
			</div>
		);
	}

	const { avg, trend, theme, sparklineData, latestTxt, latestCls, rawData } =
		computed;
	const hoveredEntry = hovered ? rawData[hovered.index] : null;

	return (
		<div className="flex items-center gap-2.5 w-full group relative">
			<div className="relative flex-1">
				<Sparkline
					data={sparklineData}
					color={theme.stroke}
					onHover={handleHover}
				/>

				<span className="absolute top-0 left-0 text-[7px] font-mono text-muted-foreground/30 pointer-events-none">
					24h
				</span>

				<Tooltip
					entry={hoveredEntry}
					hoverX={
						hovered ? 4 + (hovered.index / (rawData.length - 1)) * 132 : 0
					}
					theme={theme}
					avg={avg}
				/>
			</div>

			<div className="min-w-14.5 text-right flex flex-col gap-0.5">
				<div className="flex items-center justify-end gap-1">
					{trend && (
						<span
							className={cn(
								"text-[8px] font-mono px-1 py-0.5 rounded",
								trend === "↗"
									? "text-amber-500 bg-amber-500/10"
									: "text-emerald-500 bg-emerald-500/10",
							)}
						>
							{trend}
						</span>
					)}
					<span
						className={cn(
							"font-mono font-bold text-[11px] tabular-nums",
							latestCls,
						)}
					>
						{latestTxt}
					</span>
				</div>
				<span className="text-[8px] font-mono text-muted-foreground/40 tabular-nums uppercase tracking-wide">
					μ {avg}ms
				</span>
			</div>
		</div>
	);
};

interface TooltipProps {
	entry: HistoryEntry | null;
	hoverX: number;
	theme: { stroke: string; class: string };
	avg: number;
}

function Tooltip({ entry, hoverX, theme, avg }: TooltipProps) {
	if (!entry) return null;

	const W = 140;
	const isUp = entry.up === true && entry.y !== null;
	const isDown = entry.up === false;
	const accentColor = isUp
		? theme.stroke
		: isDown
			? COLORS.down
			: COLORS.noData;
	const latencyVal = isUp ? entry.y : null;
	const diffVal = latencyVal !== null ? latencyVal - avg : 0;

	return (
		<div
			className="absolute z-50 pointer-events-none"
			style={{
				left: hoverX > W / 2 ? "auto" : hoverX + 8,
				right: hoverX > W / 2 ? W - hoverX + 8 : "auto",
				top: -6,
				transform: "translateY(-100%)",
			}}
		>
			<div
				className="relative bg-popover border border-border/60 rounded-md shadow-lg overflow-hidden"
				style={{ minWidth: 72 }}
			>
				<div
					className="absolute left-0 top-0 bottom-0 w-0.5"
					style={{ backgroundColor: accentColor }}
				/>

				<div className="pl-2.5 pr-2 py-1.5">
					<div className="flex items-baseline gap-1.5">
						<span
							className="font-mono font-semibold text-[11px] tracking-tight"
							style={{ color: accentColor }}
						>
							{entry.up === null ? "—" : isDown ? "DOWN" : `${latencyVal}`}
						</span>
						{isUp && (
							<span className="text-muted-foreground/50 text-[9px] font-mono">
								ms
							</span>
						)}
						{isUp && diffVal !== 0 && (
							<span
								className="text-[8px] font-mono tabular-nums"
								style={{
									color: diffVal > 0 ? "rgb(217, 119, 6)" : "rgb(5, 150, 105)",
								}}
							>
								{diffVal > 0 ? "+" : ""}
								{diffVal}
							</span>
						)}
					</div>

					<div className="text-muted-foreground/60 text-[8px] font-mono tabular-nums mt-0.5">
						{new Date(entry.x).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
