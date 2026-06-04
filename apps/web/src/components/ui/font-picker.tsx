"use client";

import { useState, useMemo, useRef, useCallback, useEffect, type CSSProperties } from "react";
import { List, useListRef, type RowComponentProps } from "react-window";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loadFullFont } from "@/fonts/google-fonts";
import { SYSTEM_FONTS } from "@/fonts/system-fonts";
import type { FontAtlas, FontAtlasEntry } from "@/fonts/types";
import { useFontAtlas } from "@/fonts/use-font-atlas";
import { cn } from "@/utils/ui";
import { ChevronDown, Search } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { TextIcon } from "@hugeicons/core-free-icons";

const FONT_TABS = [
	{ key: "all", label: "All fonts" },
	{ key: "chinese", label: "中文" },
	{ key: "english", label: "English" },
	{ key: "system", label: "System" },
] as const;

type FontTab = (typeof FONT_TABS)[number]["key"];

const CURATED_ENGLISH_FONT_FAMILIES = [
	"Alibaba Sans",
	"Alibaba Sans Italic",
	"Inter",
	"Roboto",
	"Open Sans",
	"Lato",
	"Montserrat",
	"Poppins",
	"IBM Plex Sans",
	"Work Sans",
	"DM Sans",
	"Manrope",
	"Merriweather",
	"Playfair Display",
	"Libre Baskerville",
	"Fira Sans",
	"Bebas Neue",
] as const;

const CURATED_CHINESE_FONT_FAMILIES = [
	"Alibaba PuHuiTi",
	"Alibaba Sans TC",
	"Alibaba Sans HK",
	"Alimama FangYuanTi VF",
	"Alimama ShuHeiTi",
	"Alimama DaoLiTi",
	"Alimama Agile VF",
	"Alimama DongFangDaKai",
	"DingTalk JinBuTi",
	"MiSans",
	"HarmonyOS Sans SC",
	"OPPO Sans 4.0",
	"Noto Sans SC",
	"Noto Serif SC",
	"Noto Sans TC",
	"Noto Serif TC",
	"Smiley Sans Oblique",
	"LXGW WenKai TC",
	"LXGW WenKai Mono TC",
	"LXGW Marker Gothic",
	"Ma Shan Zheng",
	"ZCOOL KuaiLe",
	"ZCOOL QingKe HuangYou",
	"ZCOOL XiaoWei",
	"Zhi Mang Xing",
] as const;

const COMMON_FREE_FONT_FAMILIES = [
	...CURATED_ENGLISH_FONT_FAMILIES,
	...CURATED_CHINESE_FONT_FAMILIES,
] as const;

const FONT_DISPLAY_LABELS = new Map<string, string>([
	["Alibaba PuHuiTi", "阿里巴巴普惠体 3.0"],
	["Alibaba Sans TC", "阿里巴巴普惠體 TC"],
	["Alibaba Sans HK", "阿里巴巴普惠體 HK"],
	["Alibaba Sans", "Alibaba Sans"],
	["Alibaba Sans Italic", "Alibaba Sans Italic"],
	["Alimama FangYuanTi VF", "阿里妈妈方圆体"],
	["Alimama ShuHeiTi", "阿里妈妈数黑体"],
	["Alimama DaoLiTi", "阿里妈妈刀隶体"],
	["Alimama Agile VF", "阿里妈妈灵动体"],
	["Alimama DongFangDaKai", "阿里妈妈东方大楷"],
	["DingTalk JinBuTi", "钉钉进步体"],
	["MiSans", "MiSans"],
	["HarmonyOS Sans SC", "HarmonyOS Sans"],
	["OPPO Sans 4.0", "OPPO Sans"],
	["Noto Sans SC", "思源黑体"],
	["Noto Serif SC", "思源宋体"],
	["Noto Sans TC", "思源黑體"],
	["Noto Serif TC", "思源宋體"],
	["Smiley Sans Oblique", "得意黑"],
	["LXGW WenKai TC", "霞鹜文楷"],
	["LXGW WenKai Mono TC", "霞鹜文楷等宽"],
	["LXGW Marker Gothic", "霞鹜漫黑"],
	["Ma Shan Zheng", "马善政毛笔体"],
	["ZCOOL KuaiLe", "站酷快乐体"],
	["ZCOOL QingKe HuangYou", "站酷庆科黄油体"],
	["ZCOOL XiaoWei", "站酷小薇体"],
	["Zhi Mang Xing", "志莽行书"],
]);

