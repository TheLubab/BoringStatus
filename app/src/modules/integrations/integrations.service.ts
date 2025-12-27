import { SlackProvider } from "./providers/slack";

const providers = {
	slack: SlackProvider,
};

// TODO: this is temporary
export async function sendAlert(
	type: keyof typeof providers,
	config: string,
	payload: any,
) {
	const provider = providers[type];
	if (!provider) throw new Error(`Unknown integration: ${type}`);

	await provider.send(config, payload);
}
