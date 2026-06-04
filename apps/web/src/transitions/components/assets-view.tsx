"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { useEditor } from "@/editor/use-editor";
import { useElementSelection } from "@/timeline/hooks/element/use-element-selection";
import { setChannel } from "@/animation";
import type {
	ElementAnimations,
	ScalarAnimationChannel,
} from "@/animation/types";
import { cn } from "@/utils/ui";
import { generateUUID } from "@/utils/id";
import {
	ZERO_MEDIA_TIME,
	addMediaTime,
	mediaTimeFromSeconds,
	minMediaTime,
	roundMediaTime,
	subMediaTime,
	type MediaTime,
} from "@/wasm";
import type { TimelineElement, TimelineTrack } from "@/timeline";

type SupportedTransitionElement = Extract<
	TimelineElement,
	{ type: "video" | "image" | "text" | "sticker" | "graphic" }
>;

type SupportedDualTransitionElement = Extract<
	TimelineElement,
	{ type: "video" | "image" }
>;

type SelectedTarget<TElement extends TimelineElement = TimelineElement> = {
	track: TimelineTrack;
	element: TElement;
};

type TransitionPreset = {
	id: string;
	name: string;
	description: string;
	group: "入场" | "出场" | "组合";
	accentClassName: string;
	apply: ({
		element,
	}: {
		element: SupportedTransitionElement;
	}) => ElementAnimations | undefined;
};

type DualTransitionMode =
	| "existing-overlap"
	| "incoming-handle"
	| "outgoing-handle"
	| "compress";

type ReadyDualTransitionTarget = {
	status: "ready";
	left: SelectedTarget<SupportedDualTransitionElement>;
	right: SelectedTarget<SupportedDualTransitionElement>;
	overlap: MediaTime;
	mode: DualTransitionMode;
};

type DualTransitionTarget =
	| ReadyDualTransitionTarget
	| {
			status: "unavailable";
			message: string;
	  };

type DualTransitionPreset = {
	id: string;
	name: string;
	description: string;
	accentClassName: string;
	motion: "dissolve" | "push-left" | "push-right";
};

type TransitionWindow = {
	leftStart: MediaTime;
	leftEnd: MediaTime;
	rightStart: MediaTime;
	rightEnd: MediaTime;
};

const TRANSITION_MANAGED_PATHS = [
	"opacity",
	"transform.positionX",
	"transform.scaleX",
	"transform.scaleY",
] as const;

const PRESET_DURATION_SECONDS = 0.4;
const SLIDE_DISTANCE_PX = 240;
const ZOOM_SCALE_FACTOR = 1.08;

