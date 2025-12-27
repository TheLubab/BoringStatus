import crypto from "node:crypto";

export const generateApiKey = () => {
	return `ag_${crypto.randomBytes(24).toString("hex")}`;
};
