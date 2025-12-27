// TODO: this is temporary
export interface IntegrationPayload {
	monitorName: string;
	status: "UP" | "DOWN";
	url: string;
	timestamp: Date;
}

// TODO: this is temporary
export interface IntegrationProvider {
	name: string;
	send(config: any, payload: IntegrationPayload): Promise<void>;
}
