import { AuthView } from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/accept-invitation")({
	component: () => <AuthView view="ACCEPT_INVITATION" />,
});