const SINGLE_TRANSITION_PRESETS: readonly TransitionPreset[] = [
	{
		id: "fade-in",
		name: "淡入",
		description: "片段开始时从透明过渡到可见。",
		group: "入场",
		accentClassName: "from-sky-500/20 via-cyan-500/10 to-transparent",
		apply: ({ element }) => {
			const duration = resolveOneSidedDuration({ element });
			return setScalarChannel({
				animations: clearManagedChannels({ animations: element.animations }),
				propertyPath: "opacity",
				keys: [
					{ time: ZERO_MEDIA_TIME, value: 0 },
					{ time: duration, value: getBaseOpacity({ element }) },
				],
			});
		},
	},
	{
		id: "zoom-in",
		name: "缩放淡入",
		description: "轻微放大并淡入，适合人物和封面。",
		group: "入场",
		accentClassName: "from-amber-500/20 via-orange-500/10 to-transparent",
		apply: ({ element }) => {
			const duration = resolveOneSidedDuration({ element });
			const baseOpacity = getBaseOpacity({ element });
			const baseScaleX = getNumericParam({
				element,
				key: "transform.scaleX",
				fallback: 1,
			});
			const baseScaleY = getNumericParam({
				element,
				key: "transform.scaleY",
				fallback: 1,
			});
			let animations = clearManagedChannels({ animations: element.animations });
			animations = setScalarChannel({
				animations,
				propertyPath: "opacity",
				keys: [
					{ time: ZERO_MEDIA_TIME, value: 0 },
					{ time: duration, value: baseOpacity },
				],
			});
			animations = setScalarChannel({
				animations,
				propertyPath: "transform.scaleX",
				keys: [
					{ time: ZERO_MEDIA_TIME, value: baseScaleX * ZOOM_SCALE_FACTOR },
					{ time: duration, value: baseScaleX },
				],
			});
			return setScalarChannel({
				animations,
				propertyPath: "transform.scaleY",
				keys: [
					{ time: ZERO_MEDIA_TIME, value: baseScaleY * ZOOM_SCALE_FACTOR },
					{ time: duration, value: baseScaleY },
				],
			});
		},
	},
	{
		id: "slide-in-left",
		name: "左滑入",
		description: "从左侧滑入并带一点透明过渡。",
		group: "入场",
		accentClassName: "from-emerald-500/20 via-teal-500/10 to-transparent",
		apply: ({ element }) => buildSlideEnterAnimations({ element, direction: "left" }),
	},
	{
		id: "slide-in-right",
		name: "右滑入",
		description: "从右侧滑入，适合介绍类镜头。",
		group: "入场",
		accentClassName: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
		apply: ({ element }) => buildSlideEnterAnimations({ element, direction: "right" }),
	},
	{
		id: "fade-out",
		name: "淡出",
		description: "片段结束时平滑淡出。",
		group: "出场",
		accentClassName: "from-rose-500/20 via-pink-500/10 to-transparent",
		apply: ({ element }) => {
			const duration = resolveOneSidedDuration({ element });
			const startTime = subMediaTime({ a: element.duration, b: duration });
			return setScalarChannel({
				animations: clearManagedChannels({ animations: element.animations }),
				propertyPath: "opacity",
				keys: [
					{ time: startTime, value: getBaseOpacity({ element }) },
					{ time: element.duration, value: 0 },
				],
			});
		},
	},
	{
		id: "slide-out-left",
		name: "左滑出",
		description: "向左滑出并淡出。",
		group: "出场",
		accentClassName: "from-indigo-500/20 via-blue-500/10 to-transparent",
		apply: ({ element }) => buildSlideExitAnimations({ element, direction: "left" }),
	},
	{
		id: "slide-out-right",
		name: "右滑出",
		description: "向右滑出并淡出。",
		group: "出场",
		accentClassName: "from-lime-500/20 via-green-500/10 to-transparent",
		apply: ({ element }) => buildSlideExitAnimations({ element, direction: "right" }),
	},
	{
		id: "fade-in-out",
		name: "淡入淡出",
		description: "片段开头和结尾都做常规淡化。",
		group: "组合",
		accentClassName: "from-zinc-500/20 via-slate-500/10 to-transparent",
		apply: ({ element }) => {
			const duration = resolveDualSidedDuration({ element });
			const endFadeStart = subMediaTime({ a: element.duration, b: duration });
			return setScalarChannel({
				animations: clearManagedChannels({ animations: element.animations }),
				propertyPath: "opacity",
				keys: [
					{ time: ZERO_MEDIA_TIME, value: 0 },
					{ time: duration, value: getBaseOpacity({ element }) },
					{ time: endFadeStart, value: getBaseOpacity({ element }) },
					{ time: element.duration, value: 0 },
				],
			});
		},
	},
	{
		id: "clear-transition",
		name: "清除转场",
		description: "移除本面板管理的透明度、位移和缩放关键帧。",
		group: "组合",
		accentClassName: "from-muted/50 via-muted/15 to-transparent",
		apply: ({ element }) => clearManagedChannels({ animations: element.animations }),
	},
] as const;

const DUAL_TRANSITION_PRESETS: readonly DualTransitionPreset[] = [
	{
		id: "cross-dissolve",
		name: "交叉溶解",
		description: "让当前片段与右侧相邻片段真实重叠并做交叉淡化。",
		accentClassName: "from-sky-500/20 via-cyan-500/10 to-transparent",
		motion: "dissolve",
	},
	{
		id: "push-left",
		name: "向左推入",
		description: "右侧片段从右向左推进，同时把左侧片段推出画面。",
		accentClassName: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
		motion: "push-left",
	},
	{
		id: "push-right",
		name: "向右推入",
		description: "右侧片段从左向右推进，适合节奏更强的转场。",
		accentClassName: "from-emerald-500/20 via-teal-500/10 to-transparent",
		motion: "push-right",
	},
] as const;

