import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"flex h-11 w-full min-w-0 rounded-xl border-2 border-input bg-background px-4 py-2 text-base shadow-sm outline-none transition-all",
				"placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm",
				"focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20",
				"aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:focus-visible:ring-destructive/20",
				"disabled:cursor-not-allowed disabled:opacity-50",
				className
			)}
			{...props}
		/>
	)
}

export { Input }
