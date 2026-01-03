import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Clock,
	ExternalLink,
	Globe,
	MoreHorizontal,
	PauseCircle,
	PlayCircle,
	Radio,
	Trash2,
} from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SelectMonitor } from "@/modules/monitors/monitors.schema";

interface MonitorHeaderProps {
	monitor: SelectMonitor;
	isActive: boolean;
	onToggle: () => void;
	onDelete: () => void;
}

const TYPE_CONFIG = {
	http: { icon: Globe, label: "HTTP", color: "text-slate-600" },
	tcp: { icon: Radio, label: "TCP", color: "text-slate-600" },
	ping: { icon: Radio, label: "Ping", color: "text-slate-600" },
} as const;

export function MonitorHeader({
	monitor,
	isActive,
	onToggle,
	onDelete,
}: MonitorHeaderProps) {
	const typeConfig =
		TYPE_CONFIG[monitor.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.http;
	const TypeIcon = typeConfig.icon;

	return (
		<div className="pb-4 border-b border-slate-200">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-1.5 mb-4 text-xs text-slate-500">
				<Link
					to="/monitors"
					className="flex items-center gap-1 hover:text-slate-900 transition-colors"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					<span>Monitors</span>
				</Link>
				<span>/</span>
				<span className="text-slate-900 font-medium truncate max-w-[200px]">
					{monitor.name}
				</span>
			</nav>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				{/* Left side */}
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
						<TypeIcon className="h-5 w-5 text-slate-600" />
					</div>

					<div>
						<div className="flex items-center gap-2.5 mb-0.5">
							<h1 className="text-lg font-semibold text-slate-900">
								{monitor.name}
							</h1>
							<StatusPill status={monitor.status} isActive={isActive} />
						</div>

						<div className="flex items-center gap-2.5 text-xs text-slate-500">
							{monitor.type === "http" ? (
								<a
									href={monitor.target}
									target="_blank"
									rel="noreferrer"
									className="flex items-center gap-1 hover:text-slate-700 transition-colors truncate max-w-[280px]"
								>
									{monitor.target}
									<ExternalLink className="h-3 w-3 shrink-0" />
								</a>
							) : (
								<span className="truncate max-w-[200px]">{monitor.target}</span>
							)}
							<span className="text-slate-300">·</span>
							<span className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								{formatFrequency(monitor.frequency)}
							</span>
							<span className="text-slate-300">·</span>
							<span className="uppercase tracking-wide font-medium text-slate-400">
								{typeConfig.label}
							</span>
						</div>
					</div>
				</div>

				{/* Right side */}
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onToggle}
						className={cn(
							"h-8 text-xs font-medium border-slate-200",
							isActive
								? "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
								: "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200",
						)}
					>
						{isActive ? (
							<>
								<PauseCircle className="h-3.5 w-3.5 mr-1.5" />
								Pause
							</>
						) : (
							<>
								<PlayCircle className="h-3.5 w-3.5 mr-1.5" />
								Resume
							</>
						)}
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8 w-8 p-0 border-slate-200"
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<DropdownMenuItem
										onSelect={(e) => e.preventDefault()}
										className="text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
									>
										<Trash2 className="h-3.5 w-3.5 mr-2" />
										Delete
									</DropdownMenuItem>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Monitor?</AlertDialogTitle>
										<AlertDialogDescription>
											This will permanently delete{" "}
											<strong>{monitor.name}</strong> and all its data.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={onDelete}
											className="bg-red-600 hover:bg-red-700 text-white"
										>
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}

function StatusPill({
	status,
	isActive,
}: {
	status: string;
	isActive: boolean;
}) {
	if (!isActive) {
		return (
			<span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full bg-slate-100 text-slate-500">
				<span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
				Paused
			</span>
		);
	}

	const config: Record<
		string,
		{ dot: string; bg: string; text: string; label: string }
	> = {
		up: {
			dot: "bg-emerald-500",
			bg: "bg-emerald-50",
			text: "text-emerald-700",
			label: "Operational",
		},
		down: {
			dot: "bg-red-500",
			bg: "bg-red-50",
			text: "text-red-700",
			label: "Down",
		},
		error: {
			dot: "bg-red-500",
			bg: "bg-red-50",
			text: "text-red-700",
			label: "Error",
		},
		pending: {
			dot: "bg-slate-400",
			bg: "bg-slate-100",
			text: "text-slate-600",
			label: "Pending",
		},
	};

	const c = config[status] || config.pending;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full",
				c.bg,
				c.text,
			)}
		>
			<span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
			{c.label}
		</span>
	);
}

function formatFrequency(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
	return `${Math.round(seconds / 3600)}h`;
}
