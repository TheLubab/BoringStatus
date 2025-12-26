import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth/auth";

export const getSessionFn = createServerFn({ method: "GET" }).handler(
	async ({ context }) => {
		if (!context) return;

		return auth.api.getSession({ headers: getRequestHeaders() });
	},
);
