import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { MonitorList } from "@/components/monitors/list/monitor-list";
import { Button } from "@/components/ui/button";
import { getMonitorsByOrgForDashboard } from "@/modules/monitors/monitors.api";

export const Route = createFileRoute("/_dashboardLayout/monitors/")({
	component: MonitorsPage,
});

function MonitorsPage() {
	const { data } = useSuspenseQuery({
		queryKey: ["monitors"],
		queryFn: () => getMonitorsByOrgForDashboard(),
	});
	console.log(data);

	const router = useRouter();

	return (
		<div className="m-auto py-8 px-4 w-full max-w-5xl">
			<div className="flex flex-col mb-7 sm:flex-row items-start sm:items-center justify-between gap-6">
				<h1 className="text-3xl font-black tracking-tight">Monitors</h1>
				<Button asChild>
					<Link to="/monitors/new">
						<Plus />
						New Monitor
					</Link>
				</Button>
			</div>

			<MonitorList
				data={data}
				onRowClick={(monitor) =>
					router.navigate({
						to: "/monitors/$monitorId",
						params: { monitorId: monitor.id },
					})
				}
			/>
		</div>
	);
}
