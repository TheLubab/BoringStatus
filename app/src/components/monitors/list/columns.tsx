import { createColumnHelper } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { type Status, StatusBadge } from "@/components/ui/status-badge";
import type {
	DashboardHistoryEntry,
	DashboardMonitor,
	MonitorStatus,
} from "@/modules/monitors/monitors.zod";

import { IssuesCell, LatencyChart, MonitorNameCell, UptimeCell } from "./cells";
import { getAverageLatency, getMonitorDisplayUrl } from "./utils";

// ─────────────────────────────────────────────────────────────────────────────
// COLUMN DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<DashboardMonitor>();

/** Reusable sortable header button */
const SortableHeader = ({
	label,
	column,
}: {
	label: string;
	column: {
		toggleSorting: (desc: boolean) => void;
		getIsSorted: () => false | "asc" | "desc";
	};
}) => (
	<button
		type="button"
		className="flex items-center gap-1 hover:text-foreground transition-colors -ml-0.5"
		onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
	>
		{label}
		<ArrowUpDown className="size-2.5 opacity-30" />
	</button>
);

/** Status priority for sorting (lower = shown first) */
const STATUS_PRIORITY: Record<string, number> = {
	down: 0,
	error: 1,
	degraded: 2,
	pending: 3,
	up: 4,
};

/** Create column definitions for the monitor table */
export const createColumns = (
	_onRowClick?: (monitor: DashboardMonitor) => void,
) => [
	// 1. Monitor name + URL
	columnHelper.accessor("name", {
		size: 280,
		minSize: 200,
		header: ({ column }) => <SortableHeader label="Monitor" column={column} />,
		cell: ({ row }) => {
			const monitor = row.original;
			const url = getMonitorDisplayUrl(monitor);
			return <MonitorNameCell name={monitor.name} url={url} />;
		},
	}),

	// 2. Status badge
	columnHelper.accessor("status", {
		size: 90,
		minSize: 70,
		header: ({ column }) => <SortableHeader label="Status" column={column} />,
		cell: ({ getValue }) => {
			const status = getValue();
			const shouldPulse = status === "down" || status === "error";
			return (
				<StatusBadge
					pulse={shouldPulse}
					status={status}
					className="capitalize text-[10px]"
					size="sm"
				>
					{status}
				</StatusBadge>
			);
		},
		sortingFn: (rowA, rowB, columnId) => {
			const priorityA =
				STATUS_PRIORITY[rowA.getValue(columnId) as MonitorStatus] ?? 5;
			const priorityB =
				STATUS_PRIORITY[rowB.getValue(columnId) as MonitorStatus] ?? 5;

			return priorityA - priorityB;
		},
	}),

	// 3. Issues
	columnHelper.accessor("issues", {
		header: "Issues",
		size: 60,
		minSize: 40,
		cell: ({ getValue }) => <IssuesCell issues={getValue()} />,
	}),

	// 4. Uptime percentage
	columnHelper.accessor("uptime", {
		size: 80,
		header: ({ column }) => <SortableHeader label="Uptime" column={column} />,
		cell: ({ getValue }) => <UptimeCell uptime={getValue()} />,
	}),

	// 5. Latency sparkline chart
	columnHelper.accessor("history", {
		size: 200,
		minSize: 140,
		header: ({ column }) => <SortableHeader label="Latency" column={column} />,
		cell: ({ getValue }) => <LatencyChart data={getValue()} />,
		sortingFn: (rowA, rowB, columnId) => {
			const historyA = rowA.getValue(columnId) as
				| DashboardHistoryEntry[]
				| null;
			const historyB = rowB.getValue(columnId) as
				| DashboardHistoryEntry[]
				| null;

			const avgA = getAverageLatency(historyA);
			const avgB = getAverageLatency(historyB);

			return avgA < avgB ? 1 : avgA > avgB ? -1 : 0;
		},
	}),
];
