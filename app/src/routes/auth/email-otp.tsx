import { AuthView } from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/email-otp")({
	component: () => <AuthView view="EMAIL_OTP" />,
});
