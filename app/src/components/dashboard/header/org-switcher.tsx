import { CreateOrganizationDialog } from "@daveyplate/better-auth-ui";
import { Link } from "@tanstack/react-router";
import type { Organization } from "better-auth/plugins";
import { ArrowUpCircle, ChevronsUpDown, Plus, Settings } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth/auth-client";
import {
	useActiveOrganization,
	useListOrganizations,
} from "@/lib/auth/auth-hooks";
import { cn } from "@/lib/utils";

export function OrgSwitcher({ triggerProps }: { triggerProps?: any }) {
	// 1. Fetch Data
	const { data: organization, isPending: isLoadingOrg } =
		useActiveOrganization();
	const { data: organizations, isPending: isLoadingList } =
		useListOrganizations();

	// 2. Get Active Org
	const [activeOrg, setActiveOrg] = React.useState<Organization>(
		organization as any as Organization,
	);

	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	// Handle Switching
	const handleSwitchOrg = async (orgId: string) => {
		try {
			await authClient.organization.setActive({
				organizationId: orgId,
			});
			const selected = organizations?.find((o) => o.id === orgId);
			if (selected) setActiveOrg(selected);
		} catch (e) {
			console.error("Failed to switch org", e);
		}
	};

	useEffect(() => {
		setActiveOrg(organization as any as Organization);
	}, [organization]);

	const hasOrgs = organizations && organizations.length > 0;

	// FIX:
	const currentPlan = activeOrg?.metadata?.plan || "Free";

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						{...triggerProps}
						className={cn(
							"max-w-full flex flex-col items-start outline-none group disabled:opacity-50",
							triggerProps?.className,
						)}
						disabled={isLoadingList}
					>
						{hasOrgs && activeOrg && !isLoadingOrg ? (
							<div className="flex items-center justify-start min-w-0 gap-2 max-w-full">
								<div className="flex items-center justify-center size-6 shrink-0 rounded bg-frame-muted text-xs font-bold text-frame-accent overflow-hidden">
									{activeOrg.logo ? (
										<img
											src={activeOrg.logo}
											alt={activeOrg.name}
											className="h-full w-full object-cover"
										/>
									) : (
										activeOrg.name.charAt(0).toUpperCase()
									)}
								</div>

								<div className="text-start flex flex-col flex-1 leading-tight">
									<div className="h-4 flex items-center gap-1.5 max-w-full flex-1">
										<span className="truncate max-w-12 md:max-w-20 lg:max-w-28 text-sm font-bold tracking-tight text-frame-foreground transition-colors group-hover:text-frame-accent">
											{activeOrg.name}
										</span>
									</div>

									<span
										className={cn(
											"text-[10px] font-bold tracking-wider",
											currentPlan.toUpperCase() === "FREE"
												? "text-frame-foreground/70"
												: "text-premium",
										)}
									>
										{currentPlan}
									</span>
								</div>

								<ChevronsUpDown className="size-3 shrink-0 text-frame-foreground/50 transition-colors group-hover:text-frame-accent" />
							</div>
						) : (
							<div className="flex items-center gap-1.5">
								<span className="text-sm font-bold tracking-tight text-frame-foreground group-hover:text-frame-accent transition-colors">
									{isLoadingOrg ? (
										<Skeleton className="size-6 rounded bg-frame-foreground/30" />
									) : (
										"Create Team"
									)}
								</span>
								{!isLoadingOrg && (
									<Plus className="h-3 w-3 text-frame-foreground/40 group-hover:text-frame-accent" />
								)}
							</div>
						)}
					</button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					align="start"
					className="min-w-55 max-w-[calc(100vw-1rem)] bg-frame border-frame-muted text-frame-foreground rounded-xl p-1.5 shadow-xl"
				>
					<DropdownMenuLabel className="text-[10px] text-primary uppercase tracking-wider font-bold px-2 py-1.5">
						Switch Team
					</DropdownMenuLabel>

					{/* ORG LIST */}
					{organizations?.map((org) => (
						<DropdownMenuItem
							key={org.id}
							onClick={() => handleSwitchOrg(org.id)}
							className="focus:bg-frame-muted focus:text-frame-foreground cursor-pointer rounded-lg py-2.5 px-2"
						>
							<div className="flex items-center gap-2">
								<div className="flex items-center justify-center size-5 rounded bg-frame-muted text-xs font-bold text-frame-accent">
									{org.logo ? (
										<img
											src={org.logo}
											alt={org.name}
											className="w-full h-full object-cover rounded"
										/>
									) : (
										org.name.charAt(0).toUpperCase()
									)}
								</div>
								<span className="font-medium text-sm truncate max-w-38">
									{org.name}
								</span>
							</div>
							{activeOrg?.id === org.id && (
								<div className="ml-auto size-1.5 rounded-full bg-frame-accent" />
							)}
						</DropdownMenuItem>
					))}

					{/* SETTINGS BUTTON */}
					{activeOrg && (
						<>
							<DropdownMenuSeparator className="bg-frame-muted" />
							<DropdownMenuItem
								className="focus:bg-frame-muted text-premium focus:text-premium cursor-pointer rounded-lg py-2 px-2"
								asChild
							>
								<Link to="/plans">
									<ArrowUpCircle className="text-premium mr-2 h-3.5 w-3.5" />
									<span className="text-sm">Upgrade Plan</span>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="focus:bg-frame-muted focus:text-frame-foreground cursor-pointer rounded-lg py-2 px-2 text-frame-foreground/80"
								asChild
							>
								<Link to="/organization/settings">
									<Settings className="mr-2 h-3.5 w-3.5" />
									<span className="text-sm">Team Settings</span>
								</Link>
							</DropdownMenuItem>
						</>
					)}

					<DropdownMenuSeparator className="bg-frame-muted" />

					{/* CREATE NEW TEAM */}
					<DropdownMenuItem
						onClick={() => setIsCreateDialogOpen(true)}
						className="focus:bg-frame-muted focus:text-frame-foreground cursor-pointer rounded-lg text-primary py-2"
					>
						<Plus className="mr-2 h-3.5 w-3.5" /> New Team
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<CreateOrganizationDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
			/>
		</>
	);
}
