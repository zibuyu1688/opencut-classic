export type DeepseekStoredCredentials = {
	apiKey: string;
	baseUrl: string;
	model: string;
};

const DEEPSEEK_STORAGE_KEY = "opencut.ai.deepseek.credentials";

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

export function createEmptyDeepseekStoredCredentials(): DeepseekStoredCredentials {
	return {
		apiKey: "",
		baseUrl: DEFAULT_DEEPSEEK_BASE_URL,
		model: DEFAULT_DEEPSEEK_MODEL,
	};
}

export function loadStoredDeepseekCredentials(): DeepseekStoredCredentials {
	if (typeof window === "undefined") {
		return createEmptyDeepseekStoredCredentials();
	}

	try {
		const rawValue = window.localStorage.getItem(DEEPSEEK_STORAGE_KEY);
		if (!rawValue) {
			return createEmptyDeepseekStoredCredentials();
		}

		const parsed = JSON.parse(rawValue);
		if (!parsed || typeof parsed !== "object") {
			return createEmptyDeepseekStoredCredentials();
		}

		const apiKey =
			typeof parsed.apiKey === "string" ? parsed.apiKey : "";
		const baseUrl =
			typeof parsed.baseUrl === "string" && parsed.baseUrl.trim()
				? parsed.baseUrl
				: DEFAULT_DEEPSEEK_BASE_URL;
		const model =
			typeof parsed.model === "string" && parsed.model.trim()
				? parsed.model === "deepseek-chat"
					? DEFAULT_DEEPSEEK_MODEL
					: parsed.model
				: DEFAULT_DEEPSEEK_MODEL;

		return {
			apiKey,
			baseUrl,
			model,
		};
	} catch {
		return createEmptyDeepseekStoredCredentials();
	}
}

export function saveStoredDeepseekCredentials({
	credentials,
}: {
	credentials: DeepseekStoredCredentials;
}) {
	if (typeof window === "undefined") return;

	const normalized: DeepseekStoredCredentials = {
		apiKey: credentials.apiKey.trim(),
		baseUrl: credentials.baseUrl.trim() || DEFAULT_DEEPSEEK_BASE_URL,
		model: credentials.model.trim() || DEFAULT_DEEPSEEK_MODEL,
	};

	window.localStorage.setItem(DEEPSEEK_STORAGE_KEY, JSON.stringify(normalized));
}
