import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RadioCardProps {
	value: string;
	selectedValue?: string;
	onChange: (value: string) => void;
	icon: ReactNode;
	label: string;
	description?: string;
	className?: string;
}

export function RadioCard({
	value,
	selectedValue,
	onChange,
	icon,
	label,
	description,
	className,
}: RadioCardProps) {
	const isSelected = value === selectedValue;

	return (
		<button
			type="button"
			onClick={() => onChange(value)}
			className={cn(
				"cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 relative overflow-hidden group",
				isSelected
					? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
					: "border-border hover:border-emerald-600/50 hover:bg-accent",
				className,
			)}
		>
			{isSelected && (
				<div className="absolute top-2 right-2 text-emerald-600 animate-in fade-in zoom-in duration-300">
					<CheckCircle2 className="w-4 h-4" />
				</div>
			)}

			<div
				className={cn(
					"transition-colors duration-200",
					isSelected
						? "text-emerald-600"
						: "text-muted-foreground group-hover:text-foreground",
				)}
			>
				{icon}
			</div>

			<div className="text-center space-y-1">
				<div
					className={cn(
						"font-semibold text-sm",
						isSelected
							? "text-emerald-700 dark:text-emerald-400"
							: "text-foreground",
					)}
				>
					{label}
				</div>
				{description && (
					<div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider opacity-80">
						{description}
					</div>
				)}
			</div>
		</button>
	);
}
