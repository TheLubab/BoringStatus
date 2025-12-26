import {
	Activity,
	Globe,
	Lock,
	Plus,
	Server,
	Settings2,
	Trash2,
} from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { ProBadge } from "@/components/saas/pro-badge";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/radio-card";
import { RichRadioItem } from "@/components/ui/radio-item-rich";
import { Separator } from "@/components/ui/separator";
import type { MonitorFormValues } from "@/db/zod";
import { cn } from "@/lib/utils";

interface MonitorStepGeneralProps {
	allowHighFrequency?: boolean;
	allowAdvancedMethods?: boolean;
	allowCustomHeaders?: boolean;
	allowCustomStatus?: boolean;
	usageLabel?: React.ReactNode;
}

export function MonitorStepGeneral({
	allowHighFrequency = false,
	allowAdvancedMethods = false,
	allowCustomStatus = false,
	allowCustomHeaders = false,
	usageLabel,
}: MonitorStepGeneralProps) {
	const form = useFormContext<MonitorFormValues>();

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "headers",
		rules: {
			maxLength: 10,
		},
	});

	const type = useWatch({ control: form.control, name: "type" });

	const currentStatus = useWatch({
		control: form.control,
		name: "expectedStatus",
	});

	const target = useWatch({
		control: form.control,
		name: "target",
	});

	const port = useWatch({
		control: form.control,
		name: "port",
	});

	useEffect(() => {
		form.setValue("name", target + (type === "tcp" ? `:${port}` : ""), {
			shouldDirty: true,
		});
	}, [target, port, type, form.setValue]);

	const isCustomStatus = currentStatus !== "200-299" && currentStatus !== "200";

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
			{/* SECTION 1: TYPE SELECTION */}
			<div className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<RadioCard
						value="http"
						label="Website"
						description="HTTP / HTTPS"
						icon={<Globe className="w-6 h-6" />}
						selectedValue={type}
						onChange={(val) =>
							form.setValue("type", val as "http" | "ping" | "tcp")
						}
					/>
					<RadioCard
						value="ping"
						label="Ping"
						description="ICMP / Hostname"
						icon={<Activity className="w-6 h-6" />}
						selectedValue={type}
						onChange={(val) =>
							form.setValue("type", val as "http" | "ping" | "tcp")
						}
					/>
					<RadioCard
						value="tcp"
						label="Port"
						description="TCP / UDP"
						icon={<Server className="w-6 h-6" />}
						selectedValue={type}
						onChange={(val) =>
							form.setValue("type", val as "http" | "ping" | "tcp")
						}
					/>
				</div>
			</div>

			<Separator className="bg-border/60" />

			{/* SECTION 2: TARGET & IDENTITY */}
			<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
				<div
					className={cn("md:col-span-12", type === "tcp" && "md:col-span-9")}
				>
					<FormField
						control={form.control}
						name="target"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-foreground font-medium">
									{type === "http" ? "Website URL" : "Hostname or IP"}
								</FormLabel>
								<FormControl>
									<Input
										value={field.value}
										onChange={(e) => {
											const value = e.target.value;
											let processedUrl = value;

											if (
												type === "http" &&
												value &&
												!value.startsWith("http") &&
												!value.startsWith("https")
											) {
												if (value.includes(".")) {
													processedUrl = `https://${value}`;
												}
											}

											field.onChange(processedUrl);
										}}
										onBlur={field.onBlur}
										name={field.name}
										ref={field.ref}
										placeholder={
											type === "http" ? "https://example.com" : "192.168.1.1"
										}
										className="pl-4 h-11 text-base shadow-sm focus-visible:ring-primary"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Port Input (TCP Only) */}
				{type === "tcp" && (
					<div className="md:col-span-3">
						<FormField
							control={form.control}
							name="port"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Port</FormLabel>
									<FormControl>
										<Input
											{...field}
											value={field.value ?? undefined}
											placeholder="443"
											className="h-11 font-mono"
											type="number"
											min={1}
											max={65535}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				)}
			</div>

			{/* FREQUENCY */}
			<div className="space-y-4 pt-2">
				<h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
					<Activity className="w-4 h-4 text-muted-foreground" /> Check Frequency
				</h3>
				<div className="space-y-1 max-w-64">
					<FormField
						control={form.control}
						name="frequency"
						render={({ field }) => (
							<>
								<RichRadioItem
									title="10 minutes"
									checked={field.value === 600}
									onChange={() => field.onChange(600)}
								/>
								<RichRadioItem
									title="5 minutes"
									badge={<ProBadge showLock={!allowHighFrequency} />}
									checked={field.value === 300}
									onChange={() => field.onChange(300)}
									disabled={!allowHighFrequency}
								/>
								<RichRadioItem
									title="1 minute"
									badge={<ProBadge showLock={!allowHighFrequency} />}
									checked={field.value === 60}
									onChange={() => field.onChange(60)}
									disabled={!allowHighFrequency}
								/>
							</>
						)}
					/>
				</div>
			</div>

			{/* SECTION 4: ADVANCED */}
			<Accordion
				type="single"
				collapsible
				className="w-full bg-muted/30 rounded-lg px-4 border"
			>
				<AccordionItem value="advanced" className="border-0">
					<AccordionTrigger className="hover:no-underline py-4 group">
						<div className=" flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
							<Settings2 className="w-4 h-4" />
							<span>Advanced Options</span>
						</div>
					</AccordionTrigger>
					<AccordionContent className="pb-6 pt-0">
						<div className="pt-2 pb-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center justify-between">
											<span>Display Name</span>
											<span className="text-xs text-muted-foreground font-normal">
												Optional
											</span>
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="e.g. Production API"
												className="h-10"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						{/* HTTP ADVANCED */}
						{type === "http" && (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
								<div className="space-y-2">
									<FormField
										control={form.control}
										name="method"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs font-semibold text-muted-foreground">
													Request Method
												</FormLabel>
												<div className="relative">
													<FormControl>
														<select
															{...field}
															value={field.value ?? undefined}
															className="w-full h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
															disabled={!allowAdvancedMethods}
														>
															<option value="GET">GET</option>
															<option
																value="POST"
																disabled={!allowAdvancedMethods}
															>
																POST (Pro)
															</option>
															<option
																value="PUT"
																disabled={!allowAdvancedMethods}
															>
																PUT (Pro)
															</option>
														</select>
													</FormControl>
													{!allowAdvancedMethods && (
														<Lock className="absolute right-8 top-2.5 w-3 h-3 text-muted-foreground" />
													)}
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="space-y-2">
									<FormField
										control={form.control}
										name="expectedStatus"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs font-semibold text-muted-foreground flex justify-between">
													<span>Expected Status</span>
													<ProBadge showLock={!allowCustomStatus} />
												</FormLabel>
												<div className="space-y-2">
													<FormControl>
														<select
															className={cn(
																"w-full h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
																!allowCustomStatus &&
																"opacity-50 cursor-not-allowed bg-muted",
															)}
															disabled={!allowCustomStatus}
															value={
																isCustomStatus
																	? "custom"
																	: field.value || "200-299"
															}
															onChange={(e) => {
																const val = e.target.value;
																if (val === "custom") {
																	field.onChange("");
																} else {
																	field.onChange(val);
																}
															}}
														>
															<option value="200-299">
																200-299 (Any Success)
															</option>
															<option value="200">200 (OK)</option>
															<option value="custom">Custom...</option>
														</select>
													</FormControl>

													{(isCustomStatus ||
														(allowCustomStatus && field.value === "")) && (
															<FormControl>
																<Input
																	{...field}
																	value={field.value || ""}
																	className="h-9 font-mono animate-in fade-in slide-in-from-top-1"
																	placeholder="e.g. 200, 201, 204"
																/>
															</FormControl>
														)}
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="space-y-2 sm:col-span-2">
									<span className="text-xs font-semibold text-muted-foreground flex gap-2">
										Custom Headers {!allowCustomHeaders && <ProBadge />}
									</span>
									{allowCustomHeaders ? (
										<div className="space-y-2">
											{fields.map((field, index) => (
												<div
													key={field.id}
													className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2"
												>
													<FormField
														control={form.control}
														name={`headers.${index}.key`}
														render={({ field }) => (
															<Input
																{...field}
																placeholder="Key"
																className="h-9 font-mono text-xs flex-1"
															/>
														)}
													/>
													<span className="text-muted-foreground">:</span>
													<FormField
														control={form.control}
														name={`headers.${index}.value`}
														render={({ field }) => (
															<Input
																{...field}
																placeholder="Value"
																className="h-9 font-mono text-xs flex-1"
															/>
														)}
													/>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
														onClick={() => remove(index)}
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											))}
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => append({ key: "", value: "" })}
												className="w-full border-dashed text-xs h-8"
											>
												<Plus className="w-3 h-3 mr-2" /> Add Header
											</Button>
										</div>
									) : (
										<div className="h-20 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center text-xs text-muted-foreground cursor-not-allowed">
											Upgrade to unlock Authorization headers
										</div>
									)}
								</div>

								<div className="space-y-2">
									<FormField
										control={form.control}
										name="keyword_found"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs font-semibold text-muted-foreground">
													Keyword Found (Body)
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														value={field.value || ""}
														placeholder="e.g. System Normal"
														className="h-9 font-mono text-xs"
													/>
												</FormControl>
												<FormMessage />
												<p className="text-[11px] text-muted-foreground">
													Alert if this text is missing from the response body.
												</p>
											</FormItem>
										)}
									/>
								</div>

								<div className="space-y-2">
									<FormField
										control={form.control}
										name="keyword_missing"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs font-semibold text-muted-foreground">
													Keyword Missing (Body)
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														value={field.value || ""}
														placeholder="e.g. Critical Error"
														className="h-9 font-mono text-xs"
													/>
												</FormControl>
												<FormMessage />
												<p className="text-[11px] text-muted-foreground">
													Alert if this text is present in the response body.
												</p>
											</FormItem>
										)}
									/>
								</div>
							</div>
						)}

						{/* PING/TCP ADVANCED */}
						{(type === "ping" || type === "tcp") && (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
								<div className="space-y-2">
									<span className="text-xs font-semibold text-muted-foreground">
										Timeout (seconds)
									</span>
									<FormField
										control={form.control}
										name="timeout"
										render={({ field }) => (
											<Input
												type="number"
												{...field}
												value={field.value as number}
												onChange={(e) => field.onChange(Number(e.target.value))}
												className="h-9"
											/>
										)}
									/>
								</div>
								<div className="space-y-2">
									<span className="text-xs font-semibold text-muted-foreground">
										Max Retries
									</span>
									<FormField
										control={form.control}
										name="retries"
										render={({ field }) => (
											<Input
												type="number"
												{...field}
												value={field.value as number}
												onChange={(e) => field.onChange(Number(e.target.value))}
												className="h-9"
											/>
										)}
									/>
								</div>
							</div>
						)}
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			{/* Footer Usage Text */}
			{usageLabel && (
				<p className="text-center text-xs text-muted-foreground mt-4">
					{usageLabel}
				</p>
			)}
		</div>
	);
}
