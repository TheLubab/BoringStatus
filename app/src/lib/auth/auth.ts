import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import * as schema1 from '@/db/auth-schema.ts'
import { organization } from "better-auth/plugins";
import { randomStr, slugify } from "../utils";
import { asc, desc, eq } from "drizzle-orm";

export const auth = betterAuth({
	trustedOrigins: ["http://localhost:3000", "https://localhost:3000", "http://boringstatus.local", "https://boringstatus.local"],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema1
	}),
	emailAndPassword: {
		enabled: true,
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
							organizationId: schema1.member.organizationId,
							role: schema1.member.role,
						})
						.from(schema1.member)
						.where(eq(schema1.member.userId, session.userId))
						.orderBy(asc(schema1.member.createdAt));

					const org = memberships.find((m) => m.role === "owner") || memberships[0];

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
				}
			},
		}
	},
});



async function onUserSignup(userName: string, userId: string) {
	const slug = `${slugify(userName.split(" ")[0])}-${randomStr(6)}`;
	const orgName = `${userName.split(" ")[0]}'s Workspace`;
	const createdAt = new Date();

	const [newOrg] = await db.insert(schema1.organization).values({
		id: randomStr(16),
		name: orgName,
		slug: slug,
		logo: null,
		metadata: JSON.stringify({
			personal: true
		}),
		createdAt: createdAt,
	}).returning();

	await db.insert(schema1.member).values({
		id: randomStr(16),
		organizationId: newOrg.id,
		userId: userId,
		role: "owner",
		createdAt: createdAt,
	});

	const [recentSession] = await db
		.select()
		.from(schema1.session)
		.where(eq(schema1.session.userId, userId))
		.orderBy(desc(schema1.session.createdAt))
		.limit(1);

	if (recentSession) {
		await db
			.update(schema1.session)
			.set({ activeOrganizationId: newOrg.id })
			.where(eq(schema1.session.id, recentSession.id));
	}
}


