import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DraggableItem } from "@/components/editor/panels/assets/draggable-item";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEditor } from "@/editor/use-editor";
import {
	BatchCommand,
	AddTrackCommand,
	InsertElementCommand,
} from "@/commands";
import {
	buildLibraryAudioElement,
	buildTextElement,
} from "@/timeline/element-utils";
import { DEFAULTS } from "@/timeline/defaults";
import { insertCaptionChunksAsTextTrack } from "@/subtitles/insert";
import {
	getTtsVoicePresetValue,
	isTtsProvider,
	loadStoredTtsCredentials,
	TTS_DEFAULT_VOICES,
	TTS_PROVIDER_LABELS,
	TTS_VOICE_PRESETS,
	type TtsProvider,
	type TtsStoredCredentials,
} from "@/sounds/tts-config";
import { loadStoredDeepseekCredentials } from "@/ai/deepseek-config";
import { mediaTimeFromSeconds, type MediaTime } from "@/wasm";

const MAX_TOPIC_LENGTH = 200;

const MAX_AI_INSERT_TEXT_LENGTH = 3000;

type DeepseekTask = "copy" | "narration";

type TtsSuccessResponse = {
	provider: TtsProvider;
	model: string;
	voiceId: string;
	mimeType: string;
	audioBase64: string;
};

type TtsGeneratedClip = {
	text: string;
	sourceUrl: string;
	duration: number;
	name: string;
};

type SentenceSegment = {
	text: string;
	startTime: number;
	duration: number;
};

function splitTextIntoSentences({ text }: { text: string }): string[] {
	const normalized = text
		.replace(/\r\n/g, "\n")
		.replace(/\s+/g, " ")
		.trim();
	if (!normalized) return [];

	const coarseParts = normalized
		.split(/(?<=[。！？.!?；;\n])\s*/)
		.map((part) => part.trim())
		.filter(Boolean);

	const refined: string[] = [];
	for (const part of coarseParts) {
		if (part.length <= 36) {
			refined.push(part);
			continue;
		}

		const subParts = part
			.split(/(?<=[，,、])/)
			.map((item) => item.trim())
			.filter(Boolean);
		if (subParts.length === 0) {
			refined.push(part);
			continue;
		}
		refined.push(...subParts);
	}

	return refined;
}

function estimateSentenceDuration({ text }: { text: string }) {
	const weight = text.replace(/\s+/g, "").length;
	const seconds = Math.max(1.2, Math.min(8, weight / 4));
	return Number.isFinite(seconds) ? seconds : 1.8;
}

function base64ToBlob({
	base64,
	mimeType,
}: {
	base64: string;
	mimeType: string;
}) {
	const binary = atob(base64);
	const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
	return new Blob([bytes], { type: mimeType });
}

function blobToDataUrl({ blob }: { blob: Blob }) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}
			reject(new Error("无法读取音频数据"));
		};
		reader.onerror = () => reject(new Error("无法读取音频数据"));
		reader.readAsDataURL(blob);
	});
}

function getBlobAudioDuration({ blob }: { blob: Blob }) {
	const objectUrl = URL.createObjectURL(blob);
	const audio = new Audio(objectUrl);

	return new Promise<number>((resolve, reject) => {
		audio.onloadedmetadata = () => {
			URL.revokeObjectURL(objectUrl);
			resolve(audio.duration > 0 ? audio.duration : 1);
		};
		audio.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error("无法读取生成音频时长"));
		};
	});
}

async function requestDeepseek({
	task,
	topic,
}: {
	task: DeepseekTask;
	topic: string;
}) {
	const credentials = loadStoredDeepseekCredentials();
	const response = await fetch("/api/ai/deepseek", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			task,
			topic,
			apiKey: credentials.apiKey.trim() || undefined,
			baseUrl: credentials.baseUrl.trim() || undefined,
			model: credentials.model.trim() || undefined,
		}),
	});

	const payload: unknown = await response.json();
	if (!response.ok) {
		const message =
			typeof payload === "object" && payload && "error" in payload
				? String(payload.error)
				: "AI 生成失败";
		throw new Error(message);
	}

	if (task === "copy") {
		if (
			typeof payload === "object" &&
			payload &&
			"items" in payload &&
			Array.isArray(payload.items)
		) {
			return payload.items.filter((item): item is string => typeof item === "string");
		}
		throw new Error("文案返回格式异常");
	}

	if (
		typeof payload === "object" &&
		payload &&
		"narration" in payload &&
		typeof payload.narration === "string"
	) {
		return payload.narration;
	}

	throw new Error("旁白返回格式异常");
}

