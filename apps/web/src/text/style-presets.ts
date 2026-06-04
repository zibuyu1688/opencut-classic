import type { ParamValues } from "@/params";
import { DEFAULTS } from "@/timeline/defaults";

export type TextStylePresetCategoryId =
	| "title"
	| "tag"
	| "neon"
	| "showbiz";

export type TextStylePreset = {
	id: string;
	name: string;
	category: TextStylePresetCategoryId;
	content: string;
	params?: Partial<ParamValues>;
	previewInnerClassName?: string;
	previewTextClassName?: string;
	isDisabledStyle?: boolean;
};

export const TEXT_STYLE_PRESET_CATEGORIES: Array<{
	id: TextStylePresetCategoryId;
	label: string;
}> = [
	{ id: "title", label: "标题" },
	{ id: "tag", label: "标签" },
	{ id: "neon", label: "霓虹" },
	{ id: "showbiz", label: "综艺" },
];

export const TEXT_STYLE_PRESETS: TextStylePreset[] = [
	{
		id: "default",
		name: "默认样式",
		category: "title",
		content: "默认文本",
		isDisabledStyle: true,
	},
	{
		id: "bold-white",
		name: "纯白标题",
		category: "title",
		content: "默认文本",
		params: {
			fontFamily: "Alibaba PuHuiTi",
			fontWeight: "bold",
			color: "#ffffff",
		},
		previewTextClassName: "text-white font-bold",
	},
	{
		id: "bold-black",
		name: "纯黑标题",
		category: "title",
		content: "默认文本",
		params: {
			fontFamily: "Alibaba Sans",
			fontWeight: "bold",
			color: "#111111",
		},
		previewTextClassName: "text-neutral-950 font-bold",
	},
	{
		id: "yellow-title",
		name: "高亮黄",
		category: "title",
		content: "默认文本",
		params: {
			fontFamily: "Alibaba PuHuiTi",
			fontWeight: "bold",
			color: "#ffd400",
		},
		previewTextClassName: "text-yellow-400 font-bold",
	},
	{
		id: "sky-title",
		name: "天空蓝",
		category: "title",
		content: "默认文本",
		params: {
			fontFamily: "HarmonyOS Sans SC",
			fontWeight: "bold",
			color: "#b7d9ff",
		},
		previewTextClassName: "text-sky-200 font-bold",
	},
	{
		id: "slate-title",
		name: "雾蓝灰",
		category: "title",
		content: "默认文本",
		params: {
			fontFamily: "OPPO Sans 4.0",
			fontWeight: "bold",
			color: "#8fb0c7",
		},
		previewTextClassName: "text-slate-300 font-bold",
	},
	{
		id: "bubble-left-cream",
		name: "左对白框",
		category: "tag",
		content: "默认文本",
		params: {
			fontFamily: "Alibaba Sans TC",
			fontWeight: "bold",
			color: "#4b3829",
			"background.enabled": true,
			"background.color": "#fff7e7",
			"background.variant": "rounded",
			"background.shapePath": "speech-round",
			"background.shapeFlipX": false,
			"background.cornerRadius": 24,
			"background.paddingX": 42,
			"background.paddingY": 24,
		},
		previewInnerClassName: "rounded-2xl bg-amber-50 px-3 py-1.5",
		previewTextClassName: "text-amber-950 font-bold",
	},
	{
		id: "bubble-right-mono",
		name: "右对白框",
		category: "tag",
		content: "默认文本",
		params: {
			fontFamily: "HarmonyOS Sans SC",
			fontWeight: "bold",
			color: "#ffffff",
			"background.enabled": true,
			"background.color": "#252525",
			"background.variant": "rounded",
			"background.shapePath": "speech-round",
			"background.shapeFlipX": true,
			"background.cornerRadius": 24,
			"background.paddingX": 42,
			"background.paddingY": 24,
		},
		previewInnerClassName: "rounded-2xl bg-zinc-900 px-3 py-1.5",
		previewTextClassName: "text-white font-bold",
	},
	{
		id: "bubble-capsule-yellow",
		name: "奶油胶囊",
		category: "tag",
		content: "默认文本",
		params: {
			fontFamily: "Alibaba PuHuiTi",
			fontWeight: "bold",
			color: "#7a5800",
			"background.enabled": true,
			"background.color": "#ffe486",
			"background.variant": "capsule",
			"background.shapePath": "none",
			"background.cornerRadius": 100,
			"background.paddingX": 44,
			"background.paddingY": 24,
		},
		previewInnerClassName: "rounded-full bg-yellow-200 px-3 py-1.5",
		previewTextClassName: "text-yellow-900 font-bold",
	},
	{
		id: "bubble-tape-peach",
		name: "切角贴纸",
		category: "tag",
		content: "默认文本",
		params: {
			fontFamily: "Alibaba Sans",
			fontWeight: "bold",
			color: "#715047",
			"background.enabled": true,
			"background.color": "#f3d7c1",
			"background.variant": "rounded",
			"background.shapePath": "sticker-cut",
			"background.cornerRadius": 8,
			"background.paddingX": 44,
			"background.paddingY": 18,
		},
		previewInnerClassName: "bg-orange-100 px-3 py-1.5",
		previewTextClassName: "text-stone-700 font-bold",
	},
	{
		id: "bubble-search",
		name: "尖尾对白",
		category: "tag",
		content: "默认文本",
		params: {
			fontFamily: "Alibaba Sans",
			fontWeight: "normal",
			color: "#202020",
			"background.enabled": true,
			"background.color": "#ffffff",
			"background.variant": "rounded",
			"background.shapePath": "speech-point",
			"background.cornerRadius": 100,
			"background.paddingX": 52,
			"background.paddingY": 20,
		},
		previewInnerClassName: "rounded-full bg-white px-3 py-1.5",
		previewTextClassName: "text-zinc-900 font-medium",
	},
	{
		id: "bubble-cloud-pink",
		name: "云朵贴纸",
		category: "tag",
		content: "默认文本",
		params: {
			fontFamily: "Alibaba PuHuiTi",
			fontWeight: "bold",
			color: "#ffffff",
			"background.enabled": true,
			"background.color": "#ff9db6",
			"background.variant": "rounded",
			"background.shapePath": "sticker-cloud",
			"background.cornerRadius": 100,
			"background.paddingX": 44,
			"background.paddingY": 20,
		},
		previewInnerClassName: "rounded-2xl bg-pink-300 px-3 py-1.5",
		previewTextClassName: "text-white font-bold",
	},
	{
		id: "bubble-burst-note",
		name: "爆炸提示",
		category: "tag",
		content: "默认文本",
		params: {
			fontFamily: "DingTalk JinBuTi",
			fontWeight: "bold",
			color: "#111111",
			"background.enabled": true,
			"background.color": "#fff59a",
			"background.variant": "rounded",
			"background.shapePath": "sticker-burst",
			"background.cornerRadius": 16,
			"background.paddingX": 36,
			"background.paddingY": 20,
		},
		previewInnerClassName: "bg-yellow-200 px-3 py-1.5",
		previewTextClassName: "text-neutral-900 font-bold",
	},
	{
		id: "neon-green",
		name: "荧光绿",
		category: "neon",
		content: "默认文本",
		params: {
			fontFamily: "HarmonyOS Sans SC",
			fontWeight: "bold",
			color: "#ffffff",
			"glow.enabled": true,
			"glow.color": "#32ff4b",
			"glow.blur": 16,
		},
		previewTextClassName: "text-lime-300 font-bold",
	},
	{
		id: "neon-pink",
		name: "霓虹粉",
		category: "neon",
		content: "默认文本",
		params: {
			fontFamily: "Alibaba Sans",
			fontWeight: "bold",
			color: "#fff7fd",
			"glow.enabled": true,
			"glow.color": "#ff4fae",
			"glow.blur": 18,
		},
		previewTextClassName: "text-pink-300 font-bold",
	},
	{
		id: "neon-blue",
		name: "电光蓝",
		category: "neon",
		content: "默认文本",
		params: {
			fontFamily: "OPPO Sans 4.0",
			fontWeight: "bold",
			color: "#ffffff",
			"glow.enabled": true,
			"glow.color": "#56b8ff",
			"glow.blur": 18,
		},
		previewTextClassName: "text-blue-200 font-bold",
	},
	{
		id: "neon-purple",
		name: "赛博紫",
		category: "neon",
		content: "默认文本",
		params: {
			fontFamily: "Alibaba Sans Italic",
			fontWeight: "bold",
			fontStyle: "italic",
			color: "#ffffff",
			"glow.enabled": true,
			"glow.color": "#9b6cff",
			"glow.blur": 20,
		},
		previewTextClassName: "text-violet-200 font-bold italic",
	},
	{
		id: "showbiz-burst",
		name: "综艺爆字",
		category: "showbiz",
		content: "默认文本",
		params: {
			fontFamily: "Smiley Sans Oblique",
			fontSize: 18,
			fontWeight: "bold",
			color: "#fff67a",
			"stroke.enabled": true,
			"stroke.color": "#ff5f91",
			"stroke.width": 2.5,
			"shadow.enabled": true,
			"shadow.color": "#371c56",
			"shadow.blur": 0,
			"shadow.offsetX": 5,
			"shadow.offsetY": 5,
		},
		previewTextClassName: "text-yellow-200 font-bold italic",
	},
	{
		id: "showbiz-outline",
		name: "漫画描边",
		category: "showbiz",
		content: "默认文本",
		params: {
			fontFamily: "DingTalk JinBuTi",
			fontSize: 18,
			fontWeight: "bold",
			color: "#ffffff",
			"stroke.enabled": true,
			"stroke.color": "#101010",
			"stroke.width": 3,
			"shadow.enabled": true,
			"shadow.color": "#ff9d00",
			"shadow.blur": 0,
			"shadow.offsetX": 3,
			"shadow.offsetY": 3,
		},
		previewTextClassName: "text-white font-bold",
	},
	{
		id: "showbiz-pop",
		name: "泡泡字",
		category: "showbiz",
		content: "默认文本",
		params: {
			fontFamily: "Alimama FangYuanTi VF",
			fontSize: 18,
			fontWeight: "bold",
			color: "#ff5d92",
			"stroke.enabled": true,
			"stroke.color": "#fff1f7",
			"stroke.width": 2.5,
			"shadow.enabled": true,
			"shadow.color": "#6e2047",
			"shadow.blur": 0,
			"shadow.offsetX": 4,
			"shadow.offsetY": 4,
		},
		previewTextClassName: "text-pink-400 font-bold",
	},
	{
		id: "showbiz-neon-sign",
		name: "发光招牌",
		category: "showbiz",
		content: "默认文本",
		params: {
			fontFamily: "Alimama DaoLiTi",
			fontSize: 18,
			fontWeight: "bold",
			color: "#fffef5",
			"stroke.enabled": true,
			"stroke.color": "#1f1f1f",
			"stroke.width": 1.5,
			"glow.enabled": true,
			"glow.color": "#ffcf54",
			"glow.blur": 14,
		},
		previewTextClassName: "text-amber-100 font-bold",
	},
];

