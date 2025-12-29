import { Activity, Globe, Server } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import type {
	InsertMonitor,
	MonitorType,
} from "@/modules/monitors/monitors.zod";

export function MonitorSelectType() {
	const form = useFormContext<InsertMonitor>();
	const type = useWatch({ control: form.control, name: "type" });

	const handleTypeChange = (newType: MonitorType) => {
		form.setValue("type", newType);
	};

	const options = [
		{
			value: "http" as MonitorType,
			label: "Website",
			description: "HTTP / HTTPS",
			icon: <Globe className="w-5 h-5 text-blue-500" />,
		},
		{
			value: "ping" as MonitorType,
			label: "Ping",
			description: "ICMP / Hostname",
			icon: <Activity className="w-5 h-5 text-emerald-500" />,
		},
		{
			value: "tcp" as MonitorType,
			label: "Port",
			description: "TCP / UDP",
			icon: <Server className="w-5 h-5 text-orange-500" />,
		},
	];

	return (
		<div className="w-full animate-in fade-in slide-in-from-left-2 duration-500">
			<RadioCardGroup
				defaultValue={type}
				variant="horizontal"
				onValueChange={handleTypeChange}
			>
				{options.map((option) => (
					<RadioCard
						showRadio={false}
						key={option.value}
						variant="centered"
						value={option.value}
						title={option.label}
						description={option.description}
						icon={option.icon}
					/>
				))}
			</RadioCardGroup>
		</div>
	);
}