export function TransitionsView() {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();
	const selectedElementsWithTracks = useMemo(
		() => editor.timeline.getElementsWithTracks({ elements: selectedElements }),
		[editor, selectedElements],
	);
	const selectedTargets = useMemo(
		() =>
			selectedElementsWithTracks.filter(({ element }) =>
				isSupportedTransitionElement({ element }),
			),
		[selectedElementsWithTracks],
	);
	const dualTransitionTarget = useMemo(
		() =>
			resolveDualTransitionTarget({
				selectedElementsWithTracks,
			}),
		[selectedElementsWithTracks],
	);

	const handleApplyPreset = ({ preset }: { preset: TransitionPreset }) => {
		if (selectedElements.length === 0) {
			toast.error("请先在时间线中选择一个片段", {
				description: "转场预设会作用到当前选中的视频、图片、文字、贴纸或图形元素。",
			});
			return;
		}

		if (selectedTargets.length === 0) {
			toast.error("当前选择不支持单片段转场预设", {
				description: "请改为选择视频、图片、文字、贴纸或图形元素。",
			});
			return;
		}

		editor.timeline.updateElements({
			updates: selectedTargets.map(({ track, element }) => ({
				trackId: track.id,
				elementId: element.id,
				patch: {
					animations: preset.apply({ element }),
				},
			})),
		});

		toast.success(`已应用“${preset.name}”`, {
			description:
				selectedTargets.length === 1
					? "对应片段的转场关键帧已更新。"
					: `已更新 ${selectedTargets.length} 个片段的转场关键帧。`,
		});
	};

	const handleApplyDualPreset = ({ preset }: { preset: DualTransitionPreset }) => {
		if (dualTransitionTarget.status !== "ready") {
			toast.error("当前无法应用双片段转场", {
				description: dualTransitionTarget.message,
			});
			return;
		}

		const { updates, description } = buildDualTransitionUpdates({
			pair: dualTransitionTarget,
			motion: preset.motion,
		});

		editor.timeline.updateElements({ updates });

		toast.success(`已应用“${preset.name}”`, {
			description,
		});
	};

	return (
		<PanelView title="转场" contentClassName="px-3 pb-4">
			<div className="flex flex-col gap-4 py-2">
				<div className="rounded-sm border bg-accent/40 p-3">
					<p className="text-sm font-medium">常用转场预设</p>
					<p className="text-muted-foreground mt-1 text-xs leading-5">
						上半部分是单片段入场/出场预设，下半部分是更接近剪辑软件的双片段转场。双片段转场会基于当前选中片段与其右侧相邻片段创建真实重叠区域。
					</p>
					<p className="text-muted-foreground mt-2 text-xs">
						当前可作用单片段：{selectedTargets.length} 个
					</p>
				</div>

				<section className="flex flex-col gap-2 rounded-sm border bg-background p-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium">双片段转场</h3>
						<span className="text-muted-foreground text-xs">
							{dualTransitionTarget.status === "ready" ? "已就绪" : "待选择"}
						</span>
					</div>
					<p className="text-muted-foreground text-xs leading-5">
						{dualTransitionTarget.status === "ready"
							? `当前目标：${getTransitionDisplayName(dualTransitionTarget.left.element.name)} → ${getTransitionDisplayName(dualTransitionTarget.right.element.name)}`
							: dualTransitionTarget.message}
					</p>
					{dualTransitionTarget.status === "ready" && (
						<p className="text-muted-foreground text-xs leading-5">
							{getDualTransitionModeMessage({ mode: dualTransitionTarget.mode })}
						</p>
					)}
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
						{DUAL_TRANSITION_PRESETS.map((preset) => (
							<button
								key={preset.id}
								type="button"
								onClick={() => handleApplyDualPreset({ preset })}
								className="group overflow-hidden rounded-sm border text-left transition-colors hover:border-primary hover:bg-accent/40"
							>
								<div
									className={cn(
										"flex h-18 items-end border-b bg-linear-to-br px-3 py-2",
										preset.accentClassName,
									)}
								>
									<div className="text-base font-medium">{preset.name}</div>
								</div>
							</button>
						))}
					</div>
				</section>

				{(["入场", "出场", "组合"] as const).map((group) => {
					const presets = SINGLE_TRANSITION_PRESETS.filter(
						(preset) => preset.group === group,
					);
					return (
						<section key={group} className="flex flex-col gap-2">
							<div className="flex items-center justify-between px-1">
								<h3 className="text-sm font-medium">{group}</h3>
								<span className="text-muted-foreground text-xs">
									{presets.length} 个预设
								</span>
							</div>
							<div className="grid grid-cols-2 gap-2">
								{presets.map((preset) => (
									<button
										key={preset.id}
										type="button"
										onClick={() => handleApplyPreset({ preset })}
										className="group overflow-hidden rounded-sm border bg-background text-left transition-colors hover:border-primary hover:bg-accent/40"
									>
										<div
											className={cn(
												"flex h-18 items-end border-b bg-linear-to-br px-3 py-2",
												preset.accentClassName,
											)}
										>
											<div className="text-base font-medium">{preset.name}</div>
										</div>
									</button>
								))}
							</div>
						</section>
					);
				})}
			</div>
		</PanelView>
	);
}

