import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    ExternalLink,
    Globe,
    History,
    MoreVertical,
    PauseCircle,
    PlayCircle,
    Settings,
    Trash2,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { LatencyChart } from "@/components/monitors/list/cells";
import { MonitorEditForm } from "@/components/monitors/edit/monitor-edit-form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Monitor } from "@/modules/monitors/monitors.zod";
import type { HeartbeatStatus } from "@/modules/heartbeats/heartbeats.zod";

// Types
interface Heartbeat {
    time: Date;
    status: HeartbeatStatus;
    latency: number | null;
    message: string | null;
    metrics: Record<string, unknown>;
}

interface MonitorViewProps {
    monitor: Monitor & { channelIds: string[] };
    heartbeats: Heartbeat[];
    onToggleActive: () => Promise<void>;
    onDelete: () => Promise<void>;
}

// Helpers
function computeMonitorData(heartbeats: Heartbeat[]) {
    const recentChecks = heartbeats.slice(0, 10).map((hb) => ({
        time: hb.time,
        status: hb.status,
        latency: hb.latency ?? 0,
        statusCode:
            "statusCode" in hb.metrics
                ? (hb.metrics.statusCode as number)
                : undefined,
        message: hb.message,
    }));

    const validLatencies = heartbeats
        .filter((hb) => hb.latency != null)
        .map((hb) => hb.latency!);
    const avgLatency =
        validLatencies.length > 0
            ? Math.round(
                validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length,
            )
            : 0;

    const upCount = heartbeats.filter((hb) => hb.status === "up").length;
    const totalCount = heartbeats.length;
    const uptime24h =
        totalCount > 0 ? Math.round((upCount / totalCount) * 100 * 100) / 100 : 0;

    const hourlyData = new Map<
        string,
        { latencies: number[]; upCount: number; downCount: number }
    >();

    for (const hb of heartbeats) {
        const hour = new Date(hb.time);
        hour.setMinutes(0, 0, 0);
        const hourKey = hour.toISOString();

        if (!hourlyData.has(hourKey)) {
            hourlyData.set(hourKey, { latencies: [], upCount: 0, downCount: 0 });
        }

        const data = hourlyData.get(hourKey)!;
        if (hb.latency != null) {
            data.latencies.push(hb.latency);
        }
        if (hb.status === "up") {
            data.upCount++;
        } else if (hb.status === "down" || hb.status === "error") {
            data.downCount++;
        }
    }

    const historyData = Array.from(hourlyData.entries())
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([time, data]) => {
            const totalChecks = data.upCount + data.downCount;
            return {
                x: time,
                y:
                    data.latencies.length > 0
                        ? Math.round(
                            data.latencies.reduce((a, b) => a + b, 0) /
                            data.latencies.length,
                        )
                        : null,
                up: totalChecks === 0 ? null : data.upCount > 0 ? true : false,
            };
        });

    return {
        recentChecks,
        stats: { avgLatency, uptime24h, uptime30d: uptime24h },
        historyData,
    };
}

