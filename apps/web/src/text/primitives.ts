import type { TextCanvasContext, TextBlockMeasurement } from "@/text/layout";
import { DEFAULTS } from "@/timeline/defaults";
import { clamp } from "@/utils/math";
import {
	CORNER_RADIUS_MAX,
	CORNER_RADIUS_MIN,
	normalizeTextBackgroundShapePath,
	normalizeTextBackgroundVariant,
} from "./background";
import {
	drawTextDecoration,
	getTextBackgroundRect,
	measureTextBlock,
	setCanvasLetterSpacing,
} from "./layout";
import { FONT_SIZE_SCALE_REFERENCE } from "./typography";

export type TextAlign = "left" | "center" | "right";
export type TextFontWeight = "normal" | "bold";
export type TextFontStyle = "normal" | "italic";
export type TextDecoration = "none" | "underline" | "line-through";

export interface TextLayoutParams {
	content: string;
	fontSize: number;
	fontFamily: string;
	fontWeight: TextFontWeight;
	fontStyle: TextFontStyle;
	textAlign: TextAlign;
	textDecoration?: TextDecoration;
	letterSpacing?: number;
	warpAmount?: number;
	lineHeight?: number;
}

export interface ResolvedTextLayout {
	scaledFontSize: number;
	fontString: string;
	letterSpacing: number;
	lineHeightPx: number;
	fontSizeRatio: number;
	textAlign: TextAlign;
	textDecoration: TextDecoration;
	warpAmount: number;
}

export interface MeasuredTextLayout extends ResolvedTextLayout {
	lines: string[];
	lineMetrics: TextMetrics[];
	block: TextBlockMeasurement;
}

export interface ResolvedTextBackgroundLike {
	enabled: boolean;
	color: string;
	opacity?: number;
	variant?: string;
	shapePath?: string;
	shapeFlipX?: boolean;
	shapeFlipY?: boolean;
	paddingX: number;
	paddingY: number;
	offsetX: number;
	offsetY: number;
	cornerRadius: number;
}

export function quoteFontFamily({ fontFamily }: { fontFamily: string }): string {
	return `"${fontFamily.replace(/"/g, '\\"')}"`;
}

export function buildTextFontString({
	fontFamily,
	fontWeight,
	fontStyle,
	scaledFontSize,
}: {
	fontFamily: string;
	fontWeight: TextFontWeight;
	fontStyle: TextFontStyle;
	scaledFontSize: number;
}): string {
	return `${fontStyle} ${fontWeight} ${scaledFontSize}px ${quoteFontFamily({ fontFamily })}, sans-serif`;
}

export function resolveTextLayout({
	text,
	canvasHeight,
}: {
	text: TextLayoutParams;
	canvasHeight: number;
}): ResolvedTextLayout {
	const scaledFontSize =
		text.fontSize * (canvasHeight / FONT_SIZE_SCALE_REFERENCE);
	const fontWeight = text.fontWeight === "bold" ? "bold" : "normal";
	const fontStyle = text.fontStyle === "italic" ? "italic" : "normal";
	const letterSpacing = text.letterSpacing ?? DEFAULTS.text.letterSpacing;
	const lineHeightPx =
		scaledFontSize * (text.lineHeight ?? DEFAULTS.text.lineHeight);
	const fontSizeRatio = text.fontSize / 15;

	return {
		scaledFontSize,
		fontString: buildTextFontString({
			fontFamily: text.fontFamily,
			fontWeight,
			fontStyle,
			scaledFontSize,
		}),
		letterSpacing,
		lineHeightPx,
		fontSizeRatio,
		textAlign: text.textAlign,
		textDecoration: text.textDecoration ?? "none",
		warpAmount: text.warpAmount ?? 0,
	};
}

export function measureTextLayout({
	text,
	canvasHeight,
	ctx,
}: {
	text: TextLayoutParams;
	canvasHeight: number;
	ctx: TextCanvasContext;
}): MeasuredTextLayout {
	const resolvedLayout = resolveTextLayout({ text, canvasHeight });
	const lines = text.content.split("\n");

	ctx.save();
	ctx.font = resolvedLayout.fontString;
	ctx.textBaseline = "middle";
	setCanvasLetterSpacing({
		ctx,
		letterSpacingPx: resolvedLayout.letterSpacing,
	});
	const lineMetrics = lines.map((line) => ctx.measureText(line));
	ctx.restore();

	const block = measureTextBlock({
		lineMetrics,
		lineHeightPx: resolvedLayout.lineHeightPx,
	});

	return {
		...resolvedLayout,
		lines,
		lineMetrics,
		block,
	};
}

