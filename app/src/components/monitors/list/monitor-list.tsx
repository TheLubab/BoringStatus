import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronRight, Plus, Search } from "lucide-react";
import { useMemo } from "react";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableHeadRow,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DashboardMonitor } from "@/modules/monitors/monitors.zod";

import { createColumns } from "./columns";
import { getStatusBorderClass } from "./utils";

export function MonitorList({
	data,
	onRowClick,
}: {
	data: DashboardMonitor[];
	onRowClick?: (monitor: DashboardMonitor) => void;
}) {
	const columns = useMemo(() => createColumns(onRowClick), [onRowClick]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		enableColumnResizing: true,
		columnResizeMode: "onChange",
	});

	return (
		<div className="w-full space-y-3">
			<Table style={{ minWidth: table.getTotalSize() }}>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableHeadRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id} style={{ width: header.getSize() }}>
									{header.isPlaceholder
										? null
										: flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
								</TableHead>
							))}
							{/* Chevron column header (empty) */}
							<TableHead className="w-8" />
						</TableHeadRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
								onClick={() => onRowClick?.(row.original)}
								className={cn(
									"cursor-pointer border-l-2 group/row",
									"hover:border-l-primary/80",
									getStatusBorderClass(row.original.status),
								)}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell
										key={cell.id}
										style={{ width: cell.column.getSize() }}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
								{/* Reveal chevron on hover */}
								<TableCell className="w-8 px-2">
									<ChevronRight className="size-3.5 text-muted-foreground/0 group-hover/row:text-muted-foreground/50 transition-all duration-100 group-hover/row:translate-x-0.5" />
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow className="hover:bg-transparent">
							<TableCell colSpan={columns.length + 1} className="h-32">
								<div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
									<div className="size-12 rounded-full bg-muted/30 flex items-center justify-center">
										<Search className="size-5 text-muted-foreground/40" />
									</div>
									<div className="text-center space-y-1">
										<p className="text-[12px] font-medium text-foreground/70">
											No monitors found
										</p>
										<p className="text-[10px] text-muted-foreground/60">
											Create your first monitor to start tracking uptime
										</p>
									</div>
									<button
										type="button"
										className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-primary hover:text-primary/80 bg-primary/[0.08] hover:bg-primary/[0.12] rounded-md transition-colors"
									>
										<Plus className="size-3" />
										Add Monitor
									</button>
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{/* Footer */}
			<div className="flex items-center justify-between px-2 py-1.5 bg-muted/[0.03] rounded-md border border-border/20">
				<div className="flex items-center gap-3">
					<div className="text-[10px] text-muted-foreground/70 font-mono">
						<span className="text-foreground/80 font-medium">
							{data.length}
						</span>
						<span className="mx-1 text-muted-foreground/50">monitors</span>
					</div>
					<div className="h-3 w-px bg-border/40" />
					<div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50 font-mono">
						<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
						<span className="uppercase tracking-wider">Live</span>
					</div>
				</div>
				<div className="text-[9px] text-muted-foreground/40 font-mono">
					Updated just now
				</div>
			</div>
		</div>
	);
}
