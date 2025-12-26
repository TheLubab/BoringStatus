import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/env.ts";
import * as authSchema from "@/modules/auth/auth-schema";
import * as schema2 from "./saas-schema.ts";

export const schema = { ...authSchema, ...integrationSchema };

const pool = new Pool({
	connectionString: env.DATABASE_URL,
});
export const db = drizzle(pool, {
	schema,
});
