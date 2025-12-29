import { useFormContext, useWatch } from "react-hook-form";

import { ProBadge } from "@/components/saas/pro-badge";
import { FormLabel } from "@/components/ui/form";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import type { InsertMonitor } from "@/modules/monitors/monitors.zod";

interface MonitorSelectFrequencyProps {
	allowHighFrequency?: boolean;
}

export function MonitorSelectFrequency({
	allowHighFrequency = true,
}: MonitorSelectFrequencyProps) {
	const form = useFormContext<InsertMonitor>();
	const frequency = useWatch({ control: form.control, name: "frequency" });

	const handleFrequencyChange = (freq: string) => {
		form.setValue("frequency", Number(freq));
	};

	const options = [
		{
			value: "60",
			title: "1 min",
			disabled: !allowHighFrequency,
			radioCircle: !allowHighFrequency && <ProBadge />,
			showRadio: allowHighFrequency,
		},
		{
			value: "300",
			title: "5 min",
			disabled: !allowHighFrequency,
			radioCircle: !allowHighFrequency && <ProBadge />,
			showRadio: allowHighFrequency,
		},
		{
			value: "600",
			title: "10 min",
		},
	];

	return (
		<div className="space-y-2 animate-in fade-in duration-300">
			<FormLabel>Check Every</FormLabel>
			<RadioCardGroup
				defaultValue={String(frequency)}
				onValueChange={handleFrequencyChange}
				variant="horizontal"
			>
				{options.map((option) => (
					<RadioCard key={option.value} className="py-2" {...option} />
				))}
			</RadioCardGroup>
		</div>
	);
}
