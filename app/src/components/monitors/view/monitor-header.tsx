import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ExternalLink,
	PauseCircle,
	PlayCircle,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Monitor } from "@/modules/monitors/monitors.zod";
import { StatusBadge } from "@/components/ui/status-badge";

interface MonitorHeaderProps {
	monitor: Monitor;
	isActive: boolean;
	onToggle: () => void;
	onDelete: () => void;
}

export function MonitorHeader({
	monitor,
	isActive,
	onToggle,
	onDelete,
}: MonitorHeaderProps) {
	return (
		<div className="border-b pb-6">
			<div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
				<Link
					to="/monitors"
					className="hover:text-foreground flex items-center gap-1 transition-colors"
				>
					<ArrowLeft className="h-4 w-4" /> Monitors
				</Link>
				<span>/</span>
				<span>Details</span>
			</div>

			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div>
					<div className="flex mb-2 items-center gap-4 flex-wrap">
						<h1 className="text-2xl font-bold tracking-tight">
							{monitor.name}
						</h1>
						{!isActive ? (
							<StatusBadge status={monitor.status} pulse={true}>
								{monitor.status.toUpperCase()}
							</StatusBadge>
						) : (
							<Badge variant="secondary">Paused</Badge>
						)}
					</div>

					{monitor.type === "http" && (
						<a
							href={monitor.target}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
						>
							{monitor.target}
							<ExternalLink className="h-3 w-3" />
						</a>
					)}
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						onClick={onToggle}
						className={cn(
							"transition-colors duration-300 ease-in-out",
							isActive
								? "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
								: "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200",
						)}
					>
						{isActive ? (
							<>
								<PauseCircle className="mr-2 h-4 w-4" /> Pause
							</>
						) : (
							<>
								<PlayCircle className="mr-2 h-4 w-4" /> Resume
							</>
						)}
					</Button>

					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								onSelect={(e) => e.preventDefault()}
								variant="destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" /> Delete
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Monitor?</AlertDialogTitle>
								<AlertDialogDescription>
									This will permanently delete <strong>{monitor.name}</strong>{" "}
									and all its history.
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
				</div>
			</div>
		</div>
	);
}
