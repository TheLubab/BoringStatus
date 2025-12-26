import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { AlertOctagon, ArrowUpDown, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { type Status, StatusBadge } from "../../ui/status-badge";
import {
	ActionsCell,
	LatencyChart,
	MonitorNameCell,
	UptimeCell,
} from "./monitor-cells";
import { MonitorIssues } from "./monitor-issues";
import type { DashboardMonitor } from "@/functions/monitor";

interface MonitorTableProps {
	data: DashboardMonitor[];
	onRowClick?: (monitor: DashboardMonitor) => void;
}

const getAverageLatency = (history: any[]) => {
	if (!history || !Array.isArray(history) || history.length === 0) return 0;

	const total = history.reduce((acc, item) => {
		return acc + (item.value ?? item.latency ?? item ?? 0);
	}, 0);

	return total / history.length;
};

export function MonitorsTable({ data, onRowClick }: MonitorTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState("");
	const [issuesOnly, setIssuesOnly] = useState(false);

	// --- Filtering Logic ---
	const filteredData = useMemo(() => {
		let result = data;

		if (searchQuery) {
			const lowerQuery = searchQuery.toLowerCase();
			result = result.filter(
				(item) =>
					item.name.toLowerCase().includes(lowerQuery) ||
					item.target.toLowerCase().includes(lowerQuery),
			);
		}

		if (statusFilter.size > 0) {
			result = result.filter((item) => statusFilter.has(item.status || ""));
		}

		return result;
	}, [data, searchQuery, statusFilter]);

	// --- Column Definitions ---
	const columnHelper = createColumnHelper<DashboardMonitor & Record<string, any>>();
	const columns = useMemo(
		() => [
			columnHelper.accessor("name", {
				size: 250,
				minSize: 200,
				header: ({ column }) => (
					<Button
						variant="ghost"
						className="-ml-4 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Monitor
						<ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
					</Button>
				),
				cell: ({ row }) => (
					<MonitorNameCell
						name={row.original.name}
						url={
							row.original.target +
							(row.original.port ? `:${row.original.port}` : "")
						}
					/>
				),
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
						className="-ml-4 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Uptime (24h)
						<ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
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
							className="-mr-4 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}
						>
							Latency (24h)
							<ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
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
				cell: ({ getValue }) => <MonitorIssues issues={getValue()} />,
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
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		state: { sorting },
		enableColumnResizing: true,
		columnResizeMode: "onChange",
	});

	return (
		<div className="w-full space-y-4">
			{/* --- Toolbar --- */}
			<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
				<div className="relative w-full sm:w-[300px]">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search monitors..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>

				<div className="flex items-center gap-2 w-full sm:w-auto">
					<Button
						variant={issuesOnly ? "secondary" : "outline"}
						size="sm"
						onClick={() => setIssuesOnly(!issuesOnly)}
						className={cn(
							"h-9 gap-2 transition-all",
							issuesOnly
								? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900"
								: "text-muted-foreground",
						)}
					>
						<AlertOctagon className="h-4 w-4" />
						<span>Issues Only</span>
						{issuesOnly && (
							<Badge
								variant="secondary"
								className="ml-1 size-4 bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-300"
							>
								<X className="size-3" />
							</Badge>
						)}
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"h-9 gap-2 border-dashed",
									statusFilter.size > 0
										? "text-foreground border-secondary/60 focus:bg-secondary/10 bg-secondary/10 border-solid"
										: "text-muted-foreground",
								)}
							>
								<Filter className="h-4 w-4" />
								Status
								{statusFilter.size > 0 && (
									<Badge
										variant="secondary"
										className="ml-auto h-5 min-w-5 px-1 rounded-full text-[10px]"
									>
										{statusFilter.size}
									</Badge>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[180px]">
							<DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{["up", "down", "maintenance", "pending", "error"].map(
								(status) => (
									<DropdownMenuCheckboxItem
										key={status}
										checked={statusFilter.has(status)}
										onCheckedChange={(checked) => {
											const next = new Set(statusFilter);
											if (checked) next.add(status);
											else next.delete(status);
											setStatusFilter(next);
										}}
									>
										<StatusBadge
											className="capitalize"
											status={status as Status}
										>
											{status}
										</StatusBadge>
									</DropdownMenuCheckboxItem>
								),
							)}
							{statusFilter.size > 0 && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onSelect={() => setStatusFilter(new Set())}
										className="justify-center text-center text-xs"
									>
										Clear filters
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* --- Table --- */}
			<div className="rounded-xl border bg-card shadow-sm overflow-hidden">
				<Table
					className="table-fixed w-full"
					style={{ minWidth: table.getTotalSize() }}
				>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								className="hover:bg-transparent border-b border-border/60 bg-muted/30"
							>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className="sm:px-5 h-10"
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
									className="cursor-pointer border-b border-border/40 hover:bg-muted/40 transition-[background-color]"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="sm:px-4 py-3"
											style={{ width: cell.column.getSize() }}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-32 text-center"
								>
									<div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
										<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
											<Search className="h-4 w-4 opacity-50" />
										</div>
										<p className="text-sm">
											No monitors found matching your criteria.
										</p>
										{(statusFilter.size > 0 || issuesOnly || searchQuery) && (
											<Button
												variant="link"
												size="sm"
												onClick={() => {
													setStatusFilter(new Set());
													setSearchQuery("");
													setIssuesOnly(false);
												}}
											>
												Clear all filters
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* --- Footer --- */}
			<div className="flex items-center justify-between px-1">
				<div className="text-xs text-muted-foreground">
					Showing{" "}
					<span className="font-medium text-foreground">
						{filteredData.length}
					</span>{" "}
					of <span className="font-medium text-foreground">{data.length}</span>{" "}
					monitors
				</div>
				<div className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-widest">
					Live Updates
				</div>
			</div>
		</div>
	);
}
