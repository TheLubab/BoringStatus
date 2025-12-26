import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { insertMonitorSchema, type MonitorFormValues } from "@/db/zod";
import { cn } from "@/lib/utils";
import { MonitorStepAlerting } from "./monitor-step-alerting";
import { MonitorStepGeneral } from "./monitor-step-general";
import { MonitorSuccess } from "./monitor-success";

interface AddMonitorProps {
	onComplete?: (data: MonitorFormValues) => void;
	onSubmitAction?: (data: MonitorFormValues) => Promise<void>;
	className?: string;
	allowHighFrequency?: boolean;
	allowAdvancedMethods?: boolean;
	allowCustomStatus?: boolean;
	allowCustomHeaders?: boolean;
	usageLabel?: React.ReactNode;
}

export function MonitorCreate({
	onComplete,
	onSubmitAction,
	className,
	allowHighFrequency = false,
	allowAdvancedMethods = false,
	allowCustomStatus = false,
	allowCustomHeaders = false,
	usageLabel,
}: AddMonitorProps) {
	const [isSuccess, setIsSuccess] = useState(false);
	const [isChecking, setIsChecking] = useState(false);
	const [step, setStep] = useState(1);

	const form = useForm<MonitorFormValues>({
		resolver: zodResolver(insertMonitorSchema) as any,
		defaultValues: {
			type: "http",
			name: "",
			target: "",

			active: true,
			frequency: 60 * 5,
			timeout: 20,
			retries: 1,

			method: "GET",
			expectedStatus: "200-299",
			headers: [],

			port: 80,

			alertOnDown: true,
			alertOnRecovery: true,
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
			"retries",
			"method",
			"expectedStatus",
			"headers",
			"port",
		]);

		if (result) {
			setStep(2);
		} else {
			const errors = form.formState.errors;
			const errorFields = Object.keys(errors);

			if (errorFields.length > 0) {
				const firstError = errors[errorFields[0] as keyof typeof errors];
				toast.error(
					firstError?.message || `Please check the ${errorFields[0]} field`,
				);
			} else {
				toast.error("Please fill in all required fields correctly");
			}
		}
	};

	const onSubmit = async (values: MonitorFormValues) => {
		const data = values;
		setIsChecking(true);

		try {
			if (onSubmitAction) {
				await onSubmitAction(data);
			} else {
				await new Promise((resolve) => setTimeout(resolve, 2000));
				console.log("Creating Monitor:", data);
			}

			setIsChecking(false);
			setIsSuccess(true);
			toast.success("Monitor created successfully!");
			if (onComplete) onComplete(data);
		} catch (error) {
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
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit, (errors) => {
					console.error(errors);
					const errorFields = Object.keys(errors);
					if (errorFields.length > 0) {
						const firstError = errors[errorFields[0] as keyof typeof errors];
						toast.error(
							firstError?.message || "Please check the form for errors",
						);
					} else {
						toast.error("Please check the form for errors");
					}
				})}
				className={cn("space-y-8", className)}
			>
				{step === 1 && (
					<MonitorStepGeneral
						allowHighFrequency={allowHighFrequency}
						allowAdvancedMethods={allowAdvancedMethods}
						allowCustomStatus={allowCustomStatus}
						allowCustomHeaders={allowCustomHeaders}
						usageLabel={usageLabel}
					/>
				)}

				{step === 2 && <MonitorStepAlerting />}

				<div className="pt-4 flex gap-3">
					{step === 2 && (
						<Button
							type="button"
							variant="outline"
							onClick={() => setStep(1)}
							className="h-12 px-6"
						>
							<ArrowLeft className="w-4 h-4 mr-2" /> Back
						</Button>
					)}

					{step === 1 ? (
						<Button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								nextStep();
							}}
							className="w-full h-12 text-base font-semibold shadow-sm"
						>
							Continue <ArrowRight className="w-4 h-4 ml-2" />
						</Button>
					) : (
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
				</div>
			</form>
		</Form>
	);
}
