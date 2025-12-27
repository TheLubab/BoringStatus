import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
	component: AuthLayout,
});

function AuthLayout() {
	return (
		<main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
			<Outlet />
		</main>
	)
}
