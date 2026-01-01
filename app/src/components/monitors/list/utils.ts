import type {
    DashboardHistoryEntry,
    DashboardMonitor,
    TcpConfig,
} from "@/modules/monitors/monitors.zod";

/**
 * Calculate average latency from history array
 * Only includes valid UP entries with non-null latency
 */
export const getAverageLatency = (
    history: DashboardHistoryEntry[] | null | undefined,
): number => {
    if (!history || history.length === 0) return 0;
    const validEntries = history.filter(
        (e): e is { x: string; y: number; up: true } =>
            e.up === true && e.y !== null,
    );
    if (validEntries.length === 0) return 0;
    const total = validEntries.reduce((acc, entry) => acc + entry.y, 0);
    return total / validEntries.length;
};

/**
 * Get display URL for a monitor
 * Includes port suffix for TCP monitors
 */
export const getMonitorDisplayUrl = (monitor: DashboardMonitor): string => {
    if (monitor.type === "tcp") {
        const config = monitor.config as TcpConfig;
        if (config?.port) {
            return `${monitor.target}:${config.port}`;
        }
    }
    return monitor.target;
};

/**
 * Get status-based border color class for table rows
 */
export const getStatusBorderClass = (status: string | null): string => {
    switch (status) {
        case "up":
            return "border-l-emerald-500/60";
        case "down":
            return "border-l-rose-500";
        case "error":
            return "border-l-rose-500";
        case "degraded":
            return "border-l-amber-500";
        case "pending":
            return "border-l-muted-foreground/30";
        default:
            return "border-l-transparent";
    }
};
