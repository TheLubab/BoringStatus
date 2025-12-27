import { env } from '@/env'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	out: './drizzle',
	schema: ['./src/db/saas-schema.ts', './src/db/auth-schema.ts'],
	dialect: 'postgresql',
	dbCredentials: {
		url: env.DATABASE_URL,
	},
})
