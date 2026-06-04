import { CORNER_RADIUS_MIN } from "@/text/background";
import { DEFAULTS } from "@/timeline/defaults";
import type { TextElement } from "@/timeline";
import {
	normalizeTextBackgroundShapePath,
	normalizeTextBackgroundVariant,
	type TextBackground,
} from "@/text/background";
import { resolveColorAtTime, resolveNumberAtTime } from "@/animation/values";
import {
	getTextVisualRect,
} from "./layout";
import {
	measureTextLayout,
	type MeasuredTextLayout,
	type TextVisualPadding,
	type TextAlign,
	type TextDecoration,
	type TextFontStyle,
	type TextFontWeight,
	type TextLayoutParams,
} from "./primitives";

export interface ResolvedTextBackground extends TextBackground {
	opacity: number;
	paddingX: number;
	paddingY: number;
	offsetX: number;
	offsetY: number;
	cornerRadius: number;
}

export interface MeasuredTextElement extends MeasuredTextLayout {
	resolvedBackground: ResolvedTextBackground;
	resolvedStyle: ResolvedTextStyle;
	visualRect: { left: number; top: number; width: number; height: number };
}

export interface ResolvedTextStroke {
	enabled: boolean;
	color: string;
	width: number;
}

export interface ResolvedTextShadow {
	enabled: boolean;
	color: string;
	opacity: number;
	blur: number;
	distance: number;
	angle: number;
	offsetX: number;
	offsetY: number;
}

export interface ResolvedTextGlow {
	enabled: boolean;
	color: string;
	style: "soft" | "burst";
	intensity: number;
	range: number;
	verticalAngle: number;
	horizontalAngle: number;
	blur: number;
}

export interface ResolvedTextWarp {
	enabled: boolean;
	amount: number;
}

export interface ResolvedTextStyle {
	stroke: ResolvedTextStroke;
	shadow: ResolvedTextShadow;
	glow: ResolvedTextGlow;
	warp: ResolvedTextWarp;
}

let textMeasurementContext:
	| CanvasRenderingContext2D
	| OffscreenCanvasRenderingContext2D
	| null = null;

export function getTextMeasurementContext():
	| CanvasRenderingContext2D
	| OffscreenCanvasRenderingContext2D {
	if (textMeasurementContext) {
		return textMeasurementContext;
	}

	if (typeof OffscreenCanvas !== "undefined") {
		const canvas = new OffscreenCanvas(1, 1);
		const context = canvas.getContext("2d");
		if (context) {
			textMeasurementContext = context;
			return context;
		}
	}

	if (typeof document !== "undefined") {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		if (context) {
			textMeasurementContext = context;
			return context;
		}
	}

	throw new Error("Failed to create text measurement context");
}

export function measureTextElement({
	element,
	canvasHeight,
	localTime,
	ctx,
}: {
	element: TextElement;
	canvasHeight: number;
	localTime: number;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}): MeasuredTextElement {
	const text = buildTextLayoutParamsFromElement({ element });
	const measuredLayout = measureTextLayout({
		text,
		canvasHeight,
		ctx,
	});

	const bg = buildTextBackgroundFromElement({ element });
	const resolvedBackground: ResolvedTextBackground = {
		...bg,
		opacity: resolveNumberAtTime({
			baseValue: bg.opacity ?? DEFAULTS.text.background.opacity,
			animations: element.animations,
			propertyPath: "background.opacity",
			localTime,
		}),
		paddingX: resolveNumberAtTime({
			baseValue: bg.paddingX ?? DEFAULTS.text.background.paddingX,
			animations: element.animations,
			propertyPath: "background.paddingX",
			localTime,
		}),
		paddingY: resolveNumberAtTime({
			baseValue: bg.paddingY ?? DEFAULTS.text.background.paddingY,
			animations: element.animations,
			propertyPath: "background.paddingY",
			localTime,
		}),
		offsetX: resolveNumberAtTime({
			baseValue: bg.offsetX ?? DEFAULTS.text.background.offsetX,
			animations: element.animations,
			propertyPath: "background.offsetX",
			localTime,
		}),
		offsetY: resolveNumberAtTime({
			baseValue: bg.offsetY ?? DEFAULTS.text.background.offsetY,
			animations: element.animations,
			propertyPath: "background.offsetY",
			localTime,
		}),
		cornerRadius: resolveNumberAtTime({
			baseValue: bg.cornerRadius ?? CORNER_RADIUS_MIN,
			animations: element.animations,
			propertyPath: "background.cornerRadius",
			localTime,
		}),
	};

	const visualRect = getTextVisualRect({
		textAlign: text.textAlign,
		block: measuredLayout.block,
		background: resolvedBackground,
		fontSizeRatio: measuredLayout.fontSizeRatio,
		visualPadding: buildTextVisualPadding({
			style: buildResolvedTextStyle({
				element,
				animations: element.animations,
				localTime,
				fontSizeRatio: measuredLayout.fontSizeRatio,
			}),
		}),
	});
	const resolvedStyle = buildResolvedTextStyle({
		element,
		animations: element.animations,
		localTime,
		fontSizeRatio: measuredLayout.fontSizeRatio,
	});

	return {
		...measuredLayout,
		resolvedBackground,
		resolvedStyle,
		visualRect,
	};
}

