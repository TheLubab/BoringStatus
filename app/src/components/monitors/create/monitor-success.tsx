import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonitorSuccessProps {
	className?: string;
	onConfigureNew: () => void;
	allowHighFrequency?: boolean;
	target?: string;
}

export function MonitorSuccess({
	className,
	onConfigureNew,
	allowHighFrequency = false,
	target = "your server",
}: MonitorSuccessProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center p-8 space-y-6 text-center animate-in zoom-in-95 duration-300",
				className,
			)}
		>
			<div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2 shadow-sm">
				<CheckCircle2 className="w-8 h-8 text-primary" />
			</div>

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

			{/* Dynamic Upsell */}
			{!allowHighFrequency && (
				<div className="bg-premium/5 border border-premium/10 p-4 rounded-lg w-full max-w-md flex items-start text-left gap-3">
					<Zap className="w-5 h-5 text-premium shrink-0 mt-0.5" />
					<div className="space-y-1">
						<p className="text-sm font-semibold text-premium">
							Enable 1-minute checks?
						</p>
						<p className="text-xs text-muted-foreground">
							Upgrade to Pro to catch downtime 5x faster and get instant SMS
							alerts.
						</p>
					</div>
				</div>
			)}

			<div className="flex gap-3 pt-4 w-full justify-center">
				<Button variant="outline" onClick={onConfigureNew}>
					Configure Another
				</Button>
				<Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
					View Status <ArrowRight className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
}
