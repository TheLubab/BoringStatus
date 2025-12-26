export interface IntegrationPayload {
	monitorName: string;
	status: "UP" | "DOWN";
	url: string;
	timestamp: Date;
}

export interface IntegrationProvider {
	name: string;
	send(config: any, payload: IntegrationPayload): Promise<void>;
}
