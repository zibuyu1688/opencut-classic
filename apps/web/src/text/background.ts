export const CORNER_RADIUS_MIN = 0;
export const CORNER_RADIUS_MAX = 100;

export const TEXT_BACKGROUND_VARIANTS = [
	{ value: "rounded", label: "圆角底板" },
	{ value: "capsule", label: "胶囊条" },
	{ value: "speech-left", label: "左气泡" },
	{ value: "speech-right", label: "右气泡" },
	{ value: "tape", label: "贴纸条" },
	{ value: "underline", label: "下划线条" },
] as const;

export const TEXT_BACKGROUND_SHAPE_PATHS = [
	{ value: "none", label: "默认轮廓" },
	{ value: "speech-round", label: "对白圆尾" },
	{ value: "speech-point", label: "对白尖尾" },
	{ value: "sticker-cut", label: "贴纸切角" },
	{ value: "sticker-cloud", label: "云朵贴纸" },
	{ value: "sticker-burst", label: "爆炸贴纸" },
] as const;

export type TextBackgroundVariant =
	(typeof TEXT_BACKGROUND_VARIANTS)[number]["value"];

export type TextBackgroundShapePath =
	(typeof TEXT_BACKGROUND_SHAPE_PATHS)[number]["value"];

export function normalizeTextBackgroundVariant({
	value,
}: {
	value: unknown;
}): TextBackgroundVariant {
	switch (value) {
		case "capsule":
		case "speech-left":
		case "speech-right":
		case "tape":
		case "underline":
		case "rounded":
			return value;
		default:
			return "rounded";
	}
}

export function normalizeTextBackgroundShapePath({
	value,
}: {
	value: unknown;
}): TextBackgroundShapePath {
	switch (value) {
		case "speech-round":
		case "speech-point":
		case "sticker-cut":
		case "sticker-cloud":
		case "sticker-burst":
		case "none":
			return value;
		default:
			return "none";
	}
}

export interface TextBackground {
	enabled: boolean;
	color: string;
	opacity?: number;
	variant?: TextBackgroundVariant;
	shapePath?: TextBackgroundShapePath;
	shapeFlipX?: boolean;
	shapeFlipY?: boolean;
	cornerRadius?: number;
	paddingX?: number;
	paddingY?: number;
	offsetX?: number;
	offsetY?: number;
}
