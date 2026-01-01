import { cn } from "@/lib/utils";

interface UptimeCellProps {
	uptime?: number | null;
}

export const UptimeCell = ({ uptime }: UptimeCellProps) => {
	if (uptime === undefined || uptime === null) {
		return (
			<span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-muted/30 font-mono font-medium text-[10px] text-muted-foreground/40 tabular-nums">
				—
			</span>
		);
	}

	let colorClass = "text-muted-foreground/40";
	let bgClass = "";
	if (uptime < 98) {
		colorClass = "text-amber-600";
	}
	if (uptime < 90) {
		colorClass = "text-rose-600";
	}

	return (
		<span
			className={cn(
				"inline-flex items-center justify-center px-1.5 py-0.5 rounded font-mono font-semibold text-[10px] tabular-nums",
				colorClass,
				bgClass,
			)}
		>
			{uptime.toFixed(2)}%
		</span>
	);
};
