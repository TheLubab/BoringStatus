import { AlertTriangle, CheckCircle2, Clock, History } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MonitorDetailsCheck } from "@/modules/monitors/monitors.zod";

interface RecentChecksCardProps {
    recentChecks: MonitorDetailsCheck[];
}

export function RecentChecksCard({ recentChecks }: RecentChecksCardProps) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-400" />
                    <h3 className="text-sm font-medium text-slate-900">Recent Checks</h3>
                </div>
                {recentChecks.length > 0 && <ChecksSummary checks={recentChecks} />}
            </div>

            {recentChecks.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="divide-y divide-slate-100">
                    {recentChecks.map((check, i) => (
                        <CheckRow key={i} check={check} isLatest={i === 0} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ChecksSummary({ checks }: { checks: MonitorDetailsCheck[] }) {
    const upCount = checks.filter((c) => c.status === "up").length;
    const downCount = checks.length - upCount;

    return (
        <div className="flex items-center gap-3 text-xs">
            {upCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {upCount}
                </span>
            )}
            {downCount > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {downCount}
                </span>
            )}
        </div>
    );
}

function CheckRow({
    check,
    isLatest,
}: {
    check: MonitorDetailsCheck;
    isLatest: boolean;
}) {
    const isUp = check.status === "up";

    return (
        <div
            className={cn(
                "flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-slate-50",
                isLatest && "bg-slate-50/50",
            )}
        >
            <div className="flex items-center gap-3">
                {/* Status indicator */}
                <div
                    className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full",
                        isUp ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600",
                    )}
                >
                    {isUp ? (
                        <CheckCircle2 className="h-3 w-3" />
                    ) : (
                        <AlertTriangle className="h-3 w-3" />
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                "text-xs font-medium",
                                isUp ? "text-emerald-700" : "text-red-700",
                            )}
                        >
                            {check.status.toUpperCase()}
                        </span>
                        {check.statusCode && (
                            <span
                                className={cn(
                                    "px-1.5 py-0.5 text-[10px] font-mono rounded",
                                    check.statusCode >= 200 && check.statusCode < 300
                                        ? "bg-emerald-100 text-emerald-700"
                                        : check.statusCode >= 400
                                            ? "bg-red-100 text-red-700"
                                            : "bg-amber-100 text-amber-700",
                                )}
                            >
                                {check.statusCode}
                            </span>
                        )}
                        {isLatest && (
                            <span className="px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide rounded bg-blue-100 text-blue-600">
                                Latest
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatCheckTime(new Date(check.time))}
                        {check.message && (
                            <>
                                <span className="text-slate-300 mx-1">·</span>
                                <span className="truncate max-w-[160px]">{check.message}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Latency */}
            <div className="text-right">
                <span
                    className={cn(
                        "text-sm font-mono font-medium tabular-nums",
                        check.latency != null &&
                        (check.latency < 200
                            ? "text-emerald-600"
                            : check.latency < 500
                                ? "text-slate-700"
                                : check.latency < 1000
                                    ? "text-amber-600"
                                    : "text-red-600"),
                    )}
                >
                    {check.latency != null ? `${check.latency}ms` : "—"}
                </span>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 mb-2">
                <Clock className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No checks yet</p>
            <p className="text-xs text-slate-500 mt-0.5">
                Checks will appear once the monitor runs
            </p>
        </div>
    );
}

function formatCheckTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
