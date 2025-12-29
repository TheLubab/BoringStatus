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
				"group relative flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 transition-all duration-100 select-none",
				"focus-within:ring-1 focus-within:ring-primary/40",
				disabled
					? "cursor-not-allowed bg-muted/40 text-muted-foreground"
					: "cursor-pointer hover:bg-muted/30 hover:border-foreground/20",
				checked && !disabled
					? "border-primary bg-primary/5"
					: "border-border bg-card",
			)}
		>
			{/* Left */}
			<div className="flex items-center gap-2">
				{/* Radio */}
				<div className="relative flex items-center">
					<input
						type="radio"
						checked={checked}
						disabled={disabled}
						onChange={onChange}
						className={cn(
							"peer size-3.5 appearance-none rounded-full border transition-all duration-100",
							"border-input bg-transparent",
							"checked:border-primary checked:bg-primary",
							"focus-visible:outline-none",
							disabled &&
								"checked:border-muted-foreground checked:bg-muted-foreground",
						)}
					/>
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<div className="size-1.5 rounded-full bg-primary-foreground opacity-0 transition-opacity duration-100 peer-checked:opacity-100" />
					</div>
				</div>

				{/* Text */}
				<div className="flex min-w-0 flex-col gap-px">
					<span
						className={cn(
							"text-[13px] font-semibold leading-snug tracking-tight",
							disabled && "text-muted-foreground",
						)}
					>
						{title}
					</span>

					{subtitle && (
						<span className="text-xs leading-snug text-muted-foreground/70">
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