const FONT_SEARCH_ALIASES = new Map<string, string[]>([
	["Alibaba PuHuiTi", ["阿里普惠体", "普惠体", "普惠体 3.0", "阿里巴巴普惠体 3.0", "AlibabaPuHuiTi"]],
	["Alibaba Sans TC", ["阿里巴巴普惠體TC", "普惠體TC", "AlibabaSansTC"]],
	["Alibaba Sans HK", ["阿里巴巴普惠體HK", "普惠體HK", "AlibabaSansHK"]],
	["Alibaba Sans", ["阿里巴巴 Sans", "AlibabaSans"]],
	["Alibaba Sans Italic", ["AlibabaSansItalic", "阿里巴巴 Sans Italic"]],
	["Alimama FangYuanTi VF", ["阿里妈妈方圆体", "方圆体", "Alimama FangYuanTi"]],
	["Alimama ShuHeiTi", ["阿里妈妈数黑体", "数黑体", "Alimama ShuHeiTi"]],
	["Alimama DaoLiTi", ["阿里妈妈刀隶体", "刀隶体", "Alimama DaoLiTi"]],
	["Alimama Agile VF", ["阿里妈妈灵动体", "灵动体", "Alimama Agile"]],
	["Alimama DongFangDaKai", ["阿里妈妈东方大楷", "东方大楷", "Alimama DongFangDaKai"]],
	["DingTalk JinBuTi", ["钉钉进步体", "进步体", "DingTalkJinBuTi"]],
	["MiSans", ["小米字体", "小米", "Mi Sans"]],
	["HarmonyOS Sans SC", ["HarmonyOS Sans", "鸿蒙字体", "华为鸿蒙", "HarmonyOS"]],
	["OPPO Sans 4.0", ["OPPO Sans", "OPPOSans", "OPPO字体"]],
	["Noto Sans SC", ["思源黑体", "黑体", "Source Han Sans"]],
	["Noto Serif SC", ["思源宋体", "宋体", "Source Han Serif"]],
	["Noto Sans TC", ["思源黑體", "黑體"]],
	["Noto Serif TC", ["思源宋體", "宋體"]],
	["Smiley Sans Oblique", ["得意黑", "Smiley Sans"]],
	["LXGW WenKai TC", ["霞鹜文楷", "文楷"]],
	["LXGW WenKai Mono TC", ["霞鹜文楷等宽", "等宽文楷", "文楷 Mono"]],
	["LXGW Marker Gothic", ["霞鹜漫黑", "漫黑"]],
	["Ma Shan Zheng", ["马善政", "毛笔体"]],
	["ZCOOL KuaiLe", ["站酷快乐体", "快乐体"]],
	["ZCOOL QingKe HuangYou", ["站酷庆科黄油体", "黄油体"]],
	["ZCOOL XiaoWei", ["站酷小薇体", "小薇体"]],
	["Zhi Mang Xing", ["志莽行书", "行书"]],
]);

const COMMON_FREE_FONT_ORDER = new Map(
	COMMON_FREE_FONT_FAMILIES.map((family, index) => [family, index]),
);

function getFontLabel({ family }: { family: string }): string {
	return FONT_DISPLAY_LABELS.get(family) ?? family;
}

function matchesFontSearch({ family, query }: { family: string; query: string }): boolean {
	const normalizedQuery = query.toLowerCase();
	const aliases = FONT_SEARCH_ALIASES.get(family) ?? [];
	return [family, getFontLabel({ family }), ...aliases].some((term) =>
		term.toLowerCase().includes(normalizedQuery),
	);
}

