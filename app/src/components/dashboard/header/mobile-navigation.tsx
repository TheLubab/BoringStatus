import { Link } from "@tanstack/react-router";
import { Activity, Megaphone, PanelTop, Webhook } from "lucide-react";

const NAV_ITEMS = [
	{ label: "Monitors", href: "/monitors", icon: Activity },
	{ label: "Incidents", href: "/incidents", icon: Megaphone },
	{ label: "Status Pages", href: "/status-pages", icon: PanelTop },
	{ label: "Integrations", href: "/integrations", icon: Webhook },
];

export function MobileNavigation() {
	return (
		<div className="flex h-full flex-col">
			<div className="border-b border-frame-foreground/5 px-4 py-3">
				<h2 className="text-sm font-semibold">Navigation</h2>
			</div>

			<nav className="flex flex-col gap-1 p-2">
				{NAV_ITEMS.map((item) => (
					<Link
						key={item.href}
						to={item.href}
						className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition hover:bg-frame-foreground/5"
						activeProps={{
							className: "bg-primary/10 font-bold"
						}}
					>
						<item.icon className="size-4" />
						{item.label}
					</Link>
				))}
			</nav>
		</div>
	);
}
