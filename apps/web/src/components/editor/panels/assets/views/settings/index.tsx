"use client";

import { useState } from "react";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FPS_PRESETS } from "@/fps/presets";
import { floatToFrameRate, frameRateToFloat } from "@/fps/utils";
import { useEditor } from "@/editor/use-editor";
import {
	Section,
	SectionContent,
	SectionHeader,
	SectionTitle,
} from "@/components/section";
import { BackgroundContent } from "./background";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { useEditorStore } from "@/editor/editor-store";
import { usePropertyDraft } from "@/components/editor/panels/properties/hooks/use-property-draft";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils/ui";
import { dimensionToAspectRatio } from "@/utils/geometry";
import { formatNumberForDisplay } from "@/utils/math";
import { OcSquarePlusIcon } from "@/components/icons";
import type { TCanvasSize } from "@/project/types";
import {
	createEmptyTtsStoredCredentials,
	loadStoredTtsCredentials,
	saveStoredTtsCredentials,
	TTS_PROVIDER_LABELS,
	TTS_PROVIDER_MODELS,
	type TtsProvider,
	type TtsStoredCredentials,
} from "@/sounds/tts-config";
import {
	createEmptyDeepseekStoredCredentials,
	loadStoredDeepseekCredentials,
	saveStoredDeepseekCredentials,
	type DeepseekStoredCredentials,
} from "@/ai/deepseek-config";
import { toast } from "sonner";

type SettingsView = "project-info" | "background" | "ai";

function isSettingsView(value: string): value is SettingsView {
	return value === "project-info" || value === "background" || value === "ai";
}

const PRESET_LABELS: Record<string, string> = {
	"1:1": "1:1",
	"16:9": "16:9",
	"9:16": "9:16",
	"4:3": "4:3",
};

function areCanvasSizesEqual({
	left,
	right,
}: {
	left: TCanvasSize;
	right: TCanvasSize;
}) {
	return left.width === right.width && left.height === right.height;
}

function formatCanvasDimension({ value }: { value: number }) {
	return formatNumberForDisplay({ value, maxFractionDigits: 0 });
}

function parseCanvasDimension({ input }: { input: string }): number | null {
	const trimmed = input.trim();
	if (!trimmed) return null;

	const parsed = Number(trimmed);
	if (!Number.isFinite(parsed)) return null;

	const rounded = Math.round(parsed);
	return rounded > 0 ? rounded : null;
}

function useCanvasDimensionDraft({
	value,
	onCommit,
}: {
	value: number;
	onCommit: (value: number) => void;
}) {
	const [pendingValue, setPendingValue] = useState(value);

	return usePropertyDraft({
		displayValue: formatCanvasDimension({ value }),
		parse: (input) => parseCanvasDimension({ input }),
		onStartEditing: () => {
			setPendingValue(value);
		},
		onPreview: (nextValue) => {
			setPendingValue(nextValue);
		},
		onCommit: () => {
			if (pendingValue !== value) {
				onCommit(pendingValue);
			}
		},
	});
}