// Main Component
export function MonitorView({
    monitor,
    heartbeats,
    onToggleActive,
    onDelete,
}: MonitorViewProps) {
    const { recentChecks, stats, historyData } = useMemo(
        () => computeMonitorData(heartbeats),
        [heartbeats],
    );

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
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <Header
                monitor={monitor}
                isActive={isActive}
                onToggle={handleToggle}
                onDelete={handleDelete}
            />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 border">
                    <TabsTrigger value="overview" className="gap-2">
                        <Activity className="w-4 h-4" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="configuration" className="gap-2">
                        <Settings className="w-4 h-4" /> Configuration
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <StatsGrid monitor={monitor} stats={stats} recentChecks={recentChecks} />
                    <ChartCard historyData={historyData} />
                    <RecentChecksCard recentChecks={recentChecks} />
                </TabsContent>

                <TabsContent value="configuration">
                    <MonitorEditForm
                        monitor={monitor}
                        connectedChannelIds={monitor.channelIds}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Sub-components

function Header({
    monitor,
    isActive,
    onToggle,
    onDelete,
}: {
    monitor: Monitor;
    isActive: boolean;
    onToggle: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b pb-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link
                        to="/monitors"
                        className="hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Monitors
                    </Link>
                    <span>/</span>
                    <span>Details</span>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-3xl font-bold tracking-tight">{monitor.name}</h1>
                    <StatusBadge status={monitor.status || "pending"} />
                    {!isActive && (
                        <Badge variant="secondary" className="text-muted-foreground">
                            Paused
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-6 text-sm">
                    {monitor.type === "http" && (
                        <a
                            href={monitor.target}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Globe className="h-4 w-4" />
                            {monitor.target}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        Check every {monitor.frequency / 60} min
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    onClick={onToggle}
                    className={cn(
                        isActive
                            ? "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                            : "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200",
                    )}
                >
                    {isActive ? (
                        <>
                            <PauseCircle className="mr-2 h-4 w-4" /> Pause
                        </>
                    ) : (
                        <>
                            <PlayCircle className="mr-2 h-4 w-4" /> Resume
                        </>
                    )}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onToggle}>
                            {isActive ? "Pause Checking" : "Resume Checking"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Monitor?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete <strong>{monitor.name}</strong>{" "}
                                        and all its history.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onDelete}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function StatsGrid({
    monitor,
    stats,
    recentChecks,
}: {
    monitor: Monitor;
    stats: { avgLatency: number; uptime24h: number; uptime30d: number };
    recentChecks: { time: Date }[];
}) {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            <StatsCard
                title="Current Status"
                value={(monitor.status || "pending").toUpperCase()}
                sub={
                    recentChecks[0]?.time
                        ? new Date(recentChecks[0].time).toLocaleString()
                        : "Never"
                }
                icon={<StatusIcon status={monitor.status || "pending"} className="h-4 w-4" />}
            />
            <StatsCard
                title="Avg. Latency"
                value={`${stats.avgLatency} ms`}
                sub="Last 24 hours"
                icon={<Clock className="h-4 w-4 text-blue-500" />}
            />
            <StatsCard
                title="24h Uptime"
                value={`${stats.uptime24h}%`}
                sub="Target: 99.9%"
                icon={<Activity className="h-4 w-4 text-purple-500" />}
            />
            <StatsCard
                title="30d Uptime"
                value={`${stats.uptime30d}%`}
                sub="Rolling window"
                icon={<Activity className="h-4 w-4 text-orange-500" />}
            />
        </div>
    );
}

function StatsCard({
    title,
    value,
    sub,
    icon,
}: {
    title: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
        </Card>
    );
}

function ChartCard({
    historyData,
}: {
    historyData: { x: string; y: number | null; up: boolean | null }[];
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Response Time & Uptime</CardTitle>
                <CardDescription>
                    Latency and availability over the last 24 hours
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="py-8">
                    <LatencyChart data={historyData} />
                </div>
            </CardContent>
        </Card>
    );
}

function RecentChecksCard({
    recentChecks,
}: {
    recentChecks: {
        time: Date;
        status: string;
        latency: number;
        statusCode?: number;
        message: string | null;
    }[];
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-muted-foreground" />
                    Recent Checks
                </CardTitle>
                <CardDescription>Latest heartbeat logs</CardDescription>
            </CardHeader>
            <CardContent>
                {recentChecks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No checks recorded yet.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {recentChecks.map((check, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/30 px-2 rounded-md transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-full border",
                                            check.status === "up"
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : "bg-red-50 text-red-600 border-red-100",
                                        )}
                                    >
                                        {check.status === "up" ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            <span
                                                className={
                                                    check.status === "up"
                                                        ? "text-emerald-700"
                                                        : "text-red-700"
                                                }
                                            >
                                                {check.status.toUpperCase()}
                                            </span>
                                            {check.statusCode && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] h-5 px-1.5 font-mono"
                                                >
                                                    {check.statusCode}
                                                </Badge>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(check.time).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    {check.message && (
                                        <span
                                            className="text-xs text-muted-foreground max-w-[200px] truncate hidden md:inline-block"
                                            title={check.message}
                                        >
                                            {check.message}
                                        </span>
                                    )}
                                    <div className="text-sm font-mono text-muted-foreground w-16 text-right">
                                        {check.latency}ms
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        up: "bg-emerald-50 text-emerald-700 border-emerald-200",
        down: "bg-red-50 text-red-700 border-red-200",
        maintenance: "bg-amber-50 text-amber-700 border-amber-200",
        pending: "bg-gray-50 text-gray-700 border-gray-200",
    };

    const icons = {
        up: <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />,
        down: <XCircle className="mr-1.5 h-3.5 w-3.5" />,
        maintenance: <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />,
        pending: <Activity className="mr-1.5 h-3.5 w-3.5" />,
    };

    const s = status as keyof typeof styles;

    return (
        <Badge
            variant="outline"
            className={cn("px-3 py-1 text-sm font-medium", styles[s] || styles.pending)}
        >
            {icons[s] || icons.pending}
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
        </Badge>
    );
}

function StatusIcon({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    if (status === "up")
        return <CheckCircle2 className={cn("text-emerald-500", className)} />;
    if (status === "down")
        return <XCircle className={cn("text-red-500", className)} />;
    if (status === "maintenance")
        return <AlertTriangle className={cn("text-amber-500", className)} />;
    return <Activity className={cn("text-gray-500", className)} />;
}
