import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { MonitorCreate } from "@/components/monitors/create/monitor-create";
import { createMonitor } from "@/functions/monitor";
import { MonitorFormValues } from "@/db/zod";

const monitorAddSearchSchema = z.object({
	newChannelId: z.string().optional(),
});

export const Route = createFileRoute("/_dashboardLayout/monitors/add")({
	validateSearch: monitorAddSearchSchema,
	component: AddMonitorPage,
});

function AddMonitorPage() {
	const router = useRouter();

	const handleCreate = async (data: MonitorFormValues) => {
		try {
			await createMonitor({ data });
			router.invalidate();
		} catch (error) {
			console.error(error);
			throw error; // Let the component handle the error display
		}
	};

	return (
		<div className="m-auto bg-white p-8 rounded-xl shadow-sm border w-full max-w-3xl">
			<h1 className="text-2xl font-bold mb-6">New Monitor</h1>
			<MonitorCreate
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
