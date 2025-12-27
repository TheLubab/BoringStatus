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

// TODO: move to apikeys.service or somewhere better
/**
 * Validates API key from Authorization header and returns the organization ID
 * Expects: Authorization: Bearer <API_KEY>
 * Returns: organizationId for organization keys, null for system/master keys
 */
const requireApiKey = async (
	requiredScope?: string,
): Promise<{
	organizationId: string | null;
	scopes: string[];
}> => {
	const headers = getRequestHeaders();
	const authHeader =
		headers.get("authorization") || headers.get("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new Error(
			"Unauthorized: Missing or invalid Authorization header. Expected: Bearer <API_KEY>",
		);
	}

	const apiKeyValue = authHeader.substring(7).trim();

	if (!apiKeyValue) {
		throw new Error("Unauthorized: API key is required");
	}

	// Look up the API key in the database
	const keyRecord = await db.query.apiKey.findFirst({
		where: and(eq(apiKey.key, apiKeyValue), eq(apiKey.isActive, true)),
		columns: { id: true, organizationId: true, scopes: true },
	});

	if (!keyRecord) {
		throw new Error("Unauthorized: Invalid or inactive API key");
	}

	// For system keys (null organizationId), require explicit scope to prevent accidental misuse
	// Organization keys are already scoped by their organization, so scope check is optional
	if (!keyRecord.organizationId) {
		if (!requiredScope) {
			throw new Error(
				"Unauthorized: System keys require explicit scope validation for security",
			);
		}
		const scopes = keyRecord.scopes || [];
		if (!scopes.includes(requiredScope)) {
			throw new Error(
				`Unauthorized: System API key missing required scope: ${requiredScope}`,
			);
		}
	} else if (requiredScope) {
		const scopes = keyRecord.scopes || [];
		if (!scopes.includes(requiredScope)) {
			throw new Error(
				`Unauthorized: API key missing required scope: ${requiredScope}`,
			);
		}
	}

	return {
		organizationId: keyRecord.organizationId ?? null,
		scopes: keyRecord.scopes || [],
	};
};

// RECORD HEARTBEAT
// Protected by API key authentication (Bearer token)
// System keys require "heartbeat:write" scope for security
export const recordHeartbeat = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => insertHeartbeatSchema.parse(data))
	.handler(async ({ data }) => {
		const { organizationId } = await requireApiKey("heartbeat:write");

		return await db.transaction(async (tx) => {
			// 1. Fetch monitor and verify ownership (if org key) or existence (if system key)
			const monitorRecord = await tx.query.monitor.findFirst({
				where: organizationId
					? and(
						eq(monitor.id, data.monitorId),
						eq(monitor.organizationId, organizationId),
					)
					: eq(monitor.id, data.monitorId),
				columns: { frequency: true, organizationId: true },
			});

			if (!monitorRecord) {
				throw new Error(
					organizationId
						? "Monitor not found or unauthorized"
						: "Monitor not found",
				);
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