async function generateSpeechClip({
	text,
	provider,
	voiceId,
	ttsCredentials,
}: {
	text: string;
	provider: TtsProvider;
	voiceId: string;
	ttsCredentials: TtsStoredCredentials;
}): Promise<TtsGeneratedClip> {
	const response = await fetch("/api/sounds/tts", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			provider,
			text,
			voiceId: voiceId.trim() || TTS_DEFAULT_VOICES[provider],
			apiKey: ttsCredentials.providerKeys[provider].trim() || undefined,
			qwenBaseUrl:
				provider === "qwen"
					? ttsCredentials.qwenBaseUrl.trim() || undefined
					: undefined,
			minimaxPlanKey:
				provider === "minimax"
					? ttsCredentials.minimaxTokenPlanKey.trim() || undefined
					: undefined,
		}),
	});

	const rawPayload: unknown = await response.json();
	if (!response.ok) {
		const message =
			typeof rawPayload === "object" && rawPayload && "error" in rawPayload
				? String(rawPayload.error)
				: "配音生成失败";
		throw new Error(message);
	}

	const payload = rawPayload as Partial<TtsSuccessResponse>;
	if (
		typeof payload.audioBase64 !== "string" ||
		typeof payload.mimeType !== "string"
	) {
		throw new Error("配音返回格式异常");
	}

	const blob = base64ToBlob({
		base64: payload.audioBase64,
		mimeType: payload.mimeType,
	});
	const sourceUrl = await blobToDataUrl({ blob });
	const duration = await getBlobAudioDuration({ blob });

	const normalizedName = text.replace(/\s+/g, " ").trim();
	return {
		text,
		sourceUrl,
		duration,
		name: normalizedName.length > 24 ? `${normalizedName.slice(0, 24)}...` : normalizedName,
	};
}

function buildSentenceSegments({
	text,
	startTime,
	smartSplit,
}: {
	text: string;
	startTime: number;
	smartSplit: boolean;
}): SentenceSegment[] {
	const baseSentences = smartSplit
		? splitTextIntoSentences({ text })
		: [text.trim()].filter(Boolean);

	const segments: SentenceSegment[] = [];
	let cursor = startTime;
	for (const sentence of baseSentences) {
		const duration = estimateSentenceDuration({ text: sentence });
		segments.push({
			text: sentence,
			startTime: cursor,
			duration,
		});
		cursor += duration;
	}

	return segments;
}

function hasTtsKey({
	provider,
	credentials,
}: {
	provider: TtsProvider;
	credentials: TtsStoredCredentials;
}) {
	if (provider === "qwen") {
		return credentials.providerKeys.qwen.trim().length > 0;
	}

	return (
		credentials.providerKeys.minimax.trim().length > 0 ||
		credentials.minimaxTokenPlanKey.trim().length > 0
	);
}

