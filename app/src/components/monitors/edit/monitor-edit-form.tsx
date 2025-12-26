import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { insertMonitorSchema, type MonitorFormValues } from "@/db/zod";
import { MonitorStepAlerting } from "@/components/monitors/create/monitor-step-alerting";
import { MonitorStepGeneral } from "@/components/monitors/create/monitor-step-general";
import { updateMonitor } from "@/functions/monitor";
import { useRouter } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";

interface MonitorEditFormProps {
    monitor: any;
    connectedChannelIds: string[];
}

export function MonitorEditForm({ monitor, connectedChannelIds }: MonitorEditFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<MonitorFormValues>({
        // Cast as any to avoid strict type mismatches between Zod schema output and RHF internal types
        resolver: zodResolver(insertMonitorSchema) as any,
        defaultValues: {
            type: monitor.type,
            name: monitor.name,
            target: monitor.target,
            active: monitor.active,
            frequency: monitor.frequency,
            timeout: monitor.timeout || 20,
            retries: monitor.retries || 0,
            method: monitor.method || "GET",
            expectedStatus: monitor.expectedStatus || "200-299",
            headers: monitor.headers || [],
            port: monitor.port || (monitor.type === "http" ? 443 : 80),
            alertOnDown: monitor.alertOnDown,
            alertOnRecovery: monitor.alertOnRecovery,
            channelIds: connectedChannelIds,
            keyword_found: monitor.keyword_found || undefined,
            keyword_missing: monitor.keyword_missing || undefined,
        },
    });

    const onSubmit = async (values: MonitorFormValues) => {
        setIsSaving(true);
        try {
            await updateMonitor({
                data: {
                    monitorId: monitor.id,
                    ...values,
                },
            });
            toast.success("Monitor updated successfully");
            router.invalidate();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update monitor");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
                <div className="bg-card rounded-lg border p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-6">General Configuration</h2>
                    <MonitorStepGeneral
                        allowHighFrequency={true} // Assuming user can edit whatever they have
                        allowAdvancedMethods={true}
                        allowCustomStatus={true}
                        allowCustomHeaders={true}
                    />
                </div>

                <div className="bg-card rounded-lg border p-6 shadow-sm">
                    <MonitorStepAlerting />
                </div>

                <div className="flex justify-end sticky bottom-4 z-10">
                    <Button type="submit" size="lg" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
