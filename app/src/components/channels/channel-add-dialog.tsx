import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	Check,
	CheckCircle2,
	Code,
	Copy,
	ExternalLink,
	Loader2,
	Mail,
	MessageSquare,
	Plus,
	Webhook,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ProBadge } from "@/components/saas/pro-badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createChannel } from "@/modules/integrations/integrations.api";
import type { NotificationChannel } from "@/modules/integrations/integrations.schema";
import {
	type InsertNotificationChannel,
	type NotificationChannelType,
	insertNotificationChannelSchema,
} from "@/modules/integrations/integrations.zod";

interface ChannelAddDialogProps {
	onSuccess?: (channel: NotificationChannel) => void;
	children?: React.ReactNode;
	allowPro?: boolean;
}

type Step = "type" | "details" | "verify" | "success";

const WEBHOOK_EXAMPLE = `POST /your-webhook-endpoint
Content-Type: application/json

{
  "event": "monitor.down",
  "monitor": {
    "id": "mon_123",
    "name": "Production API",
    "url": "https://api.example.com"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "status": "down",
  "message": "Connection timeout after 30s"
}`;

export function ChannelAddDialog({
	onSuccess,
	children,
	allowPro = true,
}: ChannelAddDialogProps) {
	const [open, setOpen] = useState(false);

	const handleClose = () => {
		setOpen(false);
	};

	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: createChannel,
		onSuccess: (newChannel) => {
			onSuccess?.(newChannel);
			queryClient.invalidateQueries({ queryKey: ["channels"] });
			toast.success("Channel added");
		},
		onError: () => {
			toast.error("Failed to add channel");
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children || (
					<Button variant="outline" size="sm" className="gap-1.5" type="button">
						<Plus className="size-3.5" />
						<span className="text-[13px]">Add Channel</span>
					</Button>
				)}
			</DialogTrigger>
			<DialogPortal>
				<DialogContent className="sm:max-w-130">
					<ChannelAddForm
						onChannelCreate={(data) => createMutation.mutate(data)}
						allowPro={allowPro}
						onClose={handleClose}
					/>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}

interface ChannelAddFormProps {
	onChannelCreate: (data: InsertNotificationChannel) => void;
	allowPro?: boolean;
	onClose: () => void;
}

