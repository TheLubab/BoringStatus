import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonitorSuccessProps {
	className?: string;
	target?: string;
	id?: string;
}

export function MonitorSuccess({
	id,
	className,
	target = "your server",
}: MonitorSuccessProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center p-8 space-y-6 text-center animate-in zoom-in-95 duration-300",
				className,
			)}
		>
			<CheckCircle2 className="w-12 h-12 text-primary" />

			<div className="space-y-2">
				<h2 className="text-2xl font-bold tracking-tight text-foreground">
					Monitor Created
				</h2>
				<p className="text-muted-foreground max-w-sm mx-auto">
					We successfully connected to{" "}
					<span className="font-medium text-foreground">{target}</span>. The
					first check is already running.
				</p>
			</div>

			{id && (
				<div className="flex gap-3 pt-4 w-full justify-center">
					<Link to="/monitors/$monitorId" params={{ monitorId: id }}>
						<Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
							View Status <ArrowRight className="w-4 h-4" />
						</Button>
					</Link>
				</div>
			)}
		</div>
	);
}
