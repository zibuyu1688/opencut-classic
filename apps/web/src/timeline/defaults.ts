import { DEFAULT_NEW_ELEMENT_DURATION } from "@/timeline/creation";
import type { TTimelineViewState } from "@/project/types";
import type { BlendMode, Transform } from "@/rendering";
import { ZERO_MEDIA_TIME } from "@/wasm";
import type { TextElement } from "./types";

const defaultTransform: Transform = {
	scaleX: 1,
	scaleY: 1,
	position: { x: 0, y: 0 },
	rotate: 0,
};

const defaultOpacity = 1;
const defaultBlendMode: BlendMode = "normal";
const defaultVolume = 0;

const defaultTextLetterSpacing = 0;
const defaultTextLineHeight = 1.2;

const defaultTextStroke = {
	enabled: false,
	color: "#000000",
	width: 0,
};

const defaultTextShadow = {
	enabled: false,
	color: "#000000",
	opacity: 90,
	blur: 0,
	distance: 0,
	angle: -45,
	offsetX: 0,
	offsetY: 0,
};

const defaultTextGlow = {
	enabled: false,
	color: "#ffffff",
	style: "soft" as const,
	intensity: 0,
	range: 0,
	verticalAngle: -50,
	horizontalAngle: -50,
	blur: 0,
};

const defaultTextWarp = {
	enabled: false,
	amount: 0,
};

const defaultTextBackground = {
	enabled: false,
	color: "#000000",
	opacity: 100,
	variant: "rounded" as const,
	shapePath: "none" as const,
	shapeFlipX: false,
	shapeFlipY: false,
	cornerRadius: 0,
	paddingX: 30,
	paddingY: 42,
	offsetX: 0,
	offsetY: 0,
};

const defaultTextElement: Omit<TextElement, "id"> = {
	type: "text",
	name: "文字",
	duration: DEFAULT_NEW_ELEMENT_DURATION,
	startTime: ZERO_MEDIA_TIME,
	trimStart: ZERO_MEDIA_TIME,
	trimEnd: ZERO_MEDIA_TIME,
	params: {
		content: "默认文本",
		fontSize: 15,
		fontFamily: "Arial",
		color: "#ffffff",
		textAlign: "center",
		fontWeight: "normal",
		fontStyle: "normal",
		textDecoration: "none",
		letterSpacing: defaultTextLetterSpacing,
		lineHeight: defaultTextLineHeight,
		"stroke.enabled": defaultTextStroke.enabled,
		"stroke.color": defaultTextStroke.color,
		"stroke.width": defaultTextStroke.width,
		"shadow.enabled": defaultTextShadow.enabled,
		"shadow.color": defaultTextShadow.color,
		"shadow.opacity": defaultTextShadow.opacity,
		"shadow.blur": defaultTextShadow.blur,
		"shadow.distance": defaultTextShadow.distance,
		"shadow.angle": defaultTextShadow.angle,
		"shadow.offsetX": defaultTextShadow.offsetX,
		"shadow.offsetY": defaultTextShadow.offsetY,
		"glow.enabled": defaultTextGlow.enabled,
		"glow.color": defaultTextGlow.color,
		"glow.style": defaultTextGlow.style,
		"glow.intensity": defaultTextGlow.intensity,
		"glow.range": defaultTextGlow.range,
		"glow.verticalAngle": defaultTextGlow.verticalAngle,
		"glow.horizontalAngle": defaultTextGlow.horizontalAngle,
		"glow.blur": defaultTextGlow.blur,
		"warp.enabled": defaultTextWarp.enabled,
		"warp.amount": defaultTextWarp.amount,
		"background.enabled": defaultTextBackground.enabled,
		"background.color": defaultTextBackground.color,
		"background.opacity": defaultTextBackground.opacity,
		"background.variant": defaultTextBackground.variant,
		"background.shapePath": defaultTextBackground.shapePath,
		"background.shapeFlipX": defaultTextBackground.shapeFlipX,
		"background.shapeFlipY": defaultTextBackground.shapeFlipY,
		"background.cornerRadius": defaultTextBackground.cornerRadius,
		"background.paddingX": defaultTextBackground.paddingX,
		"background.paddingY": defaultTextBackground.paddingY,
		"background.offsetX": defaultTextBackground.offsetX,
		"background.offsetY": defaultTextBackground.offsetY,
		"transform.positionX": defaultTransform.position.x,
		"transform.positionY": defaultTransform.position.y,
		"transform.scaleX": defaultTransform.scaleX,
		"transform.scaleY": defaultTransform.scaleY,
		"transform.rotate": defaultTransform.rotate,
		opacity: defaultOpacity,
		blendMode: defaultBlendMode,
	},
};

const defaultTimelineViewState: TTimelineViewState = {
	zoomLevel: 1,
	scrollLeft: 0,
	playheadTime: ZERO_MEDIA_TIME,
};

export const DEFAULTS = {
	element: {
		transform: defaultTransform,
		opacity: defaultOpacity,
		blendMode: defaultBlendMode,
		volume: defaultVolume,
	},
	text: {
		letterSpacing: defaultTextLetterSpacing,
		lineHeight: defaultTextLineHeight,
		stroke: defaultTextStroke,
		shadow: defaultTextShadow,
		glow: defaultTextGlow,
		warp: defaultTextWarp,
		background: defaultTextBackground,
		element: defaultTextElement,
	},
	timeline: {
		viewState: defaultTimelineViewState,
	},
};
