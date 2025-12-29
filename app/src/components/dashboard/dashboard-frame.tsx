import { cn } from "@/lib/utils";

interface DashboardFrameProps {
	header: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

export function DashboardFrame({
	header,
	children,
	className,
}: DashboardFrameProps) {
	return (
		<div
			className={cn(
				"flex h-screen w-full flex-col bg-frame overflow-hidden font-sans text-frame-foreground",
				className,
			)}
		>
			{header}
			<main className="flex-1 overflow-auto bg-background text-foreground rounded-t-4xl mx-2 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative">
				<div className="mx-auto w-full max-w-7xl px-6 py-8">{children}</div>
			</main>
		</div>
	);
}
