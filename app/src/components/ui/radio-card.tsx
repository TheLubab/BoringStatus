import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon, type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const radioCardGroupVariants = cva("grid gap-3", {
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
	"group relative flex w-full rounded-xl border-2 bg-card p-4 text-left shadow-sm transition-all outline-none hover:border-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 data-[state=checked]:ring-1 data-[state=checked]:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "flex-row items-start gap-4",
				centered: "flex-col items-center justify-center text-center gap-2 py-6",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

interface RadioCardGroupProps
	extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
	VariantProps<typeof radioCardGroupVariants> { }

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
							"shrink-0 text-muted-foreground group-data-[state=checked]:text-primary",
							variant === "centered" ? "mb-1" : "mt-1",
						)}
					>
						{typeof Icon === "function" ? <Icon className="size-5" /> : Icon}
					</div>
				)}

				<div className="flex flex-1 flex-col gap-1 my-auto">
					<span className="text-sm font-bold leading-none tracking-tight">
						{title}
					</span>
					{description && (
						<p className="text-sm text-muted-foreground leading-relaxed">
							{description}
						</p>
					)}
				</div>

				{showRadio && (
					<div
						className={cn(
							"flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted transition-colors group-data-[state=checked]:border-primary",
							variant === "centered" && "mt-2",
						)}
						aria-hidden="true"
					>
						<RadioGroupPrimitive.Indicator className="flex items-center justify-center">
							<CircleIcon className="size-2.5 fill-primary text-primary" />
						</RadioGroupPrimitive.Indicator>
					</div>
				)}
				{RadioCircle &&
					(typeof RadioCircle === "function" ? <RadioCircle /> : RadioCircle)}

				{children && (
					<div className="hidden mt-4 w-full border-t pt-4 animate-in fade-in zoom-in-95 group-data-[state=checked]:block">
						{children}
					</div>
				)}
			</RadioGroupPrimitive.Item>
		);
	},
);
RadioCard.displayName = "RadioCard";

export { RadioCardGroup, RadioCard };
