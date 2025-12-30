import { Plus, X } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
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
import type {
	InsertMonitor,
	MonitorType,
} from "@/modules/monitors/monitors.zod";
import { useEffect } from "react";

// - HTTP: dns, connect, ttfb, total, statusCode, tls, contentLength, includesKeyword, excludesKeyword
// - Ping: latency, jitter, packetLoss
// - TCP: connect, success

const METRICS = [
	// Common
	{
		value: "status",
		label: "Status",
		types: ["http", "ping", "tcp"] as MonitorType[],
		proOnly: false,
	},

	// HTTP metrics
	{
		value: "body",
		label: "Response Body",
		types: ["http"] as MonitorType[],
		proOnly: true,
	},
	{
		value: "response_time",
		label: "Response Time (ms)",
		types: ["http"] as MonitorType[],
		proOnly: false,
	},
	{
		value: "dns",
		label: "DNS Lookup Time (ms)",
		types: ["http"] as MonitorType[],
		proOnly: true,
	},
	{
		value: "ttfb",
		label: "Time to First Byte (ms)",
		types: ["http"] as MonitorType[],
		proOnly: true,
	},
	{
		value: "connect",
		label: "Connection Time (ms)",
		types: ["http", "tcp"] as MonitorType[],
		proOnly: true,
	},
	{
		value: "tls",
		label: "TLS Handshake Time (ms)",
		types: ["http"] as MonitorType[],
		proOnly: true,
	},

	// Ping metrics
	{
		value: "latency",
		label: "Latency (ms)",
		types: ["ping"] as MonitorType[],
		proOnly: false,
	},
	{
		value: "packet_loss",
		label: "Packet Loss %",
		types: ["ping"] as MonitorType[],
		proOnly: true,
	},
] as const;

const OPERATORS = [
	{ value: "eq", label: "is" },
	{ value: "neq", label: "is not" },
	{ value: "gt", label: "above" },
	{ value: "lt", label: "below" },
	{ value: "contains", label: "contains" },
	{ value: "not_contains", label: "not contains" },
] as const;

const STATUS_VALUES = [
	{ value: "up", label: "Up" },
	{ value: "down", label: "Down" },
] as const;

interface MonitorAlertRulesProps {
	maxRules?: number;
	allowAdvancedMetrics?: boolean;
	description?: string;
}

