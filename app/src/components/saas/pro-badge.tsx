import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProBadge({
	className,
	showLock = false,
}: {
	className?: string;
	showLock?: boolean;
}) {
	return (
		<Badge
			variant="secondary"
			className={cn(
				"bg-linear-to-r from-amber-200 to-yellow-400 text-yellow-900",
				"hover:bg-amber-300 border-0 px-1.5 py-0 h-5 text-[10px] font-bold shadow-sm",
				className,
			)}
		>
			{showLock && <Lock className="w-2 h-2 mr-1 opacity-70" />}
			PRO
		</Badge>
	);
}
