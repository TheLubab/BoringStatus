import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq, gt, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { apiKey } from "@/modules/apikeys/apikeys.schema";
import { getSession } from "@/modules/auth/auth.api";
import { monitor } from "@/modules/monitors/monitors.schema";

import { heartbeat } from "./heartbeats.schema";
import { getHeartbeatsSchema, insertHeartbeatSchema } from "./heartbeats.zod";

const requireAuth = async () => {
	const session = await getSession();
	const activeOrgId = session?.activeOrganizationId;

	if (!session || !activeOrgId) {
		throw new Error("Unauthorized: Access restricted to organization members.");
	}
	return activeOrgId;
};

/**
 * Validates API key from Authorization header and returns the organization ID
 * Expects: Authorization: Bearer <API_KEY>
 */
const requireApiKey = async (): Promise<string> => {
	const headers = getRequestHeaders();
	const authHeader =
		headers.get("authorization") || headers.get("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new Error(
			"Unauthorized: Missing or invalid Authorization header. Expected: Bearer <API_KEY>",
		);
	}

	const apiKeyValue = authHeader.substring(7).trim(); // Remove "Bearer " prefix

	if (!apiKeyValue) {
		throw new Error("Unauthorized: API key is required");
	}

	// Look up the API key in the database
	const keyRecord = await db.query.apiKey.findFirst({
		where: and(eq(apiKey.key, apiKeyValue), eq(apiKey.isActive, true)),
		columns: { id: true, organizationId: true },
	});

	if (!keyRecord) {
		throw new Error("Unauthorized: Invalid or inactive API key");
	}

	if (!keyRecord.organizationId) {
		throw new Error(
			"Unauthorized: API key is not associated with an organization",
		);
	}

	// Update last used timestamp
	await db
		.update(apiKey)
		.set({ lastUsedAt: new Date() })
		.where(eq(apiKey.id, keyRecord.id));

	return keyRecord.organizationId;
};

// RECORD HEARTBEAT
// Protected by API key authentication (Bearer token)
export const recordHeartbeat = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => insertHeartbeatSchema.parse(data))
	.handler(async ({ data }) => {
		const organizationId = await requireApiKey();

		return await db.transaction(async (tx) => {
			// 1. Fetch monitor and verify ownership
			const monitorRecord = await tx.query.monitor.findFirst({
				where: and(
					eq(monitor.id, data.monitorId),
					eq(monitor.organizationId, organizationId),
				),
				columns: { frequency: true, organizationId: true },
			});

			if (!monitorRecord) {
				throw new Error("Monitor not found or unauthorized");
			}

			// 2. Insert the Heartbeat
			const [newHeartbeat] = await tx
				.insert(heartbeat)
				.values({
					...data,
					time: data.time ?? new Date(),
				})
				.returning();

			// 3. Update the Parent Monitor State (Cache)
			await tx
				.update(monitor)
				.set({
					status: data.status,
					lastCheckAt: newHeartbeat.time,
					nextCheckAt: sql`NOW() + INTERVAL '1 second' * ${monitorRecord.frequency}`,
				})
				.where(eq(monitor.id, data.monitorId));

			return { success: true, id: newHeartbeat.runId || "recorded" };
		});
	});

// GET HEARTBEATS
export const getHeartbeatsForMonitor = createServerFn({ method: "GET" })
	.inputValidator(getHeartbeatsSchema)
	.handler(async ({ data: { monitorId, from, to } }) => {
		const activeOrgId = await requireAuth();

		// Verify ownership
		const monitorExists = await db.query.monitor.findFirst({
			where: and(
				eq(monitor.id, monitorId),
				eq(monitor.organizationId, activeOrgId),
			),
			columns: { id: true },
		});

		if (!monitorExists) {
			throw new Error("Monitor not found or unauthorized");
		}

		// Fetch time-series data
		const results = await db
			.select()
			.from(heartbeat)
			.where(
				and(
					eq(heartbeat.monitorId, monitorId),
					gt(heartbeat.time, from),
					lte(heartbeat.time, to),
				),
			)
			.orderBy(desc(heartbeat.time));

		return results;
	});

// GET LATEST HEARTBEAT
export const getLatestHeartbeat = createServerFn({ method: "GET" })
	.inputValidator(z.object({ monitorId: z.string() }))
	.handler(async ({ data: { monitorId } }) => {
		const activeOrgId = await requireAuth();

		// Verify ownership
		const monitorExists = await db.query.monitor.findFirst({
			where: and(
				eq(monitor.id, monitorId),
				eq(monitor.organizationId, activeOrgId),
			),
			columns: { id: true },
		});

		if (!monitorExists) throw new Error("Monitor not found");

		const result = await db.query.heartbeat.findFirst({
			where: eq(heartbeat.monitorId, monitorId),
			orderBy: [desc(heartbeat.time)],
		});

		return result;
	});