function sortFontNames(fontNames: string[]): string[] {
	return [...fontNames].sort((left, right) => {
		const leftRank = COMMON_FREE_FONT_ORDER.get(left);
		const rightRank = COMMON_FREE_FONT_ORDER.get(right);

		if (leftRank !== undefined || rightRank !== undefined) {
			if (leftRank === undefined) return 1;
			if (rightRank === undefined) return -1;
			return leftRank - rightRank;
		}

		return left.localeCompare(right);
	});
}

const ROW_HEIGHT = 48;
const PREVIEW_SCALE = 0.8;
const LIST_WIDTH = 288;
const MAX_LIST_HEIGHT = 288;
const OVERSCAN = 15;

interface FontPickerProps {
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	className?: string;
}

export function FontPicker({
	defaultValue,
	onValueChange,
	className,
}: FontPickerProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [activeTab, setActiveTab] = useState<FontTab>("all");
	const searchInputRef = useRef<HTMLInputElement>(null);
	const listRef = useListRef();
	const { atlas, status, fontNames, retry: handleRetry } = useFontAtlas({ open });

	const tabFonts = useMemo(() => {
		switch (activeTab) {
			case "chinese": {
				return CURATED_CHINESE_FONT_FAMILIES.filter((family) =>
					fontNames.includes(family),
				);
			}
			case "english": {
				return CURATED_ENGLISH_FONT_FAMILIES.filter((family) =>
					fontNames.includes(family),
				);
			}
			case "system": {
				return sortFontNames(fontNames.filter((name) => SYSTEM_FONTS.has(name)));
			}
			default: {
				return sortFontNames(fontNames);
			}
		}
	}, [activeTab, fontNames]);

	const filteredFonts = useMemo(() => {
		if (!search) return tabFonts;
		return tabFonts.filter((family) =>
			matchesFontSearch({ family, query: search }),
		);
	}, [search, tabFonts]);

	const listHeight = Math.min(
		MAX_LIST_HEIGHT,
		filteredFonts.length * ROW_HEIGHT,
	);

	const handleSelect = useCallback(
		async ({ family }: { family: string }) => {
			if (!SYSTEM_FONTS.has(family)) {
				try {
					await loadFullFont({ family });
				} catch {
					// ignore load failure, font will fall back to system default
				}
			}
			onValueChange?.(family);
			setOpen(false);
		},
		[onValueChange],
	);

	const handleOpenChange = useCallback((nextOpen: boolean) => {
		setOpen(nextOpen);
		if (nextOpen) return;
		setSearch("");
		setActiveTab("all");
	}, []);

	const activeTabLabel =
		FONT_TABS.find((t) => t.key === activeTab)?.label.toLowerCase() ?? "";

	useEffect(() => {
		if (!open || status !== "idle" || filteredFonts.length === 0) {
			return;
		}

		const frameId = requestAnimationFrame(() => {
			listRef.current?.scrollToRow({
				index: 0,
				behavior: "instant",
				align: "start",
			});
		});

		return () => {
			cancelAnimationFrame(frameId);
		};
	}, [activeTab, filteredFonts.length, listRef, open, search, status]);

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger
				className={cn(
					"border-border bg-accent flex h-7 w-full cursor-pointer items-center justify-between gap-1 rounded-md border px-2.5 text-sm whitespace-nowrap focus-visible:border-primary focus-visible:ring-0 focus:outline-hidden",
					className,
				)}
			>
				<div className="flex min-w-0 items-center gap-1.5">
					<span className="text-muted-foreground [&_svg]:size-3.5 shrink-0">
						<HugeiconsIcon icon={TextIcon} />
					</span>
					<span className="truncate" style={{ fontFamily: defaultValue }}>
						{defaultValue
							? getFontLabel({ family: defaultValue })
							: "Select a font"}
					</span>
				</div>
				<ChevronDown className="size-3 shrink-0 opacity-50" />
			</PopoverTrigger>
			<PopoverContent
				className="w-72 p-0 overflow-hidden"
				align="start"
				side="left"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					searchInputRef.current?.focus();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					event.stopPropagation();
				}}
			>
				<div className="relative px-3 py-1.5">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 shrink-0 opacity-50" />
					<Input
						ref={searchInputRef}
						placeholder={`Search ${activeTabLabel}...`}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						size="xs"
						className="w-full pl-5 bg-transparent border-none! shadow-none!"
					/>
				</div>
				<div className="flex border-b px-3">
					{FONT_TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							className={cn(
								"px-3 py-1.5 text-xs border-b-2 -mb-px",
								activeTab === tab.key
									? "border-foreground text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setActiveTab(tab.key)}
						>
							{tab.label}
						</button>
					))}
				</div>
				{status === "loading" && (
					<div className="py-8 text-center text-sm text-muted-foreground">
						Loading fonts...
					</div>
				)}
				{status === "error" && (
					<div className="flex flex-col items-center gap-3 py-8 px-4">
						<p className="text-sm text-muted-foreground text-center">
							Failed to load font previews.
						</p>
						<Button variant="outline" size="sm" onClick={handleRetry}>
							Retry
						</Button>
					</div>
				)}
				{status === "idle" &&
					fontNames.length > 0 &&
					filteredFonts.length === 0 && (
						<div className="py-6 text-center text-sm text-muted-foreground">
							No fonts found.
						</div>
					)}
				{status === "idle" && atlas && filteredFonts.length > 0 && (
					<List
						key={`${activeTab}-${search}`}
						listRef={listRef}
						rowCount={filteredFonts.length}
						rowHeight={ROW_HEIGHT}
						overscanCount={OVERSCAN}
						rowComponent={FontRow}
						rowProps={{
							atlas,
							filteredFonts,
							selectedFont: defaultValue,
							onFontSelect: handleSelect,
						}}
						style={{ height: listHeight, width: LIST_WIDTH }}
					/>
				)}
			</PopoverContent>
		</Popover>
	);
}

