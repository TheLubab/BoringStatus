"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Beaker, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
    clearHeartbeatsForMonitor,
    generateFakeHeartbeats,
} from "@/modules/heartbeats/heartbeats.dev";
import type { DashboardMonitor } from "@/modules/monitors/monitors.zod";

// ─────────────────────────────────────────────────────────────────────────────
// DEV TOOLBAR - Only shows in development mode
// ─────────────────────────────────────────────────────────────────────────────

interface DevToolbarProps {
    monitors: DashboardMonitor[];
}

export function DevToolbar({ monitors }: DevToolbarProps) {
    // Only render in development
    if (process.env.NODE_ENV === "production") {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 z-50">
            <GenerateHeartbeatsButton monitors={monitors} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE HEARTBEATS DIALOG
// ─────────────────────────────────────────────────────────────────────────────

interface GenerateHeartbeatsButtonProps {
    monitors: DashboardMonitor[];
}

function GenerateHeartbeatsButton({ monitors }: GenerateHeartbeatsButtonProps) {
    const [open, setOpen] = useState(false);
    const [selectedMonitorId, setSelectedMonitorId] = useState<string>("");
    const [count, setCount] = useState(50);
    const [intervalMinutes, setIntervalMinutes] = useState(5);
    const [upProbability, setUpProbability] = useState(92);
    const [degradedProbability, setDegradedProbability] = useState(5);

    const queryClient = useQueryClient();

    const generateMutation = useMutation({
        mutationFn: (data: {
            monitorId: string;
            count: number;
            intervalMinutes: number;
            upProbability: number;
            degradedProbability: number;
        }) => generateFakeHeartbeats({ data }),
        onSuccess: (result) => {
            toast.success(`Generated ${result.generated} heartbeats`, {
                description: `Status: ${result.statusBreakdown.up} up, ${result.statusBreakdown.degraded} degraded, ${result.statusBreakdown.down} down`,
            });
            queryClient.invalidateQueries({ queryKey: ["monitors"] });
            setOpen(false);
        },
        onError: (error) => {
            toast.error("Failed to generate heartbeats", {
                description: error.message,
            });
        },
    });

    const clearMutation = useMutation({
        mutationFn: (monitorId: string) =>
            clearHeartbeatsForMonitor({ data: { monitorId } }),
        onSuccess: () => {
            toast.success("Cleared all heartbeats");
            queryClient.invalidateQueries({ queryKey: ["monitors"] });
        },
        onError: (error) => {
            toast.error("Failed to clear heartbeats", {
                description: error.message,
            });
        },
    });

    const handleGenerate = () => {
        if (!selectedMonitorId) {
            toast.error("Please select a monitor");
            return;
        }

        generateMutation.mutate({
            monitorId: selectedMonitorId,
            count,
            intervalMinutes,
            upProbability: upProbability / 100,
            degradedProbability: degradedProbability / 100,
        });
    };

    const handleClear = () => {
        if (!selectedMonitorId) {
            toast.error("Please select a monitor");
            return;
        }
        clearMutation.mutate(selectedMonitorId);
    };

    const isPending = generateMutation.isPending || clearMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                        "gap-2 shadow-lg border-amber-500/30 bg-amber-50 dark:bg-amber-950/30",
                        "hover:bg-amber-100 dark:hover:bg-amber-900/40",
                        "text-amber-700 dark:text-amber-400",
                    )}
                >
                    <Beaker className="size-4" />
                    <span className="hidden sm:inline">Dev Tools</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="size-5 text-amber-500" />
                        Generate Test Heartbeats
                    </DialogTitle>
                    <DialogDescription>
                        Create fake heartbeat data for testing the dashboard. This is only
                        available in development mode.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Monitor Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="monitor">Monitor</Label>
                        <Select
                            value={selectedMonitorId}
                            onValueChange={setSelectedMonitorId}
                        >
                            <SelectTrigger id="monitor">
                                <SelectValue placeholder="Select a monitor..." />
                            </SelectTrigger>
                            <SelectContent>
                                {monitors.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        <span className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    "size-2 rounded-full",
                                                    m.status === "up" && "bg-emerald-500",
                                                    m.status === "down" && "bg-rose-500",
                                                    m.status === "degraded" && "bg-amber-500",
                                                    m.status === "pending" && "bg-slate-400",
                                                )}
                                            />
                                            {m.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Count */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="count">Heartbeat Count</Label>
                            <span className="text-xs text-muted-foreground font-mono">
                                {count}
                            </span>
                        </div>
                        <Input
                            id="count"
                            type="number"
                            value={count}
                            onChange={(e) =>
                                setCount(Math.min(500, Math.max(1, Number(e.target.value))))
                            }
                            min={1}
                            max={500}
                        />
                    </div>

                    {/* Interval */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="interval">Interval (minutes)</Label>
                            <span className="text-xs text-muted-foreground font-mono">
                                {intervalMinutes}m
                            </span>
                        </div>
                        <Slider
                            id="interval"
                            value={[intervalMinutes]}
                            onValueChange={([v]) => setIntervalMinutes(v)}
                            min={1}
                            max={60}
                            step={1}
                            className="py-2"
                        />
                        <p className="text-xs text-muted-foreground">
                            Total time span:{" "}
                            {Math.round((count * intervalMinutes) / 60 / 24) > 0
                                ? `~${Math.round((count * intervalMinutes) / 60 / 24)} days`
                                : `~${Math.round((count * intervalMinutes) / 60)} hours`}
                        </p>
                    </div>

                    {/* Status Probabilities */}
                    <div className="space-y-3">
                        <Label>Status Probabilities</Label>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-emerald-600">Up</span>
                                    <span className="text-xs font-mono">{upProbability}%</span>
                                </div>
                                <Slider
                                    value={[upProbability]}
                                    onValueChange={([v]) => setUpProbability(v)}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="py-1"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-amber-600">Degraded</span>
                                    <span className="text-xs font-mono">
                                        {degradedProbability}%
                                    </span>
                                </div>
                                <Slider
                                    value={[degradedProbability]}
                                    onValueChange={([v]) => setDegradedProbability(v)}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="py-1"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-rose-600">Down/Error</span>
                                    <span className="text-xs font-mono">
                                        {Math.max(0, 100 - upProbability - degradedProbability)}%
                                    </span>
                                </div>
                                <div className="h-4 flex items-center">
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-rose-400 transition-all"
                                            style={{
                                                width: `${Math.max(0, 100 - upProbability - degradedProbability)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-row gap-2 sm:gap-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClear}
                        disabled={isPending || !selectedMonitorId}
                        className="gap-1.5"
                    >
                        {clearMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="size-3.5" />
                        )}
                        Clear
                    </Button>
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isPending || !selectedMonitorId}
                        className="gap-1.5"
                    >
                        {generateMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="size-3.5" />
                        )}
                        Generate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
