import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";

import { MonitorNew } from "@/components/monitors/create/monitor-new";
import { createMonitor } from "@/modules/monitors/monitors.api";
import type { InsertMonitor } from "@/modules/monitors/monitors.zod";

const monitorAddSearchSchema = z.object({
	newChannelId: z.string().optional(),
});

export const Route = createFileRoute("/_dashboardLayout/monitors/new")({
	validateSearch: monitorAddSearchSchema,
	component: NewMonitorPage,
});

function NewMonitorPage() {
	const router = useRouter();

	const handleCreate = async (data: InsertMonitor) => {
		try {
			await createMonitor({ data });
			router.invalidate();
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	return (
		<div className="m-auto py-8 px-4 w-full max-w-2xl">
			<MonitorNew
				allowAdvancedMethods={true}
				allowCustomHeaders={true}
				allowCustomStatus={true}
				allowHighFrequency={true}
				usageLabel="1/10 Monitor (trial)"
				onSubmitAction={handleCreate}
			/>
		</div>
	);
}
