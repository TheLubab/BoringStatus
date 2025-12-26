import { createFileRoute } from "@tanstack/react-router";
import { IntegrationsManager } from "@/components/channels/integrations-manager";

export const Route = createFileRoute("/_dashboardLayout/integrations/")({
	component: IntegrationsPage,
});

function IntegrationsPage() {
	return (
		<div className="p-2">
			<div className="flex flex-col mb-7 sm:flex-row items-start sm:items-center justify-between gap-6">
				<div>
					<h1 className="text-3xl font-black tracking-tight">Integrations</h1>
					<p className="text-muted-foreground mt-2 text-lg">
						Manage your notification channels and alerts.
					</p>
				</div>
			</div>

			<IntegrationsManager />
		</div>
	)
}
