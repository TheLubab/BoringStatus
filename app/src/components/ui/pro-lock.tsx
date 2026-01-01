import { Lock } from "lucide-react";
import type React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProLockProps {
	children: React.ReactNode;
	isLocked?: boolean;
	className?: string;
	label?: string;
}

export function ProLock({
	children,
	isLocked = true,
	className,
	label = "PRO",
}: ProLockProps) {
	if (!isLocked) {
		return <>{children}</>;
	}

	return (
		<div className={cn("relative group", className)}>
			<div className="absolute -top-2 -right-2 z-10 pointer-events-none">
				<Badge
					variant="default"
					className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 text-[10px] px-1.5 py-0 h-5"
				>
					<Lock className="w-3 h-3 mr-1" />
					{label}
				</Badge>
			</div>
			<div className="pointer-events-none opacity-60 grayscale blur-[1px]">
				{children}
			</div>
			{/* Overlay to prevent interaction */}
			<div
				className="absolute inset-0 z-0 bg-transparent cursor-not-allowed"
				title="Upgrade to Pro to unlock this feature"
			/>
		</div>
	);
}