export function drawMeasuredTextLayout({
	ctx,
	layout,
	textColor,
	background,
	backgroundColor,
	textBaseline = "middle",
}: {
	ctx: TextCanvasContext;
	layout: MeasuredTextLayout;
	textColor: string;
	background?: ResolvedTextBackgroundLike | null;
	backgroundColor?: string;
	textBaseline?: CanvasTextBaseline;
}): void {
	ctx.font = layout.fontString;
	ctx.textAlign = layout.textAlign;
	ctx.textBaseline = textBaseline;
	ctx.fillStyle = textColor;
	setCanvasLetterSpacing({ ctx, letterSpacingPx: layout.letterSpacing });

	if (
		background?.enabled &&
		backgroundColor &&
		backgroundColor !== "transparent" &&
		layout.lines.length > 0
	) {
		const backgroundRect = getTextBackgroundRect({
			textAlign: layout.textAlign,
			block: layout.block,
			background: {
				...background,
				color: backgroundColor,
			},
			fontSizeRatio: layout.fontSizeRatio,
		});
		if (backgroundRect) {
			const backgroundOpacity =
				background.opacity === undefined
					? 1
					: clamp({ value: background.opacity, min: 0, max: 100 }) / 100;
			ctx.save();
			ctx.globalAlpha *= backgroundOpacity;
			ctx.fillStyle = backgroundColor;
			drawTextBackgroundShape({
				ctx,
				background,
				backgroundRect,
				fontSizeRatio: layout.fontSizeRatio,
			});
			ctx.restore();
			ctx.fillStyle = textColor;
		}
	}

	for (let index = 0; index < layout.lines.length; index++) {
		const lineY = index * layout.lineHeightPx - layout.block.visualCenterOffset;
		drawTextLine({
			ctx,
			text: layout.lines[index],
			lineY,
			layout,
			lineMetrics: layout.lineMetrics[index],
			mode: "fill",
		});
	}
}

function drawTextBackgroundShape({
	ctx,
	background,
	backgroundRect,
	fontSizeRatio,
}: {
	ctx: TextCanvasContext;
	background: ResolvedTextBackgroundLike;
	backgroundRect: {
		left: number;
		top: number;
		width: number;
		height: number;
	};
	fontSizeRatio: number;
}) {
	const variant = normalizeTextBackgroundVariant({ value: background.variant });
	const shapePath = normalizeTextBackgroundShapePath({
		value: background.shapePath,
	});
	const p =
		clamp({
			value: background.cornerRadius,
			min: CORNER_RADIUS_MIN,
			max: CORNER_RADIUS_MAX,
		}) / 100;
	const roundedRadius =
		(Math.min(backgroundRect.width, backgroundRect.height) / 2) * p;

	const hasPathFlip = background.shapeFlipX || background.shapeFlipY;
	if (hasPathFlip) {
		ctx.save();
		const centerX = backgroundRect.left + backgroundRect.width / 2;
		const centerY = backgroundRect.top + backgroundRect.height / 2;
		ctx.translate(centerX, centerY);
		ctx.scale(background.shapeFlipX ? -1 : 1, background.shapeFlipY ? -1 : 1);
		ctx.translate(-centerX, -centerY);
	}

	if (shapePath !== "none") {
		drawShapePathBackground({
			ctx,
			shapePath,
			variant,
			backgroundRect,
			roundedRadius,
			fontSizeRatio,
		});
		if (hasPathFlip) {
			ctx.restore();
		}
		return;
	}

	if (variant === "capsule") {
		ctx.beginPath();
		ctx.roundRect(
			backgroundRect.left,
			backgroundRect.top,
			backgroundRect.width,
			backgroundRect.height,
			backgroundRect.height / 2,
		);
		ctx.fill();
		return;
	}

	if (variant === "speech-left" || variant === "speech-right") {
		const tailWidth = 24 * fontSizeRatio;
		const tailHeight = 18 * fontSizeRatio;
		ctx.beginPath();
		ctx.roundRect(
			backgroundRect.left,
			backgroundRect.top,
			backgroundRect.width,
			backgroundRect.height,
			Math.max(roundedRadius, backgroundRect.height * 0.28),
		);
		ctx.fill();
		ctx.beginPath();
		if (variant === "speech-left") {
			ctx.moveTo(backgroundRect.left + tailWidth * 1.05, backgroundRect.top + backgroundRect.height);
			ctx.lineTo(backgroundRect.left + tailWidth * 0.12, backgroundRect.top + backgroundRect.height + tailHeight);
			ctx.lineTo(backgroundRect.left + tailWidth * 1.5, backgroundRect.top + backgroundRect.height - tailHeight * 0.12);
		} else {
			const right = backgroundRect.left + backgroundRect.width;
			ctx.moveTo(right - tailWidth * 1.05, backgroundRect.top + backgroundRect.height);
			ctx.lineTo(right - tailWidth * 0.12, backgroundRect.top + backgroundRect.height + tailHeight);
			ctx.lineTo(right - tailWidth * 1.5, backgroundRect.top + backgroundRect.height - tailHeight * 0.12);
		}
		ctx.closePath();
		ctx.fill();
		return;
	}

	if (variant === "tape") {
		const skew = 12 * fontSizeRatio;
		ctx.beginPath();
		ctx.moveTo(backgroundRect.left + skew, backgroundRect.top);
		ctx.lineTo(backgroundRect.left + backgroundRect.width, backgroundRect.top);
		ctx.lineTo(
			backgroundRect.left + backgroundRect.width - skew,
			backgroundRect.top + backgroundRect.height,
		);
		ctx.lineTo(backgroundRect.left, backgroundRect.top + backgroundRect.height);
		ctx.closePath();
		ctx.fill();
		return;
	}

	ctx.beginPath();
	ctx.roundRect(
		backgroundRect.left,
		backgroundRect.top,
		backgroundRect.width,
		backgroundRect.height,
		roundedRadius,
	);
	ctx.fill();

	if (hasPathFlip) {
		ctx.restore();
	}
}