export function MonitorAlertRules({
	maxRules = 10,
	allowAdvancedMetrics = true,
	description = "Define conditions that will trigger an alert",
}: MonitorAlertRulesProps) {
	const form = useFormContext<InsertMonitor>();
	const type = useWatch({ control: form.control, name: "type" });
	const alertRules = useWatch({ control: form.control, name: "alertRules" });

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "alertRules",
	});

	useEffect(() => {
		form.setValue("config.includesKeyword", undefined);
		form.setValue("config.excludesKeyword", undefined);
		alertRules.forEach((v) => {
			if (v.metric === "body") {
				if (v.operator === "contains") {
					form.setValue("config.includesKeyword", v.value);
				} else if (v.operator === "not_contains") {
					form.setValue("config.excludesKeyword", v.value);
				}
			}
		});
	}, [alertRules, form.setValue]);

	const canAddMore = maxRules === undefined || fields.length < maxRules;

	const getValidOperators = (metric: string) => {
		// Status only supports equals/not equals
		if (metric === "status") {
			return OPERATORS.filter((op) => ["eq", "neq"].includes(op.value));
		}
		// Body uses contains/not_contains
		if (metric === "body") {
			return OPERATORS.filter((op) =>
				["contains", "not_contains"].includes(op.value),
			);
		}
		// All timing metrics and packet_loss use gt/lt for threshold comparison
		return OPERATORS.filter((op) => ["gt", "lt"].includes(op.value));
	};

	const getDefaultValue = (metric: string) => {
		if (metric === "status") return "up";
		if (metric === "response_time") return "1000"; // 1 second
		if (metric === "dns") return "100"; // 100ms
		if (metric === "ttfb") return "500"; // 500ms
		if (metric === "connect") return "200"; // 200ms
		if (metric === "tls") return "200"; // 200ms
		if (metric === "latency") return "100"; // 100ms
		if (metric === "packet_loss") return "10"; // 10%
		if (metric === "body") return "";
		return "100";
	};

	const getDefaultOperator = (metric: string) => {
		if (metric === "status") return "neq";
		if (metric === "body") return "contains";
		return "gt";
	};

	const getAvailableMetrics = () => {
		// Filter metrics by current monitor type
		const typeMetrics = METRICS.filter((m) =>
			m.types.includes(type as MonitorType),
		);

		// Mark Pro features as disabled if not allowed
		return typeMetrics.map((m) => ({
			...m,
			disabled: m.proOnly && !allowAdvancedMetrics,
			showPro: m.proOnly && !allowAdvancedMetrics,
		}));
	};

	const handleAddRule = () => {
		if (!canAddMore) return;

		append({
			metric: "status",
			operator: "neq",
			value: "up",
		});
	};

	return (
		<div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-500">
			<div className="flex items-center justify-between">
				<FormLabel>Alert Rules</FormLabel>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAddRule}
					disabled={!canAddMore}
				>
					<Plus className="w-3 h-3 mr-1" /> Add
				</Button>
			</div>

			<FormDescription>
				{description}
				{maxRules !== undefined && (
					<span className="text-muted-foreground"> (max {maxRules})</span>
				)}
			</FormDescription>

			{/* Show form-level error for alertRules */}
			<FormField
				control={form.control}
				name="alertRules"
				render={() => <FormMessage />}
			/>

			{fields.length === 0 ? (
				<div className="py-4 text-center text-sm text-muted-foreground animate-in fade-in">
					No alert rules configured
				</div>
			) : (
				<div className="space-y-4">
					{fields.map((field, index) => {
						const currentMetric = form.watch(`alertRules.${index}.metric`);
						const validOperators = getValidOperators(currentMetric);

						return (
							<div
								key={field.id}
								className="flex flex-col sm:flex-row gap-2 sm:items-center animate-in fade-in"
							>
								{/* Metric */}
								<FormField
									control={form.control}
									name={`alertRules.${index}.metric`}
									render={({ field }) => (
										<FormItem className="sm:w-36">
											<Select
												value={field.value}
												onValueChange={(value) => {
													field.onChange(value);
													form.setValue(
														`alertRules.${index}.operator`,
														getDefaultOperator(value),
														{ shouldValidate: true, shouldDirty: true },
													);
													form.setValue(
														`alertRules.${index}.value`,
														getDefaultValue(value),
														{ shouldValidate: true, shouldDirty: true },
													);
												}}
											>
												<FormControl>
													<SelectTrigger
														size="sm"
														className="max-w-full w-full min-w-full"
													>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{getAvailableMetrics().map((m) => (
														<SelectItem
															key={m.value}
															value={m.value}
															disabled={m.disabled}
														>
															{m.label}
															{m.showPro && (
																<span className="ml-1 text-xs text-muted-foreground">
																	(Pro)
																</span>
															)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Operator */}
								<FormField
									control={form.control}
									name={`alertRules.${index}.operator`}
									render={({ field }) => (
										<FormItem className="sm:w-32">
											<Select
												key={`${index}-${currentMetric}-operator`}
												value={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger size="sm" className="w-full">
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{validOperators.map((op) => (
														<SelectItem key={op.value} value={op.value}>
															{op.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Value */}
								<FormField
									control={form.control}
									name={`alertRules.${index}.value`}
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												{currentMetric === "status" ? (
													<Select
														value={field.value}
														onValueChange={field.onChange}
													>
														<SelectTrigger size="sm" className="w-full">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{STATUS_VALUES.map((s) => (
																<SelectItem key={s.value} value={s.value}>
																	{s.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												) : currentMetric === "body" ? (
													<Input
														{...field}
														type="text"
														placeholder="keyword to search..."
														className="h-8 text-sm"
													/>
												) : currentMetric === "packet_loss" ? (
													<Input
														{...field}
														type="number"
														min={0}
														max={100}
														placeholder="%"
														className="h-8 font-mono text-sm"
													/>
												) : (
													// All timing metrics (response_time, dns, ttfb, connect, tls, latency)
													<Input
														{...field}
														type="number"
														min={1}
														max={60000}
														placeholder="ms"
														className="h-8 font-mono text-sm"
													/>
												)}
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Remove */}
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-8 w-8 self-end sm:self-auto"
									onClick={() => remove(index)}
								>
									<X className="w-3.5 h-3.5" />
								</Button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
