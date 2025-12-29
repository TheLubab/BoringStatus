import { Link } from "@tanstack/react-router";
import type { User } from "better-auth";
import { CreditCard, LogOut, Settings, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
	user,
	loading,
}: {
	user?: User;
	loading?: boolean;
}) {
	if (loading) {
		return (
			<div className="flex items-center gap-3 animate-pulse">
				<div className="size-7 bg-frame-foreground/10 rounded-full" />
			</div>
		);
	}

	if (!user) {
		return (
			<Link to="/auth/sign-in">
				<button
					className="text-[13px] font-medium text-frame-accent hover:underline transition-colors duration-100"
					type="button"
				>
					Sign In
				</button>
			</Link>
		);
	}

	const initials = user.name ? user.name.substring(0, 2).toUpperCase() : "U";

	return (
		<div className="flex items-center gap-3">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="relative outline-none transition-transform duration-100 active:scale-95 group"
					>
						<Avatar className="size-7 ring-1 ring-frame-foreground/10 group-hover:ring-frame-accent/50 transition-all duration-100">
							<AvatarImage src={user.image || undefined} />
							<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
								{initials}
							</AvatarFallback>
						</Avatar>
					</button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					className="w-52 bg-frame border-frame-muted/50 text-frame-foreground rounded-md shadow-lg p-1"
					align="end"
				>
					<div className="px-2 py-1.5 mb-0.5 flex items-center gap-2">
						<Avatar className="size-6 ring-1 ring-frame-foreground/10">
							<AvatarImage src={user.image || undefined} />
							<AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="overflow-hidden flex-1">
							<p className="text-[13px] font-semibold truncate leading-tight">
								{user.name}
							</p>
							<p className="text-[10px] text-frame-foreground/50 truncate font-mono leading-tight">
								{user.email}
							</p>
						</div>
					</div>

					<DropdownMenuSeparator className="bg-frame-muted/50 my-1" />

					<Link to="/organization/billing" className="w-full">
						<DropdownMenuItem className="focus:text-frame-foreground focus:bg-frame-muted/80 text-frame-foreground/70 cursor-pointer rounded-sm py-1.5 text-[13px] transition-colors duration-75">
							<CreditCard className="mr-1.5 size-3 text-frame-foreground/60" />
							Billing
						</DropdownMenuItem>
					</Link>

					{/* Settings Link using Provider Paths */}
					<Link to="/account/settings" className="w-full">
						<DropdownMenuItem className="focus:text-frame-foreground focus:bg-frame-muted/80 text-frame-foreground/70 cursor-pointer rounded-sm py-1.5 text-[13px] transition-colors duration-75">
							<Settings className="mr-1.5 size-3 text-frame-foreground/60" />
							Account Settings
						</DropdownMenuItem>
					</Link>

					<Link to="/organization/billing" className="w-full">
						<DropdownMenuItem className="focus:bg-frame-muted/80 focus:text-frame-foreground text-frame-foreground/70 cursor-pointer rounded-sm py-1.5 text-[13px] transition-colors duration-75">
							<Users className="mr-1.5 size-3 text-frame-foreground/60" />
							Team Settings
						</DropdownMenuItem>
					</Link>

					<DropdownMenuSeparator className="bg-frame-muted/50 my-1" />

					<Link to="/auth/sign-out" className="w-full">
						<DropdownMenuItem className="focus:text-frame-foreground text-frame-foreground/50 focus:bg-destructive/20 cursor-pointer rounded-sm py-1.5 text-[13px] transition-colors duration-75">
							<LogOut className="mr-1.5 size-3 text-frame-foreground/50" />
							Log out
						</DropdownMenuItem>
					</Link>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