function drawShapePathBackground({
	ctx,
	shapePath,
	variant,
	backgroundRect,
	roundedRadius,
	fontSizeRatio,
}: {
	ctx: TextCanvasContext;
	shapePath: "speech-round" | "speech-point" | "sticker-cut" | "sticker-cloud" | "sticker-burst";
	variant: ReturnType<typeof normalizeTextBackgroundVariant>;
	backgroundRect: {
		left: number;
		top: number;
		width: number;
		height: number;
	};
	roundedRadius: number;
	fontSizeRatio: number;
}) {
	if (shapePath === "speech-round" || shapePath === "speech-point") {
		const tailWidth = shapePath === "speech-point" ? 26 * fontSizeRatio : 20 * fontSizeRatio;
		const tailHeight = shapePath === "speech-point" ? 20 * fontSizeRatio : 14 * fontSizeRatio;
		ctx.beginPath();
		ctx.roundRect(
			backgroundRect.left,
			backgroundRect.top,
			backgroundRect.width,
			backgroundRect.height,
			Math.max(roundedRadius, backgroundRect.height * 0.3),
		);
		ctx.fill();

		const right = backgroundRect.left + backgroundRect.width;
		const drawTailOnRight = variant === "speech-right";
		ctx.beginPath();
		if (drawTailOnRight) {
			ctx.moveTo(right - tailWidth * 1.1, backgroundRect.top + backgroundRect.height - tailHeight * 0.12);
			ctx.lineTo(right - tailWidth * 0.2, backgroundRect.top + backgroundRect.height + tailHeight);
			ctx.lineTo(right - tailWidth * 1.6, backgroundRect.top + backgroundRect.height - tailHeight * 0.28);
		} else {
			ctx.moveTo(backgroundRect.left + tailWidth * 1.1, backgroundRect.top + backgroundRect.height - tailHeight * 0.12);
			ctx.lineTo(backgroundRect.left + tailWidth * 0.2, backgroundRect.top + backgroundRect.height + tailHeight);
			ctx.lineTo(backgroundRect.left + tailWidth * 1.6, backgroundRect.top + backgroundRect.height - tailHeight * 0.28);
		}
		ctx.closePath();
		ctx.fill();
		return;
	}

	if (shapePath === "sticker-cut") {
		const cut = Math.min(backgroundRect.width, backgroundRect.height) * 0.16;
		const left = backgroundRect.left;
		const top = backgroundRect.top;
		const right = left + backgroundRect.width;
		const bottom = top + backgroundRect.height;
		ctx.beginPath();
		ctx.moveTo(left + cut, top);
		ctx.lineTo(right - cut, top);
		ctx.lineTo(right, top + cut);
		ctx.lineTo(right, bottom - cut);
		ctx.lineTo(right - cut, bottom);
		ctx.lineTo(left + cut, bottom);
		ctx.lineTo(left, bottom - cut);
		ctx.lineTo(left, top + cut);
		ctx.closePath();
		ctx.fill();
		return;
	}

	if (shapePath === "sticker-cloud") {
		const left = backgroundRect.left;
		const top = backgroundRect.top;
		const width = backgroundRect.width;
		const height = backgroundRect.height;
		const r = Math.min(width, height) * 0.18;
		ctx.beginPath();
		ctx.roundRect(left + r * 0.2, top + r * 0.3, width - r * 0.4, height - r * 0.6, Math.max(roundedRadius, r));
		ctx.fill();
		const bumps = [
			[left + width * 0.16, top + r * 0.22, r],
			[left + width * 0.36, top + r * 0.05, r * 1.1],
			[left + width * 0.64, top + r * 0.08, r],
			[left + width * 0.84, top + r * 0.24, r * 0.92],
		];
		for (const [x, y, radius] of bumps) {
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
		}
		return;
	}

	if (shapePath === "sticker-burst") {
		const centerX = backgroundRect.left + backgroundRect.width / 2;
		const centerY = backgroundRect.top + backgroundRect.height / 2;
		const inner = Math.min(backgroundRect.width, backgroundRect.height) * 0.36;
		const outer = Math.max(backgroundRect.width, backgroundRect.height) * 0.56;
		const spikes = 12;
		ctx.beginPath();
		for (let index = 0; index < spikes * 2; index++) {
			const radius = index % 2 === 0 ? outer : inner;
			const angle = (Math.PI * index) / spikes - Math.PI / 2;
			const pointX = centerX + Math.cos(angle) * radius;
			const pointY = centerY + Math.sin(angle) * radius;
			if (index === 0) {
				ctx.moveTo(pointX, pointY);
			} else {
				ctx.lineTo(pointX, pointY);
			}
		}
		ctx.closePath();
		ctx.fill();
		return;
	}
}