export function buildTextLayoutParamsFromElement({
	element,
}: {
	element: TextElement;
}): TextLayoutParams {
	return {
		content: readStringParam({
			params: element.params,
			key: "content",
					fallback: "默认文本",
		}),
		fontSize: readNumberParam({
			params: element.params,
			key: "fontSize",
			fallback: 15,
		}),
		fontFamily: readStringParam({
			params: element.params,
			key: "fontFamily",
			fallback: "Arial",
		}),
		fontWeight: readFontWeight({
			value: element.params.fontWeight,
			fallback: "normal",
		}),
		fontStyle: readFontStyle({
			value: element.params.fontStyle,
			fallback: "normal",
		}),
		textAlign: readTextAlign({
			value: element.params.textAlign,
			fallback: "center",
		}),
		textDecoration: readTextDecoration({
			value: element.params.textDecoration,
			fallback: "none",
		}),
		letterSpacing: readNumberParam({
			params: element.params,
			key: "letterSpacing",
			fallback: DEFAULTS.text.letterSpacing,
		}),
		warpAmount: readBooleanParam({
			params: element.params,
			key: "warp.enabled",
			fallback: DEFAULTS.text.warp.enabled,
		})
			? readNumberParam({
					params: element.params,
					key: "warp.amount",
					fallback: DEFAULTS.text.warp.amount,
				})
			: 0,
		lineHeight: readNumberParam({
			params: element.params,
			key: "lineHeight",
			fallback: DEFAULTS.text.lineHeight,
		}),
	};
}

export function buildTextBackgroundFromElement({
	element,
}: {
	element: TextElement;
}): TextBackground {
	return {
		enabled: readBooleanParam({
			params: element.params,
			key: "background.enabled",
			fallback: DEFAULTS.text.background.enabled,
		}),
		color: readStringParam({
			params: element.params,
			key: "background.color",
			fallback: DEFAULTS.text.background.color,
		}),
		opacity: readNumberParam({
			params: element.params,
			key: "background.opacity",
			fallback: DEFAULTS.text.background.opacity,
		}),
		variant: normalizeTextBackgroundVariant({
			value: element.params["background.variant"],
		}),
		shapePath: normalizeTextBackgroundShapePath({
			value: element.params["background.shapePath"],
		}),
		shapeFlipX: readBooleanParam({
			params: element.params,
			key: "background.shapeFlipX",
			fallback: DEFAULTS.text.background.shapeFlipX,
		}),
		shapeFlipY: readBooleanParam({
			params: element.params,
			key: "background.shapeFlipY",
			fallback: DEFAULTS.text.background.shapeFlipY,
		}),
		cornerRadius: readNumberParam({
			params: element.params,
			key: "background.cornerRadius",
			fallback: DEFAULTS.text.background.cornerRadius,
		}),
		paddingX: readNumberParam({
			params: element.params,
			key: "background.paddingX",
			fallback: DEFAULTS.text.background.paddingX,
		}),
		paddingY: readNumberParam({
			params: element.params,
			key: "background.paddingY",
			fallback: DEFAULTS.text.background.paddingY,
		}),
		offsetX: readNumberParam({
			params: element.params,
			key: "background.offsetX",
			fallback: DEFAULTS.text.background.offsetX,
		}),
		offsetY: readNumberParam({
			params: element.params,
			key: "background.offsetY",
			fallback: DEFAULTS.text.background.offsetY,
		}),
	};
}

function readStringParam({
	params,
	key,
	fallback,
}: {
	params: TextElement["params"];
	key: string;
	fallback: string;
}): string {
	const value = params[key];
	return typeof value === "string" ? value : fallback;
}

