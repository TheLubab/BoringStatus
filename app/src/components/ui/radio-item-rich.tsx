import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RichRadioItemProps {
	title: string;
	subtitle?: string;
	checked: boolean;
	disabled?: boolean;
	onChange?: () => void;
	badge?: ReactNode;
}

export function RichRadioItem({
	title,
	subtitle,
	checked,
	disabled,
	onChange,
	badge,
}: RichRadioItemProps) {
	return (
		<label
			className={cn(
				"group relative flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-all select-none",
				"focus-within:ring-2 focus-within:ring-ring/40",
				disabled
					? "cursor-not-allowed bg-muted/40 text-muted-foreground"
					: "cursor-pointer hover:bg-muted/30",
				checked && !disabled
					? "border-primary bg-primary/10"
					: "border-border bg-card",
			)}
		>
			{/* Left */}
			<div className="flex items-center gap-2.5">
				{/* Radio */}
				<div className="relative flex items-center">
					<input
						type="radio"
						checked={checked}
						disabled={disabled}
						onChange={onChange}
						className={cn(
							"peer h-4 w-4 appearance-none rounded-full border transition-colors",
							"border-border bg-background",
							"checked:border-primary checked:bg-primary",
							"focus-visible:outline-none",
							disabled &&
								"checked:border-muted-foreground checked:bg-muted-foreground",
						)}
					/>
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<div className="h-2 w-2 rounded-full bg-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100" />
					</div>
				</div>

				{/* Text */}
				<div className="flex min-w-0 flex-col">
					<span
						className={cn(
							"text-sm font-medium leading-snug",
							disabled && "text-muted-foreground",
						)}
					>
						{title}
					</span>

					{subtitle && (
						<span className="text-xs leading-snug text-muted-foreground">
							{subtitle}
						</span>
					)}
				</div>
			</div>

			{/* Right */}
			{badge && <div className="shrink-0">{badge}</div>}
		</label>
	);
}