export function ChannelAddForm({
	onChannelCreate,
	allowPro = true,
	onClose,
}: ChannelAddFormProps) {
	const [step, setStep] = useState<Step>("type");
	const [selectedType, setSelectedType] =
		useState<NotificationChannelType>("email");
	const [verifying, setVerifying] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");
	const [pendingEmail, setPendingEmail] = useState("");
	const [copied, setCopied] = useState(false);
	const [exampleOpen, setExampleOpen] = useState(false);

	const form = useForm<InsertNotificationChannel>({
		resolver: zodResolver(insertNotificationChannelSchema),
		defaultValues: {
			name: "",
			type: "email",
			email: "",
		},
	});

	const handleTypeSelect = (type: NotificationChannelType) => {
		setSelectedType(type);

		const currentName = form.getValues("name");

		// Reset form with type-specific defaults
		switch (type) {
			case "email":
				form.reset({ name: currentName, type: "email", email: "" });
				break;
			case "slack":
				form.reset({ name: currentName, type: "slack", webhookUrl: "" });
				break;
			case "discord":
				form.reset({ name: currentName, type: "discord", webhookUrl: "" });
				break;
			case "webhook":
				form.reset({ name: currentName, type: "webhook", webhookUrl: "" });
				break;
		}

		setStep("details");
	};

	const handleSendVerification = async () => {
		const values = form.getValues();
		if (values.type !== "email") return;

		const email = values.email;

		if (!email) {
			toast.error("Please enter an email address");
			return;
		}

		setVerifying(true);
		setPendingEmail(email);
		toast.loading("Sending verification code...", { id: "verify-email" });

		await new Promise((resolve) => setTimeout(resolve, 1000));

		setVerifying(false);
		toast.success("Verification code sent!", { id: "verify-email" });
		setStep("verify");
	};

	const handleVerifyCode = async () => {
		if (verificationCode.length !== 6) {
			toast.error("Please enter the 6-digit code");
			return;
		}

		setVerifying(true);
		toast.loading("Verifying code...", { id: "verify-code" });

		await new Promise((resolve) => setTimeout(resolve, 1000));

		setVerifying(false);
		toast.success("Email verified!", { id: "verify-code" });

		const values = form.getValues();
		onChannelCreate(values);
		setStep("success");
	};

	const onSubmit = async (data: InsertNotificationChannel) => {
		if (data.type === "email") {
			await handleSendVerification();
			return;
		}

		setVerifying(true);
		toast.loading("Adding channel...", { id: "save-channel" });

		await new Promise((resolve) => setTimeout(resolve, 1500));

		setVerifying(false);
		toast.success("Channel added successfully!", { id: "save-channel" });

		onChannelCreate(data);
		setStep("success");
	};

	const reset = () => {
		setStep("type");
		setVerificationCode("");
		setPendingEmail("");
		setExampleOpen(false);
		form.reset({ name: "", type: "email", email: "" });
	};

	const handleResetAndClose = () => {
		onClose();
		setTimeout(reset, 200);
	};

	const copyToClipboard = async (text: string) => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
		toast.success("Copied to clipboard");
	};

	const copyExample = async () => {
		await navigator.clipboard.writeText(WEBHOOK_EXAMPLE);
		toast.success("Example copied to clipboard");
	};

	return (
		<>
			{/* SUCCESS STATE */}
			{step === "success" && (
				<div className="py-6 text-center space-y-4">
					<div className="mx-auto size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
						<CheckCircle2 className="size-6 text-emerald-500" />
					</div>
					<div className="space-y-1">
						<DialogTitle className="text-base">Channel Added</DialogTitle>
						<DialogDescription className="text-[13px]">
							Your {selectedType} channel is ready to receive alerts
						</DialogDescription>
					</div>
					<div className="flex gap-2 justify-center">
						<Button variant="outline" onClick={reset} type="button" size="sm">
							Add Another
						</Button>
						<Button onClick={handleResetAndClose} type="button" size="sm">
							Done
						</Button>
					</div>
				</div>
			)}

			{/* TYPE SELECTION */}
			{step === "type" && (
				<>
					<DialogHeader>
						<DialogTitle>Add Notification Channel</DialogTitle>
						<DialogDescription>
							Choose how you want to receive alerts
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-2 gap-2 py-3">
						<TypeCard
							icon={<Mail className="size-5" />}
							label="Email"
							onClick={() => handleTypeSelect("email")}
						/>
						<TypeCard
							icon={<MessageSquare className="size-5" />}
							label="Slack"
							onClick={() => handleTypeSelect("slack")}
						/>
						<TypeCard
							icon={<MessageSquare className="size-5" />}
							label="Discord"
							onClick={() => handleTypeSelect("discord")}
						/>
						<TypeCard
							icon={<Webhook className="size-5" />}
							label="Webhook"
							isPro
							disabled={!allowPro}
							onClick={() => handleTypeSelect("webhook")}
						/>
					</div>
				</>
			)}

			{/* DETAILS FORM */}
			{step === "details" && (
				<Form {...form}>
					<form
						onSubmit={(e) => {
							e.stopPropagation();
							form.handleSubmit(onSubmit, console.error)(e);
						}}
						className="space-y-4"
					>
						<DialogHeader>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setStep("type")}
								className="w-fit -ml-2 mb-1 h-7 text-[13px]"
							>
								<ArrowLeft className="size-3 mr-1.5" />
								Back
							</Button>
							<DialogTitle className="text-[15px]">
								Configure{" "}
								{selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
							</DialogTitle>
						</DialogHeader>

						<div className="space-y-3">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input
												placeholder={getNamePlaceholder(selectedType)}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{selectedType === "email" && (
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email Address</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="alerts@company.com"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{(selectedType === "slack" ||
								selectedType === "discord" ||
								selectedType === "webhook") && (
									<FormField
										control={form.control}
										name="webhookUrl"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center justify-between">
													<FormLabel>Webhook URL</FormLabel>
													{selectedType !== "webhook" && (
														<a
															href={getSetupDocsUrl(selectedType)}
															target="_blank"
															rel="noopener noreferrer"
															className="text-[11px] text-muted-foreground/70 hover:text-foreground inline-flex items-center gap-0.5 transition-colors duration-100"
														>
															Setup guide
															<ExternalLink className="size-2.5" />
														</a>
													)}
												</div>
												<FormControl>
													<Input
														type="url"
														placeholder={getWebhookPlaceholder(selectedType)}
														className="font-mono text-[13px]"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

							{selectedType === "webhook" && (
								<Collapsible open={exampleOpen} onOpenChange={setExampleOpen}>
									<CollapsibleTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="w-full justify-between text-muted-foreground/70 hover:text-foreground h-7"
										>
											<span className="flex items-center gap-1.5 text-[13px]">
												<Code className="size-3" />
												View webhook payload example
											</span>
											<span className="text-[11px]">
												{exampleOpen ? "Hide" : "Show"}
											</span>
										</Button>
									</CollapsibleTrigger>
									<CollapsibleContent className="pt-1.5">
										<div className="relative">
											<pre className="text-[11px] bg-muted p-3 rounded-md overflow-x-auto border">
												<code>{WEBHOOK_EXAMPLE}</code>
											</pre>
											<Button
												type="button"
												size="sm"
												variant="ghost"
												className="absolute top-1.5 right-1.5 size-6 p-0"
												onClick={copyExample}
											>
												<Copy className="size-2.5" />
											</Button>
										</div>
									</CollapsibleContent>
								</Collapsible>
							)}
						</div>

						<div className="flex justify-end gap-2 pt-3 border-t">
							<Button type="submit" disabled={verifying} size="sm">
								{verifying ? (
									<>
										<Loader2 className="size-3 mr-1.5 animate-spin" />
										{selectedType === "email" ? "Sending..." : "Saving..."}
									</>
								) : (
									"Continue"
								)}
							</Button>
						</div>
					</form>
				</Form>
			)}

			{/* EMAIL VERIFICATION */}
			{step === "verify" && (
				<div className="space-y-4">
					<DialogHeader>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setStep("details")}
							className="w-fit -ml-2 mb-1 h-7 text-[13px]"
						>
							<ArrowLeft className="size-3 mr-1.5" />
							Back
						</Button>
						<DialogTitle className="text-[15px]">Verify Email</DialogTitle>
						<DialogDescription className="text-[13px]">
							Enter the code sent to{" "}
							<button
								onClick={() => copyToClipboard(pendingEmail)}
								className="font-medium text-foreground hover:underline inline-flex items-center gap-0.5"
								type="button"
							>
								{pendingEmail}
								{copied ? (
									<Check className="size-2.5 text-emerald-500" />
								) : (
									<Copy className="size-2.5" />
								)}
							</button>
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3">
						<Input
							type="text"
							placeholder="000000"
							maxLength={6}
							value={verificationCode}
							onChange={(e) => {
								const value = e.target.value.replace(/\D/g, "").slice(0, 6);
								setVerificationCode(value);
							}}
							className="text-center text-xl tracking-[0.4em] font-mono h-11"
							autoFocus
						/>

						<p className="text-[13px] text-center text-muted-foreground/70">
							Didn't receive it?{" "}
							<button
								type="button"
								onClick={handleSendVerification}
								className="text-foreground hover:underline font-medium"
							>
								Resend
							</button>
						</p>
					</div>

					<div className="flex justify-end gap-2 pt-3 border-t">
						<Button
							type="button"
							onClick={handleVerifyCode}
							disabled={verifying || verificationCode.length !== 6}
							size="sm"
						>
							{verifying ? (
								<>
									<Loader2 className="size-3 mr-1.5 animate-spin" />
									Verifying...
								</>
							) : (
								"Verify & Add"
							)}
						</Button>
					</div>
				</div>
			)}
		</>
	);
}

function TypeCard({
	icon,
	label,
	onClick,
	isPro = false,
	disabled = false,
}: {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	isPro?: boolean;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={disabled ? undefined : onClick}
			className={cn(
				"relative flex flex-col items-center gap-2 p-4 border rounded-md transition-all duration-100",
				disabled
					? "opacity-40 cursor-not-allowed"
					: "hover:border-primary/50 hover:bg-muted/30 active:scale-[0.98]",
			)}
		>
			{isPro && (
				<div className="absolute top-1.5 right-1.5">
					<ProBadge />
				</div>
			)}
			<div className="text-muted-foreground/70">{icon}</div>
			<span className="font-medium text-[13px]">{label}</span>
		</button>
	);
}

function getNamePlaceholder(type: NotificationChannelType) {
	switch (type) {
		case "email":
			return "Production Alerts";
		case "slack":
			return "#incidents";
		case "discord":
			return "Status Updates";
		case "webhook":
			return "Custom Integration";
	}
}

function getWebhookPlaceholder(type: NotificationChannelType) {
	switch (type) {
		case "slack":
			return "https://hooks.slack.com/services/...";
		case "discord":
			return "https://discord.com/api/webhooks/...";
		default:
			return "https://api.example.com/webhook";
	}
}

function getSetupDocsUrl(type: NotificationChannelType) {
	switch (type) {
		case "slack":
			return "https://api.slack.com/messaging/webhooks";
		case "discord":
			return "https://support.discord.com/hc/en-us/articles/228383668";
		default:
			return "#";
	}
}
