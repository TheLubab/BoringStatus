import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { MonitorView } from "@/components/monitors/view/monitor-view";
import { getHeartbeatsForMonitor } from "@/modules/heartbeats/heartbeats.api";
import {
	deleteMonitor,
	getMonitorById,
	toggleMonitorActive,
} from "@/modules/monitors/monitors.api";

export const Route = createFileRoute("/_dashboardLayout/monitors/$monitorId")({
	component: MonitorDetailsPage,
});

function MonitorDetailsPage() {
	const { monitorId } = Route.useParams();
	const router = useRouter();

	const { data: monitor } = useSuspenseQuery({
		queryKey: ["monitor", monitorId],
		queryFn: () => getMonitorById({ data: { id: monitorId } }),
	});

	const now = new Date();
	const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	const { data: heartbeats = [] } = useSuspenseQuery({
		queryKey: ["heartbeats", monitorId, "24h"],
		queryFn: () =>
			getHeartbeatsForMonitor({
				data: { monitorId, from: twentyFourHoursAgo, to: now },
			}),
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
				heartbeats={heartbeats}
				onToggleActive={handleToggleActive}
				onDelete={handleDelete}
			/>
		</div>
	);
}
