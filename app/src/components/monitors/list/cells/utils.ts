// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type HistoryEntry = { x: string; y: number | null; up: boolean | null };

export type Point = { x: number; y: number };

export type LatencyColors = {
    stroke: string;
    fill: string;
    class: string;
    gradientId: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// LATENCY COLOR GRADING
// ─────────────────────────────────────────────────────────────────────────────

const LATENCY_THRESHOLDS = { healthy: 300, degraded: 800 } as const;

export const getLatencyColor = (latency: number): LatencyColors => {
    if (latency < LATENCY_THRESHOLDS.healthy)
        return {
            stroke: "rgb(16 185 129)",
            fill: "rgba(16, 185, 129, 0.2)",
            class: "text-emerald-500",
            gradientId: "grad-emerald",
        };
    if (latency < LATENCY_THRESHOLDS.degraded)
        return {
            stroke: "rgb(245 158 11)",
            fill: "rgba(245, 158, 11, 0.2)",
            class: "text-amber-500",
            gradientId: "grad-amber",
        };
    return {
        stroke: "rgb(244 63 94)",
        fill: "rgba(244, 63, 94, 0.2)",
        class: "text-rose-500",
        gradientId: "grad-rose",
    };
};

// Colors for different states
export const STATE_COLORS = {
    noData: {
        stroke: "rgb(156 163 175)",
        fill: "rgba(156, 163, 175, 0.15)",
        class: "text-muted-foreground",
    }, // gray-400
    down: {
        stroke: "rgb(244 63 94)",
        fill: "rgba(244, 63, 94, 0.15)",
        class: "text-rose-500",
    }, // rose-500
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// MONOTONE CUBIC SPLINE (Fritsch-Carlson for smooth curves)
// ─────────────────────────────────────────────────────────────────────────────

export const monotoneCubicPath = (points: Point[]): string => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2)
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    // Calculate slopes
    const n = points.length;
    const dx: number[] = [];
    const dy: number[] = [];
    const m: number[] = [];

    for (let i = 0; i < n - 1; i++) {
        dx[i] = points[i + 1].x - points[i].x;
        dy[i] = points[i + 1].y - points[i].y;
        m[i] = dy[i] / dx[i];
    }

    // Compute tangents (Fritsch-Carlson)
    const tangents: number[] = [m[0]];
    for (let i = 1; i < n - 1; i++) {
        if (m[i - 1] * m[i] <= 0) {
            tangents[i] = 0;
        } else {
            tangents[i] = (m[i - 1] + m[i]) / 2;
        }
    }
    tangents[n - 1] = m[n - 2];

    // Ensure monotonicity
    for (let i = 0; i < n - 1; i++) {
        if (Math.abs(m[i]) < 1e-6) {
            tangents[i] = 0;
            tangents[i + 1] = 0;
        } else {
            const alpha = tangents[i] / m[i];
            const beta = tangents[i + 1] / m[i];
            const tau = alpha * alpha + beta * beta;
            if (tau > 9) {
                const t = 3 / Math.sqrt(tau);
                tangents[i] = t * alpha * m[i];
                tangents[i + 1] = t * beta * m[i];
            }
        }
    }

    // Build cubic bezier path
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const d = dx[i] / 3;
        const cp1x = p0.x + d;
        const cp1y = p0.y + tangents[i] * d;
        const cp2x = p1.x - d;
        const cp2y = p1.y - tangents[i + 1] * d;
        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    return path;
};
