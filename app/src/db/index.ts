import { config } from "dotenv";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema1 from "./auth-schema.ts";
import * as schema2 from "./saas-schema.ts";

config();

const pool = new Pool({
	connectionString: process.env.DATABASE_URL!,
});
export const db = drizzle(pool, {
	schema: {
		...schema1,
		...schema2,
	},
});
