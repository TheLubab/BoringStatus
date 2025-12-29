import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"flex h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-[13px] outline-none transition-all duration-100 ease-out",
				"placeholder:text-muted-foreground/60 file:border-0 file:bg-transparent file:text-xs file:font-medium",
				"hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30",
				"aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30",
				"disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-input",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
