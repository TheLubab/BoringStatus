import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { auth } from "./auth.config";

export const requireAuthMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			throw redirect({ to: "/auth/sign-in" });
		}
		return next({ context: { session } });
	},
);
