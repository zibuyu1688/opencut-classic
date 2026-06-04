import { checkRateLimit } from "@/auth/rate-limit";
import { webEnv } from "@/env/web";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
	task: z.enum(["copy", "narration"]),
	topic: z.string().trim().min(1).max(500),
	apiKey: z.string().trim().min(1).optional(),
	baseUrl: z.string().trim().url().optional(),
	model: z.string().trim().min(1).max(100).optional(),
});

const deepseekResponseSchema = z.object({
	choices: z
		.array(
			z.object({
				message: z.object({
					content: z.string().optional(),
				}),
			}),
		)
		.min(1),
});

const recommendationResponseSchema = z.object({
	items: z.array(z.string().trim().min(1)).min(1).max(6),
});

const narrationResponseSchema = z.object({
	narration: z.string().trim().min(1),
});

function toErrorResponse({
	message,
	status,
}: {
	message: string;
	status: number;
}) {
	return NextResponse.json({ error: message }, { status });
}

function normalizeBaseUrl({ baseUrl }: { baseUrl?: string }) {
	return (baseUrl || "https://api.deepseek.com").trim().replace(/\/$/, "");
}

function extractJsonObject(text: string) {
	const start = text.indexOf("{");
	const end = text.lastIndexOf("}");
	if (start < 0 || end <= start) return null;
	return text.slice(start, end + 1);
}

function normalizeRecommendations(content: string) {
	const rawJson = extractJsonObject(content);
	if (rawJson) {
		const parsed = recommendationResponseSchema.safeParse(JSON.parse(rawJson));
		if (parsed.success) return parsed.data.items;
	}

	const lines = content
		.split(/\n+/)
		.map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
		.filter(Boolean)
		.slice(0, 6);

	if (lines.length > 0) return lines;
	throw new Error("DeepSeek 未返回可用文案");
}

function normalizeNarration(content: string) {
	const rawJson = extractJsonObject(content);
	if (rawJson) {
		const parsed = narrationResponseSchema.safeParse(JSON.parse(rawJson));
		if (parsed.success) return parsed.data.narration;
	}

	const normalized = content.trim();
	if (!normalized) {
		throw new Error("DeepSeek 未返回可用旁白");
	}
	return normalized;
}

function buildMessages({
	task,
	topic,
}: {
	task: "copy" | "narration";
	topic: string;
}) {
	if (task === "copy") {
		return [
			{
				role: "system",
				content:
					'你是短视频文案助手。请根据主题生成 6 条不同风格的中文短文案。输出 JSON：{"items":["..."]}。每条 12-40 字，不要出现额外字段。',
			},
			{
				role: "user",
				content: `主题：${topic}`,
			},
		] as const;
	}

	return [
		{
			role: "system",
			content:
				'你是短视频旁白助手。请根据主题写一段可直接配音的中文旁白，150-350 字，语气自然。输出 JSON：{"narration":"..."}。',
		},
		{
			role: "user",
			content: `主题：${topic}`,
		},
	] as const;
}

export async function POST(request: NextRequest) {
	try {
		const { limited } = await checkRateLimit({ request });
		if (limited) {
			return toErrorResponse({ message: "请求过于频繁，请稍后重试", status: 429 });
		}

		const rawBody = await request.json();
		const parsed = requestSchema.safeParse(rawBody);
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "请求参数无效",
					details: parsed.error.flatten().fieldErrors,
				},
				{ status: 400 },
			);
		}

		const apiKey = parsed.data.apiKey || webEnv.DEEPSEEK_API_KEY;
		if (!apiKey) {
			return toErrorResponse({
				message: "未配置 DeepSeek API Key，请在设置 > AI 中填写",
				status: 400,
			});
		}

		const deepseekResponse = await fetch(
			`${normalizeBaseUrl({ baseUrl: parsed.data.baseUrl })}/chat/completions`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: parsed.data.model || "deepseek-chat",
					temperature: parsed.data.task === "copy" ? 0.9 : 0.7,
					messages: buildMessages({
						task: parsed.data.task,
						topic: parsed.data.topic,
					}),
				}),
			},
		);

		const responseText = await deepseekResponse.text();
		if (!deepseekResponse.ok) {
			return toErrorResponse({
				message: responseText || `DeepSeek 请求失败，状态码 ${deepseekResponse.status}`,
				status: 502,
			});
		}

		const payload = deepseekResponseSchema.parse(JSON.parse(responseText));
		const content = payload.choices[0]?.message.content ?? "";

		if (parsed.data.task === "copy") {
			return NextResponse.json({ items: normalizeRecommendations(content) });
		}

		return NextResponse.json({ narration: normalizeNarration(content) });
	} catch (error) {
		const message = error instanceof Error ? error.message : "DeepSeek 生成失败";
		return toErrorResponse({ message, status: 500 });
	}
}
