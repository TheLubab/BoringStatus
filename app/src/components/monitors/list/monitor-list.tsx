import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Search } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type {
	DashboardMonitor,
	TcpConfig,
} from "@/modules/monitors/monitors.zod";
import {
	ActionsCell,
	LatencyChart,
	MonitorNameCell,
	UptimeCell,
} from "./monitor-cells";
import { StatusBadge } from "@/components/ui/status-badge";

const getAverageLatency = (history: any[]) => {
	if (!history || !Array.isArray(history) || history.length === 0) return 0;

	const total = history.reduce((acc, item) => {
		return acc + (item.value ?? item.latency ?? item ?? 0);
	}, 0);

	return total / history.length;
};

export function MonitorList({
	data,
	onRowClick,
}: {
	data: DashboardMonitor[];
	onRowClick?: (monitor: DashboardMonitor) => void;
}) {
	const columnHelper = createColumnHelper<DashboardMonitor>();
	const columns = useMemo(
		() => [
			columnHelper.accessor("name", {
				size: 250,
				minSize: 200,
				header: ({ column }) => (
					<Button
						variant="ghost"
						className="-ml-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Monitor
						<ArrowUpDown className="ml-1.5 size-2.5 opacity-40" />
					</Button>
				),
				cell: ({ row }) => {
					const m = row.original;
					let url = m.target;
					if (m.type === "tcp") {
						const config = m.config as TcpConfig;
						if (config.port) {
							url += `:${config.port}`;
						}
					}
					return <MonitorNameCell name={m.name} url={url} />;
				},
			}),

			columnHelper.accessor("status", {
				size: 120,
				minSize: 120,
				header: "Status",
				cell: ({ getValue }) => {
					const status = getValue();
					return (
						<StatusBadge
							pulse={["down", "error"].includes((status as any) || "")}
							status={(status as any) || "pending"}
							className="capitalize"
						>
							{status}
						</StatusBadge>
					);
				},
			}),

			columnHelper.accessor("uptime", {
				size: 140,
				header: ({ column }) => (
					<Button
						variant="ghost"
						className="-ml-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Uptime (24h)
						<ArrowUpDown className="ml-1.5 size-2.5 opacity-40" />
					</Button>
				),
				cell: ({ getValue }) => (
					<div className="text-left">
						<UptimeCell uptime={getValue()} />
					</div>
				),
			}),

			columnHelper.accessor("latencyHistory", {
				size: 220,
				minSize: 120,
				header: ({ column }) => (
					<div className="text-left">
						<Button
							variant="ghost"
							className="-mr-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}
						>
							Latency (24h)
							<ArrowUpDown className="ml-1.5 size-2.5 opacity-40" />
						</Button>
					</div>
				),
				cell: ({ getValue }) => (
					<div className="w-full text-left">
						<LatencyChart data={getValue()} />
					</div>
				),
				sortingFn: (rowA, rowB, columnId) => {
					const historyA = rowA.getValue(columnId) as any[];
					const historyB = rowB.getValue(columnId) as any[];

					const valA = getAverageLatency(historyA);
					const valB = getAverageLatency(historyB);

					return valA < valB ? 1 : valA > valB ? -1 : 0;
				},
			}),

			columnHelper.accessor("issues", {
				header: "Issues",
				size: 100,
				minSize: 40,
				cell: ({ getValue }) => <>issues?</>,
			}),

			columnHelper.display({
				id: "actions",
				size: 80,
				minSize: 40,
				cell: ({ row }) => (
					<ActionsCell monitor={row.original} onViewDetails={onRowClick} />
				),
			}),
		],
		[onRowClick, columnHelper],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		enableColumnResizing: true,
		columnResizeMode: "onChange",
	});

	return (
		<div className="w-full space-y-3">
			<Table
				className="table-fixed w-full"
				style={{ minWidth: table.getTotalSize() }}
			>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow
							key={headerGroup.id}
							className="hover:bg-transparent border-b border-border/50 bg-muted/20"
						>
							{headerGroup.headers.map((header) => (
								<TableHead
									key={header.id}
									className="sm:px-4 h-8 text-[11px]"
									style={{ width: header.getSize() }}
								>
									{header.isPlaceholder
										? null
										: flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
								onClick={() => onRowClick?.(row.original)}
								className="cursor-pointer border-b border-border/30 hover:bg-muted/30 transition-colors duration-75"
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell
										key={cell.id}
										className="sm:px-4 py-2"
										style={{ width: cell.column.getSize() }}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								<div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
									<div className="size-6 rounded-full bg-muted flex items-center justify-center">
										<Search className="size-3 opacity-40" />
									</div>
									<p className="text-[13px]">No monitors found.</p>
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{/* --- Footer --- */}
			<div className="flex items-center justify-between px-0.5">
				<div className="text-[11px] text-muted-foreground/70">
					Showing{" "}
					<span className="font-medium text-foreground">{data.length}</span> of{" "}
					<span className="font-medium text-foreground">{data.length}</span>{" "}
					monitors
				</div>
				<div className="text-[9px] text-muted-foreground/50 font-mono uppercase tracking-widest">
					Live Updates
				</div>
			</div>
		</div>
	);
}
