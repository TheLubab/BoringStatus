import { createFileRoute } from "@tanstack/react-router";
import { getPublicStatusPage } from "@/functions/status-pages";
import { CheckCircle, AlertTriangle, XCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/status/$slug")({
    component: PublicStatusPage,
    loader: async ({ params }) => {
        const page = await getPublicStatusPage({ data: { slug: params.slug } });
        if (!page) {
            throw new Error("Status page not found");
        }
        return { page };
    },
});

function StatusBadge({ status }: { status: string }) {
    if (status === "up") {
        return <div className="flex items-center text-emerald-500 font-medium text-sm"><CheckCircle className="w-4 h-4 mr-1.5" /> Operational</div>
    }
    if (status === "down") {
        return <div className="flex items-center text-red-500 font-medium text-sm"><XCircle className="w-4 h-4 mr-1.5" /> Outage</div>
    }
    if (status === "maintenance") {
        return <div className="flex items-center text-amber-500 font-medium text-sm"><Activity className="w-4 h-4 mr-1.5" /> Maintenance</div>
    }
    return <div className="flex items-center text-muted-foreground font-medium text-sm"><AlertTriangle className="w-4 h-4 mr-1.5" /> Unknown</div>
}

function PublicStatusPage() {
    const { page } = Route.useLoaderData();

    // Calculate aggregate status
    const allUp = page.monitors.every((m: any) => m.monitor.status === "up");
    const anyDown = page.monitors.some((m: any) => m.monitor.status === "down");
    const isMaintenance = page.monitors.some((m: any) => m.monitor.status === "maintenance");

    let statusColor = "bg-emerald-500";
    let statusText = "All Systems Operational";
    let statusIcon = <CheckCircle className="w-8 h-8 text-white" />;

    if (anyDown) {
        statusColor = "bg-red-500";
        statusText = "Some Systems Experiencing Issues";
        statusIcon = <XCircle className="w-8 h-8 text-white" />;
    } else if (isMaintenance) {
        statusColor = "bg-amber-500";
        statusText = "Maintenance in Progress";
        statusIcon = <Activity className="w-8 h-8 text-white" />;
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-50 flex flex-col">

            {/* HER0 / HEADER */}
            <div className="w-full bg-white dark:bg-neutral-900 border-b">
                <div className="max-w-3xl mx-auto px-6 py-8 md:py-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            {/* Logo Placeholder */}
                            <div className="flex items-center gap-3">
                                {page.themeColor && <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: page.themeColor }} />}
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{page.name}</h1>
                            </div>
                            {page.description && <p className="mt-2 text-muted-foreground">{page.description}</p>}
                        </div>
                        {/* Optional: Subscribe Button */}
                    </div>

                    {/* MAIN STATUS BANNER */}
                    <div className={cn("rounded-xl p-6 md:p-8 flex items-center shadow-sm text-white transition-colors", statusColor)}>
                        {statusIcon}
                        <span className="ml-4 text-xl md:text-2xl font-bold">{statusText}</span>
                    </div>
                </div>
            </div>

            {/* MONITORS LIST */}
            <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 space-y-8">
                <section>
                    <h2 className="text-lg font-semibold mb-4 px-1">System Status</h2>
                    <div className="space-y-3">
                        {page.monitors.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                No monitors configured for this status page.
                            </div>
                        ) : (
                            page.monitors.map((m: any) => (
                                <Card key={m.monitor.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-base">{m.monitor.name}</span>
                                        {/* Mock Uptime Bar for visuals */}
                                        <div className="flex gap-[2px] mt-2">
                                            {Array.from({ length: 30 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "w-1.5 h-6 rounded-[2px]",
                                                        i > 25 && m.monitor.status === "down" ? "bg-red-500/80" : "bg-emerald-500/80"
                                                    )}
                                                    title={`Day ${i + 1}: ${i > 25 && m.monitor.status === "down" ? "Down" : "Operational"}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <StatusBadge status={m.monitor.status} />
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                {/* PAST INCIDENTS (MOCK) */}
                <section>
                    <h2 className="text-lg font-semibold mb-4 px-1">Past Incidents</h2>
                    <div className="space-y-6">
                        {/* Mock Incident 1 */}
                        <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-4 py-1">
                            <div className="text-sm text-muted-foreground mb-1">Nov 24, 2024</div>
                            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">API Latency Spikes</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                We observed increased latency on our API endpoints. The issue has been resolved.
                            </p>
                        </div>
                        {/* Mock Incident 2 */}
                        <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-4 py-1">
                            <div className="text-sm text-muted-foreground mb-1">Oct 12, 2024</div>
                            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Scheduled Maintenance</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Completed scheduled database upgrades.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* FOOTER */}
            <footer className="w-full py-8 text-center text-sm text-muted-foreground border-t mt-auto">
                Powered by <a href="/" className="font-semibold hover:underline text-neutral-900 dark:text-neutral-100">BoringStatus</a>
            </footer>

        </div>
    );
}
