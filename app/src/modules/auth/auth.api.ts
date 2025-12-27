import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "./auth.config";

export const getSession = createServerFn({ method: "GET" }).handler(
	async ({ context }) => {
		if (!context) return;

		const data = await auth.api.getSession({ headers: getRequestHeaders() });

		if (!data?.session) return null;

		return {
			user: data.user,
			activeOrganizationId: data.session.activeOrganizationId,
		};
	},
);
