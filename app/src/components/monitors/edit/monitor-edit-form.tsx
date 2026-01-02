import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { MonitorAdvancedOptions } from "@/components/monitors/create/monitor-advanced-options";
import { MonitorAlertRules } from "@/components/monitors/create/monitor-alert-rules";
import { MonitorSelectChannels } from "@/components/monitors/create/monitor-select-channels";
import { MonitorSelectFrequency } from "@/components/monitors/create/monitor-select-frequency";
import { MonitorSelectType } from "@/components/monitors/create/monitor-select-type";
import { MonitorTargetInput } from "@/components/monitors/create/monitor-target-input";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { updateMonitor } from "@/modules/monitors/monitors.api";
import {
	type InsertMonitor,
	insertMonitorSchema,
} from "@/modules/monitors/monitors.zod";

interface MonitorEditFormProps {
	monitor: any;
	connectedChannelIds: string[];
}

export function MonitorEditForm({
	monitor,
	connectedChannelIds,
}: MonitorEditFormProps) {
	const router = useRouter();
	const [isSaving, setIsSaving] = useState(false);

	const form = useForm<InsertMonitor>({
		// Cast as any to avoid strict type mismatches between Zod schema output and RHF internal types(discriminated unions are tricky)
		resolver: zodResolver(insertMonitorSchema) as any,
		defaultValues: {
			type: monitor.type as any,
			name: monitor.name,
			target: monitor.target,
			active: monitor.active,
			frequency: monitor.frequency,
			timeout: monitor.timeout,
			config: monitor.config as any,
			alertRules: monitor.alertRules as any,
			channelIds: connectedChannelIds,
			regions: monitor.regions || ["default"],
		},
	});

	const onSubmit = async (values: InsertMonitor) => {
		setIsSaving(true);
		try {
			await updateMonitor({
				data: {
					id: monitor.id,
					data: values, // properly nested
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
				{/* General Configuration */}
				<div className="bg-card rounded-lg border p-6 shadow-sm">
					<h2 className="text-lg font-semibold mb-6">General Configuration</h2>
					<div className="space-y-6">
						<MonitorSelectType />
						<MonitorTargetInput />
						<MonitorSelectFrequency allowHighFrequency={true} />
					</div>
				</div>

				{/* Advanced Options */}
				<div className="bg-card rounded-lg border p-6 shadow-sm">
					<h2 className="text-lg font-semibold mb-6">Advanced Options</h2>
					<MonitorAdvancedOptions
						allowAdvancedMethods={true}
						allowCustomHeaders={true}
					/>
				</div>

				{/* Alert Rules */}
				<div className="bg-card rounded-lg border p-6 shadow-sm">
					<MonitorAlertRules maxRules={10} allowAdvancedMetrics={true} />
				</div>

				{/* Notification Channels */}
				<div className="bg-card rounded-lg border p-6 shadow-sm">
					<MonitorSelectChannels />
				</div>

				{/* Submit Button */}
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
