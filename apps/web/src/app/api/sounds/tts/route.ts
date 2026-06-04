import { checkRateLimit } from "@/auth/rate-limit";
import { webEnv } from "@/env/web";
import {
	TTS_DEFAULT_VOICES,
	TTS_PROVIDER_MODELS,
} from "@/sounds/tts-config";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
	provider: z.enum(["qwen", "minimax"]),
	text: z.string().trim().min(1).max(3000),
	voiceId: z.string().trim().min(1).max(100).optional(),
	apiKey: z.string().trim().min(1).optional(),
	qwenBaseUrl: z.string().trim().url().optional(),
	minimaxPlanKey: z.string().trim().min(1).optional(),
	speed: z.number().min(0.5).max(2).default(1),
});

const responseSchema = z.object({
	provider: z.enum(["qwen", "minimax"]),
	model: z.string().min(1),
	voiceId: z.string().min(1),
	mimeType: z.string().min(1),
	audioBase64: z.string().min(1),
});

const miniMaxApiResponseSchema = z.object({
	data: z
		.object({
			audio: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
	base_resp: z
		.object({
			status_code: z.number().optional(),
			status_msg: z.string().optional(),
		})
		.optional(),
});

const qwenApiResponseSchema = z.object({
	status_code: z.number().optional(),
	code: z.string().optional(),
	message: z.string().optional(),
	request_id: z.string().optional(),
	output: z
		.object({
			finish_reason: z.string().optional(),
			audio: z
				.object({
					url: z.string().url().optional(),
					data: z.string().optional(),
				})
				.optional(),
		})
		.optional(),
});

const QWEN_MODEL = TTS_PROVIDER_MODELS.qwen;
const QWEN_DEFAULT_VOICE = TTS_DEFAULT_VOICES.qwen;
const MINIMAX_MODEL = TTS_PROVIDER_MODELS.minimax;
const MINIMAX_DEFAULT_VOICE = TTS_DEFAULT_VOICES.minimax;
const MINIMAX_URL = "https://api.minimaxi.com/v1/t2a_v2";
const DEFAULT_QWEN_BASE_URL = "https://dashscope.aliyuncs.com/api/v1";
const DEFAULT_QWEN_LANGUAGE_TYPE = "Chinese";

type TtsResponse = z.infer<typeof responseSchema>;

function toErrorResponse({
	message,
	status,
}: {
	message: string;
	status: number;
}) {
	return NextResponse.json({ error: message }, { status });
}

function bufferToBase64(buffer: ArrayBuffer) {
	return Buffer.from(buffer).toString("base64");
}

function hexToBase64(hex: string) {
	const normalizedHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	return Buffer.from(normalizedHex, "hex").toString("base64");
}

function resolveQwenUrl({ baseUrl }: { baseUrl?: string }) {
	const normalizedBaseUrl = (baseUrl || webEnv.QWEN_DASHSCOPE_BASE_URL || DEFAULT_QWEN_BASE_URL)
		.trim()
		.replace(/\/$/, "");

	if (
		normalizedBaseUrl.endsWith(
			"/services/aigc/multimodal-generation/generation",
		)
	) {
		return normalizedBaseUrl;
	}

	return `${normalizedBaseUrl}/services/aigc/multimodal-generation/generation`;
}

function inferQwenLanguageType(text: string) {
	if (/\p{Script=Han}/u.test(text)) {
		return DEFAULT_QWEN_LANGUAGE_TYPE;
	}

	if (/[A-Za-z]/.test(text)) {
		return "English";
	}

	return "Auto";
}

function parseJsonSafely(rawText: string): unknown {
	try {
		return JSON.parse(rawText);
	} catch {
		return null;
	}
}

function looksLikeConsoleOrDocUrl(value: string) {
	return /bailian\.console\.aliyuncs\.com|help\.aliyun\.com/i.test(value);
}

async function generateWithQwen({
	text,
	voiceId,
	apiKey,
	qwenBaseUrl,
	speed,
}: {
	text: string;
	voiceId?: string;
	apiKey?: string;
	qwenBaseUrl?: string;
	speed: number;
}): Promise<TtsResponse> {
	const resolvedApiKey = apiKey || webEnv.ALIBABA_BAILIAN_API_KEY;
	if (!resolvedApiKey) {
		throw new Error("未配置 ALIBABA_BAILIAN_API_KEY");
	}

	if (
		resolvedApiKey.startsWith("http://") ||
		resolvedApiKey.startsWith("https://") ||
		looksLikeConsoleOrDocUrl(resolvedApiKey)
	) {
		throw new Error(
			"Qwen Key 需要填写真实 API Key（通常以 sk- 开头），不能填写控制台或文档链接。",
		);
	}

	if (qwenBaseUrl && looksLikeConsoleOrDocUrl(qwenBaseUrl)) {
		throw new Error(
			"Qwen DashScope Base URL 需要填写接口地址，不是控制台或文档页面链接。北京地域请留空，或填写 https://dashscope.aliyuncs.com/api/v1",
		);
	}

	const resolvedVoiceId = voiceId || QWEN_DEFAULT_VOICE;
	const response = await fetch(resolveQwenUrl({ baseUrl: qwenBaseUrl }), {
		method: "POST",
		headers: {
			Authorization: `Bearer ${resolvedApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: QWEN_MODEL,
			input: {
				text,
				voice: resolvedVoiceId,
				language_type: inferQwenLanguageType(text),
			},
		}),
	});

	const rawText = await response.text();
	if (!response.ok) {
		const errorPayload = parseJsonSafely(rawText);
		if (
			errorPayload &&
			typeof errorPayload === "object" &&
			"message" in errorPayload &&
			typeof errorPayload.message === "string" &&
			errorPayload.message.includes("url error")
		) {
			throw new Error(
				"Qwen DashScope 地址无效，或与当前 API Key 的地域不匹配。请在设置 > AI 中填写对应地域的 DashScope Base URL。",
			);
		}
		throw new Error(rawText || `Qwen-TTS 请求失败，状态码 ${response.status}`);
	}

	const rawJson = parseJsonSafely(rawText);
	const payload = qwenApiResponseSchema.parse(rawJson);

	if (payload.status_code && payload.status_code !== 200) {
		throw new Error(payload.message || payload.code || "Qwen-TTS 语音生成失败");
	}

	const audioUrl = payload.output?.audio?.url;
	if (!audioUrl) {
		throw new Error("Qwen-TTS 未返回音频地址");
	}

	const audioResponse = await fetch(audioUrl);
	if (!audioResponse.ok) {
		throw new Error(`Qwen-TTS 音频下载失败，状态码 ${audioResponse.status}`);
	}

	const mimeType = audioResponse.headers.get("content-type") || "audio/mpeg";
	const audioBase64 = bufferToBase64(await audioResponse.arrayBuffer());

	return responseSchema.parse({
		provider: "qwen",
		model: QWEN_MODEL,
		voiceId: resolvedVoiceId,
		mimeType,
		audioBase64,
	});
}

async function generateWithMiniMax({
	text,
	voiceId,
	apiKey,
	minimaxPlanKey,
	speed,
}: {
	text: string;
	voiceId?: string;
	apiKey?: string;
	minimaxPlanKey?: string;
	speed: number;
}): Promise<TtsResponse> {
	const resolvedApiKey =
		apiKey || minimaxPlanKey || webEnv.MINIMAX_API_KEY || webEnv.MINIMAX_TOKEN_PLAN_KEY;
	if (!resolvedApiKey) {
		throw new Error("未配置 MINIMAX_API_KEY 或 MINIMAX_TOKEN_PLAN_KEY");
	}

	const resolvedVoiceId = voiceId || MINIMAX_DEFAULT_VOICE;
	const response = await fetch(MINIMAX_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${resolvedApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: MINIMAX_MODEL,
			text,
			stream: false,
			output_format: "hex",
			voice_setting: {
				voice_id: resolvedVoiceId,
				speed,
				vol: 1,
				pitch: 0,
			},
			audio_setting: {
				sample_rate: 32000,
				bitrate: 128000,
				format: "mp3",
				channel: 1,
			},
			subtitle_enable: false,
		}),
	});

	const rawText = await response.text();
	if (!response.ok) {
		throw new Error(rawText || `MiniMax 请求失败，状态码 ${response.status}`);
	}

	const rawJson: unknown = JSON.parse(rawText);
	const rawData = miniMaxApiResponseSchema.parse(rawJson);

	if (rawData.base_resp?.status_code && rawData.base_resp.status_code !== 0) {
		throw new Error(rawData.base_resp.status_msg || "MiniMax 语音生成失败");
	}

	if (!rawData.data?.audio) {
		throw new Error("MiniMax 未返回音频数据");
	}

	return responseSchema.parse({
		provider: "minimax",
		model: MINIMAX_MODEL,
		voiceId: resolvedVoiceId,
		mimeType: "audio/mpeg",
		audioBase64: hexToBase64(rawData.data.audio),
	});
}

export async function POST(request: NextRequest) {
	try {
		const { limited } = await checkRateLimit({ request });
		if (limited) {
			return toErrorResponse({ message: "请求过于频繁，请稍后重试", status: 429 });
		}

		const rawBody = await request.json();
		const validationResult = requestSchema.safeParse(rawBody);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "请求参数无效",
					details: validationResult.error.flatten().fieldErrors,
				},
				{ status: 400 },
			);
		}

		const {
			provider,
			text,
			voiceId,
			apiKey,
			qwenBaseUrl,
			minimaxPlanKey,
			speed,
		} = validationResult.data;
		const result =
			provider === "qwen"
				? await generateWithQwen({
					text,
					voiceId,
					apiKey,
					qwenBaseUrl,
					speed,
				})
				: await generateWithMiniMax({
					text,
					voiceId,
					apiKey,
					minimaxPlanKey,
					speed,
				});

		return NextResponse.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "语音生成失败";
		const status =
			message.includes("ALIBABA_BAILIAN_API_KEY") ||
			message.includes("MINIMAX_API_KEY") ||
			message.includes("MINIMAX_TOKEN_PLAN_KEY")
				? 503
				: 500;

		console.error("TTS generation failed:", error);
		return toErrorResponse({ message, status });
	}
}