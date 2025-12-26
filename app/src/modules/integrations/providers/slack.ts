import { IntegrationPayload, IntegrationProvider } from "../integrations-types";

export const SlackProvider: IntegrationProvider = {
	name: "slack",
	async send(webhookUrl: string, payload: IntegrationPayload) {
		await fetch(webhookUrl, {
			method: "POST",
			body: JSON.stringify({
				text: `🚨 Monitor *${payload.monitorName}* is ${payload.status}!`,
			}),
		});
	},
};
