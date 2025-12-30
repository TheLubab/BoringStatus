import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createMonitor } from "@/modules/monitors/monitors.api";
import {
	type InsertMonitor,
	insertMonitorSchema,
} from "@/modules/monitors/monitors.zod";

import { MonitorAdvancedOptions } from "./monitor-advanced-options";
import { MonitorAlertRules } from "./monitor-alert-rules";
import { MonitorSelectChannels } from "./monitor-select-channels";
import { MonitorSelectFrequency } from "./monitor-select-frequency";
import { MonitorSelectType } from "./monitor-select-type";
import { MonitorSuccess } from "./monitor-success";
import { MonitorTargetInput } from "./monitor-target-input";

interface MonitorNewProps {
	onComplete?: (data: InsertMonitor) => void;
	className?: string;
	allowHighFrequency?: boolean;
	allowAdvancedMethods?: boolean;
	allowCustomHeaders?: boolean;
	maxAlertRules?: number;
	allowAdvancedMetrics?: boolean;
}

export function MonitorNew({
	onComplete,
	className,
	allowHighFrequency = false,
	allowAdvancedMethods = false,
	allowCustomHeaders = false,
	maxAlertRules = 10,
	allowAdvancedMetrics = false,
}: MonitorNewProps) {
	const [isSuccess, setIsSuccess] = useState(false);
	const [newId, setNewId] = useState<string>();
	const [isChecking, setIsChecking] = useState(false);
	const [step, setStep] = useState(1);
	const [showAdvancedOptions, setShowAdvancedOptions] =
		useState<boolean>(false);

	const form = useForm<InsertMonitor>({
		resolver: zodResolver(insertMonitorSchema),
		defaultValues: {
			name: "",
			target: "",
			type: "http",
			frequency: 300,
			timeout: 10,
			config: {
				method: "GET",
				expectedStatus: "200-299",
				followRedirects: true,
				headers: {},
				body: "",
				includesKeyword: "",
				excludesKeyword: "",
			},
			active: true,
			regions: ["default"],
			alertRules: [
				{
					metric: "status",
					operator: "eq",
					value: "down",
				},
			],
			channelIds: [],
		},
	});

	const nextStep = async () => {
		let fieldsToValidate: (keyof InsertMonitor)[] = [];

		if (step === 1) {
			fieldsToValidate = [
				"type",
				"name",
				"target",
				"frequency",
				"timeout",
				"config",
			];
		} else if (step === 2) {
			fieldsToValidate = ["alertRules"];
		}

		const result = await form.trigger(fieldsToValidate);

		if (result) {
			setStep((prev) => prev + 1);
		} else {
			const errors = form.formState.errors;
			const errorFields = Object.keys(errors);

			if (errorFields.length > 0) {
				const firstErrorKey = errorFields[0];
				const firstError = errors[firstErrorKey as keyof typeof errors];

				let errorMessage = "Please check the form fields";

				if (firstError) {
					if (typeof firstError === "object" && "message" in firstError) {
						errorMessage = firstError.message as string;
					} else if (typeof firstError === "object") {
						const nestedKeys = Object.keys(firstError);
						if (nestedKeys.length > 0) {
							const nestedError =
								firstError[nestedKeys[0] as keyof typeof firstError];
							if (
								nestedError &&
								typeof nestedError === "object" &&
								"message" in nestedError
							) {
								errorMessage = nestedError.message as string;
							} else {
								errorMessage = `Please check the ${firstErrorKey}.${nestedKeys[0]} field`;
							}
						}
					}
				}

				toast.error(errorMessage);
			} else {
				toast.error("Please fill in all required fields correctly");
			}
		}
	};

	const onSubmit = async (values: InsertMonitor) => {
		const data = values;
		setIsChecking(true);

		console.log("creating monitor", data);
		try {
			const res = await createMonitor({ data });
			setIsChecking(false);
			setIsSuccess(true);
			setNewId(res.id);
			toast.success("Monitor created successfully!");
			onComplete?.(data);
		} catch (error) {
			console.error(error);
			setIsChecking(false);
			toast.error("Failed to create monitor. Please try again.");
		}
	};

	if (isSuccess) {
		return (
			<MonitorSuccess
				id={newId}
				className={className}
				target={form.getValues("target")}
			/>
		);
	}

	return (
		<div className="rounded-4xl bg-white shadow-xl border border-foreground/10">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit, (errors) => {
						console.error(errors);
						const errorFields = Object.keys(errors);
						if (errorFields.length > 0) {
							const firstError = errors[errorFields[0] as keyof typeof errors];
							toast.error(
								firstError?.message
									? String(firstError?.message)
									: "Please check the form for errors",
							);
						} else {
							toast.error("Please check the form for errors");
						}
					})}
					className={cn("space-y-8", className)}
				>
					<main className="px-6 space-y-6 pt-6 min-h-64">
						{step === 1 && (
							<h2 className="text-xl font-semibold">New monitor</h2>
						)}
						{step === 1 && <MonitorSelectType />}
						{step === 1 && <MonitorTargetInput />}
						{step === 1 && (
							<MonitorSelectFrequency allowHighFrequency={allowHighFrequency} />
						)}
						{step === 1 && showAdvancedOptions && <Separator />}
						{step === 1 && showAdvancedOptions && (
							<MonitorAdvancedOptions
								allowAdvancedMethods={allowAdvancedMethods}
								allowCustomHeaders={allowCustomHeaders}
							/>
						)}

						{step === 2 && (
							<MonitorAlertRules
								maxRules={maxAlertRules}
								allowAdvancedMetrics={allowAdvancedMetrics}
							/>
						)}

						{step === 3 && <MonitorSelectChannels />}
					</main>

					<footer className="rounded-b-3xl gap-3 px-6 py-3 border-t border-foreground/5 flex w-full animate-in slide-in-from-bottom bg-zinc-100">
						{step === 1 && (
							<button
								type="button"
								onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
								className="text-sm me-auto"
							>
								{showAdvancedOptions
									? "Hide advanced options"
									: "Show advanced options"}
							</button>
						)}
						{step > 1 && (
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep((s) => s - 1)}
								className="ms-auto"
							>
								Back
							</Button>
						)}
						{(step === 1 || step === 2) && (
							<Button
								type="button"
								variant="default"
								onClick={(e) => {
									e.preventDefault();
									nextStep();
								}}
								className="px-6"
							>
								Next
							</Button>
						)}
						{step === 3 && (
							<Button
								type="submit"
								variant="default"
								disabled={isChecking}
								className={cn(isChecking ? "opacity-90" : "hover:scale-[1.01]")}
							>
								{isChecking ? (
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										Verifying...
									</div>
								) : (
									"Create Monitor"
								)}
							</Button>
						)}
					</footer>
				</form>
			</Form>
		</div>
	);
}