function readNumberParam({
	params,
	key,
	fallback,
}: {
	params: TextElement["params"];
	key: string;
	fallback: number;
}): number {
	const value = params[key];
	return typeof value === "number" ? value : fallback;
}

function readBooleanParam({
	params,
	key,
	fallback,
}: {
	params: TextElement["params"];
	key: string;
	fallback: boolean;
}): boolean {
	const value = params[key];
	return typeof value === "boolean" ? value : fallback;
}

function readTextAlign({
	value,
	fallback,
}: {
	value: unknown;
	fallback: TextAlign;
}): TextAlign {
	return value === "left" || value === "center" || value === "right"
		? value
		: fallback;
}

function readFontWeight({
	value,
	fallback,
}: {
	value: unknown;
	fallback: TextFontWeight;
}): TextFontWeight {
	return value === "bold" || value === "normal" ? value : fallback;
}

function readFontStyle({
	value,
	fallback,
}: {
	value: unknown;
	fallback: TextFontStyle;
}): TextFontStyle {
	return value === "italic" || value === "normal" ? value : fallback;
}

function readTextDecoration({
	value,
	fallback,
}: {
	value: unknown;
	fallback: TextDecoration;
}): TextDecoration {
	return value === "none" || value === "underline" || value === "line-through"
		? value
		: fallback;
}

function buildResolvedTextStyle({
	element,
	animations,
	localTime,
	fontSizeRatio,
}: {
	element: TextElement;
	animations: TextElement["animations"];
	localTime: number;
	fontSizeRatio: number;
}): ResolvedTextStyle {
	return {
		stroke: {
			enabled: readBooleanParam({
				params: element.params,
				key: "stroke.enabled",
				fallback: DEFAULTS.text.stroke.enabled,
			}),
			color: resolveColorAtTime({
				baseColor: readStringParam({
					params: element.params,
					key: "stroke.color",
					fallback: DEFAULTS.text.stroke.color,
				}),
				animations,
				propertyPath: "stroke.color",
				localTime,
			}),
			width:
				resolveNumberAtTime({
					baseValue: readNumberParam({
						params: element.params,
						key: "stroke.width",
						fallback: DEFAULTS.text.stroke.width,
					}),
					animations,
					propertyPath: "stroke.width",
					localTime,
				}) * fontSizeRatio,
		},
		shadow: {
			enabled: readBooleanParam({
				params: element.params,
				key: "shadow.enabled",
				fallback: DEFAULTS.text.shadow.enabled,
			}),
			color: resolveColorAtTime({
				baseColor: readStringParam({
					params: element.params,
					key: "shadow.color",
					fallback: DEFAULTS.text.shadow.color,
				}),
				animations,
				propertyPath: "shadow.color",
				localTime,
			}),
			opacity: resolveNumberAtTime({
				baseValue: readNumberParam({
					params: element.params,
					key: "shadow.opacity",
					fallback: DEFAULTS.text.shadow.opacity,
				}),
				animations,
				propertyPath: "shadow.opacity",
				localTime,
			}),
			blur:
				resolveNumberAtTime({
					baseValue: readNumberParam({
						params: element.params,
						key: "shadow.blur",
						fallback: DEFAULTS.text.shadow.blur,
					}),
					animations,
					propertyPath: "shadow.blur",
					localTime,
				}) * fontSizeRatio,
			distance:
				resolveNumberAtTime({
					baseValue: readNumberParam({
						params: element.params,
						key: "shadow.distance",
						fallback: DEFAULTS.text.shadow.distance,
					}),
					animations,
					propertyPath: "shadow.distance",
					localTime,
				}) * fontSizeRatio,
			angle: resolveNumberAtTime({
				baseValue: readNumberParam({
					params: element.params,
					key: "shadow.angle",
					fallback: DEFAULTS.text.shadow.angle,
				}),
				animations,
				propertyPath: "shadow.angle",
				localTime,
			}),
			offsetX:
				resolveNumberAtTime({
					baseValue: readNumberParam({
						params: element.params,
						key: "shadow.offsetX",
						fallback: DEFAULTS.text.shadow.offsetX,
					}),
					animations,
					propertyPath: "shadow.offsetX",
					localTime,
				}) * fontSizeRatio,
			offsetY:
				resolveNumberAtTime({
					baseValue: readNumberParam({
						params: element.params,
						key: "shadow.offsetY",
						fallback: DEFAULTS.text.shadow.offsetY,
					}),
					animations,
					propertyPath: "shadow.offsetY",
					localTime,
				}) * fontSizeRatio,
		},
		glow: {
			enabled: readBooleanParam({
				params: element.params,
				key: "glow.enabled",
				fallback: DEFAULTS.text.glow.enabled,
			}),
			color: resolveColorAtTime({
				baseColor: readStringParam({
					params: element.params,
					key: "glow.color",
					fallback: DEFAULTS.text.glow.color,
				}),
				animations,
				propertyPath: "glow.color",
				localTime,
			}),
			style: readStringParam({
				params: element.params,
				key: "glow.style",
				fallback: DEFAULTS.text.glow.style,
			}) === "burst"
				? "burst"
				: "soft",
			intensity: resolveNumberAtTime({
				baseValue: readNumberParam({
					params: element.params,
					key: "glow.intensity",
					fallback: DEFAULTS.text.glow.intensity,
				}),
				animations,
				propertyPath: "glow.intensity",
				localTime,
			}),
			range:
				resolveNumberAtTime({
					baseValue: readNumberParam({
						params: element.params,
						key: "glow.range",
						fallback: DEFAULTS.text.glow.range,
					}),
					animations,
					propertyPath: "glow.range",
					localTime,
				}) * fontSizeRatio,
			verticalAngle: resolveNumberAtTime({
				baseValue: readNumberParam({
					params: element.params,
					key: "glow.verticalAngle",
					fallback: DEFAULTS.text.glow.verticalAngle,
				}),
				animations,
				propertyPath: "glow.verticalAngle",
				localTime,
			}),
			horizontalAngle: resolveNumberAtTime({
				baseValue: readNumberParam({
					params: element.params,
					key: "glow.horizontalAngle",
					fallback: DEFAULTS.text.glow.horizontalAngle,
				}),
				animations,
				propertyPath: "glow.horizontalAngle",
				localTime,
			}),
			blur:
				resolveNumberAtTime({
					baseValue: readNumberParam({
						params: element.params,
						key: "glow.blur",
						fallback: DEFAULTS.text.glow.blur,
					}),
					animations,
					propertyPath: "glow.blur",
					localTime,
				}) * fontSizeRatio,
		},
		warp: {
			enabled: readBooleanParam({
				params: element.params,
				key: "warp.enabled",
				fallback: DEFAULTS.text.warp.enabled,
			}),
			amount: resolveNumberAtTime({
				baseValue: readNumberParam({
					params: element.params,
					key: "warp.amount",
					fallback: DEFAULTS.text.warp.amount,
				}),
				animations,
				propertyPath: "warp.amount",
				localTime,
			}),
		},
	};
}

