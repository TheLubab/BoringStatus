import {
	AlertTriangle,
	AlertCircle,
	Info,
	Minus,
} from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MonitorIssue } from "@/modules/monitors/monitors.zod";
import { Badge } from "@/components/ui/badge";

interface MonitorIssuesProps {
	issues?: MonitorIssue[];
}

const severityConfig = {
	high: {
		icon: AlertTriangle,
		dot: "bg-rose-500",
	},
	medium: {
		icon: AlertCircle,
		dot: "bg-amber-500",
	},
	low: {
		icon: Info,
		dot: "bg-blue-500",
	},
} as const;

export function MonitorIssues({ issues }: MonitorIssuesProps) {
	if (!issues?.length) return <Minus className="text-foreground/30" />;

	const highestSeverity = issues.some((i) => i.severity === "high")
		? "high"
		: issues.some((i) => i.severity === "medium")
			? "medium"
			: "low";

	const BadgeIcon = severityConfig[highestSeverity].icon;

	return (
		<TooltipProvider delayDuration={150}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge
						aria-label={`${issues.length} active issues`}
						variant={
							highestSeverity === "high"
								? "destructive"
								: highestSeverity === "medium"
									? "secondary"
									: "outline"
						}
					>
						<BadgeIcon className="h-3.5 w-3.5" />
						<span>{issues.length}</span>
					</Badge>
				</TooltipTrigger>

				<TooltipContent
					side="left"
					align="center"
					sideOffset={8}
					className="w-70 overflow-hidden rounded-xl border bg-popover p-0 shadow-lg"
				>
					<div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
						<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
							Active Issues
						</span>
						<span className="text-[11px] text-muted-foreground">
							{issues.length} total
						</span>
					</div>

					<ul className="max-h-55 divide-y overflow-auto">
						{issues.map((issue) => (
							<li
								key={issue.id}
								className="flex gap-2 px-3 py-2 text-xs leading-snug hover:bg-muted/30"
							>
								<span
									className={cn(
										"mt-1 h-2 w-2 shrink-0 rounded-full",
										severityConfig[issue.severity].dot,
									)}
								/>
								<span className="text-foreground/90">{issue.message}</span>
							</li>
						))}
					</ul>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
