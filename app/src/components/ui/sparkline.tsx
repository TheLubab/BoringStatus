import { memo, useCallback, useId, useMemo, useState } from "react";

export interface SparklinePoint {
	value: number | null;
	label?: string;
	state?: "up" | "down" | null;
}

export interface SparklineProps {
	data: SparklinePoint[];
	width?: number;
	height?: number;
	padding?: number;
	color?: string;
	showGradient?: boolean;
	animate?: boolean;
	onHover?: (index: number | null, point: SparklinePoint | null) => void;
}

interface ProcessedPoint {
	x: number;
	y: number;
	point: SparklinePoint;
	index: number;
}

interface Segment {
	points: { x: number; y: number }[];
	path: string;
	length: number;
	areaPath: string | null;
}

function monotoneCubicSpline(pts: { x: number; y: number }[]): string {
	if (pts.length < 2) return "";

	const n = pts.length;
	const deltas: number[] = [];
	const tangents: number[] = [];

	for (let i = 0; i < n - 1; i++) {
		deltas[i] = (pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x);
	}

	tangents[0] = deltas[0];
	for (let i = 1; i < n - 1; i++) {
		tangents[i] = (deltas[i - 1] + deltas[i]) / 2;
	}
	tangents[n - 1] = deltas[n - 2];

	let path = `M ${pts[0].x} ${pts[0].y}`;
	for (let i = 0; i < n - 1; i++) {
		const dx = pts[i + 1].x - pts[i].x;
		const cp1x = pts[i].x + dx / 3;
		const cp1y = pts[i].y + (tangents[i] * dx) / 3;
		const cp2x = pts[i + 1].x - dx / 3;
		const cp2y = pts[i + 1].y - (tangents[i + 1] * dx) / 3;
		path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
	}

	return path;
}

function measurePathLength(pts: { x: number; y: number }[]): number {
	let len = 0;
	for (let i = 1; i < pts.length; i++) {
		const dx = pts[i].x - pts[i - 1].x;
		const dy = pts[i].y - pts[i - 1].y;
		len += Math.sqrt(dx * dx + dy * dy);
	}
	return len;
}

function buildAreaPath(
	linePath: string,
	pts: { x: number; y: number }[],
	bottom: number,
): string {
	const first = pts[0];
	const last = pts[pts.length - 1];
	return `${linePath} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
}

export function useSparklineData(
	data: SparklinePoint[],
	width: number,
	height: number,
	padding: number,
) {
	return useMemo(() => {
		if (!data.length) return { points: [], segments: [], yMax: 0 };

		const chartW = width - padding * 2;
		const chartH = height - padding * 2;
		const values = data
			.map((d) => d.value)
			.filter((v): v is number => v !== null);
		const yMax = Math.max(...values, 100) * 1.2;

		const points: ProcessedPoint[] = data.map((point, i) => ({
			x:
				padding +
				(data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
			y:
				point.value !== null
					? padding + chartH - (point.value / yMax) * chartH
					: height - 6,
			point,
			index: i,
		}));

		// Split into continuous segments (where value is not null)
		const segments: Segment[] = [];
		let current: { x: number; y: number }[] = [];

		points.forEach((p) => {
			if (p.point.value !== null) {
				current.push({ x: p.x, y: p.y });
			} else if (current.length) {
				segments.push(createSegment(current, height - padding));
				current = [];
			}
		});
		if (current.length) {
			segments.push(createSegment(current, height - padding));
		}

		return { points, segments, yMax };
	}, [data, width, height, padding]);
}

function createSegment(
	pts: { x: number; y: number }[],
	bottom: number,
): Segment {
	const path = monotoneCubicSpline(pts);
	return {
		points: pts,
		path,
		length: measurePathLength(pts),
		areaPath: pts.length >= 2 ? buildAreaPath(path, pts, bottom) : null,
	};
}

export const Sparkline = memo(function Sparkline({
	data,
	width = 140,
	height = 30,
	padding = 4,
	color = "rgb(16, 185, 129)",
	showGradient = true,
	animate = true,
	onHover,
}: SparklineProps) {
	const gradientId = useId();
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const { points, segments } = useSparklineData(data, width, height, padding);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<SVGSVGElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const mx = e.clientX - rect.left;

			let closest = 0;
			let minDist = Infinity;
			points.forEach((p, i) => {
				const d = Math.abs(p.x - mx);
				if (d < minDist) {
					minDist = d;
					closest = i;
				}
			});

			const idx = minDist < 15 ? closest : null;
			setHoveredIndex(idx);
			onHover?.(idx, idx !== null ? points[idx].point : null);
		},
		[points, onHover],
	);

	const handleMouseLeave = useCallback(() => {
		setHoveredIndex(null);
		onHover?.(null, null);
	}, [onHover]);

	if (!data.length) return null;

	const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;
	const lastValidPoint = points.filter((p) => p.point.value !== null).pop();

	return (
		<svg
			width={width}
			height={height}
			className="cursor-crosshair"
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		>
			<title>sparkline</title>
			{showGradient && (
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={color} stopOpacity={0.3} />
						<stop offset="100%" stopColor={color} stopOpacity={0.02} />
					</linearGradient>
				</defs>
			)}

			{/* Area fills */}
			{showGradient &&
				segments.map((seg) =>
					seg.areaPath ? (
						<path
							key={`a${seg}`}
							d={seg.areaPath}
							fill={`url(#${gradientId})`}
						/>
					) : null,
				)}

			{/* Lines */}
			{segments.map((seg, i) => (
				<path
					key={`l${seg}`}
					d={seg.path}
					fill="none"
					stroke={color}
					strokeWidth={1.5}
					strokeLinecap="round"
					strokeDasharray={animate ? seg.length : undefined}
					strokeDashoffset={animate ? seg.length : undefined}
					style={
						animate
							? {
								animation: `sparkline-draw 600ms ease-out ${100 + i * 80}ms forwards`,
							}
							: undefined
					}
				/>
			))}

			{/* Null state dots */}
			{points
				.filter((p) => p.point.value === null)
				.map((p) => (
					<circle
						key={`null-${p.index}`}
						cx={p.x}
						cy={height - 6}
						r={p.point.state === "down" ? 2 : 1.5}
						fill={
							p.point.state === "down"
								? "rgb(244, 63, 94)"
								: "rgb(100, 116, 139)"
						}
						opacity={p.point.state === "down" ? 0.5 : 0.4}
					/>
				))}

			{/* Hover indicator */}
			{hoveredPoint && (
				<>
					<line
						x1={hoveredPoint.x}
						y1={padding}
						x2={hoveredPoint.x}
						y2={height - padding}
						stroke={color}
						strokeWidth={1}
						strokeDasharray="2 2"
						opacity={0.5}
					/>
					<circle
						cx={hoveredPoint.x}
						cy={hoveredPoint.y}
						r={4}
						fill="white"
						stroke={color}
						strokeWidth={2}
					/>
				</>
			)}

			{/* Last valid point indicator */}
			{lastValidPoint && !hoveredPoint && (
				<>
					<circle
						cx={lastValidPoint.x}
						cy={lastValidPoint.y}
						r={5}
						fill={color}
						opacity={0.15}
					/>
					<circle
						cx={lastValidPoint.x}
						cy={lastValidPoint.y}
						r={2.5}
						fill={color}
					/>
				</>
			)}

			{animate && (
				<style>{`@keyframes sparkline-draw { to { stroke-dashoffset: 0; } }`}</style>
			)}
		</svg>
	);
});
