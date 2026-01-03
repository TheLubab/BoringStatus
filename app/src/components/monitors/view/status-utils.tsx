import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
	up: "bg-emerald-50 text-emerald-700 border-emerald-200",
	down: "bg-red-50 text-red-700 border-red-200",
	maintenance: "bg-amber-50 text-amber-700 border-amber-200",
	pending: "bg-gray-50 text-gray-700 border-gray-200",
} as const;

const STATUS_ICONS = {
	up: CheckCircle2,
	down: XCircle,
	maintenance: AlertTriangle,
	pending: Activity,
} as const;

type StatusKey = keyof typeof STATUS_STYLES;

export function StatusIcon({
	status,
	className,
}: {
	status: string;
	className?: string;
}) {
	if (status === "up")
		return <CheckCircle2 className={cn("text-emerald-500", className)} />;
	if (status === "down")
		return <XCircle className={cn("text-red-500", className)} />;
	if (status === "maintenance")
		return <AlertTriangle className={cn("text-amber-500", className)} />;
	return <Activity className={cn("text-gray-500", className)} />;
}
