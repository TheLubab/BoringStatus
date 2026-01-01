import {
	AlertTriangleIcon,
	CheckIcon,
	InfoIcon,
	Loader2Icon,
	XIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			position="bottom-right"
			gap={8}
			offset={16}
			icons={{
				success: <CheckIcon className="size-3.5" strokeWidth={2.5} />,
				info: <InfoIcon className="size-3.5" strokeWidth={2} />,
				warning: <AlertTriangleIcon className="size-3.5" strokeWidth={2} />,
				error: <XIcon className="size-3.5" strokeWidth={2.5} />,
				loading: (
					<Loader2Icon className="size-3.5 animate-spin" strokeWidth={2} />
				),
			}}
			toastOptions={{
				unstyled: false,
				classNames: {
					toast:
						"group toast !bg-card !border-border/80 !shadow-none !rounded-md !px-3 !py-2.5 !gap-2.5 !items-start",
					title: "!text-[13px] !font-medium !leading-tight !tracking-[-0.01em]",
					description:
						"!text-[12px] !text-muted-foreground !leading-snug !mt-0.5 font-mono !tracking-[-0.01em]",
					actionButton:
						"!bg-primary !text-primary-foreground !text-[12px] !font-medium !h-7 !px-2.5 !rounded-sm",
					cancelButton:
						"!bg-transparent !text-muted-foreground hover:!text-foreground !text-[12px] !font-medium !h-7 !px-2",
					closeButton:
						"!bg-transparent !border-0 !text-muted-foreground hover:!text-foreground !size-5 !-top-1.5 !-right-1.5",
					icon: "!mt-0.5 !mr-0",
					success: "!text-primary [&>[data-icon]]:!text-primary",
					error: "!text-destructive [&>[data-icon]]:!text-destructive",
					warning: "!text-amber-600 [&>[data-icon]]:!text-amber-600",
					info: "[&>[data-icon]]:!text-muted-foreground",
				},
			}}
			style={
				{
					"--normal-bg": "var(--card)",
					"--normal-text": "var(--foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
					"--width": "340px",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
