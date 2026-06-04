export interface AlibabaDirectFontAsset {
	kind: "direct";
	url: string;
}

export interface AlibabaZipFontAsset {
	kind: "zip";
	url: string;
}

export type AlibabaFontAsset = AlibabaDirectFontAsset | AlibabaZipFontAsset;

export const ALIBABA_FONT_ASSETS = {
	"alibaba-sans-tc-45": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSansTC/AlibabaSansTC-45/9AkkxMizjfMtpRqCf5bjF.woff2",
	},
	"alibaba-sans-tc-55": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSansTC/AlibabaSansTC-55/LYAcNkNXGtceMG0L8aKjC.woff2",
	},
	"alibaba-sans-tc-75": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSansTC/AlibabaSansTC-75/8hgvLlwq6D_4DYit64CGK.woff2",
	},
	"alibaba-sans-tc-95": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSansTC/AlibabaSansTC-95/v-wxw49icFRa0-6OUajIJ.woff2",
	},
	"alibaba-sans-hk-45": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSansHK/AlibabaSansHK-45/zl4Xr07_AfD_-NmV4YBRF.woff2",
	},
	"alibaba-sans-hk-55": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSansHK/AlibabaSansHK-55/9CE-Id9E0ZtIgMWaGGe0h.woff2",
	},
	"alibaba-sans-hk-75": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSansHK/AlibabaSansHK-75/ZtjGp8D6Fh1ettSRBGazH.woff2",
	},
	"alibaba-sans-hk-95": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSansHK/AlibabaSansHK-95/_Cxa01W4FHTBoZZQMS1kH.woff2",
	},
	"alibaba-sans-light": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSans/AlibabaSans-Light/3QO-XulzLU5zY5JOExtZQ.woff2",
	},
	"alibaba-sans-regular": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSans/AlibabaSans-Regular/Z1GrodtGAwZbgszWzTGl3.woff2",
	},
	"alibaba-sans-medium": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSans/AlibabaSans-Medium/qw4-mrmVEDAl4AXP7y9XJ.woff2",
	},
	"alibaba-sans-bold": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSans/AlibabaSans-Bold/ZW4M0pZWqrkTQ40cV0p6C.woff2",
	},
	"alibaba-sans-heavy": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSans/AlibabaSans-Heavy/MJTB6STBIDSjB2q2ng8hH.woff2",
	},
	"alibaba-sans-black": {
		kind: "direct",
		url: "https://fonts.alibabadesign.com/AlibabaSans/AlibabaSans-Black/sjkFwMz4ZirCSNvuqLJ_8.woff2",
	},
	"alibaba-sans-italic-light": {
		kind: "zip",
		url: "https://fonts.alibabadesign.com/AlibabaSansItalics/AlibabaSans-LightItalic.zip",
	},
	"alibaba-sans-italic-regular": {
		kind: "zip",
		url: "https://fonts.alibabadesign.com/AlibabaSansItalics/AlibabaSans-Italic.zip",
	},
	"alibaba-sans-italic-medium": {
		kind: "zip",
		url: "https://fonts.alibabadesign.com/AlibabaSansItalics/AlibabaSans-MediumItalic.zip",
	},
	"alibaba-sans-italic-bold": {
		kind: "zip",
		url: "https://fonts.alibabadesign.com/AlibabaSansItalics/AlibabaSans-BoldItalic.zip",
	},
	"alibaba-sans-italic-heavy": {
		kind: "zip",
		url: "https://fonts.alibabadesign.com/AlibabaSansItalics/AlibabaSans-HeavyItalic.zip",
	},
	"alimama-dong-fang-da-kai-regular": {
		kind: "zip",
		url: "https://fonts.alibabadesign.com/AlimamaDongFangDaKai/AlimamaDongFangDaKai-Regular.zip",
	},
	"ding-talk-jin-bu-ti-regular": {
		kind: "zip",
		url: "https://fonts.alibabadesign.com/DingTalkJinBuTi/DingTalkJinBuTi-Regular.zip",
	},
} as const satisfies Record<string, AlibabaFontAsset>;

export type AlibabaFontAssetId = keyof typeof ALIBABA_FONT_ASSETS;

export function buildAlibabaFontProxyUrl({
	id,
}: {
	id: AlibabaFontAssetId;
}): string {
	return `/api/fonts/alibaba?id=${id}`;
}