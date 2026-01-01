import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-semibold tracking-tight disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer select-none transition-[transform,box-shadow,background-color,border-color] duration-100 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.97] active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-1",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md active:bg-primary/80 active:shadow-sm focus-visible:ring-primary/50",
				solid:
					"bg-foreground text-background shadow-sm hover:bg-foreground/90 hover:shadow-md active:bg-foreground/80 focus-visible:ring-foreground/50",
				destructive:
					"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md active:bg-destructive/80 focus-visible:ring-destructive/50",
				outline:
					"border border-input bg-transparent text-foreground hover:bg-muted/50 hover:border-foreground/25 active:bg-muted/70 focus-visible:ring-primary/40",
				secondary:
					"bg-muted text-foreground hover:bg-muted/70 active:bg-muted/50 focus-visible:ring-primary/40",
				ghost:
					"text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70 focus-visible:ring-primary/40",
				link: "text-foreground underline-offset-3 hover:underline hover:text-primary focus-visible:ring-0 active:scale-100 active:translate-y-0",
				success:
					"bg-emerald-600 text-white shadow-sm hover:bg-emerald-600/90 hover:shadow-md active:bg-emerald-600/80 focus-visible:ring-emerald-500/50",
			},
			size: {
				default: "h-8 px-3.5 py-1.5 has-[>svg]:px-3",
				sm: "h-7 gap-1 px-2.5 has-[>svg]:px-2 text-xs",
				lg: "h-9 px-5 has-[>svg]:px-4 text-sm",
				xl: "h-10 px-6 has-[>svg]:px-5 text-sm",
				icon: "size-8",
				"icon-sm": "size-7",
				"icon-lg": "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";
	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
