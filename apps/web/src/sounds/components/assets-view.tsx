"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useSoundSearch } from "@/sounds/use-sound-search";
import { useSoundsStore } from "@/sounds/sounds-store";
import type { SavedSound, SoundEffect } from "@/sounds/types";
import { cn } from "@/utils/ui";
import {
	FavouriteIcon,
	FilterMailIcon,
	PauseIcon,
	PlayIcon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { z } from "zod";

type GeneratedSpeech = {
	id: number;
	name: string;
	provider: TtsProvider;
	model: string;
	voiceId: string;
	text: string;
	previewUrl: string;
	duration: number;
	createdAt: string;
};

const MAX_TTS_TEXT_LENGTH = 3000;

const ttsSuccessResponseSchema = z.object({
	provider: z.enum(["qwen", "minimax"]),
	model: z.string(),
	voiceId: z.string(),
	mimeType: z.string(),
	audioBase64: z.string(),
});

const ttsErrorResponseSchema = z.object({
	error: z.string().optional(),
	message: z.string().optional(),
});

function looksLikeConsoleOrDocUrl(value: string) {
	return /bailian\.console\.aliyuncs\.com|help\.aliyun\.com/i.test(value);
}

function validateTtsRequest({
	provider,
	apiKey,
	qwenBaseUrl,
}: {
	provider: TtsProvider;
	apiKey: string;
	qwenBaseUrl: string;
}) {
	if (provider !== "qwen") {
		return null;
	}

	if (apiKey && (apiKey.startsWith("http://") || apiKey.startsWith("https://"))) {
		return "Qwen Key 需要填写真实 API Key（通常以 sk- 开头），不能填写控制台或文档链接。";
	}

	if (qwenBaseUrl && looksLikeConsoleOrDocUrl(qwenBaseUrl)) {
		return "Qwen DashScope Base URL 需要填写接口地址，不是控制台或文档页面链接。北京地域请留空，或填写 https://dashscope.aliyuncs.com/api/v1";
	}

	return null;
}

function getVoicePresetGroups({
	provider,
	presets,
}: {
	provider: TtsProvider;
	presets: { id: string; label: string }[];
}) {
	if (provider !== "minimax") {
		return [{ label: null, presets }];
	}

	const groups = new Map<string, { id: string; label: string }[]>();
	for (const preset of presets) {
		const [groupLabel] = preset.label.split(" · ");
		const currentGroup = groups.get(groupLabel) ?? [];
		currentGroup.push(preset);
		groups.set(groupLabel, currentGroup);
	}

	return Array.from(groups.entries()).map(([label, groupedPresets]) => ({
		label,
		presets: groupedPresets,
	}));
}

export function SoundsView() {
	return (
			<div className="flex h-full flex-col">
				<Tabs defaultValue="sound-effects" className="flex h-full flex-col">
					<div className="px-3 pt-2 pb-0">
						<TabsList className="gap-1">
							<TabsTrigger className="h-6 px-2 text-xs" value="sound-effects">
								音效
							</TabsTrigger>
							<TabsTrigger className="h-6 px-2 text-xs" value="tts">
								文字转语音
							</TabsTrigger>
							<TabsTrigger className="h-6 px-2 text-xs" value="saved">
								收藏
							</TabsTrigger>
						</TabsList>
					</div>
					<Separator className="my-2" />
					<TabsContent
						value="sound-effects"
						className="mt-0 flex min-h-0 flex-1 flex-col p-5 pt-0"
					>
						<SoundEffectsView />
					</TabsContent>
					<TabsContent
						value="tts"
						className="mt-0 flex min-h-0 flex-1 flex-col p-5 pt-0"
					>
						<TtsView />
					</TabsContent>
					<TabsContent
						value="saved"
						className="mt-0 flex min-h-0 flex-1 flex-col p-5 pt-0"
					>
						<SavedSoundsView />
					</TabsContent>
				</Tabs>
			</div>
		);
		}

		function TtsView() {
			const { addSoundToTimeline } = useSoundsStore();
			const [provider, setProvider] = useState<TtsProvider>("qwen");
			const [voiceId, setVoiceId] = useState(TTS_DEFAULT_VOICES.qwen);
			const [ttsCredentials] = useState<TtsStoredCredentials>(() =>
				loadStoredTtsCredentials(),
			);
			const [text, setText] = useState("");
			const [isGenerating, setIsGenerating] = useState(false);
			const [error, setError] = useState<string | null>(null);
			const [generatedSpeeches, setGeneratedSpeeches] = useState<GeneratedSpeech[]>([]);

			const handleGenerate = async () => {
				const trimmedText = text.trim();
				if (!trimmedText) {
					return;
				}

				const requestValidationError = validateTtsRequest({
					provider,
					apiKey: ttsCredentials.providerKeys[provider].trim(),
					qwenBaseUrl: ttsCredentials.qwenBaseUrl.trim(),
				});
				if (requestValidationError) {
					setError(requestValidationError);
					toast.error("语音生成失败", { description: requestValidationError });
					return;
				}

				try {
					setIsGenerating(true);
					setError(null);

					const response = await fetch("/api/sounds/tts", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							provider,
							text: trimmedText,
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
					const successPayload = ttsSuccessResponseSchema.safeParse(rawPayload);

					if (!response.ok || !successPayload.success) {
						const errorPayload = ttsErrorResponseSchema.safeParse(rawPayload);
						throw new Error(
							errorPayload.data?.error ||
								errorPayload.data?.message ||
								"语音生成失败，请稍后重试。",
						);
					}

					const payload = successPayload.data;
					const blob = base64ToBlob({
						base64: payload.audioBase64,
						mimeType: payload.mimeType,
					});
					const previewUrl = await blobToDataUrl({ blob });
					const duration = await getBlobAudioDuration({ blob });

					setGeneratedSpeeches((current) => [
						{
							id: Date.now(),
							name: buildGeneratedSpeechName({ text: trimmedText, provider }),
							provider: payload.provider,
							model: payload.model,
							voiceId: payload.voiceId,
							text: trimmedText,
							previewUrl,
							duration,
							createdAt: new Date().toISOString(),
						},
						...current,
					]);

					toast.success("语音已生成", {
						description: `${TTS_PROVIDER_LABELS[payload.provider]} · ${payload.model}`,
					});
				} catch (generationError) {
					const message =
						generationError instanceof Error
							? generationError.message
							: "语音生成失败，请稍后重试。";
					setError(message);
					toast.error("语音生成失败", { description: message });
				} finally {
					setIsGenerating(false);
				}
			};

			const handleAddGeneratedSpeechToTimeline = async ({
				speech,
			}: {
				speech: GeneratedSpeech;
			}) => {
				await addSoundToTimeline({
					sound: buildGeneratedSoundEffect({ speech }),
				});
			};

			const selectedVoicePreset = getTtsVoicePresetValue({ provider, voiceId });
			const voicePresetGroups = getVoicePresetGroups({
				provider,
				presets: TTS_VOICE_PRESETS[provider],
			});

			return (
				<div className="mt-1 flex h-full flex-col gap-2">
					<div className="grid gap-1.5">
						<div className="flex flex-col gap-0">
							<p className="text-xs leading-none font-medium">服务商</p>
							<Select
								value={provider}
								onValueChange={(value) => {
									if (!isTtsProvider(value)) {
										return;
									}
									setProvider(value);
									setVoiceId(TTS_DEFAULT_VOICES[value]);
								}}
							>
								<SelectTrigger className="h-7 w-full bg-background text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="qwen">阿里巴巴 Qwen-TTS</SelectItem>
									<SelectItem value="minimax">MiniMax</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-1.5">
							<div className="flex flex-col gap-0.5">
								<p className="text-sm font-medium">音色名称</p>
								<Select
									value={selectedVoicePreset}
									onValueChange={(value) => {
										if (value !== "custom") {
											setVoiceId(value);
										}
									}}
								>
									<SelectTrigger className="h-8 w-full bg-background">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{voicePresetGroups.map((group, groupIndex) => (
											<SelectGroup key={group.label ?? `default-${groupIndex}`}>
												{groupIndex > 0 && <SelectSeparator />}
												{group.label && <SelectLabel>{group.label}</SelectLabel>}
												{group.presets.map((preset) => (
													<SelectItem key={preset.id} value={preset.id}>
														{preset.label}
													</SelectItem>
												))}
											</SelectGroup>
										))}
										<SelectSeparator />
										<SelectItem value="custom">自定义</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="flex flex-col gap-0.5">
								<p className="text-sm font-medium">音色 ID</p>
								<Input
									className="h-8"
									value={voiceId}
									onChange={({ currentTarget }) => setVoiceId(currentTarget.value)}
									placeholder={TTS_DEFAULT_VOICES[provider]}
								/>
							</div>
						</div>

						<Textarea
							value={text}
							onChange={({ currentTarget }) => setText(currentTarget.value)}
							placeholder="输入要合成的文字"
							className="min-h-12"
							maxLength={MAX_TTS_TEXT_LENGTH}
						/>

						<div className="flex items-center justify-between gap-3">
							<p className="text-muted-foreground text-xs">
								{text.length}/{MAX_TTS_TEXT_LENGTH}
							</p>
							<Button
								onClick={handleGenerate}
								disabled={isGenerating || !text.trim()}
							>
								{isGenerating ? "正在生成..." : "生成语音"}
							</Button>
						</div>

						{error && <p className="text-destructive text-sm">{error}</p>}
					</div>

					<Separator />

					<div className="relative h-full overflow-hidden">
						<ScrollArea className="h-full flex-1">
							<div className="flex flex-col gap-4">
								{generatedSpeeches.length === 0 ? (
									<div className="text-muted-foreground text-sm">
										生成后的语音会显示在这里
									</div>
								) : (
									generatedSpeeches.map((speech) => (
										<div
											key={speech.id}
											className="flex items-center justify-between gap-3 rounded-md border p-3"
										>
											<audio controls src={speech.previewUrl} className="min-w-0 flex-1">
												<track kind="captions" />
											</audio>
											<Button
												size="sm"
												className="shrink-0"
												onClick={() => handleAddGeneratedSpeechToTimeline({ speech })}
											>
												加入时间线
											</Button>
										</div>
									))
								)}
							</div>
						</ScrollArea>
					</div>
				</div>
			);
}

function SoundEffectsView() {
	const {
		topSoundEffects,
		isLoading,
		searchQuery,
		setSearchQuery,
		scrollPosition,
		setScrollPosition,
		loadSavedSounds,
		showCommercialOnly,
		toggleCommercialFilter,
		hasLoaded,
		setTopSoundEffects,
		setLoading,
		setError,
		setHasLoaded,
		setCurrentPage,
		setHasNextPage,
		setTotalCount,
	} = useSoundsStore();
	const {
		results: searchResults,
		isLoading: isSearching,
		loadMore,
		hasNextPage,
		isLoadingMore,
	} = useSoundSearch({
		query: searchQuery,
		commercialOnly: showCommercialOnly,
	});

	const [playingId, setPlayingId] = useState<number | null>(null);
	const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
		null,
	);

	const { scrollAreaRef, handleScroll } = useInfiniteScroll({
		onLoadMore: loadMore,
		hasMore: hasNextPage,
		isLoading: isLoadingMore || isSearching,
	});

	useEffect(() => {
		loadSavedSounds();
	}, [loadSavedSounds]);

	useEffect(() => {
		if (hasLoaded) {
			return;
		}

		let shouldIgnore = false;

		const fetchTopSounds = async () => {
			try {
				if (!shouldIgnore) {
					setLoading({ loading: true });
					setError({ error: null });
				}

				const response = await fetch(
					"/api/sounds/search?page_size=50&sort=downloads",
				);

				if (!shouldIgnore) {
					if (!response.ok) {
						throw new Error(`Failed to fetch: ${response.status}`);
					}

					const data = await response.json();
					setTopSoundEffects({ sounds: data.results });
					setHasLoaded({ loaded: true });

					setCurrentPage({ page: 1 });
					setHasNextPage({ hasNext: !!data.next });
					setTotalCount({ count: data.count });
				}
			} catch (error) {
				if (!shouldIgnore) {
					console.error("Failed to fetch top sounds:", error);
					setError({
						error:
							error instanceof Error ? error.message : "Failed to load sounds",
					});
				}
			} finally {
				if (!shouldIgnore) {
					setLoading({ loading: false });
				}
			}
		};

		const timeoutId = setTimeout(fetchTopSounds, 100, {});

		return () => {
			shouldIgnore = true;
			clearTimeout(timeoutId);
		};
	}, [
		hasLoaded,
		setTopSoundEffects,
		setLoading,
		setError,
		setHasLoaded,
		setCurrentPage,
		setHasNextPage,
		setTotalCount,
	]);

	useEffect(() => {
		if (!scrollAreaRef.current || scrollPosition <= 0) {
			return;
		}

		const restoreScrollPosition = () => {
			scrollAreaRef.current?.scrollTo({ top: scrollPosition });
		};

		const timeoutId = setTimeout(restoreScrollPosition, 100, {});

		return () => clearTimeout(timeoutId);
	}, [scrollPosition, scrollAreaRef]);

	const handleScrollWithPosition = (event: React.UIEvent<HTMLDivElement>) => {
		const { currentTarget } = event;
		const { scrollTop } = currentTarget;
		setScrollPosition({ position: scrollTop });
		handleScroll(event);
	};

	const displayedSounds = searchQuery ? searchResults : topSoundEffects;

	const playSound = ({ sound }: { sound: SoundEffect }) => {
		if (playingId === sound.id) {
			audioElement?.pause();
			setPlayingId(null);
			return;
		}

		audioElement?.pause();

		if (sound.previewUrl) {
			const audio = new Audio(sound.previewUrl);
			audio.addEventListener("ended", () => {
				setPlayingId(null);
			});
			audio.addEventListener("error", () => {
				setPlayingId(null);
			});
			audio.play().catch((error) => {
				console.error("Failed to play sound preview:", error);
				setPlayingId(null);
			});

			setAudioElement(audio);
			setPlayingId(sound.id);
		}
	};

	return (
		<div className="mt-1 flex h-full flex-col gap-5">
			<div className="flex items-center gap-3">
				<Input
					placeholder="搜索音效"
					className="w-full"
					containerClassName="w-full"
					value={searchQuery}
					onChange={({ currentTarget }) =>
						setSearchQuery({ query: currentTarget.value })
					}
					showClearIcon
					onClear={() => setSearchQuery({ query: "" })}
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="text"
							size="icon"
							className={cn(showCommercialOnly && "text-primary")}
						>
							<HugeiconsIcon icon={FilterMailIcon} />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuCheckboxItem
							checked={showCommercialOnly}
							onCheckedChange={() => toggleCommercialFilter()}
						>
							仅显示可商用授权
						</DropdownMenuCheckboxItem>
						<div className="text-muted-foreground px-2 py-1.5 text-xs">
							{showCommercialOnly
								? "当前仅显示允许商业使用的音效"
								: "当前显示全部音效，不区分授权类型"}
						</div>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="relative h-full overflow-hidden">
				<ScrollArea
					className="h-full flex-1"
					ref={scrollAreaRef}
					onScrollCapture={handleScrollWithPosition}
				>
					<div className="flex flex-col gap-4">
						{isLoading && !searchQuery && (
							<div className="text-muted-foreground text-sm">
								正在加载音效...
							</div>
						)}
						{isSearching && searchQuery && (
							<div className="text-muted-foreground text-sm">正在搜索...</div>
						)}
						{displayedSounds.map((sound) => (
							<AudioItem
								key={sound.id}
								sound={sound}
								isPlaying={playingId === sound.id}
								onPlay={playSound}
							/>
						))}
						{!isLoading && !isSearching && displayedSounds.length === 0 && (
							<div className="text-muted-foreground text-sm">
								{searchQuery ? "未找到音效" : "暂无可用音效"}
							</div>
						)}
						{isLoadingMore && (
							<div className="text-muted-foreground py-4 text-center text-sm">
								正在加载更多音效...
							</div>
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}

function SavedSoundsView() {
	const {
		savedSounds,
		isLoadingSavedSounds,
		savedSoundsError,
		loadSavedSounds,
		clearSavedSounds,
	} = useSoundsStore();

	const [playingId, setPlayingId] = useState<number | null>(null);
	const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
		null,
	);

	const [showClearDialog, setShowClearDialog] = useState(false);

	useEffect(() => {
		loadSavedSounds();
	}, [loadSavedSounds]);

	const playSound = ({ sound }: { sound: SoundEffect }) => {
		if (playingId === sound.id) {
			audioElement?.pause();
			setPlayingId(null);
			return;
		}

		audioElement?.pause();

		if (sound.previewUrl) {
			const audio = new Audio(sound.previewUrl);
			audio.addEventListener("ended", () => {
				setPlayingId(null);
			});
			audio.addEventListener("error", () => {
				setPlayingId(null);
			});
			audio.play().catch((error) => {
				console.error("Failed to play sound preview:", error);
				setPlayingId(null);
			});

			setAudioElement(audio);
			setPlayingId(sound.id);
		}
	};

	const convertToSoundEffect = ({
		savedSound,
	}: {
		savedSound: SavedSound;
	}): SoundEffect => ({
		id: savedSound.id,
		name: savedSound.name,
		description: "",
		url: "",
		previewUrl: savedSound.previewUrl,
		downloadUrl: savedSound.downloadUrl,
		duration: savedSound.duration,
		filesize: 0,
		type: "audio",
		channels: 0,
		bitrate: 0,
		bitdepth: 0,
		samplerate: 0,
		username: savedSound.username,
		tags: savedSound.tags,
		license: savedSound.license,
		created: savedSound.savedAt,
		downloads: 0,
		rating: 0,
		ratingCount: 0,
	});

	if (isLoadingSavedSounds) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-muted-foreground text-sm">
					正在加载收藏音效...
				</div>
			</div>
		);
	}

	if (savedSoundsError) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-destructive text-sm">
					错误：{savedSoundsError}
				</div>
			</div>
		);
	}

	if (savedSounds.length === 0) {
		return (
			<div className="bg-background flex h-full flex-col items-center justify-center gap-3 p-4">
				<HugeiconsIcon
					icon={FavouriteIcon}
					className="text-muted-foreground size-10"
				/>
				<div className="flex flex-col gap-2 text-center">
					<p className="text-lg font-medium">还没有收藏音效</p>
					<p className="text-muted-foreground text-sm text-balance">
						点击任意音效上的爱心按钮即可收藏到这里
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mt-1 flex h-full flex-col gap-5">
			<div className="flex items-center justify-between">
				<p className="text-muted-foreground text-sm">
					已收藏 {savedSounds.length} 个音效
				</p>
				<Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
					<DialogTrigger asChild>
						<Button
							variant="text"
							size="sm"
							className="text-muted-foreground hover:text-destructive h-auto !opacity-100"
						>
							清空全部
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>清空全部收藏音效？</DialogTitle>
							<DialogDescription>
								这会从你的收藏中永久移除全部 {savedSounds.length} 个音效，
								此操作无法撤销。
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="text" onClick={() => setShowClearDialog(false)}>
								取消
							</Button>
							<Button
								variant="destructive"
								onClick={async ({
									stopPropagation,
								}: React.MouseEvent<HTMLButtonElement>) => {
									stopPropagation();
									await clearSavedSounds();
									setShowClearDialog(false);
								}}
							>
								清空全部音效
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="relative h-full overflow-hidden">
				<ScrollArea className="h-full flex-1">
					<div className="flex flex-col gap-4">
						{savedSounds.map((sound) => (
							<AudioItem
								key={sound.id}
								sound={convertToSoundEffect({ savedSound: sound })}
								isPlaying={playingId === sound.id}
								onPlay={playSound}
							/>
						))}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}

function buildGeneratedSpeechName({
	text,
	provider,
}: {
	text: string;
	provider: TtsProvider;
}) {
	const normalized = text.replace(/\s+/g, " ").trim();
	if (!normalized) {
		return `${TTS_PROVIDER_LABELS[provider]} 语音`;
	}
	return normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized;
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
			reject(new Error("无法读取生成音频数据"));
		};
		reader.onerror = () => reject(new Error("无法读取生成音频数据"));
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

function buildGeneratedSoundEffect({
	speech,
}: {
	speech: GeneratedSpeech;
}): SoundEffect {
	return {
		id: speech.id,
		name: speech.name,
		description: speech.text,
		url: speech.previewUrl,
		previewUrl: speech.previewUrl,
		downloadUrl: speech.previewUrl,
		duration: speech.duration,
		filesize: 0,
		type: "audio",
		channels: 1,
		bitrate: 0,
		bitdepth: 0,
		samplerate: 0,
		username: TTS_PROVIDER_LABELS[speech.provider],
		tags: ["tts", speech.provider],
		license: "AI Generated",
		created: speech.createdAt,
		downloads: 0,
		rating: 0,
		ratingCount: 0,
	};
}

interface AudioItemProps {
	sound: SoundEffect;
	isPlaying: boolean;
	onPlay: ({ sound }: { sound: SoundEffect }) => void;
}

function AudioItem({ sound, isPlaying, onPlay }: AudioItemProps) {
	const { addSoundToTimeline, isSoundSaved, toggleSavedSound } =
		useSoundsStore();
	const isSaved = isSoundSaved({ soundId: sound.id });

	const handleClick = () => {
		onPlay({ sound });
	};

	const handleSaveClick = ({
		stopPropagation,
	}: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation();
		toggleSavedSound({ soundEffect: sound });
	};

	const handleAddToTimeline = async ({
		stopPropagation,
	}: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation();
		await addSoundToTimeline({ sound });
	};

	return (
		<div className="group flex items-center gap-3 opacity-100 hover:opacity-75">
			<button
				type="button"
				className="flex min-w-0 flex-1 items-center gap-3 text-left"
				onClick={handleClick}
			>
				<div className="bg-accent relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
					<div className="from-primary/20 absolute inset-0 bg-gradient-to-br to-transparent" />
					{isPlaying ? (
						<HugeiconsIcon icon={PauseIcon} className="size-5" />
					) : (
						<HugeiconsIcon icon={PlayIcon} className="size-5" />
					)}
				</div>

				<div className="min-w-0 flex-1 overflow-hidden">
					<p className="truncate text-sm font-medium">{sound.name}</p>
					<span className="text-muted-foreground block truncate text-xs">
						{sound.username}
					</span>
				</div>
			</button>

			<div className="flex items-center gap-3 pr-2">
				<Button
					variant="text"
					size="icon"
					className="text-muted-foreground hover:text-foreground w-auto !opacity-100"
					onClick={handleAddToTimeline}
					title="添加到时间线"
				>
					<HugeiconsIcon icon={PlusSignIcon} />
				</Button>
				<Button
					variant="text"
					size="icon"
					className={`hover:text-foreground w-auto !opacity-100 ${
						isSaved
							? "text-red-500 hover:text-red-600"
							: "text-muted-foreground"
					}`}
					onClick={handleSaveClick}
					title={isSaved ? "从收藏中移除" : "收藏音效"}
				>
					<HugeiconsIcon
						icon={FavouriteIcon}
						className={`${isSaved ? "fill-current" : ""}`}
					/>
				</Button>
			</div>
		</div>
	);
}
