import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
	"relative inline-flex items-center justify-center",
	{
		variants: {
			variant: {
				success: "",
				warning: "",
				error: "",
				info: "",
				neutral: "",
				purple: "",
				gold: "",
			},
			size: {
				sm: "",
				md: "",
				lg: "",
				xl: "",
			},
		},
		defaultVariants: {
			variant: "success",
			size: "md",
		},
	},
);

const variantStyles = {
	success: {
		gradient:
			"bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-600",
		glow: "shadow-emerald-500/50",
		ring: "bg-emerald-400/30",
		text: "text-emerald-600",
	},
	warning: {
		gradient: "bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600",
		glow: "shadow-amber-500/50",
		ring: "bg-amber-400/30",
		text: "text-amber-600",
	},
	error: {
		gradient: "bg-gradient-to-br from-rose-300 via-rose-400 to-rose-600",
		glow: "shadow-rose-500/50",
		ring: "bg-rose-400/30",
		text: "text-rose-600",
	},
	info: {
		gradient: "bg-gradient-to-br from-cyan-300 via-cyan-400 to-cyan-600",
		glow: "shadow-cyan-500/50",
		ring: "bg-cyan-400/30",
		text: "text-cyan-600",
	},
	neutral: {
		gradient: "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600",
		glow: "shadow-slate-500/50",
		ring: "bg-slate-400/30",
		text: "text-slate-600",
	},
	purple: {
		gradient: "bg-gradient-to-br from-purple-300 via-purple-400 to-purple-600",
		glow: "shadow-purple-500/50",
		ring: "bg-purple-400/30",
		text: "text-purple-600",
	},
	gold: {
		gradient: "bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600",
		glow: "shadow-amber-500/60",
		ring: "bg-amber-400/30",
		text: "text-amber-600",
	},
};

const sizeStyles = {
	sm: { badge: "w-2 h-2", ring: "w-3 h-3" },
	md: { badge: "w-3 h-3", ring: "w-4 h-4" },
	lg: { badge: "w-4 h-4", ring: "w-5 h-5" },
	xl: { badge: "w-5 h-5", ring: "w-6 h-6" },
};

const statusToVariant = {
	up: "success",
	down: "error",
	maintenance: "warning",
	pending: "neutral",
	error: "error",
} as const;

type Status = keyof typeof statusToVariant;

interface StatusBadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
	VariantProps<typeof statusBadgeVariants> {
	status?: Status;
	pulse?: boolean;
}

function StatusBadge({
	className,
	variant,
	status,
	pulse = false,
	size = "md",
	children,
	...props
}: StatusBadgeProps) {
	const effectiveVariant = status
		? statusToVariant[status]
		: (variant ?? "success");

	const currentVariant = Object.hasOwn(variantStyles, effectiveVariant)
		? variantStyles[effectiveVariant]
		: variantStyles.neutral;
	const currentSize = sizeStyles[size];

	return (
		<div
			className={cn(
				statusBadgeVariants({ size }),
				"gap-2", // spacing for optional children
				className,
			)}
			{...props}
		>
			<div className="relative inline-flex items-center justify-center">
				{pulse && (
					<span
						className={cn(
							"absolute rounded-full animate-ping",
							currentVariant.ring,
							currentSize.ring,
						)}
					/>
				)}

				<span
					className={cn(
						"relative inline-flex rounded-full shadow-lg",
						currentVariant.gradient,
						currentVariant.glow,
						currentSize.badge,
					)}
				/>
			</div>

			{children && (
				<span
					className={cn(
						"font-mono font-bold leading-none",
						currentVariant.text,
					)}
				>
					{children}
				</span>
			)}
		</div>
	);
}

export { StatusBadge, statusBadgeVariants, type Status };