export function SettingsView() {
	const [view, setView] = useState<SettingsView>("project-info");
	const [ttsCredentials, setTtsCredentials] = useState<TtsStoredCredentials>(() =>
		loadStoredTtsCredentials(),
	);
	const [deepseekCredentials, setDeepseekCredentials] =
		useState<DeepseekStoredCredentials>(() => loadStoredDeepseekCredentials());
	const [showKeys, setShowKeys] = useState<Record<TtsProvider, boolean>>({
		qwen: false,
		minimax: false,
	});
	const [showMiniMaxTokenPlanKey, setShowMiniMaxTokenPlanKey] = useState(false);
	const [showDeepseekKey, setShowDeepseekKey] = useState(false);
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());
	const { canvasPresets } = useEditorStore();
	const currentCanvasSize = activeProject.settings.canvasSize;
	const canvasSizeMode = activeProject.settings.canvasSizeMode ?? "preset";
	const lastCustomCanvasSize =
		activeProject.settings.lastCustomCanvasSize ?? null;

	const presetItems = canvasPresets.map((preset, index) => {
		const ratio = dimensionToAspectRatio(preset);
		return {
			id: index.toString(),
			label: PRESET_LABELS[ratio] ?? ratio,
			ratio,
			canvasSize: preset,
		};
	});

	const selectedPresetId = canvasSizeMode === "preset"
		? (presetItems.find((preset) =>
				areCanvasSizesEqual({
					left: preset.canvasSize,
					right: currentCanvasSize,
				}),
			)?.id ?? null)
		: null;

	const updateCustomCanvasSize = ({
		canvasSize,
	}: {
		canvasSize: TCanvasSize;
	}) => {
		const shouldUpdateCanvasSize = !areCanvasSizesEqual({
			left: canvasSize,
			right: currentCanvasSize,
		});
		const shouldUpdateLastCustomCanvasSize =
			lastCustomCanvasSize === null ||
			!areCanvasSizesEqual({
				left: canvasSize,
				right: lastCustomCanvasSize,
			});
		const shouldUpdateCanvasSizeMode = canvasSizeMode !== "custom";

		if (
			!shouldUpdateCanvasSize &&
			!shouldUpdateLastCustomCanvasSize &&
			!shouldUpdateCanvasSizeMode
		) {
			return;
		}

		editor.project.updateSettings({
			settings: {
				...(shouldUpdateCanvasSize ? { canvasSize } : {}),
				...(shouldUpdateCanvasSizeMode
					? { canvasSizeMode: "custom" as const }
					: {}),
				lastCustomCanvasSize: canvasSize,
			},
		});
	};

	const selectPresetCanvasSize = ({
		canvasSize,
	}: {
		canvasSize: TCanvasSize;
	}) => {
		const shouldUpdateCanvasSize = !areCanvasSizesEqual({
			left: canvasSize,
			right: currentCanvasSize,
		});
		const shouldUpdateCanvasSizeMode = canvasSizeMode !== "preset";

		if (!shouldUpdateCanvasSize && !shouldUpdateCanvasSizeMode) return;

		editor.project.updateSettings({
			settings: {
				...(shouldUpdateCanvasSize ? { canvasSize } : {}),
				...(shouldUpdateCanvasSizeMode
					? { canvasSizeMode: "preset" as const }
					: {}),
			},
		});
	};

	const selectCustomCanvasSize = () => {
		updateCustomCanvasSize({
			canvasSize: lastCustomCanvasSize ?? currentCanvasSize,
		});
	};

	const widthDraft = useCanvasDimensionDraft({
		value: currentCanvasSize.width,
		onCommit: (width) =>
			updateCustomCanvasSize({
				canvasSize: { width, height: currentCanvasSize.height },
			}),
	});

	const heightDraft = useCanvasDimensionDraft({
		value: currentCanvasSize.height,
		onCommit: (height) =>
			updateCustomCanvasSize({
				canvasSize: { width: currentCanvasSize.width, height },
			}),
	});

	const isCustomSelected = canvasSizeMode === "custom";

	const handleSaveTtsKeys = () => {
		saveStoredTtsCredentials({ credentials: ttsCredentials });
		toast.success("已保存 AI Key", {
			description: "密钥仅保存在当前浏览器，用于本机请求文字转语音。",
		});
	};

	const handleResetTtsKeys = () => {
		const emptyCredentials = createEmptyTtsStoredCredentials();
		setTtsCredentials(emptyCredentials);
		saveStoredTtsCredentials({ credentials: emptyCredentials });
		toast.success("已清空 AI Key");
	};

	const handleSaveDeepseekKey = () => {
		saveStoredDeepseekCredentials({ credentials: deepseekCredentials });
		toast.success("已保存 DeepSeek 配置", {
			description: "仅保存在当前浏览器，用于 AI 文案与旁白生成。",
		});
	};

	const handleResetDeepseekKey = () => {
		const emptyCredentials = createEmptyDeepseekStoredCredentials();
		setDeepseekCredentials(emptyCredentials);
		saveStoredDeepseekCredentials({ credentials: emptyCredentials });
		toast.success("已清空 DeepSeek 配置");
	};

	return (
		<PanelView
			contentClassName="px-0"
			scrollClassName="pt-0"
			actions={
				<Tabs
					value={view}
					onValueChange={(value) => {
						if (isSettingsView(value)) {
							setView(value);
						}
					}}
				>
					<TabsList>
						<TabsTrigger value="project-info">项目信息</TabsTrigger>
						<TabsTrigger value="background">背景</TabsTrigger>
						<TabsTrigger value="ai">AI</TabsTrigger>
					</TabsList>
				</Tabs>
			}
		>
			{view === "project-info" && (
				<div className="flex flex-col">
					<Section showTopBorder={false}>
						<SectionHeader>
							<SectionTitle className="flex-1">名称</SectionTitle>
							<span className="text-sm truncate">
								{activeProject.metadata.name}
							</span>
						</SectionHeader>
					</Section>
					<Section showTopBorder={false}>
						<SectionHeader className="justify-between">
							<SectionTitle className="flex-1">帧率</SectionTitle>
					<Select
							value={String(Math.round(frameRateToFloat(activeProject.settings.fps)))}
							onValueChange={(value) => {
								const fps = floatToFrameRate(parseFloat(value));
								editor.project.updateSettings({ settings: { fps } });
							}}
							>
								<SelectTrigger className="bg-transparent border-none p-1 h-auto">
									<SelectValue placeholder="选择帧率" />
								</SelectTrigger>
								<SelectContent>
									{FPS_PRESETS.map((preset) => (
										<SelectItem key={preset.value} value={preset.value}>
											{preset.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</SectionHeader>
					</Section>
					<Section
						showTopBorder={false}
						collapsible
						sectionKey="settings:aspect-ratio"
					>
						<SectionHeader>
							<SectionTitle className="flex-1">宽高比</SectionTitle>
						</SectionHeader>
						<SectionContent className="px-2 flex flex-col gap-1 pb-2">
							{presetItems.map((preset) => (
								<AspectRatioItem
									key={preset.id}
									label={preset.label}
									previewIcon={<AspectRatioPreview ratio={preset.ratio} />}
									isSelected={selectedPresetId === preset.id}
									onClick={() => {
										selectPresetCanvasSize({
											canvasSize: preset.canvasSize,
										});
									}}
								/>
							))}
							<div className="pb-2">
								<AspectRatioItem
									key="custom"
									label="自定义"
									previewIcon={<OcSquarePlusIcon />}
									isSelected={isCustomSelected}
									onClick={selectCustomCanvasSize}
									uiOptions={
										<div className=" flex items-center gap-2 text-foreground">
											<NumberField
												value={widthDraft.displayValue}
												className="w-full"
												aria-label="画布宽度"
												onFocus={widthDraft.onFocus}
												onChange={widthDraft.onChange}
												onBlur={widthDraft.onBlur}
											/>
											<NumberField
												value={heightDraft.displayValue}
												className="w-full"
												aria-label="画布高度"
												onFocus={heightDraft.onFocus}
												onChange={heightDraft.onChange}
												onBlur={heightDraft.onBlur}
											/>
										</div>
									}
								/>
							</div>
						</SectionContent>
					</Section>
				</div>
			)}
			{view === "background" && <BackgroundContent />}
			{view === "ai" && (
				<div className="flex flex-col">
					<Section showTopBorder={false}>
						<SectionHeader>
							<SectionTitle className="flex-1">DeepSeek 文案/旁白</SectionTitle>
						</SectionHeader>
						<SectionContent className="px-3 pb-3 pt-1">
							<div className="rounded-sm border bg-accent/30 px-3 py-2 text-xs text-muted-foreground">
								用于文字面板中的 AI 文案推荐和 AI 写旁白。密钥仅保存在当前浏览器，不会写入项目文件。
							</div>
							<div className="mt-3 rounded-sm border p-3">
								<p className="text-sm font-medium">DeepSeek API Key</p>
								<Input
									className="mt-3"
									type="password"
									showPassword={showDeepseekKey}
									onShowPasswordChange={setShowDeepseekKey}
									value={deepseekCredentials.apiKey}
									onChange={({ currentTarget }) =>
										setDeepseekCredentials((current) => ({
											...current,
											apiKey: currentTarget.value,
										}))
									}
									placeholder="输入 DeepSeek API Key"
								/>
								<Input
									className="mt-3"
									value={deepseekCredentials.baseUrl}
									onChange={({ currentTarget }) =>
										setDeepseekCredentials((current) => ({
											...current,
											baseUrl: currentTarget.value,
										}))
									}
									placeholder="DeepSeek Base URL（默认 https://api.deepseek.com）"
								/>
								<Input
									className="mt-3"
									value={deepseekCredentials.model}
									onChange={({ currentTarget }) =>
										setDeepseekCredentials((current) => ({
											...current,
											model: currentTarget.value,
										}))
									}
									placeholder="DeepSeek 模型（默认 deepseek-v4-flash）"
								/>
							</div>
							<div className="mt-3 flex justify-end gap-2">
								<Button variant="outline" onClick={handleResetDeepseekKey}>
									清空
								</Button>
								<Button onClick={handleSaveDeepseekKey}>保存</Button>
							</div>
						</SectionContent>
					</Section>

					<Section showTopBorder={false}>
						<SectionHeader>
							<SectionTitle className="flex-1">文字转语音 Key</SectionTitle>
						</SectionHeader>
						<SectionContent className="px-3 pb-3 pt-1">
							<div className="rounded-sm border bg-accent/30 px-3 py-2 text-xs text-muted-foreground">
								密钥仅保存在当前浏览器，用于调用本机的文字转语音接口，不会写入项目文件。Qwen 可额外配置 DashScope Base URL 以适配不同地域，MiniMax 支持同时保存按量 API Key 与 Token Plan Key。
							</div>
							<div className="mt-3 flex flex-col gap-3">
								{(["qwen", "minimax"] as const).map((provider) => (
									<div key={provider} className="rounded-sm border p-3">
										<div className="flex flex-col gap-1">
											<p className="text-sm font-medium">
												{TTS_PROVIDER_LABELS[provider]}
											</p>
											<p className="text-xs text-muted-foreground">
												默认模型：{TTS_PROVIDER_MODELS[provider]}
											</p>
										</div>
										<Input
											className="mt-3"
											type="password"
											showPassword={showKeys[provider]}
											onShowPasswordChange={(show) =>
												setShowKeys((current) => ({ ...current, [provider]: show }))
											}
											value={ttsCredentials.providerKeys[provider]}
											onChange={({ currentTarget }) =>
												setTtsCredentials((current) => ({
													...current,
													providerKeys: {
														...current.providerKeys,
														[provider]: currentTarget.value,
													},
												}))
											}
											placeholder={
												provider === "minimax"
													? "输入 MiniMax API Key / Token"
													: `输入 ${TTS_PROVIDER_LABELS[provider]} Key`
											}
										/>
										{provider === "minimax" && (
											<Input
												className="mt-3"
												type="password"
												showPassword={showMiniMaxTokenPlanKey}
												onShowPasswordChange={setShowMiniMaxTokenPlanKey}
												value={ttsCredentials.minimaxTokenPlanKey}
												onChange={({ currentTarget }) =>
													setTtsCredentials((current) => ({
														...current,
														minimaxTokenPlanKey: currentTarget.value,
													}))
												}
												placeholder="输入 MiniMax Token Plan Key（可选）"
											/>
										)}
										{provider === "qwen" && (
											<Input
												className="mt-3"
												value={ttsCredentials.qwenBaseUrl}
												onChange={({ currentTarget }) =>
													setTtsCredentials((current) => ({
														...current,
														qwenBaseUrl: currentTarget.value,
													}))
												}
												placeholder="输入 Qwen DashScope Base URL（可选）"
											/>
										)}
									</div>
								))}
							</div>
							<div className="mt-3 flex justify-end gap-2">
								<Button variant="outline" onClick={handleResetTtsKeys}>
									清空
								</Button>
								<Button onClick={handleSaveTtsKeys}>保存</Button>
							</div>
						</SectionContent>
					</Section>
				</div>
			)}
		</PanelView>
	);
}

function AspectRatioItem({
	label,
	previewIcon,
	isSelected,
	onClick,
	uiOptions,
}: {
	label: string;
	previewIcon: React.ReactNode;
	isSelected: boolean;
	onClick: () => void;
	uiOptions?: React.ReactNode;
}) {
	return (
		<Button
			variant={isSelected ? "secondary" : "ghost"}
			className={cn(
				"px-2 py-0 flex flex-col h-fit w-full",
				!isSelected && "border border-transparent opacity-75!",
			)}
			onClick={onClick}
		>
			<div className="w-full flex justify-between items-center h-8">
				<div className="flex-1 flex items-center gap-2">
					<div className="flex items-center justify-center size-5">
						{previewIcon}
					</div>
					<span className="text-sm truncate">{label}</span>
				</div>
				<div>
					{isSelected && <HugeiconsIcon icon={Tick02Icon} className="size-4" />}
				</div>
			</div>
			{uiOptions && isSelected && (
				<div className="w-full pb-2">{uiOptions}</div>
			)}
		</Button>
	);
}

function AspectRatioPreview({ ratio }: { ratio?: string }) {
	if (!ratio) return null;

	const [w, h] = ratio.split(":").map(Number);
	const maxSize = 16;
	const width = w >= h ? maxSize : (w / h) * maxSize;
	const height = h >= w ? maxSize : (h / w) * maxSize;

	return (
		<div
			style={{ width, height, borderWidth: 1.5 }}
			className="rounded-xs border-current opacity-60"
		/>
	);
}
