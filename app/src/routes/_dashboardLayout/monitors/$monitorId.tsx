import React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { authMiddleware } from "@/lib/auth/auth-middleware";
import {
	ArrowLeft,
	Activity,
	CheckCircle2,
	XCircle,
	AlertTriangle,
	Clock,
	Globe,
	PauseCircle,
	PlayCircle,
	Trash2,
	MoreVertical,
	ExternalLink,
	History,
	Settings
} from "lucide-react";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
	getMonitorDetails,
	deleteMonitor,
	toggleMonitorActive
} from "@/functions/monitor";
import { MonitorEditForm } from "@/components/monitors/edit/monitor-edit-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// 1. ROUTE DEFINITION
// ----------------------------------------------------------------------
export const Route = createFileRoute("/_dashboardLayout/monitors/$monitorId")({
	component: MonitorDetailsPage,
	server: {
		middleware: [authMiddleware],
	},
});

// ----------------------------------------------------------------------
// 3. PAGE COMPONENT
// ----------------------------------------------------------------------
function MonitorDetailsPage() {
	const { monitorId } = Route.useParams();
	const router = useRouter();

	// 1. Fetch Real Data
	const { data } = useSuspenseQuery({
		queryKey: ["monitor", monitorId],
		queryFn: () => getMonitorDetails({ data: { monitorId } }),
	});

	const { monitor, chart, recentChecks, stats, connectedValue } = data;

	const isActive = monitor.active;

	// Actions
	const handleToggleActive = async () => {
		try {
			await toggleMonitorActive({
				data: { monitorId: monitor.id, active: !isActive }
			});
			toast.success(isActive ? "Monitor paused" : "Monitor resumed");
			router.invalidate();
		} catch (e) {
			toast.error("Failed to update status");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteMonitor({ data: { monitorId: monitor.id } });
			toast.success("Monitor deleted");
			router.navigate({ to: "/monitors" });
		} catch (e) {
			toast.error("Failed to delete monitor");
		}
	};

	return (
		<div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">

			{/* --- HEADER --- */}
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b pb-6">
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Link to="/monitors" className="hover:text-foreground flex items-center gap-1 transition-colors">
							<ArrowLeft className="h-4 w-4" /> Monitors
						</Link>
						<span>/</span>
						<span>Details</span>
					</div>

					<div className="flex items-center gap-4 flex-wrap">
						<h1 className="text-3xl font-bold tracking-tight">{monitor.name}</h1>
						<StatusBadge status={monitor.status || "pending"} />
						{!isActive && (
							<Badge variant="secondary" className="text-muted-foreground">
								Paused
							</Badge>
						)}
					</div>

					<div className="flex items-center gap-6 text-sm">
						{monitor.type === "http" && (
							<a
								href={monitor.target}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
							>
								<Globe className="h-4 w-4" />
								{monitor.target}
								<ExternalLink className="h-3 w-3" />
							</a>
						)}
						<span className="flex items-center gap-1.5 text-muted-foreground">
							<Activity className="h-4 w-4" />
							Check every {monitor.frequency / 60} min
						</span>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						onClick={handleToggleActive}
						className={cn(isActive ? "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200" : "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200")}
					>
						{isActive ? (
							<>
								<PauseCircle className="mr-2 h-4 w-4" /> Pause Monitor
							</>
						) : (
							<>
								<PlayCircle className="mr-2 h-4 w-4" /> Resume Monitor
							</>
						)}
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleToggleActive}>
								{isActive ? "Pause Checking" : "Resume Checking"}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-700 focus:bg-red-50">
										<Trash2 className="mr-2 h-4 w-4" /> Delete Monitor
									</DropdownMenuItem>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
										<AlertDialogDescription>
											This action cannot be undone. This will permanently delete the monitor
											<strong> {monitor.name}</strong> and remove all its history.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* --- TABS --- */}
			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList className="bg-muted/50 p-1 border">
					<TabsTrigger value="overview" className="gap-2">
						<Activity className="w-4 h-4" /> Overview
					</TabsTrigger>
					<TabsTrigger value="configuration" className="gap-2">
						<Settings className="w-4 h-4" /> Configuration
					</TabsTrigger>
				</TabsList>

				{/* === OVERVIEW TAB === */}
				<TabsContent value="overview" className="space-y-6">

					{/* METRICS GRID */}
					<div className="grid gap-4 md:grid-cols-4">
						<StatsCard
							title="Current Status"
							value={(monitor.status || "pending").toUpperCase()}
							sub={recentChecks[0]?.time ? new Date(recentChecks[0].time).toLocaleString() : "Never"}
							icon={<StatusIcon status={monitor.status || "pending"} className="h-4 w-4" />}
						/>
						<StatsCard
							title="Avg. Latency"
							value={`${stats.avgLatency} ms`}
							sub="Last 24 hours"
							icon={<Clock className="h-4 w-4 text-blue-500" />}
						/>
						<StatsCard
							title="24h Uptime"
							value={`${stats.uptime24h}%`}
							sub="Target: 99.9%"
							icon={<Activity className="h-4 w-4 text-purple-500" />}
						/>
						<StatsCard
							title="30d Uptime"
							value={`${stats.uptime30d}%`}
							sub="Rolling window"
							icon={<Activity className="h-4 w-4 text-orange-500" />}
						/>
					</div>

					{/* MAIN CHART */}
					<Card>
						<CardHeader>
							<CardTitle>Response Time & Uptime</CardTitle>
							<CardDescription>
								Latency and availability over the last 24 hours
							</CardDescription>
						</CardHeader>
						<CardContent className="pl-0">
							<div className="h-[350px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={chart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
										<defs>
											<linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
												<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
										<XAxis
											dataKey="time"
											stroke="#888888"
											fontSize={12}
											tickLine={false}
											axisLine={false}
											minTickGap={30}
										/>
										<YAxis
											stroke="#888888"
											fontSize={12}
											tickLine={false}
											axisLine={false}
											tickFormatter={(value) => `${value}ms`}
											domain={[0, 'auto']}
										/>
										<Tooltip
											contentStyle={{
												backgroundColor: 'var(--background)',
												borderRadius: '8px',
												border: '1px solid var(--border)',
												boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
											}}
											itemStyle={{ color: 'var(--foreground)' }}
											formatter={(value: any) => [`${value}ms`, 'Latency']}
											labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}
										/>
										<Area
											type="monotone"
											dataKey="latency"
											stroke="#10b981"
											strokeWidth={2}
											fillOpacity={1}
											fill="url(#colorLatency)"
											activeDot={{ r: 6, strokeWidth: 0 }}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					{/* RECENT CHECKS */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div className="space-y-1">
								<CardTitle className="flex items-center gap-2">
									<History className="w-5 h-5 text-muted-foreground" />
									Recent Checks
								</CardTitle>
								<CardDescription>Latest heartbeat logs from our global runners</CardDescription>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-1">
								{recentChecks.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">No checks recorded yet.</div>
								) : (
									recentChecks.map((check, i) => (
										<div key={i} className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/30 px-2 rounded-md transition-colors">
											<div className="flex items-center gap-4">
												<div className={cn(
													"flex h-8 w-8 items-center justify-center rounded-full border",
													check.status === "up"
														? "bg-emerald-50 text-emerald-600 border-emerald-100"
														: "bg-red-50 text-red-600 border-red-100"
												)}>
													{check.status === "up" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
												</div>
												<div>
													<p className="text-sm font-medium flex items-center gap-2">
														<span className={check.status === "up" ? "text-emerald-700" : "text-red-700"}>
															{check.status.toUpperCase()}
														</span>
														{check.statusCode && (
															<Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
																{check.statusCode}
															</Badge>
														)}
													</p>
													<p className="text-xs text-muted-foreground">
														{new Date(check.time).toLocaleString()}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-6">
												{check.message && (
													<span className="text-xs text-muted-foreground max-w-[200px] truncate hidden md:inline-block" title={check.message}>
														{check.message}
													</span>
												)}
												<div className="text-sm font-mono text-muted-foreground w-16 text-right">
													{check.latency}ms
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>

				</TabsContent>

				{/* === CONFIGURATION TAB === */}
				<TabsContent value="configuration">
					<MonitorEditForm monitor={monitor} connectedChannelIds={connectedValue} />
				</TabsContent>
			</Tabs>

		</div>
	);
}

// --- SUBCOMPONENTS ---

function StatsCard({ title, value, sub, icon }: { title: string, value: string, sub: string, icon: React.ReactNode }) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				{icon}
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				<p className="text-xs text-muted-foreground mt-1">
					{sub}
				</p>
			</CardContent>
		</Card>
	)
}

function StatusBadge({ status }: { status: string }) {
	const styles = {
		up: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
		down: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
		maintenance: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
		pending: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
	};

	const icons = {
		up: <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />,
		down: <XCircle className="mr-1.5 h-3.5 w-3.5" />,
		maintenance: <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />,
		pending: <Activity className="mr-1.5 h-3.5 w-3.5" />,
	};

	const s = status as keyof typeof styles;

	return (
		<Badge variant="outline" className={`px-3 py-1 text-sm font-medium transition-colors ${styles[s] || styles.pending}`}>
			{icons[s] || icons.pending}
			{status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
		</Badge>
	);
}

function StatusIcon({ status, className }: { status: string, className?: string }) {
	if (status === 'up') return <CheckCircle2 className={cn("text-emerald-500", className)} />;
	if (status === 'down') return <XCircle className={cn("text-red-500", className)} />;
	if (status === 'maintenance') return <AlertTriangle className={cn("text-amber-500", className)} />;
	return <Activity className={cn("text-gray-500", className)} />;
}
