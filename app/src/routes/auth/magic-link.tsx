import { AuthView } from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/magic-link")({
	component: () => <AuthView view="MAGIC_LINK" />,
});
