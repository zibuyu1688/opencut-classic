import { buildAlibabaFontProxyUrl } from "@/fonts/alibaba-font-assets";

function buildFontPkgUrl({
	packageName,
	version,
	fileName,
}: {
	packageName: string;
	version: string;
	fileName: string;
}): string {
	return `https://cdn.jsdelivr.net/npm/${packageName}@${version}/${encodeURIComponent(fileName)}`;
}

export interface CustomFontFace {
	family: string;
	src: string;
	weight?: number;
	style?: "normal" | "italic" | "oblique";
}

export interface CustomFontSource {
	family: string;
	cssHref?: string;
	fontFaces?: CustomFontFace[];
	weights?: number[];
}

export const CUSTOM_FONT_SOURCES = new Map<string, CustomFontSource>([
	[
		"Alibaba PuHuiTi",
		{
			family: "Alibaba PuHuiTi",
			fontFaces: [
				{
					family: "Alibaba PuHuiTi",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alibaba-pu-hui-ti-3-0",
						version: "3.1.2",
						fileName: "AlibabaPuHuiTi-3-45-Light.ttf",
					})}") format("truetype")`,
					weight: 300,
					style: "normal",
				},
				{
					family: "Alibaba PuHuiTi",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alibaba-pu-hui-ti-3-0",
						version: "3.1.2",
						fileName: "AlibabaPuHuiTi-3-55-Regular.ttf",
					})}") format("truetype")`,
					weight: 400,
					style: "normal",
				},
				{
					family: "Alibaba PuHuiTi",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alibaba-pu-hui-ti-3-0",
						version: "3.1.2",
						fileName: "AlibabaPuHuiTi-3-65-Medium.ttf",
					})}") format("truetype")`,
					weight: 500,
					style: "normal",
				},
				{
					family: "Alibaba PuHuiTi",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alibaba-pu-hui-ti-3-0",
						version: "3.1.2",
						fileName: "AlibabaPuHuiTi-3-75-SemiBold.ttf",
					})}") format("truetype")`,
					weight: 600,
					style: "normal",
				},
				{
					family: "Alibaba PuHuiTi",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alibaba-pu-hui-ti-3-0",
						version: "3.1.2",
						fileName: "AlibabaPuHuiTi-3-85-Bold.ttf",
					})}") format("truetype")`,
					weight: 700,
					style: "normal",
				},
				{
					family: "Alibaba PuHuiTi",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alibaba-pu-hui-ti-3-0",
						version: "3.1.2",
						fileName: "AlibabaPuHuiTi-3-95-ExtraBold.ttf",
					})}") format("truetype")`,
					weight: 800,
					style: "normal",
				},
				{
					family: "Alibaba PuHuiTi",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alibaba-pu-hui-ti-3-0",
						version: "3.1.2",
						fileName: "AlibabaPuHuiTi-3-105-Heavy.ttf",
					})}") format("truetype")`,
					weight: 900,
					style: "normal",
				},
				{
					family: "Alibaba PuHuiTi",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alibaba-pu-hui-ti-3-0",
						version: "3.1.2",
						fileName: "AlibabaPuHuiTi-3-115-Black.ttf",
					})}") format("truetype")`,
					weight: 950,
					style: "normal",
				},
			],
			weights: [300, 400, 500, 600, 700, 800, 900, 950],
		},
	],
	[
		"Alibaba Sans TC",
		{
			family: "Alibaba Sans TC",
			fontFaces: [
				{
					family: "Alibaba Sans TC",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-tc-45" })}") format("woff2")`,
					weight: 300,
					style: "normal",
				},
				{
					family: "Alibaba Sans TC",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-tc-55" })}") format("woff2")`,
					weight: 400,
					style: "normal",
				},
				{
					family: "Alibaba Sans TC",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-tc-75" })}") format("woff2")`,
					weight: 600,
					style: "normal",
				},
				{
					family: "Alibaba Sans TC",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-tc-95" })}") format("woff2")`,
					weight: 800,
					style: "normal",
				},
			],
			weights: [300, 400, 600, 800],
		},
	],
	[
		"Alibaba Sans HK",
		{
			family: "Alibaba Sans HK",
			fontFaces: [
				{
					family: "Alibaba Sans HK",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-hk-45" })}") format("woff2")`,
					weight: 300,
					style: "normal",
				},
				{
					family: "Alibaba Sans HK",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-hk-55" })}") format("woff2")`,
					weight: 400,
					style: "normal",
				},
				{
					family: "Alibaba Sans HK",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-hk-75" })}") format("woff2")`,
					weight: 600,
					style: "normal",
				},
				{
					family: "Alibaba Sans HK",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-hk-95" })}") format("woff2")`,
					weight: 800,
					style: "normal",
				},
			],
			weights: [300, 400, 600, 800],
		},
	],
	[
		"Alibaba Sans",
		{
			family: "Alibaba Sans",
			fontFaces: [
				{
					family: "Alibaba Sans",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-light" })}") format("woff2")`,
					weight: 300,
					style: "normal",
				},
				{
					family: "Alibaba Sans",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-regular" })}") format("woff2")`,
					weight: 400,
					style: "normal",
				},
				{
					family: "Alibaba Sans",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-medium" })}") format("woff2")`,
					weight: 500,
					style: "normal",
				},
				{
					family: "Alibaba Sans",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-bold" })}") format("woff2")`,
					weight: 700,
					style: "normal",
				},
				{
					family: "Alibaba Sans",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-heavy" })}") format("woff2")`,
					weight: 800,
					style: "normal",
				},
				{
					family: "Alibaba Sans",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-black" })}") format("woff2")`,
					weight: 900,
					style: "normal",
				},
			],
			weights: [300, 400, 500, 700, 800, 900],
		},
	],
	[
		"Alibaba Sans Italic",
		{
			family: "Alibaba Sans Italic",
			fontFaces: [
				{
					family: "Alibaba Sans Italic",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-italic-light" })}") format("woff2")`,
					weight: 300,
					style: "normal",
				},
				{
					family: "Alibaba Sans Italic",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-italic-regular" })}") format("woff2")`,
					weight: 400,
					style: "normal",
				},
				{
					family: "Alibaba Sans Italic",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-italic-medium" })}") format("woff2")`,
					weight: 500,
					style: "normal",
				},
				{
					family: "Alibaba Sans Italic",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-italic-bold" })}") format("woff2")`,
					weight: 700,
					style: "normal",
				},
				{
					family: "Alibaba Sans Italic",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alibaba-sans-italic-heavy" })}") format("woff2")`,
					weight: 800,
					style: "normal",
				},
			],
			weights: [300, 400, 500, 700, 800],
		},
	],
	[
		"MiSans",
		{
			family: "MiSans",
			cssHref: "https://cdn.jsdelivr.net/npm/misans-webfont/misans-style.css",
			weights: [400, 700],
		},
	],
	[
		"Alimama FangYuanTi VF",
		{
			family: "Alimama FangYuanTi VF",
			fontFaces: [
				{
					family: "Alimama FangYuanTi VF",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alimama-fang-yuan-ti-vf",
						version: "1.0.5",
						fileName: "AlimamaFangYuanTiVF-Thin.woff2",
					})}") format("woff2")`,
					weight: 400,
					style: "normal",
				},
			],
			weights: [400],
		},
	],
	[
		"Alimama Agile VF",
		{
			family: "Alimama Agile VF",
			fontFaces: [
				{
					family: "Alimama Agile VF",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alimama-agile-vf",
						version: "1.0.5",
						fileName: "AlimamaAgileVF-Thin.woff2",
					})}") format("woff2")`,
					weight: 400,
					style: "normal",
				},
			],
			weights: [400],
		},
	],
	[
		"Alimama DaoLiTi",
		{
			family: "Alimama DaoLiTi",
			fontFaces: [
				{
					family: "Alimama DaoLiTi",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alimama-dao-li-ti",
						version: "1.0.5",
						fileName: "AlimamaDaoLiTi.woff2",
					})}") format("woff2")`,
					weight: 400,
					style: "normal",
				},
			],
			weights: [400],
		},
	],
	[
		"Alimama ShuHeiTi",
		{
			family: "Alimama ShuHeiTi",
			fontFaces: [
				{
					family: "Alimama ShuHeiTi",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/alimama-shu-hei-ti",
						version: "1.0.5",
						fileName: "AlimamaShuHeiTi-Bold.woff2",
					})}") format("woff2")`,
					weight: 700,
					style: "normal",
				},
			],
			weights: [700],
		},
	],
	[
		"Alimama DongFangDaKai",
		{
			family: "Alimama DongFangDaKai",
			fontFaces: [
				{
					family: "Alimama DongFangDaKai",
					src: `url("${buildAlibabaFontProxyUrl({ id: "alimama-dong-fang-da-kai-regular" })}") format("woff2")`,
					weight: 400,
					style: "normal",
				},
			],
			weights: [400],
		},
	],
	[
		"DingTalk JinBuTi",
		{
			family: "DingTalk JinBuTi",
			fontFaces: [
				{
					family: "DingTalk JinBuTi",
					src: `url("${buildAlibabaFontProxyUrl({ id: "ding-talk-jin-bu-ti-regular" })}") format("woff2")`,
					weight: 400,
					style: "normal",
				},
			],
			weights: [400],
		},
	],
	[
		"OPPO Sans 4.0",
		{
			family: "OPPO Sans 4.0",
			fontFaces: [
				{
					family: "OPPO Sans 4.0",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/oppo-sans-4-0",
						version: "1.700.0",
						fileName: "OPPO Sans 4.0.ttf",
					})}") format("truetype")`,
					weight: 400,
					style: "normal",
				},
			],
			weights: [400],
		},
	],
	[
		"HarmonyOS Sans SC",
		{
			family: "HarmonyOS Sans SC",
			fontFaces: [
				{
					family: "HarmonyOS Sans SC",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/harmony-os-sans-sc",
						version: "1.0.3",
						fileName: "HarmonyOS_Sans_SC_Thin.ttf",
					})}") format("truetype")`,
					weight: 100,
					style: "normal",
				},
				{
					family: "HarmonyOS Sans SC",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/harmony-os-sans-sc",
						version: "1.0.3",
						fileName: "HarmonyOS_Sans_SC_Light.ttf",
					})}") format("truetype")`,
					weight: 300,
					style: "normal",
				},
				{
					family: "HarmonyOS Sans SC",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/harmony-os-sans-sc",
						version: "1.0.3",
						fileName: "HarmonyOS_Sans_SC_Regular.ttf",
					})}") format("truetype")`,
					weight: 400,
					style: "normal",
				},
				{
					family: "HarmonyOS Sans SC",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/harmony-os-sans-sc",
						version: "1.0.3",
						fileName: "HarmonyOS_Sans_SC_Medium.ttf",
					})}") format("truetype")`,
					weight: 500,
					style: "normal",
				},
				{
					family: "HarmonyOS Sans SC",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/harmony-os-sans-sc",
						version: "1.0.3",
						fileName: "HarmonyOS_Sans_SC_Bold.ttf",
					})}") format("truetype")`,
					weight: 700,
					style: "normal",
				},
				{
					family: "HarmonyOS Sans SC",
					src: `url("${buildFontPkgUrl({
						packageName: "@fontpkg/harmony-os-sans-sc",
						version: "1.0.3",
						fileName: "HarmonyOS_Sans_SC_Black.ttf",
					})}") format("truetype")`,
					weight: 900,
					style: "normal",
				},
			],
			weights: [100, 300, 400, 500, 700, 900],
		},
	],
	[
		"Smiley Sans Oblique",
		{
			family: "Smiley Sans Oblique",
			fontFaces: [
				{
					family: "Smiley Sans Oblique",
					src: 'url("https://cdn.jsdelivr.net/npm/@fontpkg/smiley-sans@2.0.4/SmileySans-Oblique.ttf.woff2") format("woff2")',
					weight: 400,
					style: "oblique",
				},
			],
			weights: [400],
		},
	],
]);

export const CUSTOM_FONT_FAMILIES = [...CUSTOM_FONT_SOURCES.keys()];

export function getCustomFontSource({
	family,
}: {
	family: string;
}): CustomFontSource | undefined {
	return CUSTOM_FONT_SOURCES.get(family);
}