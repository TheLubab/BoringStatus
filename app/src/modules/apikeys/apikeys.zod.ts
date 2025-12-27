import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { apiKey } from "./apikeys.schema";

export const createApiKeySchema = createInsertSchema(apiKey, {
	name: z.string().min(1, "Name is required"),
	tags: z.array(z.string()).default(["default"]),
	scopes: z.array(z.string()).default([]),
}).pick({
	name: true,
	tags: true,
	scopes: true,
});
