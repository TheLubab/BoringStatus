import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gt, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
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

// RECORD HEARTBEAT
// FIX: this endpoint should be protected by a API Secret not user session
export const recordHeartbeat = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => insertHeartbeatSchema.parse(data))
	.handler(async ({ data }) => {
		return await db.transaction(async (tx) => {
			// 1. Fetch monitor to get current frequency value
			const monitorRecord = await tx.query.monitor.findFirst({
				where: eq(monitor.id, data.monitorId),
				columns: { frequency: true },
			});

			if (!monitorRecord) {
				throw new Error("Monitor not found");
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
