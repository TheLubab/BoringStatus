"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Pattern = "stable" | "degrading" | "incident" | "recovery" | "intermittent" | "maintenance";
type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";

const PATTERNS: Record<Pattern, string> = {
    stable: "Stable",
    degrading: "Degrading",
    incident: "Incident",
    recovery: "Recovery",
    intermittent: "Intermittent",
    maintenance: "Maintenance",
};

const TIME_RANGES: Record<TimeRange, { label: string; minutes: number; interval: number }> = {
    "1h": { label: "1h", minutes: 60, interval: 1 },
    "6h": { label: "6h", minutes: 360, interval: 5 },
    "24h": { label: "24h", minutes: 1440, interval: 5 },
    "7d": { label: "7d", minutes: 10080, interval: 15 },
    "30d": { label: "30d", minutes: 43200, interval: 60 },
};

export const BoringDevtoolsPlugin = {
    name: "Boring Status",
    render: <DevPanel />,
};

function DevPanel() {
    const [monitor, setMonitor] = useState("");
    const [pattern, setPattern] = useState<Pattern>("stable");
    const [time, setTime] = useState<TimeRange>("24h");
    const [log, setLog] = useState<string[]>([]);
    const queryClient = useQueryClient();

    const addLog = (msg: string) => setLog((p) => [msg, ...p].slice(0, 10));
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["monitors"] });
        refetch();
    };

    const { data: monitors = [], refetch } = useQuery({
        queryKey: ["devtools-monitors"],
        queryFn: async () => {
            const mod = await import("./devtools.server");
            return mod.getMonitorsForDevtools();
        },
    });

    const simulate = useMutation({
        mutationFn: async (monitorId: string) => {
            const mod = await import("./devtools.server");
            return mod.simulateRealisticHeartbeats({ data: { monitorId, pattern, ...TIME_RANGES[time] } });
        },
        onSuccess: () => invalidate(),
    });

    const clearHeartbeats = useMutation({
        mutationFn: async (monitorId: string) => {
            const mod = await import("./devtools.server");
            return mod.clearHeartbeats({ data: { monitorId } });
        },
        onSuccess: () => {
            addLog("✓ Heartbeats cleared");
            invalidate();
        },
    });

    const deleteMonitor = useMutation({
        mutationFn: async (monitorId: string) => {
            const mod = await import("./devtools.server");
            return mod.deleteMonitorDev({ data: { monitorId } });
        },
        onSuccess: () => {
            addLog("✓ Monitor deleted");
            invalidate();
        },
    });

    const createMonitor = useMutation({
        mutationFn: async (type: "http" | "tcp" | "ping") => {
            const mod = await import("./devtools.server");
            return mod.createRandomMonitor({ data: { type } });
        },
        onSuccess: (r) => {
            addLog(`✓ Created: ${r.name}`);
            invalidate();
        },
    });

    const refreshAgg = useMutation({
        mutationFn: async () => {
            const mod = await import("./devtools.server");
            return mod.refreshAggregates();
        },
        onSuccess: () => {
            addLog("✓ Aggregates refreshed");
            invalidate();
        },
    });

    const handleGenerate = async () => {
        if (!monitor) return;
        addLog(`Generating ${TIME_RANGES[time].label} ${pattern}...`);
        await simulate.mutateAsync(monitor);
        addLog("✓ Done");
    };

    const handleClear = () => {
        if (!monitor) return;
        const name = monitors.find((m) => m.id === monitor)?.name;
        if (confirm(`Clear heartbeats for ${name}?`)) {
            clearHeartbeats.mutate(monitor);
        }
    };

    const handleDelete = () => {
        if (!monitor) return;
        const name = monitors.find((m) => m.id === monitor)?.name;
        if (confirm(`DELETE monitor "${name}" and all its data?`)) {
            deleteMonitor.mutate(monitor);
            setMonitor("");
        }
    };

    const pending = simulate.isPending || clearHeartbeats.isPending || deleteMonitor.isPending || createMonitor.isPending || refreshAgg.isPending;
    const selectedName = monitor ? monitors.find((m) => m.id === monitor)?.name : null;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <b>⚗️ Dev Tools</b>
                <span style={styles.badge}>{monitors.length} monitors</span>
            </div>

            <div style={styles.content}>
                <Section title="Create Monitor">
                    <div style={styles.row}>
                        <Btn onClick={() => createMonitor.mutate("http")} disabled={pending}>+ HTTP</Btn>
                        <Btn onClick={() => createMonitor.mutate("tcp")} disabled={pending}>+ TCP</Btn>
                        <Btn onClick={() => createMonitor.mutate("ping")} disabled={pending}>+ Ping</Btn>
                        <Btn onClick={() => refreshAgg.mutate()} disabled={pending} color="#666">Refresh Agg</Btn>
                    </div>
                </Section>

                <Section title="Target Monitor">
                    <select value={monitor} onChange={(e) => setMonitor(e.target.value)} style={styles.select}>
                        <option value="">Select a monitor...</option>
                        {monitors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </Section>

                <Section title="Generate Heartbeats">
                    <div style={styles.row}>
                        {Object.entries(TIME_RANGES).map(([k, v]) => (
                            <Pill key={k} active={time === k} onClick={() => setTime(k as TimeRange)}>{v.label}</Pill>
                        ))}
                    </div>
                    <div style={{ ...styles.row, marginTop: 6 }}>
                        {Object.entries(PATTERNS).map(([k, v]) => (
                            <Pill key={k} active={pattern === k} onClick={() => setPattern(k as Pattern)}>{v}</Pill>
                        ))}
                    </div>
                    <Btn color="#22c55e" onClick={handleGenerate} disabled={pending || !monitor} style={{ marginTop: 8 }}>
                        {selectedName ? `Generate for ${selectedName}` : "Select a monitor"}
                    </Btn>
                </Section>

                <Section title="Destructive">
                    <div style={styles.row}>
                        <Btn color="#ef4444" onClick={handleClear} disabled={pending || !monitor}>Clear Heartbeats</Btn>
                        <Btn color="#ef4444" onClick={handleDelete} disabled={pending || !monitor}>Delete Monitor</Btn>
                    </div>
                </Section>
            </div>

            <div style={styles.log}>
                {log.length ? log.map((l, i) => <div key={i} style={{ color: l.startsWith("✓") ? "#22c55e" : "#888" }}>{l}</div>) : "Ready"}
            </div>
        </div>
    );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: { height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0a", color: "#e5e5e5", fontFamily: "monospace", fontSize: 11 },
    header: { padding: "8px 12px", borderBottom: "1px solid #222", display: "flex", gap: 8, alignItems: "center" },
    badge: { marginLeft: "auto", color: "#666", fontSize: 10 },
    content: { flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 12 },
    row: { display: "flex", gap: 4, flexWrap: "wrap" },
    select: { width: "100%", padding: "6px 8px", background: "#111", border: "1px solid #333", borderRadius: 4, color: "#e5e5e5", fontSize: 11 },
    log: { padding: "8px 12px", borderTop: "1px solid #222", color: "#666", fontSize: 10, maxHeight: 60, overflow: "auto" },
};

// Components
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
        <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>{title}</div>
        {children}
    </div>
);

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} style={{ padding: "4px 8px", background: active ? "#2563eb" : "#111", border: `1px solid ${active ? "#2563eb" : "#333"}`, borderRadius: 4, color: active ? "#fff" : "#888", fontSize: 10, cursor: "pointer" }}>
        {children}
    </button>
);

const Btn = ({ onClick, disabled, color = "#2563eb", style, children }: { onClick: () => void; disabled?: boolean; color?: string; style?: React.CSSProperties; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{ padding: "6px 10px", background: disabled ? "#333" : color, border: "none", borderRadius: 4, color: "#fff", fontSize: 10, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, ...style }}>
        {children}
    </button>
);

export default BoringDevtoolsPlugin;