function isSupportedTransitionElement({
	element,
}: {
	element: TimelineElement;
}): element is SupportedTransitionElement {
	return (
		element.type === "video" ||
		element.type === "image" ||
		element.type === "text" ||
		element.type === "sticker" ||
		element.type === "graphic"
	);
}

function isSupportedDualTransitionElement({
	element,
}: {
	element: TimelineElement;
}): element is SupportedDualTransitionElement {
	return element.type === "video" || element.type === "image";
}

function isDualTransitionTarget(
	target: SelectedTarget,
): target is SelectedTarget<SupportedDualTransitionElement> {
	return isSupportedDualTransitionElement({ element: target.element });
}

function getTransitionDisplayName(name: string): string {
	const fileName = name.split(/[\\/]/).pop() ?? name;
	return fileName.replace(/\.[^.]+$/, "");
}

function getNumericParam({
	element,
	key,
	fallback,
}: {
	element: SupportedTransitionElement;
	key: string;
	fallback: number;
}): number {
	const value = element.params[key];
	return typeof value === "number" ? value : fallback;
}

function getBaseOpacity({ element }: { element: SupportedTransitionElement }): number {
	return getNumericParam({ element, key: "opacity", fallback: 1 });
}

function resolveOneSidedDuration({
	element,
}: {
	element: SupportedTransitionElement;
}): MediaTime {
	const desired = mediaTimeFromSeconds({ seconds: PRESET_DURATION_SECONDS });
	return roundMediaTime({
		time: Math.max(
			1,
			Math.min(Number(desired), Math.max(1, Number(element.duration) - 1)),
		),
	});
}

function resolveDualSidedDuration({
	element,
}: {
	element: SupportedTransitionElement;
}): MediaTime {
	const desired = mediaTimeFromSeconds({ seconds: PRESET_DURATION_SECONDS });
	return roundMediaTime({
		time: Math.max(
			1,
			Math.min(Number(desired), Math.max(1, Number(element.duration) / 3)),
		),
	});
}

function resolvePairDesiredOverlap({
	left,
	right,
}: {
	left: SupportedDualTransitionElement;
	right: SupportedDualTransitionElement;
}): MediaTime {
	const desired = mediaTimeFromSeconds({ seconds: PRESET_DURATION_SECONDS });
	return roundMediaTime({
		time: Math.max(
			1,
			Math.min(
				Number(desired),
				Math.max(1, Number(left.duration) / 4),
				Math.max(1, Number(right.duration) / 4),
			),
		),
	});
}

function clearManagedChannels({
	animations,
}: {
	animations: ElementAnimations | undefined;
}): ElementAnimations | undefined {
	return TRANSITION_MANAGED_PATHS.reduce<ElementAnimations | undefined>(
		(nextAnimations, propertyPath) =>
			setChannel({
				animations: nextAnimations,
				propertyPath,
				channel: undefined,
			}),
		animations,
	);
}

