import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { ProBadge } from "@/components/saas/pro-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { InsertMonitor } from "@/modules/monitors/monitors.zod";

interface MonitorAdvancedOptionsProps {
	allowAdvancedMethods?: boolean;
	allowCustomHeaders?: boolean;
}

const HTTP_METHODS = [
	{ value: "GET", label: "GET" },
	{ value: "POST", label: "POST" },
	{ value: "PUT", label: "PUT" },
	{ value: "PATCH", label: "PATCH" },
	{ value: "DELETE", label: "DELETE" },
] as const;

const PROTOCOLS = [
	{ value: "TCP", label: "TCP" },
	{ value: "UDP", label: "UDP" },
] as const;

export function MonitorAdvancedOptions({
	allowAdvancedMethods = true,
	allowCustomHeaders = true,
}: MonitorAdvancedOptionsProps) {
	const form = useFormContext<InsertMonitor>();
	const type = useWatch({ control: form.control, name: "type" });

	// Local state for custom headers
	const [headersList, setHeadersList] = useState<
		{ key: string; value: string }[]
	>(
		Object.entries(form.getValues("config.headers") || {}).map(([k, v]) => ({
			key: k,
			value: v,
		})),
	);

	// Sync headers to form
	useEffect(() => {
		const headersRecord: Record<string, string> = {};
		headersList.forEach((h) => {
			if (h.key) headersRecord[h.key] = h.value;
		});
		form.setValue("config.headers", headersRecord);
	}, [headersList, form]);

	const appendHeader = () =>
		setHeadersList([...headersList, { key: "", value: "" }]);

	const removeHeader = (index: number) => {
		const newList = [...headersList];
		newList.splice(index, 1);
		setHeadersList(newList);
	};

	const updateHeader = (index: number, field: "key" | "value", val: string) => {
		const newList = [...headersList];
		newList[index][field] = val;
		setHeadersList(newList);
	};

	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			{/* Common: Name Field */}
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Monitor Name</FormLabel>
						<FormControl>
							<Input {...field} placeholder="e.g. Production API" />
						</FormControl>
						<FormDescription>
							A friendly name to identify this monitor
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Common: Timeout Field */}
			<FormField
				control={form.control}
				name="timeout"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Timeout (seconds)</FormLabel>
						<FormControl>
							<Input
								type="number"
								min={1}
								max={60}
								{...field}
								value={field.value as number}
								onChange={(e) => field.onChange(Number(e.target.value))}
								className="max-w-32"
							/>
						</FormControl>
						<FormDescription>
							Maximum time to wait for a response
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* HTTP-specific Options */}
			{type === "http" && (
				<div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
					{/* Request Method */}
					<FormField
						control={form.control}
						name="config.method"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="flex items-center gap-2">
									Request Method
									{!allowAdvancedMethods && <ProBadge />}
								</FormLabel>
								<Select
									value={field.value ?? "GET"}
									onValueChange={field.onChange}
									disabled={!allowAdvancedMethods}
								>
									<FormControl>
										<SelectTrigger size="sm" className="w-32">
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{HTTP_METHODS.map((method) => (
											<SelectItem
												key={method.value}
												value={method.value}
												disabled={
													!allowAdvancedMethods && method.value !== "GET"
												}
											>
												{method.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Expected Status */}
					<FormField
						control={form.control}
						name="config.expectedStatus"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Expected Status Code</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value ?? "200"}
										placeholder="200 or 200-299 or 200,201"
										className="max-w-64 font-mono"
									/>
								</FormControl>
								<FormDescription>
									Use ranges (200-299) or comma-separated values (200,201)
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Follow Redirects */}
					<FormField
						control={form.control}
						name="config.followRedirects"
						render={({ field }) => (
							<FormItem className="flex items-start gap-3 space-y-0">
								<FormControl>
									<Checkbox
										checked={field.value ?? true}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel className="cursor-pointer">
										Follow Redirects
									</FormLabel>
									<FormDescription>
										Automatically follow HTTP redirects (301, 302, etc.)
									</FormDescription>
								</div>
							</FormItem>
						)}
					/>

					{/* Keywords */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="config.includesKeyword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Must Include</FormLabel>
									<FormControl>
										<Input
											{...field}
											value={field.value ?? ""}
											placeholder="e.g. OK, success"
										/>
									</FormControl>
									<FormDescription>Alert if missing</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="config.excludesKeyword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Must Exclude</FormLabel>
									<FormControl>
										<Input
											{...field}
											value={field.value ?? ""}
											placeholder="e.g. error, failed"
										/>
									</FormControl>
									<FormDescription>Alert if found</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* Custom Headers */}
					<div className="space-y-3">
						<span className="text-sm font-medium flex items-center gap-2">
							Custom Headers
							{!allowCustomHeaders && <ProBadge />}
						</span>

						{allowCustomHeaders ? (
							<div className="space-y-2">
								{headersList.map((header, index) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: stable list
										key={index}
										className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2"
									>
										<Input
											value={header.key}
											onChange={(e) =>
												updateHeader(index, "key", e.target.value)
											}
											placeholder="Header name"
										/>
										<Input
											value={header.value}
											onChange={(e) =>
												updateHeader(index, "value", e.target.value)
											}
											placeholder="Value"
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => removeHeader(index)}
										>
											<X className="w-4 h-4" />
										</Button>
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={appendHeader}
								>
									<Plus className="w-3 h-3 mr-2" /> Add Header
								</Button>
							</div>
						) : (
							<div className="h-16 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center text-sm text-muted-foreground">
								Upgrade to Pro to add custom headers
							</div>
						)}
					</div>
				</div>
			)}

			{/* TCP-specific Options */}
			{type === "tcp" && (
				<div className="animate-in fade-in slide-in-from-top-2 duration-300">
					<FormField
						control={form.control}
						name="config.protocol"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Protocol</FormLabel>
								<Select
									value={field.value ?? "TCP"}
									onValueChange={field.onChange}
								>
									<FormControl>
										<SelectTrigger size="sm" className="w-24">
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{PROTOCOLS.map((protocol) => (
											<SelectItem key={protocol.value} value={protocol.value}>
												{protocol.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>Protocol for the port check</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			)}

			{/* Ping has no extra options - could add packet count, etc. in the future */}
		</div>
	);
}
