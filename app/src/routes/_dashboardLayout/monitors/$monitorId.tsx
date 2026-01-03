import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { MonitorView } from "@/components/monitors/view/monitor-view";
import {
	deleteMonitor,
	getMonitorDetails,
	toggleMonitorActive,
} from "@/modules/monitors/monitors.api";

export const Route = createFileRoute("/_dashboardLayout/monitors/$monitorId")({
	component: MonitorDetailsPage,
});

function MonitorDetailsPage() {
	const { monitorId } = Route.useParams();
	const router = useRouter();

	const { data: monitor } = useSuspenseQuery({
		queryKey: ["monitor-details", monitorId],
		queryFn: () => getMonitorDetails({ data: { id: monitorId } }),
	});

	const handleToggleActive = async () => {
		await toggleMonitorActive({
			data: { id: monitor.id, active: !monitor.active },
		});
		router.invalidate();
	};

	const handleDelete = async () => {
		await deleteMonitor({ data: { id: monitor.id } });
		router.navigate({ to: "/monitors" });
	};

	return (
		<div className="m-auto py-8 px-4 w-full">
			<MonitorView
				monitor={monitor}
				onToggleActive={handleToggleActive}
				onDelete={handleDelete}
			/>
		</div>
	);
}