export function strokeMeasuredTextLayout({
	ctx,
	layout,
	strokeColor,
	strokeWidth,
	textBaseline = "middle",
}: {
	ctx: TextCanvasContext;
	layout: MeasuredTextLayout;
	strokeColor: string;
	strokeWidth: number;
	textBaseline?: CanvasTextBaseline;
}): void {
	ctx.font = layout.fontString;
	ctx.textAlign = layout.textAlign;
	ctx.textBaseline = textBaseline;
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = strokeWidth;
	ctx.lineJoin = "round";
	ctx.lineCap = "round";
	setCanvasLetterSpacing({ ctx, letterSpacingPx: layout.letterSpacing });

	for (let index = 0; index < layout.lines.length; index++) {
		const lineY = index * layout.lineHeightPx - layout.block.visualCenterOffset;
		drawTextLine({
			ctx,
			text: layout.lines[index],
			lineY,
			layout,
			lineMetrics: layout.lineMetrics[index],
			mode: "stroke",
		});
	}
}

function drawTextLine({
	ctx,
	text,
	lineY,
	layout,
	lineMetrics,
	mode,
}: {
	ctx: TextCanvasContext;
	text: string;
	lineY: number;
	layout: MeasuredTextLayout;
	lineMetrics: TextMetrics;
	mode: "fill" | "stroke";
}) {
	if (layout.warpAmount !== 0 && text.length > 1) {
		drawWarpedTextLine({
			ctx,
			text,
			lineY,
			layout,
			mode,
		});
		return;
	}

	if (mode === "fill") {
		ctx.fillText(text, 0, lineY);
		drawTextDecoration({
			ctx,
			textDecoration: layout.textDecoration,
			lineWidth: lineMetrics.width,
			lineY,
			metrics: lineMetrics,
			scaledFontSize: layout.scaledFontSize,
			textAlign: layout.textAlign,
		});
		return;
	}

	ctx.strokeText(text, 0, lineY);
}

function drawWarpedTextLine({
	ctx,
	text,
	lineY,
	layout,
	mode,
}: {
	ctx: TextCanvasContext;
	text: string;
	lineY: number;
	layout: MeasuredTextLayout;
	mode: "fill" | "stroke";
}) {
	const chars = [...text];
	const letterSpacing = layout.letterSpacing;
	const charWidths = chars.map((char) => ctx.measureText(char).width);
	const totalWidth =
		charWidths.reduce((sum, width) => sum + width, 0) +
		Math.max(0, chars.length - 1) * letterSpacing;
	let x = layout.textAlign === "center" ? -totalWidth / 2 : 0;
	if (layout.textAlign === "right") {
		x = -totalWidth;
	}

	const arcStrength = Math.min(1.2, Math.abs(layout.warpAmount) / 100);
	const amplitude = arcStrength * layout.scaledFontSize * 0.9;
	const direction = layout.warpAmount >= 0 ? 1 : -1;

	for (let index = 0; index < chars.length; index++) {
		const char = chars[index];
		const charWidth = charWidths[index];
		const center = x + charWidth / 2;
		const normalized = totalWidth <= 0 ? 0 : center / (totalWidth / 2 || 1);
		const arcOffset = (1 - normalized * normalized) * amplitude * direction;
		if (mode === "fill") {
			ctx.fillText(char, x, lineY - arcOffset);
		} else {
			ctx.strokeText(char, x, lineY - arcOffset);
		}
		x += charWidth + letterSpacing;
	}
}
