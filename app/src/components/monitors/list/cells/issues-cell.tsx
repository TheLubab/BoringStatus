import { AlertTriangle, CheckCircle2 } from "lucide-react";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MonitorIssue } from "@/modules/monitors/monitors.zod";

interface IssuesCellProps {
	issues: MonitorIssue[] | null;
}

export const IssuesCell = ({ issues }: IssuesCellProps) => {
	const issueCount = issues?.length ?? 0;

	if (issueCount === 0) {
		return (
			<div className="flex items-center gap-1 text-muted-foreground/40">
				<CheckCircle2 className="size-3" />
				<span className="text-[9px] font-mono tabular-nums">0</span>
			</div>
		);
	}

	return (
		<TooltipProvider delayDuration={150}>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={cn(
							"flex items-center gap-1 cursor-help",
							issueCount > 0 ? "text-amber-600" : "text-muted-foreground/40",
						)}
					>
						<AlertTriangle className="size-3" />
						<span className="text-[9px] font-mono font-semibold tabular-nums">
							{issueCount}
						</span>
					</div>
				</TooltipTrigger>
				<TooltipContent
					side="top"
					className="max-w-xs text-[10px]"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="space-y-0.5">
						<p className="font-semibold text-foreground text-[10px]">
							{issueCount} Active Issue{issueCount !== 1 ? "s" : ""}
						</p>
						<ul className="space-y-0.5 text-muted-foreground font-mono">
							{(issues ?? []).slice(0, 3).map((issue) => (
								<li key={issue.message} className="truncate text-[9px]">
									• {issue.message}
								</li>
							))}
							{issueCount > 3 && (
								<li className="text-muted-foreground/60 text-[9px]">
									+{issueCount - 3} more...
								</li>
							)}
						</ul>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
