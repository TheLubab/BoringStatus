import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon, type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const radioCardGroupVariants = cva("grid gap-2", {
	variants: {
		variant: {
			default: "grid-cols-1",
			horizontal: "grid-cols-1 sm:grid-cols-3",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

const radioCardVariants = cva(
	"group relative flex w-full rounded-md border bg-card text-left transition-all duration-100 ease-out outline-none hover:border-foreground/25 focus-visible:ring-1 focus-visible:ring-primary/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 active:scale-[0.99] active:transition-none disabled:cursor-not-allowed disabled:opacity-40",
	{
		variants: {
			variant: {
				default: "flex-row items-start gap-3 p-3",
				centered:
					"flex-col items-center justify-center text-center gap-1.5 py-4 px-3",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

interface RadioCardGroupProps
	extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
		VariantProps<typeof radioCardGroupVariants> {}

function RadioCardGroup({ className, variant, ...props }: RadioCardGroupProps) {
	return (
		<RadioGroupPrimitive.Root
			data-slot="radio-card-group"
			className={cn(radioCardGroupVariants({ variant, className }))}
			{...props}
		/>
	);
}

// Fixed: Correctly extending the Primitive Item props
interface RadioCardProps
	extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
		VariantProps<typeof radioCardVariants> {
	title: string;
	description?: string;
	icon?: LucideIcon | React.ReactNode;
	radioCircle?: LucideIcon | React.ReactNode;
	showRadio?: boolean;
}

const RadioCard = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Item>,
	RadioCardProps
>(
	(
		{
			className,
			variant,
			title,
			description,
			icon: Icon,
			radioCircle: RadioCircle,
			showRadio = true,
			children,
			...props
		},
		ref,
	) => {
		return (
			<RadioGroupPrimitive.Item
				ref={ref}
				// Pass the variant to the CVA function, NOT the Radix component
				className={cn(radioCardVariants({ variant, className }))}
				{...props}
			>
				{Icon && (
					<div
						className={cn(
							"shrink-0 text-muted-foreground group-data-[state=checked]:text-primary transition-colors duration-100",
							variant === "centered" ? "mb-0.5" : "mt-0.5",
						)}
					>
						{typeof Icon === "function" ? <Icon className="size-4" /> : Icon}
					</div>
				)}

				<div className="flex flex-1 flex-col gap-0.5 my-auto">
					<span className="text-[13px] font-semibold leading-none tracking-tight">
						{title}
					</span>
					{description && (
						<p className="text-xs text-muted-foreground/70 leading-relaxed">
							{description}
						</p>
					)}
				</div>

				{showRadio && (
					<div
						className={cn(
							"flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-input transition-colors duration-100 group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary/10",
							variant === "centered" && "mt-1.5",
						)}
						aria-hidden="true"
					>
						<RadioGroupPrimitive.Indicator className="flex items-center justify-center">
							<CircleIcon className="size-2 fill-primary text-primary" />
						</RadioGroupPrimitive.Indicator>
					</div>
				)}
				{RadioCircle &&
					(typeof RadioCircle === "function" ? <RadioCircle /> : RadioCircle)}

				{children && (
					<div className="hidden mt-3 w-full border-t pt-3 animate-in fade-in zoom-in-98 duration-100 group-data-[state=checked]:block">
						{children}
					</div>
				)}
			</RadioGroupPrimitive.Item>
		);
	},
);
RadioCard.displayName = "RadioCard";

export { RadioCardGroup, RadioCard };
