import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"border-input placeholder:text-muted-foreground/60 flex field-sizing-content min-h-14 w-full rounded-md border bg-transparent px-2.5 py-2 text-[13px] outline-none transition-all duration-100 ease-out",
				"hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30",
				"aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30",
				"disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-input",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
