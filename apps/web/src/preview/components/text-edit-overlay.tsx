"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePreviewViewport } from "@/preview/components/preview-viewport";
import { useEditor } from "@/editor/use-editor";
import type { TextElement } from "@/timeline";
import { DEFAULTS } from "@/timeline/defaults";
import {
	getElementLocalTime,
} from "@/animation";
import { resolveTransformAtTime } from "@/rendering/animation-values";
import { buildTransformFromParams } from "@/rendering";
import { resolveTextLayout } from "@/text/primitives";
import {
	normalizeTextBackgroundShapePath,
	normalizeTextBackgroundVariant,
} from "@/text/background";
import {
	buildTextBackgroundFromElement,
	buildTextLayoutParamsFromElement,
} from "@/text/measure-element";

export function TextEditOverlay({
	trackId,
	elementId,
	element,
	onCommit,
}: {
	trackId: string;
	elementId: string;
	element: TextElement;
	onCommit: () => void;
}) {
	const editor = useEditor();
	const viewport = usePreviewViewport();
	const divRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const div = divRef.current;
		if (!div) return;
		div.focus();
		const range = document.createRange();
		range.selectNodeContents(div);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	}, []);

	const handleInput = useCallback(() => {
		const div = divRef.current;
		if (!div) return;
		const text = div.innerText;
		editor.timeline.previewElements({
			updates: [{ trackId, elementId, updates: { params: { content: text } } }],
		});
	}, [editor.timeline, trackId, elementId]);

	const handleKeyDown = useCallback(
		({ event }: { event: React.KeyboardEvent }) => {
			const { key } = event;
			if (key === "Escape") {
				event.preventDefault();
				onCommit();
				return;
			}
		},
		[onCommit],
	);

	const canvasSize = editor.project.getActive().settings.canvasSize;

	if (!canvasSize) return null;

	const currentTime = editor.playback.getCurrentTime();
	const localTime = getElementLocalTime({
		timelineTime: currentTime,
		elementStartTime: element.startTime,
		elementDuration: element.duration,
	});
	const transform = resolveTransformAtTime({
		baseTransform: buildTransformFromParams({ params: element.params }),
		animations: element.animations,
		localTime,
	});

	const { x: posX, y: posY } = viewport.positionToOverlay({
		positionX: transform.position.x,
		positionY: transform.position.y,
	});

	const { x: displayScaleX } = viewport.getDisplayScale();
	const textParams = buildTextLayoutParamsFromElement({ element });
	const resolvedTextLayout = resolveTextLayout({
		text: textParams,
		canvasHeight: canvasSize.height,
	});

	const lineHeight = textParams.lineHeight ?? DEFAULTS.text.lineHeight;
	const canvasLetterSpacing = textParams.letterSpacing ?? 0;
	const lineHeightPx = resolvedTextLayout.lineHeightPx;

	const bg = buildTextBackgroundFromElement({ element });
	const shouldShowBackground =
		bg.enabled && bg.color && bg.color !== "transparent";
	const fontSizeRatio = resolvedTextLayout.fontSizeRatio;
	const canvasPaddingX = shouldShowBackground
		? (bg.paddingX ?? DEFAULTS.text.background.paddingX) * fontSizeRatio
		: 0;
	const canvasPaddingY = shouldShowBackground
		? (bg.paddingY ?? DEFAULTS.text.background.paddingY) * fontSizeRatio
		: 0;
	const backgroundVariant = normalizeTextBackgroundVariant({ value: bg.variant });
	const shapePath = normalizeTextBackgroundShapePath({ value: bg.shapePath });
	const shapeFlipX = bg.shapeFlipX === true;
	const shapeFlipY = bg.shapeFlipY === true;
	const backgroundOpacity = Math.min(
		1,
		Math.max(0, (bg.opacity ?? DEFAULTS.text.background.opacity) / 100),
	);

	return (
		<div
			className="absolute"
			style={{
				left: posX,
				top: posY,
				transform: `translate(-50%, -50%) scale(${transform.scaleX * displayScaleX}, ${transform.scaleY * displayScaleX}) rotate(${transform.rotate}deg)`,
				transformOrigin: "center center",
			}}
		>
			<div className="relative">
				{shouldShowBackground && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0"
						style={{
							transform:
								shapeFlipX || shapeFlipY
									? `scale(${shapeFlipX ? -1 : 1}, ${shapeFlipY ? -1 : 1})`
									: undefined,
							opacity: backgroundOpacity,
						}}
					>
						<div
							className={
								backgroundVariant === "capsule"
									? "size-full rounded-full"
									: backgroundVariant === "speech-left" ||
										backgroundVariant === "speech-right"
										? "size-full rounded-[24px]"
									: backgroundVariant === "underline"
										? "absolute right-0 bottom-0 left-0 rounded-full"
									: backgroundVariant === "tape"
										? "size-full -rotate-2"
										: "size-full rounded-xl"
							}
							style={{
								backgroundColor: bg.color,
								height:
									backgroundVariant === "underline" ? `${Math.max(8, canvasPaddingY * 0.8)}px` : undefined,
								clipPath:
									shapePath === "sticker-cut"
										? "polygon(8% 0, 92% 0, 100% 18%, 100% 82%, 92% 100%, 8% 100%, 0 82%, 0 18%)"
										: shapePath === "speech-point"
											? "polygon(0 0, 100% 0, 100% 78%, 60% 78%, 50% 100%, 42% 78%, 0 78%)"
											: shapePath === "sticker-burst"
												? "polygon(50% 0, 61% 14%, 78% 6%, 80% 24%, 97% 25%, 87% 40%, 100% 52%, 83% 60%, 86% 78%, 68% 76%, 61% 94%, 50% 82%, 39% 94%, 32% 76%, 14% 78%, 17% 60%, 0 52%, 13% 40%, 3% 25%, 20% 24%, 22% 6%, 39% 14%)"
												: undefined,
							}}
						/>
						{(backgroundVariant === "speech-left" ||
							shapePath === "speech-round" ||
							shapePath === "speech-point") && (
							<div
								className={
									shapeFlipX
										? "absolute right-2 bottom-[-12px] h-5 w-5 -rotate-12"
										: "absolute bottom-[-12px] left-2 h-5 w-5 rotate-12"
								}
								style={{
									backgroundColor: bg.color,
									clipPath:
										shapePath === "speech-point"
											? "polygon(50% 100%, 0 0, 100% 0)"
											: "polygon(0 0, 100% 10%, 25% 100%)",
								}}
							/>
						)}
						{backgroundVariant === "speech-right" && shapePath === "none" && (
							<div
								className="absolute right-2 bottom-[-12px] h-5 w-5 -rotate-12"
								style={{
									backgroundColor: bg.color,
									clipPath: "polygon(75% 100%, 0 8%, 100% 0)",
								}}
							/>
						)}
					</div>
				)}
				<div
					ref={divRef}
					contentEditable
					suppressContentEditableWarning
					tabIndex={0}
					role="textbox"
					aria-label="编辑文字"
					className="cursor-text select-text outline-none whitespace-pre"
					style={{
						fontSize: resolvedTextLayout.scaledFontSize,
						fontFamily: textParams.fontFamily,
						fontWeight: textParams.fontWeight === "bold" ? "bold" : "normal",
						fontStyle: textParams.fontStyle === "italic" ? "italic" : "normal",
						textAlign: textParams.textAlign,
						letterSpacing: `${canvasLetterSpacing}px`,
						lineHeight,
						color: "transparent",
						caretColor:
							typeof element.params.color === "string"
								? element.params.color
								: "#ffffff",
						backgroundColor: "transparent",
						borderRadius:
							backgroundVariant === "capsule"
								? 999
								: backgroundVariant === "speech-left" ||
									backgroundVariant === "speech-right"
									? 24
									: backgroundVariant === "underline"
										? 0
										: undefined,
						minHeight: lineHeightPx,
						textDecoration: textParams.textDecoration ?? "none",
						padding: shouldShowBackground
							? `${canvasPaddingY}px ${canvasPaddingX}px`
							: 0,
						paddingBottom:
							shouldShowBackground && backgroundVariant === "underline"
								? `${canvasPaddingY + 6}px`
								: undefined,
						minWidth: 1,
						position: "relative",
						zIndex: 1,
						transform:
							shapeFlipX || shapeFlipY
								? `scale(${shapeFlipX ? -1 : 1}, ${shapeFlipY ? -1 : 1})`
								: undefined,
					}}
					onInput={handleInput}
					onBlur={onCommit}
					onKeyDown={(event) => handleKeyDown({ event })}
				>
					{textParams.content}
				</div>
			</div>
		</div>
	);
}
