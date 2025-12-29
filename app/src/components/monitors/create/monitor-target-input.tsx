import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { InsertMonitor } from "@/modules/monitors/monitors.zod";

export function MonitorTargetInput() {
	const form = useFormContext<InsertMonitor>();

	const type = useWatch({ control: form.control, name: "type" });
	const target = useWatch({ control: form.control, name: "target" });
	const port = useWatch({ control: form.control, name: "config.port" });

	// Auto-generate name from target
	useEffect(() => {
		form.setValue("name", target + (type === "tcp" ? `:${port || 0}` : ""), {
			shouldDirty: true,
		});
	}, [target, port, type, form.setValue]);

	// Auto-detect protocol based on port
	useEffect(() => {
		if (type === "tcp" && port) {
			const udpPorts = [53, 67, 68, 69, 123, 161, 162, 514, 500, 4500];
			if (udpPorts.includes(Number(port))) {
				form.setValue("config.protocol", "UDP");
			} else {
				form.setValue("config.protocol", "TCP");
			}
		}
	}, [port, type, form.setValue]);

	return (
		<div className="animate-in fade-in duration-300">
			<div className={cn("grid gap-4", type === "tcp" && "grid-cols-12")}>
				{/* Target Field */}
				<div className={cn(type === "tcp" ? "col-span-9" : "col-span-12")}>
					<FormField
						control={form.control}
						name="target"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{type === "http" ? "Website URL" : "Hostname or IP"}
								</FormLabel>
								<FormControl>
									<Input
										value={field.value}
										onChange={(e) => {
											const value = e.target.value;
											let processedUrl = value;

											// Auto-prepend https:// for HTTP monitors
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
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Port Field (TCP Only) */}
				{type === "tcp" && (
					<div className="col-span-3">
						<FormField
							control={form.control}
							name="config.port"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Port</FormLabel>
									<FormControl>
										<Input
											{...field}
											value={field.value ?? ""}
											placeholder="443"
											className="font-mono"
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
		</div>
	);
}
