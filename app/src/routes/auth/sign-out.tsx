import { AuthView } from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/sign-out")({
	component: () => <AuthView view="SIGN_OUT" />,
});