function buildScalarChannel({
	keys,
}: {
	keys: Array<{ time: MediaTime; value: number }>;
}): ScalarAnimationChannel {
	return {
		keys: keys.map(({ time, value }) => ({
			id: generateUUID(),
			time,
			value,
			segmentToNext: "linear",
			tangentMode: "flat",
		})),
	};
}

function setScalarChannel({
	animations,
	propertyPath,
	keys,
}: {
	animations: ElementAnimations | undefined;
	propertyPath: string;
	keys: Array<{ time: MediaTime; value: number }>;
}): ElementAnimations | undefined {
	return setChannel({
		animations,
		propertyPath,
		channel: buildScalarChannel({ keys }),
	});
}

function buildSlideEnterAnimations({
	element,
	direction,
}: {
	element: SupportedTransitionElement;
	direction: "left" | "right";
}): ElementAnimations | undefined {
	const duration = resolveOneSidedDuration({ element });
	const baseOpacity = getBaseOpacity({ element });
	const baseX = getNumericParam({
		element,
		key: "transform.positionX",
		fallback: 0,
	});
	const offset = direction === "left" ? -SLIDE_DISTANCE_PX : SLIDE_DISTANCE_PX;
	let animations = clearManagedChannels({ animations: element.animations });
	animations = setScalarChannel({
		animations,
		propertyPath: "opacity",
		keys: [
			{ time: ZERO_MEDIA_TIME, value: 0 },
			{ time: duration, value: baseOpacity },
		],
	});
	return setScalarChannel({
		animations,
		propertyPath: "transform.positionX",
		keys: [
			{ time: ZERO_MEDIA_TIME, value: baseX + offset },
			{ time: duration, value: baseX },
		],
	});
}

function buildSlideExitAnimations({
	element,
	direction,
}: {
	element: SupportedTransitionElement;
	direction: "left" | "right";
}): ElementAnimations | undefined {
	const duration = resolveOneSidedDuration({ element });
	const baseOpacity = getBaseOpacity({ element });
	const baseX = getNumericParam({
		element,
		key: "transform.positionX",
		fallback: 0,
	});
	const startTime = subMediaTime({ a: element.duration, b: duration });
	const offset = direction === "left" ? -SLIDE_DISTANCE_PX : SLIDE_DISTANCE_PX;
	let animations = clearManagedChannels({ animations: element.animations });
	animations = setScalarChannel({
		animations,
		propertyPath: "opacity",
		keys: [
			{ time: startTime, value: baseOpacity },
			{ time: element.duration, value: 0 },
		],
	});
	return setScalarChannel({
		animations,
		propertyPath: "transform.positionX",
		keys: [
			{ time: startTime, value: baseX },
			{ time: element.duration, value: baseX + offset },
		],
	});
}

