import type * as React from "react";

import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
	return (
		<div data-slot="table-container" className="relative w-full">
			<table
				data-slot="table"
				className={cn("w-full caption-bottom text-sm table-fixed", className)}
				{...props}
			/>
		</div>
	);
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
	return (
		<thead
			data-slot="table-header"
			className={cn("[&_tr]:border-b [&_tr]:border-border/50", className)}
			{...props}
		/>
	);
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
	return (
		<tbody
			data-slot="table-body"
			className={cn("[&_tr:last-child]:border-0", className)}
			{...props}
		/>
	);
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
	return (
		<tfoot
			data-slot="table-footer"
			className={cn(
				"bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
				className,
			)}
			{...props}
		/>
	);
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
	return (
		<tr
			data-slot="table-row"
			className={cn(
				"border-b border-border/20 transition-all duration-100",
				"hover:bg-primary/4",
				"data-[state=selected]:bg-muted",
				"odd:bg-transparent even:bg-muted/1.5",
				className,
			)}
			{...props}
		/>
	);
}

function TableHeadRow({ className, ...props }: React.ComponentProps<"tr">) {
	return (
		<tr
			data-slot="table-head-row"
			className={cn(
				"hover:bg-transparent border-b border-border/50 bg-muted/3",
				className,
			)}
			{...props}
		/>
	);
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
	return (
		<th
			data-slot="table-head"
			className={cn(
				// Dense, technical header styling
				"px-3 h-8 text-left align-middle whitespace-nowrap",
				"text-[10px] font-mono font-medium uppercase tracking-wider",
				"text-muted-foreground/70",
				// Checkbox handling
				"[&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
				className,
			)}
			{...props}
		/>
	);
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
	return (
		<td
			data-slot="table-cell"
			className={cn(
				// Consistent padding
				"px-3 py-2 align-middle whitespace-nowrap",
				// Checkbox handling
				"[&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
				className,
			)}
			{...props}
		/>
	);
}

function TableCaption({
	className,
	...props
}: React.ComponentProps<"caption">) {
	return (
		<caption
			data-slot="table-caption"
			className={cn("text-muted-foreground mt-4 text-sm", className)}
			{...props}
		/>
	);
}

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableHeadRow,
	TableRow,
	TableCell,
	TableCaption,
};