function buildTextVisualPadding({
	style,
}: {
	style: ResolvedTextStyle;
}): TextVisualPadding {
	const shadowAngleRad = (style.shadow.angle * Math.PI) / 180;
	const resolvedShadowOffsetX =
		style.shadow.distance !== 0
			? Math.cos(shadowAngleRad) * style.shadow.distance
			: style.shadow.offsetX;
	const resolvedShadowOffsetY =
		style.shadow.distance !== 0
			? Math.sin(shadowAngleRad) * style.shadow.distance
			: style.shadow.offsetY;
	const warpInset = style.warp.enabled
		? Math.min(120, Math.abs(style.warp.amount) * 0.5)
		: 0;
	const strokeInset = style.stroke.enabled ? style.stroke.width / 2 : 0;
	const glowInset = style.glow.enabled
		? style.glow.blur * 2 + style.glow.range
		: 0;
	const shadowInsetLeft = style.shadow.enabled
		? style.shadow.blur * 2 + Math.max(0, -resolvedShadowOffsetX)
		: 0;
	const shadowInsetRight = style.shadow.enabled
		? style.shadow.blur * 2 + Math.max(0, resolvedShadowOffsetX)
		: 0;
	const shadowInsetTop = style.shadow.enabled
		? style.shadow.blur * 2 + Math.max(0, -resolvedShadowOffsetY)
		: 0;
	const shadowInsetBottom = style.shadow.enabled
		? style.shadow.blur * 2 + Math.max(0, resolvedShadowOffsetY)
		: 0;

	return {
		left: Math.max(strokeInset, glowInset, shadowInsetLeft, warpInset),
		right: Math.max(strokeInset, glowInset, shadowInsetRight, warpInset),
		top: Math.max(strokeInset, glowInset, shadowInsetTop, warpInset),
		bottom: Math.max(strokeInset, glowInset, shadowInsetBottom, warpInset),
	};
}
