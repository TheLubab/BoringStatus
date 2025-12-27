import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { getSession } from "@/modules/auth/auth.service";

import { generateApiKey } from "./apikeys.fn";
import { apiKey } from "./apikeys.schema";
import { createApiKeySchema } from "./apikeys.zod";

const requireAuth = async () => {
	const session = await getSession();
	const activeOrgId = session?.session?.activeOrganizationId;
	if (!session || !activeOrgId) {
		throw new Error("Unauthorized");
	}
	return activeOrgId;
};

// CREATE API KEY
export const createApiKey = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => createApiKeySchema.parse(data))
	.handler(async ({ data }) => {
		const activeOrgId = await requireAuth();
		const secretKey = generateApiKey();

		const [newKey] = await db
			.insert(apiKey)
			.values({
				...data,
				organizationId: activeOrgId,
				key: secretKey,
				isActive: true,
			})
			.returning();

		return newKey;
	});

// REVOKE API KEY
export const revokeApiKey = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data: { id } }) => {
		const activeOrgId = await requireAuth();

		await db
			.update(apiKey)
			.set({ isActive: false })
			.where(and(eq(apiKey.id, id), eq(apiKey.organizationId, activeOrgId)));

		return { success: true };
	});

// Grouped exports
export const apiKeysApi = { createApiKey, revokeApiKey };
