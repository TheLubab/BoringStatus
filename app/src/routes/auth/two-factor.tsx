import { AuthView } from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/two-factor")({
	component: () => <AuthView view="TWO_FACTOR" />,
});
