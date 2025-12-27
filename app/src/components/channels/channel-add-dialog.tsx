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
import type { NotificationChannel } from "@/db/schema";
import { createChannel } from "@/modules/integrations/integrations.api";
import {
	InsertNotificationChannel,
	insertNotificationChannelSchema,
} from "@/modules/integrations/integrations.zod";

interface ChannelAddDialogProps {
	onSuccess?: (channel: NotificationChannel & { id: string }) => void;
	children?: React.ReactNode;
	allowPro?: boolean;
}

type ChannelType = "email" | "slack" | "discord" | "webhook";
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
					<Button variant="outline" size="sm" className="gap-2" type="button">
						<Plus className="w-4 h-4" />
						Add Channel
					</Button>
				)}
			</DialogTrigger>
			<DialogPortal>
				<DialogContent className="sm:max-w-130">
					<ChannelAddForm
						onChannelCreate={(c) => createMutation.mutate({ data: c })}
						allowPro={allowPro}
						onClose={handleClose}
					/>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}

interface ChannelAddFormProps {
	onChannelCreate: (channel: NotificationChannel) => void;
	allowPro?: boolean;
	onClose: () => void;
}

export function ChannelAddForm({
	onChannelCreate,
	allowPro = true,
	onClose,
}: ChannelAddFormProps) {
	const [step, setStep] = useState<Step>("type");
	const [selectedType, setSelectedType] = useState<ChannelType>("email");
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
			config: {
				email: "",
				webhookUrl: "",
			},
		},
	});

	const handleTypeSelect = (type: ChannelType) => {
		setSelectedType(type);
		form.setValue("type", type);
		form.setValue("config", {});
		form.setValue("name", "");
		setStep("details");
	};

	const handleSendVerification = async () => {
		const email = form.getValues("config").email;
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

		const data = form.getValues();
		const newChannel = { ...data, id: crypto.randomUUID() };
		onChannelCreate(newChannel);

		setStep("success");
	};

	const onSubmit = async (data: NotificationChannelFormValues) => {
		if (data.type === "email") {
			await handleSendVerification();
			return;
		}

		setVerifying(true);
		toast.loading("Adding channel...", { id: "save-channel" });

		await new Promise((resolve) => setTimeout(resolve, 1500));

		setVerifying(false);
		toast.success("Channel added successfully!", { id: "save-channel" });

		const newChannel = { ...data, id: crypto.randomUUID() };
		onChannelCreate(newChannel);
		setStep("success");
	};

	const reset = () => {
		setStep("type");
		setVerificationCode("");
		setPendingEmail("");
		setExampleOpen(false);
		form.reset();
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
				<div className="py-8 text-center space-y-6">
					<div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
						<CheckCircle2 className="w-8 h-8 text-emerald-500" />
					</div>
					<div className="space-y-2">
						<DialogTitle className="text-xl">Channel Added</DialogTitle>
						<DialogDescription>
							Your {selectedType} channel is ready to receive alerts
						</DialogDescription>
					</div>
					<div className="flex gap-3 justify-center">
						<Button variant="outline" onClick={reset} type="button">
							Add Another
						</Button>
						<Button onClick={handleResetAndClose} type="button">
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
					<div className="grid grid-cols-2 gap-3 py-4">
						<TypeCard
							icon={<Mail className="w-6 h-6" />}
							label="Email"
							onClick={() => handleTypeSelect("email")}
						/>
						<TypeCard
							icon={<MessageSquare className="w-6 h-6" />}
							label="Slack"
							onClick={() => handleTypeSelect("slack")}
						/>
						<TypeCard
							icon={<MessageSquare className="w-6 h-6" />}
							label="Discord"
							onClick={() => handleTypeSelect("discord")}
						/>
						<TypeCard
							icon={<Webhook className="w-6 h-6" />}
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
						className="space-y-6"
					>
						<DialogHeader>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setStep("type")}
								className="w-fit -ml-3 mb-2"
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Back
							</Button>
							<DialogTitle>
								Configure{" "}
								{selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
							</DialogTitle>
						</DialogHeader>

						<div className="space-y-4">
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
									name="config.email"
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
										name="config.webhookUrl"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center justify-between">
													<FormLabel>Webhook URL</FormLabel>
													{selectedType !== "webhook" && (
														<a
															href={getSetupDocsUrl(selectedType)}
															target="_blank"
															rel="noopener noreferrer"
															className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
														>
															Setup guide
															<ExternalLink className="w-3 h-3" />
														</a>
													)}
												</div>
												<FormControl>
													<Input
														type="url"
														placeholder={getWebhookPlaceholder(selectedType)}
														className="font-mono text-sm"
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
											className="w-full justify-between text-muted-foreground hover:text-foreground"
										>
											<span className="flex items-center gap-2">
												<Code className="w-4 h-4" />
												View webhook payload example
											</span>
											<span className="text-xs">
												{exampleOpen ? "Hide" : "Show"}
											</span>
										</Button>
									</CollapsibleTrigger>
									<CollapsibleContent className="pt-2">
										<div className="relative">
											<pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto border">
												<code>{WEBHOOK_EXAMPLE}</code>
											</pre>
											<Button
												type="button"
												size="sm"
												variant="ghost"
												className="absolute top-2 right-2"
												onClick={copyExample}
											>
												<Copy className="w-3 h-3" />
											</Button>
										</div>
									</CollapsibleContent>
								</Collapsible>
							)}
						</div>

						<div className="flex justify-end gap-3 pt-4 border-t">
							<Button type="submit" disabled={verifying}>
								{verifying ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
				<div className="space-y-6">
					<DialogHeader>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setStep("details")}
							className="w-fit -ml-3 mb-2"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back
						</Button>
						<DialogTitle>Verify Email</DialogTitle>
						<DialogDescription>
							Enter the code sent to{" "}
							<button
								onClick={() => copyToClipboard(pendingEmail)}
								className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
								type="button"
							>
								{pendingEmail}
								{copied ? (
									<Check className="w-3 h-3 text-emerald-500" />
								) : (
									<Copy className="w-3 h-3" />
								)}
							</button>
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<Input
							type="text"
							placeholder="000000"
							maxLength={6}
							value={verificationCode}
							onChange={(e) => {
								const value = e.target.value.replace(/\D/g, "").slice(0, 6);
								setVerificationCode(value);
							}}
							className="text-center text-2xl tracking-[0.5em] font-mono h-14"
							autoFocus
						/>

						<p className="text-sm text-center text-muted-foreground">
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

					<div className="flex justify-end gap-3 pt-4 border-t">
						<Button
							type="button"
							onClick={handleVerifyCode}
							disabled={verifying || verificationCode.length !== 6}
						>
							{verifying ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
				"relative flex flex-col items-center gap-3 p-6 border rounded-lg transition-all",
				disabled
					? "opacity-50 cursor-not-allowed"
					: "hover:border-primary hover:bg-accent",
			)}
		>
			{isPro && (
				<div className="absolute top-2 right-2">
					<ProBadge />
				</div>
			)}
			<div className="text-muted-foreground">{icon}</div>
			<span className="font-medium">{label}</span>
		</button>
	);
}

function getNamePlaceholder(type: ChannelType) {
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

function getWebhookPlaceholder(type: ChannelType) {
	switch (type) {
		case "slack":
			return "https://hooks.slack.com/services/...";
		case "discord":
			return "https://discord.com/api/webhooks/...";
		default:
			return "https://api.example.com/webhook";
	}
}

function getSetupDocsUrl(type: ChannelType) {
	switch (type) {
		case "slack":
			return "https://api.slack.com/messaging/webhooks";
		case "discord":
			return "https://support.discord.com/hc/en-us/articles/228383668";
		default:
			return "#";
	}
}
