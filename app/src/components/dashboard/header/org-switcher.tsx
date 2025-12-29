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
import { cn } from "@/lib/utils";
import { authClient } from "@/modules/auth/auth.client";
import {
	useActiveOrganization,
	useListOrganizations,
} from "@/modules/auth/auth.hooks";

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
							"max-w-full flex flex-col items-start outline-none group disabled:opacity-40 transition-all duration-100",
							triggerProps?.className,
						)}
						disabled={isLoadingList}
					>
						{hasOrgs && activeOrg && !isLoadingOrg ? (
							<div className="flex items-center justify-start min-w-0 gap-1.5 max-w-full">
								<div className="flex items-center justify-center size-5 shrink-0 rounded bg-frame-muted text-[10px] font-bold text-frame-accent overflow-hidden">
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

								<div className="text-start flex flex-col flex-1 leading-tight gap-px">
									<div className="h-3.5 flex items-center gap-1 max-w-full flex-1">
										<span className="truncate max-w-12 md:max-w-20 lg:max-w-28 text-[13px] font-semibold tracking-tight text-frame-foreground transition-colors duration-100 group-hover:text-frame-accent">
											{activeOrg.name}
										</span>
									</div>

									<span
										className={cn(
											"text-[9px] font-semibold tracking-wider uppercase",
											currentPlan.toUpperCase() === "FREE"
												? "text-frame-foreground/50"
												: "text-premium",
										)}
									>
										{currentPlan}
									</span>
								</div>

								<ChevronsUpDown className="size-2.5 shrink-0 text-frame-foreground/40 transition-colors duration-100 group-hover:text-frame-accent" />
							</div>
						) : (
							<div className="flex items-center gap-1">
								<span className="text-[13px] font-semibold tracking-tight text-frame-foreground group-hover:text-frame-accent transition-colors duration-100">
									{isLoadingOrg ? (
										<Skeleton className="size-5 rounded bg-frame-foreground/20" />
									) : (
										"Create Team"
									)}
								</span>
								{!isLoadingOrg && (
									<Plus className="size-2.5 text-frame-foreground/40 group-hover:text-frame-accent transition-colors duration-100" />
								)}
							</div>
						)}
					</button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					align="start"
					className="min-w-52 max-w-[calc(100vw-1rem)] bg-frame border-frame-muted/50 text-frame-foreground rounded-md p-1 shadow-lg"
				>
					<DropdownMenuLabel className="text-[9px] text-frame-accent uppercase tracking-wider font-semibold px-2 py-1">
						Switch Team
					</DropdownMenuLabel>

					{/* ORG LIST */}
					{organizations?.map((org) => (
						<DropdownMenuItem
							key={org.id}
							onClick={() => handleSwitchOrg(org.id)}
							className="focus:bg-frame-muted/80 focus:text-frame-foreground cursor-pointer rounded-sm py-1.5 px-2 transition-colors duration-75"
						>
							<div className="flex items-center gap-1.5">
								<div className="flex items-center justify-center size-4 rounded bg-frame-muted text-[9px] font-semibold text-frame-accent">
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
								<span className="font-medium text-[13px] truncate max-w-36">
									{org.name}
								</span>
							</div>
							{activeOrg?.id === org.id && (
								<div className="ml-auto size-1 rounded-full bg-frame-accent" />
							)}
						</DropdownMenuItem>
					))}

					{/* SETTINGS BUTTON */}
					{activeOrg && (
						<>
							<DropdownMenuSeparator className="bg-frame-muted/50 my-1" />
							<DropdownMenuItem
								className="focus:bg-frame-muted/80 text-premium focus:text-premium cursor-pointer rounded-sm py-1.5 px-2 transition-colors duration-75"
								asChild
							>
								<Link to="/plans">
									<ArrowUpCircle className="text-premium mr-1.5 size-3" />
									<span className="text-[13px]">Upgrade Plan</span>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="focus:bg-frame-muted/80 focus:text-frame-foreground cursor-pointer rounded-sm py-1.5 px-2 text-frame-foreground/70 transition-colors duration-75"
								asChild
							>
								<Link to="/organization/settings">
									<Settings className="mr-1.5 size-3" />
									<span className="text-[13px]">Team Settings</span>
								</Link>
							</DropdownMenuItem>
						</>
					)}

					<DropdownMenuSeparator className="bg-frame-muted/50 my-1" />

					{/* CREATE NEW TEAM */}
					<DropdownMenuItem
						onClick={() => setIsCreateDialogOpen(true)}
						className="focus:bg-frame-muted/80 focus:text-frame-foreground cursor-pointer rounded-sm text-frame-accent py-1.5 transition-colors duration-75"
					>
						<Plus className="mr-1.5 size-3" />
						<span className="text-[13px] font-medium">New Team</span>
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
