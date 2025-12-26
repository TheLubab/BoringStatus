import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { env } from "@/env.ts";
import { randomStr, slugify } from "@/lib/utils";
import * as authSchema from "./auth-schema";

export const auth = betterAuth({
	trustedOrigins: [
		"http://localhost:3000",
		"https://localhost:3000",
		"http://boringstatus.local",
		"https://boringstatus.local",
	],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authSchema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		github: {
			enabled: !!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET,
			clientId: env.GITHUB_CLIENT_ID ?? "",
			clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
		},
		google: {
			enabled: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
			clientId: env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
		},
	},
	plugins: [
		organization({
			organizationLimit: 2,
			invitationLimit: 5,
			membershipLimit: 10,
		}),
		tanstackStartCookies(), // leave last
	],
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const memberships = await db
						.select({
							organizationId: authSchema.member.organizationId,
							role: authSchema.member.role,
						})
						.from(authSchema.member)
						.where(eq(authSchema.member.userId, session.userId))
						.orderBy(asc(authSchema.member.createdAt));

					const org =
						memberships.find((m) => m.role === "owner") || memberships[0];

					return {
						data: {
							...session,
							activeOrganizationId: org?.organizationId ?? null,
						},
					};
				},
			},
		},
		user: {
			create: {
				after: async (user) => {
					// Without setTimeout the user isn't created yet
					// and the Member insert fails with foreign key violation.
					setTimeout(async () => {
						try {
							await onUserSignup(user.name, user.id);
						} catch (e) {
							console.error("Error creating default org:", e);
						}
					}, 0);
				},
			},
		},
	},
});

async function onUserSignup(userName: string, userId: string) {
	const slug = `${slugify(userName.split(" ")[0])}-${randomStr(6)}`;
	const orgName = `${userName.split(" ")[0]}'s Workspace`;
	const createdAt = new Date();

	const [newOrg] = await db
		.insert(authSchema.organization)
		.values({
			id: randomStr(16),
			name: orgName,
			slug: slug,
			logo: null,
			metadata: JSON.stringify({
				personal: true,
			}),
			createdAt: createdAt,
		})
		.returning();

	await db.insert(authSchema.member).values({
		id: randomStr(16),
		organizationId: newOrg.id,
		userId: userId,
		role: "owner",
		createdAt: createdAt,
	});

	const [recentSession] = await db
		.select()
		.from(authSchema.session)
		.where(eq(authSchema.session.userId, userId))
		.orderBy(desc(authSchema.session.createdAt))
		.limit(1);

	if (recentSession) {
		await db
			.update(authSchema.session)
			.set({ activeOrganizationId: newOrg.id })
			.where(eq(authSchema.session.id, recentSession.id));
	}
}
