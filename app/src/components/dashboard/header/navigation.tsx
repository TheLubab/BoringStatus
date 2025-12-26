import { Link } from "@tanstack/react-router";
import { Activity, Megaphone, PanelTop, Webhook } from "lucide-react";

const NAV_ITEMS = [
	{ label: "Monitors", href: "/monitors", icon: Activity },
	{ label: "Incidents", href: "/incidents", icon: Megaphone },
	{ label: "Status Pages", href: "/status-pages", icon: PanelTop },
	{ label: "Integrations", href: "/integrations", icon: Webhook },
];

export function Navigation() {
	return (
		<nav className="shrink-0 hidden md:flex items-center gap-1 bg-frame-muted/50 rounded-full p-1 border border-frame-foreground/5 backdrop-blur-md">
			{NAV_ITEMS.map((item) => (
				<Link
					key={item.href}
					to={item.href}
					className="group flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium  transition-all"
					activeProps={{
						className: "bg-primary text-primary-foreground font-bold",
					}}
					inactiveProps={{
						className:
							"text-frame-foreground/60 hover:text-frame-foreground   hover:bg-frame-foreground/5",
					}}
				>
					<item.icon className="size-4" />
					{item.label}
				</Link>
			))}
		</nav>
	);
}
