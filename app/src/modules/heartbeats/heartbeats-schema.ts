import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { monitor } from "@/modules/monitors/monitors-schema";

export const heartbeat = pgTable(
	"heartbeat",
	{
		// TimescaleDB key
		time: timestamp("time").defaultNow().notNull(),

		monitorId: uuid("monitor_id")
			.notNull()
			.references(() => monitor.id, { onDelete: "cascade" }),

		// Groups checks from multiple regions for the same tick
		runId: uuid("run_id"),
		region: text("region").default("default"),

		// Status
		status: text("status").notNull(), // 'up', 'down'
		latency: integer("latency").notNull(), // Execution time (ms)
		message: text("message"), // Error details
		// Polymorphic Metrics
		// This stores the specific data for the monitor type.
		// HTTP: { dns: 10, tls: 20, ttfb: 50, code: 200 }
		// Lighthouse: { performance: 90, seo: 100, fcp: 1.2 }
		// Disk: { used: 40, total: 100, percent: 40 }
		metrics: jsonb("metrics").default({}).notNull(),
	},
	(t) => [
		// Compound index for fast graphs
		index("idx_heartbeat_monitor_time").on(t.monitorId, t.time),
		index("idx_heartbeat_run").on(t.runId),
	],
);
