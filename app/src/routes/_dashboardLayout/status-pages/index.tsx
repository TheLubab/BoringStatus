import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { StatusPageList } from "@/components/status-pages/status-page-list";
import { Button } from "@/components/ui/button";
import { getStatusPagesByOrg } from "@/modules/statuspages/statuspages.api";

export const Route = createFileRoute("/_dashboardLayout/status-pages/")({
	component: StatusPagesIndex,
	loader: async () => {
		const pages = await getStatusPagesByOrg();
		return { pages };
	},
});

function StatusPagesIndex() {
	const { pages } = Route.useLoaderData();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Status Pages
					</h1>
					<p className="text-sm text-muted-foreground">
						Create and manage public status pages for your monitors.
					</p>
				</div>
				{/* Only show create button here if there are pages, otherwise the empty state in list handles it */}
				{pages.length > 0 && (
					<Button asChild>
						<Link to="/status-pages/create">
							<Plus className="mr-2 h-4 w-4" />
							Create Status Page
						</Link>
					</Button>
				)}
			</div>

			<StatusPageList statusPages={pages} />
		</div>
	);
}
