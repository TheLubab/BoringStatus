import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
	type InsertMonitor,
	insertMonitorSchema,
} from "@/modules/monitors/monitors.zod";

import { MonitorStepAlerting } from "./monitor-step-alerting";
import { MonitorStepGeneral } from "./monitor-step-general";
import { MonitorSuccess } from "./monitor-success";
import { MonitorSelectType } from "./monitor-select-type";
import { MonitorTargetInput } from "./monitor-target-input";
import { Separator } from "@/components/ui/separator";
import { MonitorSelectFrequency } from "./monitor-select-frequency";
import { MonitorAdvancedOptions } from "./monitor-advanced-options";
import { MonitorHttpValidation } from "./monitor-http-validation";
import { MonitorAlertRules } from "./monitor-alert-rules";

interface MonitorNewProps {
	onComplete?: (data: InsertMonitor) => void;
	onSubmitAction?: (data: InsertMonitor) => Promise<void>;
	className?: string;
	allowHighFrequency?: boolean;
	allowAdvancedMethods?: boolean;
	allowCustomStatus?: boolean;
	allowCustomHeaders?: boolean;
	usageLabel?: React.ReactNode;
}

export function MonitorNew({
	onComplete,
	onSubmitAction,
	className,
	allowHighFrequency = false,
	allowAdvancedMethods = false,
	allowCustomStatus = false,
	allowCustomHeaders = false,
	usageLabel,
}: MonitorNewProps) {
	const [isSuccess, setIsSuccess] = useState(false);
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
				expectedStatus: "200",
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
					operator: "neq",
					value: "up",
				},
			],
			channelIds: [],
		},
	});

	const nextStep = async () => {
		const result = await form.trigger([
			"type",
			"name",
			"target",
			"frequency",
			"timeout",
			"config",
		]);

		if (result) {
			setStep(2);
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

		try {
			if (onSubmitAction) {
				await onSubmitAction(data);
			} else {
				console.log("Creating Monitor:", data);
			}

			setIsChecking(false);
			setIsSuccess(true);
			toast.success("Monitor created successfully!");
			if (onComplete) onComplete(data);
		} catch (error) {
			console.error(error);
			setIsChecking(false);
			toast.error("Failed to create monitor. Please try again.");
		}
	};

	const handleConfigureNew = () => {
		setIsSuccess(false);
		setStep(1);
		form.reset();
	};

	if (isSuccess) {
		return (
			<MonitorSuccess
				className={className}
				onConfigureNew={handleConfigureNew}
				allowHighFrequency={allowHighFrequency}
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
					<main className="px-6 space-y-6 pt-6">
						<h2 className="text-xl font-normal">New monitor</h2>
						{step === 1 && <MonitorSelectType />}
						{step === 1 && <MonitorTargetInput />}
						{step === 1 && <MonitorSelectFrequency />}
						{step === 1 && showAdvancedOptions && <Separator />}
						{step === 1 && showAdvancedOptions && <MonitorAdvancedOptions />}

						{step === 2 && <MonitorAlertRules />}

						{step === 3 && <MonitorStepAlerting />}
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
								onClick={() => setStep(1)}
								className="ms-auto"
							>
								Back
							</Button>
						)}
						{(step === 1 || step === 2) && (
							<Button
								type="button"
								variant="secondary"
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
								disabled={isChecking}
								className={cn(
									"flex-1 h-12 text-base font-semibold shadow-lg transition-all",
									"bg-primary hover:bg-primary/90 text-primary-foreground",
									isChecking ? "opacity-90" : "hover:scale-[1.01]",
								)}
							>
								{isChecking ? (
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										Verifying connection...
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