function FontSpritePreview({ entry }: { entry: FontAtlasEntry }) {
	return (
		<div
			className="shrink-0"
			style={{
				width: entry.w,
				height: ROW_HEIGHT,
				backgroundColor: "currentColor",
				WebkitMaskImage: `url(/fonts/font-chunk-${entry.ch}.avif)`,
				WebkitMaskPosition: `-${entry.x}px -${entry.y}px`,
				WebkitMaskRepeat: "no-repeat",
				maskImage: `url(/fonts/font-chunk-${entry.ch}.avif)`,
				maskPosition: `-${entry.x}px -${entry.y}px`,
				maskRepeat: "no-repeat",
				transform: `scale(${PREVIEW_SCALE})`,
				transformOrigin: "left center",
			}}
		/>
	);
}

type FontRowProps = {
	atlas: FontAtlas;
	filteredFonts: string[];
	selectedFont: string | undefined;
	onFontSelect: (params: { family: string }) => void;
};

function FontRow({
	index,
	style,
	atlas,
	filteredFonts,
	selectedFont,
	onFontSelect,
}: RowComponentProps<FontRowProps>) {
	const fontName = filteredFonts[index];
	const entry = atlas.fonts[fontName];
	const isSelected = fontName === selectedFont;
	const isSystemFont = SYSTEM_FONTS.has(fontName);
	const label = getFontLabel({ family: fontName });
	const showFamilyName = label !== fontName;

	return (
		<button
			type="button"
			style={style as CSSProperties}
			className={cn(
				"flex w-full cursor-pointer items-center gap-2 px-3 outline-hidden hover:bg-popover-hover",
				isSelected && "bg-popover-hover",
			)}
			onClick={() => onFontSelect({ family: fontName })}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onFontSelect({ family: fontName });
				}
			}}
			aria-label={label}
		>
			<div className="min-w-0 flex-1 overflow-hidden">
				<div className="truncate text-sm text-foreground/90">{label}</div>
				{showFamilyName && (
					<div className="truncate text-[11px] text-muted-foreground">
						{fontName}
					</div>
				)}
			</div>
			<div className="shrink-0 overflow-hidden text-foreground/75">
				{isSystemFont ? (
					<span className="text-base" style={{ fontFamily: fontName }}>
						Aa
					</span>
				) : entry ? (
					<FontSpritePreview entry={entry} />
				) : (
					<span className="text-base" style={{ fontFamily: fontName }}>
						中 Aa
					</span>
				)}
			</div>
		</button>
	);
}
