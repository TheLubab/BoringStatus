import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { DashboardHeader } from "@/components/dashboard/header/header";
import { getSessionFn } from "@/functions/get-session";
import { authMiddleware } from "@/lib/auth/auth-middleware";

export const Route = createFileRoute("/_dashboardLayout")({
	component: DashboardLayout,
	server: {
		middleware: [authMiddleware],
	},
	loader: async () => {
		return {
			session: await getSessionFn(),
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
