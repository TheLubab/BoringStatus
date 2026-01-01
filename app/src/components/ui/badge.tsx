import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center justify-center rounded-sm border px-1.5 py-px text-[11px] font-semibold tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-2.5 gap-0.5 [&>svg]:pointer-events-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 aria-invalid:ring-1 aria-invalid:ring-destructive/30 aria-invalid:border-destructive transition-all duration-100 ease-out overflow-hidden",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
				secondary:
					"border-transparent bg-muted text-foreground [a&]:hover:bg-muted/80",
				destructive:
					"border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/30",
				outline: "text-foreground border-input [a&]:hover:bg-muted/50",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
