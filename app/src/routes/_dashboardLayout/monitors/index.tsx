import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { MonitorsTable } from "@/components/monitors/table/monitor-table";
import { Button } from "@/components/ui/button";
import { getMonitorsByOrg } from "@/modules/monitors/monitors.api";

export const Route = createFileRoute("/_dashboardLayout/monitors/")({
	component: MonitorsPage,
});

function MonitorsPage() {
	const { data } = useSuspenseQuery({
		queryKey: ["monitors"],
		queryFn: () => getMonitorsByOrg(),
	});

	const router = useRouter();

	return (
		<div className="p-2">
			<div className="flex flex-col mb-7 sm:flex-row items-start sm:items-center justify-between gap-6">
				<div>
					<h1 className="text-3xl font-black tracking-tight">Monitors</h1>
					<p className="text-muted-foreground mt-2 text-lg">
						Real-time performance tracking.
					</p>
				</div>
				<div className="flex items-center gap-3 w-full sm:w-auto">
					<Button asChild>
						<Link to="/monitors/add">
							<Plus />
							Add Monitor
						</Link>
					</Button>
				</div>
			</div>

			<MonitorsTable
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