function resolveDualTransitionTarget({
	selectedElementsWithTracks,
}: {
	selectedElementsWithTracks: Array<SelectedTarget>;
}): DualTransitionTarget {
	const selectedClips = selectedElementsWithTracks.filter(isDualTransitionTarget);

	if (selectedClips.length === 0) {
		return {
			status: "unavailable",
			message: "先选中一个视频或图片片段，双片段转场会自动寻找它右侧的相邻片段。",
		};
	}

	if (selectedClips.length > 2) {
		return {
			status: "unavailable",
			message: "双片段转场目前一次只支持 1 到 2 个视频/图片片段。",
		};
	}

	let left: SelectedTarget<SupportedDualTransitionElement>;
	let right: SelectedTarget<SupportedDualTransitionElement> | null = null;

	if (selectedClips.length === 2) {
		const sorted = [...selectedClips].sort(
			(a, b) => a.element.startTime - b.element.startTime,
		);
		[left, right] = sorted;
		if (left.track.id !== right.track.id) {
			return {
				status: "unavailable",
				message: "请选择同一轨道上的相邻两个视频或图片片段。",
			};
		}
		if (!isImmediateNextClip({ left, right })) {
			return {
				status: "unavailable",
				message: "请选择同一轨道上的相邻两个视频或图片片段。",
			};
		}
	} else {
		left = selectedClips[0];
		right = findNextClipOnTrack({ track: left.track, elementId: left.element.id });
		if (!right) {
			return {
				status: "unavailable",
				message: "当前选中片段右侧没有相邻的视频或图片片段。",
			};
		}
	}

	const leftEndTime = addMediaTime({
		a: left.element.startTime,
		b: left.element.duration,
	});
	const gap = right.element.startTime - leftEndTime;

	if (gap > ZERO_MEDIA_TIME) {
		return {
			status: "unavailable",
			message: "两个片段之间还有空隙，请先让它们首尾贴紧再应用双片段转场。",
		};
	}

	const desiredOverlap = resolvePairDesiredOverlap({
		left: left.element,
		right: right.element,
	});

	if (gap < ZERO_MEDIA_TIME) {
		const currentOverlap = roundMediaTime({ time: Math.abs(Number(gap)) });
		return {
			status: "ready",
			left,
			right,
			overlap: minMediaTime({ a: desiredOverlap, b: currentOverlap }),
			mode: "existing-overlap",
		};
	}

	const incomingHandle = minMediaTime({
		a: desiredOverlap,
		b: right.element.trimStart,
	});
	const outgoingHandle = minMediaTime({
		a: desiredOverlap,
		b: left.element.trimEnd,
	});

	if (incomingHandle > ZERO_MEDIA_TIME || outgoingHandle > ZERO_MEDIA_TIME) {
		if (incomingHandle >= outgoingHandle && incomingHandle > ZERO_MEDIA_TIME) {
			return {
				status: "ready",
				left,
				right,
				overlap: incomingHandle,
				mode: "incoming-handle",
			};
		}
		return {
			status: "ready",
			left,
			right,
			overlap: outgoingHandle,
			mode: "outgoing-handle",
		};
	}

	return {
		status: "ready",
		left,
		right,
		overlap: desiredOverlap,
		mode: "compress",
	};
}

function findNextClipOnTrack({
	track,
	elementId,
}: {
	track: TimelineTrack;
	elementId: string;
}): SelectedTarget<SupportedDualTransitionElement> | null {
	const clips = track.elements
		.filter((element) => isSupportedDualTransitionElement({ element }))
		.slice()
		.sort((a, b) => {
			if (a.startTime !== b.startTime) {
				return a.startTime - b.startTime;
			}
			return a.id.localeCompare(b.id);
		});
	const currentIndex = clips.findIndex((element) => element.id === elementId);
	const nextElement = currentIndex >= 0 ? clips[currentIndex + 1] : null;
	if (!nextElement) {
		return null;
	}
	return { track, element: nextElement };
}

function isImmediateNextClip({
	left,
	right,
}: {
	left: SelectedTarget<SupportedDualTransitionElement>;
	right: SelectedTarget<SupportedDualTransitionElement>;
}): boolean {
	const next = findNextClipOnTrack({
		track: left.track,
		elementId: left.element.id,
	});
	return next?.element.id === right.element.id;
}

function resolveTransitionWindow({
	pair,
}: {
	pair: ReadyDualTransitionTarget;
}): TransitionWindow {
	if (pair.mode === "existing-overlap") {
		const leftEndTimeline = addMediaTime({
			a: pair.left.element.startTime,
			b: pair.left.element.duration,
		});
		const rightWindowEnd = subMediaTime({
			a: leftEndTimeline,
			b: pair.right.element.startTime,
		});
		return {
			leftStart: subMediaTime({ a: pair.left.element.duration, b: pair.overlap }),
			leftEnd: pair.left.element.duration,
			rightStart: subMediaTime({ a: rightWindowEnd, b: pair.overlap }),
			rightEnd: rightWindowEnd,
		};
	}

	if (pair.mode === "outgoing-handle") {
		return {
			leftStart: pair.left.element.duration,
			leftEnd: addMediaTime({ a: pair.left.element.duration, b: pair.overlap }),
			rightStart: ZERO_MEDIA_TIME,
			rightEnd: pair.overlap,
		};
	}

	return {
		leftStart: subMediaTime({ a: pair.left.element.duration, b: pair.overlap }),
		leftEnd: pair.left.element.duration,
		rightStart: ZERO_MEDIA_TIME,
		rightEnd: pair.overlap,
	};
}

