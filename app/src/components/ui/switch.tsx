import * as SwitchPrimitive from "@radix-ui/react-switch";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
	className,
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(
				"peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 inline-flex h-4 w-7 shrink-0 items-center rounded-full border border-transparent transition-all duration-100 ease-out outline-none disabled:cursor-not-allowed disabled:opacity-40",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className={cn(
					"bg-background pointer-events-none block size-3 rounded-full ring-0 transition-transform duration-100 data-[state=checked]:translate-x-[calc(100%+2px)] data-[state=unchecked]:translate-x-0.5",
				)}
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