export function TextView() {
	const editor = useEditor();
	const [topic, setTopic] = useState("");
	const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
	const [isGeneratingNarration, setIsGeneratingNarration] = useState(false);
	const [isInserting, setIsInserting] = useState(false);
	const [copyItems, setCopyItems] = useState<string[]>([]);
	const [narrationText, setNarrationText] = useState("");
	const [selectedCopyIndex, setSelectedCopyIndex] = useState<number | null>(null);
	const [smartSplit, setSmartSplit] = useState(true);
	const [enableVoiceover, setEnableVoiceover] = useState(false);
	const [voiceProvider, setVoiceProvider] = useState<TtsProvider>("qwen");
	const [voiceId, setVoiceId] = useState(TTS_DEFAULT_VOICES.qwen);

	const selectedVoicePreset = useMemo(
		() => getTtsVoicePresetValue({ provider: voiceProvider, voiceId }),
		[voiceProvider, voiceId],
	);

	const canGenerate = topic.trim().length > 0;

	const handleAddDefaultText = ({ currentTime }: { currentTime: MediaTime }) => {
		const activeScene = editor.scenes.getActiveScene();
		if (!activeScene) return;

		const element = buildTextElement({
			raw: DEFAULTS.text.element,
			startTime: currentTime,
		});

		editor.timeline.insertElement({
			element,
			placement: { mode: "auto" },
		});
	};

	const handleGenerateCopy = async () => {
		const trimmedTopic = topic.trim();
		if (!trimmedTopic) return;

		try {
			setIsGeneratingCopy(true);
			const items = (await requestDeepseek({
				task: "copy",
				topic: trimmedTopic,
			})) as string[];
			setCopyItems(items);
			setSelectedCopyIndex(items.length > 0 ? 0 : null);
			toast.success("已生成文案推荐");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "文案推荐生成失败";
			toast.error("文案推荐生成失败", { description: message });
		} finally {
			setIsGeneratingCopy(false);
		}
	};

	const handleGenerateNarration = async () => {
		const trimmedTopic = topic.trim();
		if (!trimmedTopic) return;

		try {
			setIsGeneratingNarration(true);
			const generatedNarration = (await requestDeepseek({
				task: "narration",
				topic: trimmedTopic,
			})) as string;
			setNarrationText(generatedNarration);
			toast.success("已生成旁白");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "旁白生成失败";
			toast.error("旁白生成失败", { description: message });
		} finally {
			setIsGeneratingNarration(false);
		}
	};

	const insertGeneratedText = async ({
		sourceText,
	}: {
		sourceText: string;
	}) => {
		const normalizedText = sourceText.trim();
		if (!normalizedText) {
			toast.error("没有可插入的文本");
			return;
		}
		if (normalizedText.length > MAX_AI_INSERT_TEXT_LENGTH) {
			toast.error("文本过长", {
				description: `最多支持 ${MAX_AI_INSERT_TEXT_LENGTH} 字符。`,
			});
			return;
		}

		const activeScene = editor.scenes.getActiveScene();
		if (!activeScene) {
			toast.error("当前没有活动场景");
			return;
		}

		try {
			setIsInserting(true);
			const currentTime = editor.playback.getCurrentTime();
			let sentenceSegments = buildSentenceSegments({
				text: normalizedText,
				startTime: currentTime,
				smartSplit,
			});

			if (sentenceSegments.length === 0) {
				throw new Error("没有可用句段");
			}

			let generatedClips: TtsGeneratedClip[] = [];

			if (enableVoiceover) {
				const ttsCredentials = loadStoredTtsCredentials();
				if (!hasTtsKey({ provider: voiceProvider, credentials: ttsCredentials })) {
					throw new Error("请先在设置 > AI 中填写所选配音服务商的 Key");
				}

				generatedClips = [];
				let cursor = currentTime;
				for (const segment of sentenceSegments) {
					const clip = await generateSpeechClip({
						text: segment.text,
						provider: voiceProvider,
						voiceId,
						ttsCredentials,
					});
					generatedClips.push(clip);
					segment.startTime = cursor;
					segment.duration = clip.duration;
					cursor += clip.duration;
				}
			}

			const subtitleTrackId = insertCaptionChunksAsTextTrack({
				editor,
				captions: sentenceSegments.map((segment) => ({
					text: segment.text,
					startTime: segment.startTime,
					duration: segment.duration,
				})),
			});

			if (!subtitleTrackId) {
				throw new Error("字幕插入失败");
			}

			if (enableVoiceover && generatedClips.length > 0) {
				const addAudioTrackCommand = new AddTrackCommand({ type: "audio", index: 0 });
				const audioTrackId = addAudioTrackCommand.getTrackId();
				const commands = [addAudioTrackCommand];

				for (let index = 0; index < generatedClips.length; index++) {
					const clip = generatedClips[index];
					const segment = sentenceSegments[index];
					if (!segment) continue;

					commands.push(
						new InsertElementCommand({
							placement: { mode: "explicit", trackId: audioTrackId },
							element: buildLibraryAudioElement({
								sourceUrl: clip.sourceUrl,
								name: clip.name,
								duration: mediaTimeFromSeconds({ seconds: clip.duration }),
								startTime: mediaTimeFromSeconds({ seconds: segment.startTime }),
							}),
						}),
					);
				}

				editor.command.execute({
					command: new BatchCommand(commands),
				});
			}

			toast.success("已插入时间线", {
				description: enableVoiceover
					? `已按 ${sentenceSegments.length} 句生成字幕并配音对齐。`
					: `已按 ${sentenceSegments.length} 句插入智能分段字幕。`,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "插入失败";
			toast.error("插入失败", { description: message });
		} finally {
			setIsInserting(false);
		}
	};

	return (
		<PanelView title="文字" contentClassName="px-0">
			<div className="flex flex-col">
				<div className="px-2 pt-2">
					<DraggableItem
						name="默认文本"
						preview={
							<div className="bg-accent flex size-full items-center justify-center rounded">
								<span className="select-none text-xs">默认文本</span>
							</div>
						}
						dragData={{
							id: "temp-text-id",
							type: DEFAULTS.text.element.type,
							name: DEFAULTS.text.element.name,
							content: "默认文本",
						}}
						aspectRatio={1}
						onAddToTimeline={handleAddDefaultText}
						shouldShowLabel={false}
					/>
				</div>

				<Separator className="my-2" />

				<div className="flex flex-col gap-3 px-3 pb-3">
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium">AI 文案与旁白</p>
						<p className="text-muted-foreground text-xs">
							输入主题后生成文案推荐或旁白，插入时默认智能分割字幕。
						</p>
					</div>

					<Input
						value={topic}
						onChange={({ currentTarget }) => setTopic(currentTarget.value)}
						placeholder="输入主题，例如：春日露营Vlog"
						maxLength={MAX_TOPIC_LENGTH}
					/>

					<div className="flex items-center justify-between gap-2">
						<Button
							className="flex-1"
							variant="outline"
							onClick={handleGenerateCopy}
							disabled={!canGenerate || isGeneratingCopy || isInserting}
						>
							{isGeneratingCopy ? "生成中..." : "AI 文案推荐"}
						</Button>
						<Button
							className="flex-1"
							onClick={handleGenerateNarration}
							disabled={!canGenerate || isGeneratingNarration || isInserting}
						>
							{isGeneratingNarration ? "生成中..." : "AI 写旁白"}
						</Button>
					</div>

					<div className="flex items-center justify-between rounded-sm border px-2 py-1.5">
						<p className="text-sm">智能分割字幕</p>
						<Switch checked={smartSplit} onCheckedChange={setSmartSplit} />
					</div>

					<div className="space-y-2 rounded-sm border p-2">
						<div className="flex items-center justify-between">
							<p className="text-sm">配音</p>
							<Switch checked={enableVoiceover} onCheckedChange={setEnableVoiceover} />
						</div>
						{enableVoiceover && (
							<>
								<Select
									value={voiceProvider}
									onValueChange={(value) => {
										if (!isTtsProvider(value)) return;
										setVoiceProvider(value);
										setVoiceId(TTS_DEFAULT_VOICES[value]);
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{(["qwen", "minimax"] as const).map((provider) => (
											<SelectItem value={provider} key={provider}>
												{TTS_PROVIDER_LABELS[provider]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select
									value={selectedVoicePreset}
									onValueChange={(value) => {
										if (value === "custom") return;
										setVoiceId(value);
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{TTS_VOICE_PRESETS[voiceProvider].map((preset) => (
											<SelectItem value={preset.id} key={preset.id}>
												{preset.label}
											</SelectItem>
										))}
										<SelectItem value="custom">自定义</SelectItem>
									</SelectContent>
								</Select>

								<Input
									value={voiceId}
									onChange={({ currentTarget }) => setVoiceId(currentTarget.value)}
									placeholder="音色 ID"
								/>
							</>
						)}
					</div>

					{copyItems.length > 0 && (
						<div className="space-y-2 rounded-sm border p-2">
							<div className="text-sm font-medium">文案推荐</div>
							{copyItems.map((item, index) => (
								<button
									type="button"
									key={`${item}-${index}`}
									onClick={() => setSelectedCopyIndex(index)}
									className={`w-full rounded-sm border px-2 py-1.5 text-left text-sm ${
										selectedCopyIndex === index ? "border-primary" : ""
									}`}
								>
									{item}
								</button>
							))}
							<Button
								variant="secondary"
								disabled={selectedCopyIndex === null || isInserting}
								onClick={() => {
									const selected =
										selectedCopyIndex != null ? copyItems[selectedCopyIndex] : "";
									void insertGeneratedText({ sourceText: selected });
								}}
							>
								{isInserting ? "插入中..." : "插入所选文案"}
							</Button>
						</div>
					)}

					<div className="space-y-2 rounded-sm border p-2">
						<div className="text-sm font-medium">旁白</div>
						<Textarea
							value={narrationText}
							onChange={({ currentTarget }) =>
								setNarrationText(currentTarget.value)
							}
							placeholder="点击 AI 写旁白生成，或手动输入"
							className="min-h-28"
						/>
						<Button
							disabled={!narrationText.trim() || isInserting}
							onClick={() => void insertGeneratedText({ sourceText: narrationText })}
						>
							{isInserting ? "插入中..." : "插入旁白（按句分段）"}
						</Button>
					</div>
				</div>
			</div>
		</PanelView>
	);
}