export const TEXT_STYLE_PRESET_GROUPS = TEXT_STYLE_PRESET_CATEGORIES.map(
	(category) => ({
		...category,
		presets: TEXT_STYLE_PRESETS.filter(
			(preset) => preset.category === category.id,
		),
	}),
);

export type TextStylePresetTabId = "basic" | "bubble" | "fancy";

export const TEXT_STYLE_PRESET_TABS: Array<{
	id: TextStylePresetTabId;
	label: string;
	presets: TextStylePreset[];
}> = [
	{
		id: "basic",
		label: "基础",
		presets: TEXT_STYLE_PRESETS.filter((preset) => preset.category === "title"),
	},
	{
		id: "bubble",
		label: "气泡",
		presets: TEXT_STYLE_PRESETS.filter((preset) => preset.category === "tag"),
	},
	{
		id: "fancy",
		label: "花字",
		presets: TEXT_STYLE_PRESETS.filter(
			(preset) => preset.category === "neon" || preset.category === "showbiz",
		),
	},
];

export function buildTextStyleParams({
	preset,
}: {
	preset: TextStylePreset;
}): Partial<ParamValues> {
	return {
		fontFamily: "Alibaba PuHuiTi",
		fontSize: 15,
		color: "#ffffff",
		fontWeight: "normal",
		fontStyle: "normal",
		textDecoration: "none",
		letterSpacing: DEFAULTS.text.letterSpacing,
		lineHeight: DEFAULTS.text.lineHeight,
		"stroke.enabled": DEFAULTS.text.stroke.enabled,
		"stroke.color": DEFAULTS.text.stroke.color,
		"stroke.width": DEFAULTS.text.stroke.width,
		"shadow.enabled": DEFAULTS.text.shadow.enabled,
		"shadow.color": DEFAULTS.text.shadow.color,
		"shadow.opacity": DEFAULTS.text.shadow.opacity,
		"shadow.blur": DEFAULTS.text.shadow.blur,
		"shadow.distance": DEFAULTS.text.shadow.distance,
		"shadow.angle": DEFAULTS.text.shadow.angle,
		"shadow.offsetX": DEFAULTS.text.shadow.offsetX,
		"shadow.offsetY": DEFAULTS.text.shadow.offsetY,
		"glow.enabled": DEFAULTS.text.glow.enabled,
		"glow.color": DEFAULTS.text.glow.color,
		"glow.style": DEFAULTS.text.glow.style,
		"glow.intensity": DEFAULTS.text.glow.intensity,
		"glow.range": DEFAULTS.text.glow.range,
		"glow.verticalAngle": DEFAULTS.text.glow.verticalAngle,
		"glow.horizontalAngle": DEFAULTS.text.glow.horizontalAngle,
		"glow.blur": DEFAULTS.text.glow.blur,
		"warp.enabled": DEFAULTS.text.warp.enabled,
		"warp.amount": DEFAULTS.text.warp.amount,
		"background.enabled": false,
		"background.color": DEFAULTS.text.background.color,
		"background.opacity": DEFAULTS.text.background.opacity,
		"background.variant": DEFAULTS.text.background.variant,
		"background.shapePath": DEFAULTS.text.background.shapePath,
		"background.shapeFlipX": DEFAULTS.text.background.shapeFlipX,
		"background.shapeFlipY": DEFAULTS.text.background.shapeFlipY,
		"background.cornerRadius": DEFAULTS.text.background.cornerRadius,
		"background.paddingX": DEFAULTS.text.background.paddingX,
		"background.paddingY": DEFAULTS.text.background.paddingY,
		"background.offsetX": DEFAULTS.text.background.offsetX,
		"background.offsetY": DEFAULTS.text.background.offsetY,
		...(preset.params ?? {}),
	};
}