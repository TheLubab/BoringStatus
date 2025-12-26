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
			<div className="flex items-center gap-4 animate-pulse">
				<div className="size-9 bg-frame-foreground/10 rounded-full" />
			</div>
		);
	}

	if (!user) {
		return (
			<Link to="/auth/login">
				<button
					className="text-sm font-medium text-primary hover:underline"
					type="button"
				>
					Sign In
				</button>
			</Link>
		);
	}

	const initials = user.name ? user.name.substring(0, 2).toUpperCase() : "U";

	return (
		<div className="flex items-center gap-4">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="relative outline-none transition-transform active:scale-95 group"
					>
						<Avatar className="size-8 ring-2 ring-frame-foreground/10 group-hover:ring-frame-accent transition-all">
							<AvatarImage src={user.image || undefined} />
							<AvatarFallback className="bg-primary text-primary-foreground">
								{initials}
							</AvatarFallback>
						</Avatar>
					</button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					className="w-56 bg-frame border-frame-muted text-frame-foreground rounded-xl shadow-xl p-1.5"
					align="end"
				>
					<div className="px-2 py-2 mb-1 flex items-center gap-3">
						<Avatar className="size-8 ring-2 ring-frame-foreground/10 group-hover:ring-frame-accent transition-all">
							<AvatarImage src={user.image || undefined} />
							<AvatarFallback className="bg-primary text-primary-foreground">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="overflow-hidden">
							<p className="text-sm font-bold truncate">{user.name}</p>
							<p className="text-[10px] text-frame-foreground/50 truncate font-mono">
								{user.email}
							</p>
						</div>
					</div>

					<DropdownMenuSeparator className="bg-frame-muted" />

					<Link to="/organization/billing" className="w-full">
						<DropdownMenuItem className="focus:text-frame-foreground focus:bg-frame-muted text-frame-foreground/70 cursor-pointer rounded-lg">
							<CreditCard className="focus:text-frame-foreground mr-2 h-4 w-4 text-frame-foreground/70" />{" "}
							Billing
						</DropdownMenuItem>
					</Link>

					{/* Settings Link using Provider Paths */}
					<Link to="/account/settings" className="w-full">
						<DropdownMenuItem className="focus:text-frame-foreground focus:bg-frame-muted text-frame-foreground/70 cursor-pointer rounded-lg">
							<Settings className="mr-2 h-4 w-4 focus:text-frame-foreground text-frame-foreground/70" />{" "}
							Account Settings
						</DropdownMenuItem>
					</Link>

					<Link to="/organization/billing" className="w-full">
						<DropdownMenuItem className="focus:bg-frame-muted focus:text-frame-foreground text-frame-foreground/70 cursor-pointer rounded-lg">
							<Users className="mr-2 h-4 w-4 focus:text-frame-foreground text-frame-foreground/70" />{" "}
							Team Settings
						</DropdownMenuItem>
					</Link>

					<DropdownMenuSeparator className="bg-frame-muted" />

					<Link to="/auth/sign-out" className="w-full">
						<DropdownMenuItem className="focus:text-frame-foreground text-frame-foreground/60 focus:bg-destructive/20 cursor-pointer rounded-lg">
							<LogOut className="mr-2 h-4 w-4 focus:text-frame-foreground text-frame-foreground/60" />
							Log out
						</DropdownMenuItem>
					</Link>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
