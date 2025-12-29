import type * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

function Label({
	className,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(
				"text-xs leading-none font-medium tracking-tight text-foreground/90 select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-40",
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
