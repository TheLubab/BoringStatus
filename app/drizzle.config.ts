import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config()

export default defineConfig({
	out: './drizzle',
	schema: ['./src/db/saas-schema.ts', './src/db/auth-schema.ts'],
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
})
