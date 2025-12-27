import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { monitor } from "@/modules/monitors/monitors.schema";

import type { HeartbeatMetrics, HeartbeatStatus } from "./heartbeats.zod";

export const heartbeat = pgTable(
	"heartbeat",
	{
		// TimescaleDB key
		time: timestamp("time").defaultNow().notNull(),

		monitorId: uuid("monitor_id")
			.notNull()
			.references(() => monitor.id, { onDelete: "cascade" }),

		region: text("region").default("default"),

		// To optionally group checks
		runId: uuid("run_id"),

		// Status
		status: text("status").notNull().$type<HeartbeatStatus>(),
		latency: integer("latency"), // total ms
		message: text("message"), // Error details
		metrics: jsonb("metrics").notNull().$type<HeartbeatMetrics>(),
	},
	(t) => [index("idx_heartbeat_monitor_time").on(t.monitorId, t.time.desc())],
);
