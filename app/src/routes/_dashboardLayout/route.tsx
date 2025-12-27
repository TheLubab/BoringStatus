import { createFileRoute, Outlet } from "@tanstack/react-router";

import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { DashboardHeader } from "@/components/dashboard/header/header";
import { getSession } from "@/modules/auth/auth.api";
import { requireAuthMiddleware } from "@/modules/auth/auth.middleware";

export const Route = createFileRoute("/_dashboardLayout")({
	component: DashboardLayout,
	server: {
		middleware: [requireAuthMiddleware],
	},
	loader: async () => {
		return {
			session: await getSession(),
		};
	},
});

function DashboardLayout() {
	const { session } = Route.useLoaderData();

	return (
		<DashboardFrame header={<DashboardHeader user={session?.user} />}>
			<Outlet />
		</DashboardFrame>
	);
}
