import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

function RadioGroup({
	className,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
	return (
		<RadioGroupPrimitive.Root
			data-slot="radio-group"
			className={cn("grid gap-2", className)}
			{...props}
		/>
	);
}

function RadioGroupItem({
	className,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item"
			className={cn(
				"border-input text-primary focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 aria-invalid:ring-1 aria-invalid:ring-destructive/30 aria-invalid:border-destructive aspect-square size-3.5 shrink-0 rounded-full border transition-all duration-100 ease-out outline-none disabled:cursor-not-allowed disabled:opacity-40",
				className,
			)}
			{...props}
		>
			<RadioGroupPrimitive.Indicator
				data-slot="radio-group-indicator"
				className="relative flex items-center justify-center"
			>
				<CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2" />
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	);
}

export { RadioGroup, RadioGroupItem };
