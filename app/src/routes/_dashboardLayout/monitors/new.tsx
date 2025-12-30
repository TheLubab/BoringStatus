import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";

import { MonitorNew } from "@/components/monitors/create/monitor-new";

const monitorAddSearchSchema = z.object({
	newChannelId: z.string().optional(),
});

export const Route = createFileRoute("/_dashboardLayout/monitors/new")({
	validateSearch: monitorAddSearchSchema,
	component: NewMonitorPage,
});

function NewMonitorPage() {
	const router = useRouter();

	// TODO: Replace with actual subscription check or self-host override
	const isPro = true;

	const onComplete = async () => {
		router.invalidate();
	};

	return (
		<div className="m-auto py-8 px-4 w-full max-w-2xl">
			<MonitorNew
				allowHighFrequency={isPro}
				allowAdvancedMethods={isPro}
				allowCustomHeaders={isPro}
				maxAlertRules={isPro ? 10 : 3}
				allowAdvancedMetrics={isPro}
				onComplete={onComplete}
			/>
		</div>
	);
}