function buildDualTransitionUpdates({
	pair,
	motion,
}: {
	pair: ReadyDualTransitionTarget;
	motion: DualTransitionPreset["motion"];
}): {
	updates: Array<{
		trackId: string;
		elementId: string;
		patch: Partial<TimelineElement>;
	}>;
	description: string;
} {
	const window = resolveTransitionWindow({ pair });
	const leftBaseOpacity = getBaseOpacity({ element: pair.left.element });
	const rightBaseOpacity = getBaseOpacity({ element: pair.right.element });
	const leftBaseX = getNumericParam({
		element: pair.left.element,
		key: "transform.positionX",
		fallback: 0,
	});
	const rightBaseX = getNumericParam({
		element: pair.right.element,
		key: "transform.positionX",
		fallback: 0,
	});

	let leftAnimations = clearManagedChannels({
		animations: pair.left.element.animations,
	});
	let rightAnimations = clearManagedChannels({
		animations: pair.right.element.animations,
	});

	leftAnimations = setScalarChannel({
		animations: leftAnimations,
		propertyPath: "opacity",
		keys: [
			{ time: window.leftStart, value: leftBaseOpacity },
			{ time: window.leftEnd, value: 0 },
		],
	});
	rightAnimations = setScalarChannel({
		animations: rightAnimations,
		propertyPath: "opacity",
		keys: [
			{ time: window.rightStart, value: 0 },
			{ time: window.rightEnd, value: rightBaseOpacity },
		],
	});

	if (motion !== "dissolve") {
		const direction = motion === "push-left" ? "left" : "right";
		const leftOffset = direction === "left" ? -SLIDE_DISTANCE_PX : SLIDE_DISTANCE_PX;
		const rightOffset = direction === "left" ? SLIDE_DISTANCE_PX : -SLIDE_DISTANCE_PX;
		leftAnimations = setScalarChannel({
			animations: leftAnimations,
			propertyPath: "transform.positionX",
			keys: [
				{ time: window.leftStart, value: leftBaseX },
				{ time: window.leftEnd, value: leftBaseX + leftOffset },
			],
		});
		rightAnimations = setScalarChannel({
			animations: rightAnimations,
			propertyPath: "transform.positionX",
			keys: [
				{ time: window.rightStart, value: rightBaseX + rightOffset },
				{ time: window.rightEnd, value: rightBaseX },
			],
		});
	}

	const leftPatch: Partial<TimelineElement> = {
		animations: leftAnimations,
	};
	const rightPatch: Partial<TimelineElement> = {
		animations: rightAnimations,
	};

	if (pair.mode === "incoming-handle") {
		rightPatch.startTime = subMediaTime({
			a: pair.right.element.startTime,
			b: pair.overlap,
		});
		rightPatch.duration = addMediaTime({
			a: pair.right.element.duration,
			b: pair.overlap,
		});
		rightPatch.trimStart = subMediaTime({
			a: pair.right.element.trimStart,
			b: pair.overlap,
		});
	}

	if (pair.mode === "outgoing-handle") {
		leftPatch.duration = addMediaTime({
			a: pair.left.element.duration,
			b: pair.overlap,
		});
		leftPatch.trimEnd = subMediaTime({
			a: pair.left.element.trimEnd,
			b: pair.overlap,
		});
	}

	if (pair.mode === "compress") {
		rightPatch.startTime = subMediaTime({
			a: pair.right.element.startTime,
			b: pair.overlap,
		});
	}

	return {
		updates: [
			{
				trackId: pair.left.track.id,
				elementId: pair.left.element.id,
				patch: leftPatch,
			},
			{
				trackId: pair.right.track.id,
				elementId: pair.right.element.id,
				patch: rightPatch,
			},
		],
		description: getDualTransitionModeMessage({ mode: pair.mode }),
	};
}

function getDualTransitionModeMessage({
	mode,
}: {
	mode: DualTransitionMode;
}): string {
	if (mode === "existing-overlap") {
		return "已使用两个片段当前已有的重叠区来生成双片段转场。";
	}
	if (mode === "incoming-handle") {
		return "已借用右侧片段前置句柄创建重叠区，整体时长保持不变。";
	}
	if (mode === "outgoing-handle") {
		return "已借用左侧片段尾部句柄创建重叠区，整体时长保持不变。";
	}
	return "素材没有可用句柄，已通过提前右侧片段来创建真实重叠区；这会压缩该处时间线衔接。";
}