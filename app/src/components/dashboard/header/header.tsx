import type { User } from "better-auth";
import { Menu } from "lucide-react";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { BrandLogo } from "./brand-logo";
import { MobileNavigation } from "./mobile-navigation";
import { Navigation } from "./navigation";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";

export function DashboardHeader({
	user,
	loading,
}: {
	user?: User;
	loading?: boolean;
}) {
	return (
		<header className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 md:px-6 border-b border-frame-foreground/5">
			<div className="flex items-center gap-3 overflow-hidden">
				<BrandLogo />
				<svg
					strokeLinejoin="round"
					viewBox="0 0 16 16"
					height="16"
					width="16"
					className="hidden sm:flex text-frame-foreground/30"
				>
					<title>/</title>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M4.01526 15.3939L4.3107 14.7046L10.3107 0.704556L10.6061 0.0151978L11.9849 0.606077L11.6894 1.29544L5.68942 15.2954L5.39398 15.9848L4.01526 15.3939Z"
						fill="currentColor"
					></path>
				</svg>
				<OrgSwitcher />
			</div>

			<div className="flex justify-center">
				<Navigation />
			</div>

			<div className="justify-end flex items-center gap-2">
				<UserMenu user={user} loading={loading} />

				<Drawer>
					<DrawerTrigger asChild>
						<button
							className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-frame-foreground/5"
							aria-label="Toggle menu"
							type="button"
						>
							<Menu className="size-5" />
						</button>
					</DrawerTrigger>

					<DrawerContent>
						<MobileNavigation />

						<DrawerFooter>
							<DrawerClose>Close</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
			</div>
		</header>
	);
}
