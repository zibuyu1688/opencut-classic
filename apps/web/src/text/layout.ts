import {
	normalizeTextBackgroundShapePath,
	normalizeTextBackgroundVariant,
	type TextBackground,
} from "@/text/background";
import { DEFAULTS } from "@/timeline/defaults";
import type { TextAlign } from "@/text/primitives";

type TextRect = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export interface TextBlockMeasurement {
	visualCenterOffset: number;
	height: number;
	maxWidth: number;
}

export interface TextVisualPadding {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export type TextCanvasContext =
	| CanvasRenderingContext2D
	| OffscreenCanvasRenderingContext2D;

const TEXT_DECORATION_THICKNESS_RATIO = 0.07;
const STRIKETHROUGH_VERTICAL_RATIO = 0.35;

export function setCanvasLetterSpacing({
	ctx,
	letterSpacingPx,
}: {
	ctx: TextCanvasContext;
	letterSpacingPx: number;
}): void {
	if ("letterSpacing" in ctx) {
		Reflect.set(ctx, "letterSpacing", `${letterSpacingPx}px`);
	}
}

export function getMetricAscent({
	metrics,
	fallbackFontSize,
}: {
	metrics: TextMetrics;
	fallbackFontSize: number;
}): number {
	return metrics.actualBoundingBoxAscent ?? fallbackFontSize * 0.8;
}

export function getMetricDescent({
	metrics,
	fallbackFontSize,
}: {
	metrics: TextMetrics;
	fallbackFontSize: number;
}): number {
	return metrics.actualBoundingBoxDescent ?? fallbackFontSize * 0.2;
}

export function measureTextBlock({
	lineMetrics,
	lineHeightPx,
}: {
	lineMetrics: TextMetrics[];
	lineHeightPx: number;
}): TextBlockMeasurement {
	let maxWidth = 0;

	for (const metrics of lineMetrics) {
		maxWidth = Math.max(maxWidth, metrics.width);
	}

	const lineCount = lineMetrics.length;
	const height = lineCount * lineHeightPx;
	const visualCenterOffset = ((lineCount - 1) * lineHeightPx) / 2;

	return { visualCenterOffset, height, maxWidth };
}

function getTextRect({
	textAlign,
	block,
}: {
	textAlign: TextAlign;
	block: TextBlockMeasurement;
}): TextRect {
	const textAlignToLeft: Record<typeof textAlign, number> = {
		left: 0,
		right: -block.maxWidth,
		center: -block.maxWidth / 2,
	};
	const left = textAlignToLeft[textAlign];

	return {
		left,
		top: -block.height / 2,
		width: block.maxWidth,
		height: block.height,
	};
}

function isTextBackgroundVisible({
	background,
}: {
	background: TextBackground;
}): boolean {
	return (
		background.enabled &&
		Boolean(background.color) &&
		background.color !== "transparent"
	);
}

export function getTextBackgroundRect({
	textAlign,
	block,
	background,
	fontSizeRatio = 1,
}: {
	textAlign: TextAlign;
	block: TextBlockMeasurement;
	background: TextBackground;
	fontSizeRatio?: number;
}): TextRect | null {
	if (!isTextBackgroundVisible({ background })) {
		return null;
	}

	const textRect = getTextRect({ textAlign, block });
	const paddingX =
		(background.paddingX ?? DEFAULTS.text.background.paddingX) * fontSizeRatio;
	const paddingY =
		(background.paddingY ?? DEFAULTS.text.background.paddingY) * fontSizeRatio;
	const offsetX = background.offsetX ?? DEFAULTS.text.background.offsetX;
	const offsetY = background.offsetY ?? DEFAULTS.text.background.offsetY;
	const variant = normalizeTextBackgroundVariant({ value: background.variant });

	if (variant === "underline") {
		const stripHeight = Math.max(textRect.height * 0.34, paddingY * 1.25);
		return {
			left: textRect.left - paddingX + offsetX,
			top: textRect.top + textRect.height - stripHeight * 0.68 + offsetY,
			width: textRect.width + paddingX * 2,
			height: stripHeight,
		};
	}

	return {
		left: textRect.left - paddingX + offsetX,
		top: textRect.top - paddingY + offsetY,
		width: textRect.width + paddingX * 2,
		height: textRect.height + paddingY * 2,
	};
}

export function getTextBackgroundVisualPadding({
	background,
	fontSizeRatio = 1,
}: {
	background: TextBackground;
	fontSizeRatio?: number;
}): TextVisualPadding {
	const variant = normalizeTextBackgroundVariant({ value: background.variant });
	const shapePath = normalizeTextBackgroundShapePath({
		value: background.shapePath,
	});
	const tailWidth = 18 * fontSizeRatio;
	const tailHeight = 16 * fontSizeRatio;

	const basePadding =
		variant === "speech-left"
			? { left: tailWidth, top: 0, right: 0, bottom: tailHeight }
			: variant === "speech-right"
				? { left: 0, top: 0, right: tailWidth, bottom: tailHeight }
			: variant === "tape"
				? {
						left: 8 * fontSizeRatio,
						top: 2 * fontSizeRatio,
						right: 8 * fontSizeRatio,
						bottom: 2 * fontSizeRatio,
					}
				: variant === "underline"
					? { left: 0, top: 0, right: 0, bottom: 6 * fontSizeRatio }
					: { left: 0, top: 0, right: 0, bottom: 0 };

	const shapePadding =
		shapePath === "speech-round" || shapePath === "speech-point"
			? {
					left: Math.max(basePadding.left, 12 * fontSizeRatio),
					top: basePadding.top,
					right: Math.max(basePadding.right, 12 * fontSizeRatio),
					bottom: Math.max(basePadding.bottom, 18 * fontSizeRatio),
				}
			: shapePath === "sticker-cut"
				? {
						left: Math.max(basePadding.left, 8 * fontSizeRatio),
						top: Math.max(basePadding.top, 4 * fontSizeRatio),
						right: Math.max(basePadding.right, 8 * fontSizeRatio),
						bottom: Math.max(basePadding.bottom, 4 * fontSizeRatio),
					}
				: shapePath === "sticker-cloud"
					? {
							left: Math.max(basePadding.left, 12 * fontSizeRatio),
							top: Math.max(basePadding.top, 10 * fontSizeRatio),
							right: Math.max(basePadding.right, 12 * fontSizeRatio),
							bottom: Math.max(basePadding.bottom, 10 * fontSizeRatio),
						}
					: shapePath === "sticker-burst"
						? {
								left: Math.max(basePadding.left, 14 * fontSizeRatio),
								top: Math.max(basePadding.top, 14 * fontSizeRatio),
								right: Math.max(basePadding.right, 14 * fontSizeRatio),
								bottom: Math.max(basePadding.bottom, 14 * fontSizeRatio),
							}
						: basePadding;

	return shapePadding;
}

export function getTextVisualRect({
	textAlign,
	block,
	background,
	fontSizeRatio = 1,
	visualPadding,
}: {
	textAlign: TextAlign;
	block: TextBlockMeasurement;
	background: TextBackground;
	fontSizeRatio?: number;
	visualPadding?: TextVisualPadding;
}): TextRect {
	const textRect = getTextRect({ textAlign, block });
	const backgroundRect = getTextBackgroundRect({
		textAlign,
		block,
		background,
		fontSizeRatio,
	});

	const baseRect = !backgroundRect
		? textRect
		: {
				left: Math.min(textRect.left, backgroundRect.left),
				top: Math.min(textRect.top, backgroundRect.top),
				width:
					Math.max(
						textRect.left + textRect.width,
						backgroundRect.left + backgroundRect.width,
					) - Math.min(textRect.left, backgroundRect.left),
				height:
					Math.max(
						textRect.top + textRect.height,
						backgroundRect.top + backgroundRect.height,
					) - Math.min(textRect.top, backgroundRect.top),
			};
	const backgroundVisualPadding = background.enabled
		? getTextBackgroundVisualPadding({ background, fontSizeRatio })
		: { left: 0, top: 0, right: 0, bottom: 0 };
	const mergedVisualPadding = visualPadding
		? {
				left: Math.max(visualPadding.left, backgroundVisualPadding.left),
				top: Math.max(visualPadding.top, backgroundVisualPadding.top),
				right: Math.max(visualPadding.right, backgroundVisualPadding.right),
				bottom: Math.max(visualPadding.bottom, backgroundVisualPadding.bottom),
			}
		: backgroundVisualPadding;

	if (
		mergedVisualPadding.left === 0 &&
		mergedVisualPadding.top === 0 &&
		mergedVisualPadding.right === 0 &&
		mergedVisualPadding.bottom === 0
	) {
		return baseRect;
	}

	return {
		left: baseRect.left - mergedVisualPadding.left,
		top: baseRect.top - mergedVisualPadding.top,
		width:
			baseRect.width +
			mergedVisualPadding.left +
			mergedVisualPadding.right,
		height:
			baseRect.height +
			mergedVisualPadding.top +
			mergedVisualPadding.bottom,
	};
}

export function drawTextDecoration({
	ctx,
	textDecoration,
	lineWidth,
	lineY,
	metrics,
	scaledFontSize,
	textAlign,
}: {
	ctx: TextCanvasContext;
	textDecoration: string;
	lineWidth: number;
	lineY: number;
	metrics: TextMetrics;
	scaledFontSize: number;
	textAlign: CanvasTextAlign;
}): void {
	if (textDecoration === "none" || !textDecoration) return;

	const thickness = Math.max(
		1,
		scaledFontSize * TEXT_DECORATION_THICKNESS_RATIO,
	);
	const ascent = getMetricAscent({ metrics, fallbackFontSize: scaledFontSize });
	const descent = getMetricDescent({
		metrics,
		fallbackFontSize: scaledFontSize,
	});

	let xStart = -lineWidth / 2;
	if (textAlign === "left") xStart = 0;
	if (textAlign === "right") xStart = -lineWidth;

	if (textDecoration === "underline") {
		const underlineY = lineY + descent + thickness;
		ctx.fillRect(xStart, underlineY, lineWidth, thickness);
	}

	if (textDecoration === "line-through") {
		const strikeY = lineY - (ascent - descent) * STRIKETHROUGH_VERTICAL_RATIO;
		ctx.fillRect(xStart, strikeY, lineWidth, thickness);
	}
}
