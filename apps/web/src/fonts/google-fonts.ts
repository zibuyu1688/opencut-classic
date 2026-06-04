import type { FontAtlas } from "@/fonts/types";
import { getCustomFontSource } from "@/fonts/custom-fonts";
import { SYSTEM_FONTS } from "@/fonts/system-fonts";

const GOOGLE_FONTS_CSS = "https://fonts.googleapis.com/css2";
const FONT_ATLAS_PATH = "/fonts/font-atlas.json";
const FONT_CHUNK_PATH_PREFIX = "/fonts/font-chunk-";

const fullLoaded = new Set<string>();
const injectedStylesheets = new Set<string>();
const injectedFontFaces = new Set<string>();

let cachedAtlas: FontAtlas | null = null;
let atlasFetchPromise: Promise<FontAtlas | null> | null = null;

function encodeGoogleFontsFamily(family: string): string {
	return family.replace(/ /g, "+");
}

export function getCachedFontAtlas(): FontAtlas | null {
	return cachedAtlas;
}

export function clearFontAtlasCache(): void {
	cachedAtlas = null;
	atlasFetchPromise = null;
	fullLoaded.clear();
}

export function loadFontAtlas(): Promise<FontAtlas | null> {
	if (cachedAtlas) return Promise.resolve(cachedAtlas);
	if (atlasFetchPromise) return atlasFetchPromise;

	atlasFetchPromise = fetch(FONT_ATLAS_PATH)
		.then(async (response) => {
			if (!response.ok) return null;
			const data: FontAtlas = await response.json();
			cachedAtlas = data;
			preloadChunkImages({ atlas: data });
			return data;
		})
		.catch(() => null);

	return atlasFetchPromise;
}

function preloadChunkImages({ atlas }: { atlas: FontAtlas }): void {
	const maxChunk = Math.max(
		...Object.values(atlas.fonts).map((entry) => entry.ch),
	);
	for (let i = 0; i <= maxChunk; i++) {
		// hint browser to preload chunk images without blocking
		const img = new Image();
		img.src = `${FONT_CHUNK_PATH_PREFIX}${i}.avif`;
	}
}

function appendStylesheet({ href }: { href: string }): Promise<void> {
	if (injectedStylesheets.has(href)) {
		return Promise.resolve();
	}

	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = href;
	document.head.appendChild(link);

	return new Promise<void>((resolve) => {
		link.addEventListener(
			"load",
			() => {
				injectedStylesheets.add(href);
				resolve();
			},
			{ once: true },
		);
		link.addEventListener(
			"error",
			() => {
				resolve();
			},
			{ once: true },
		);
	});
}

function injectFontFaces({ family }: { family: string }): void {
	const source = getCustomFontSource({ family });
	if (!source?.fontFaces?.length) return;
	if (injectedFontFaces.has(family)) return;

	const style = document.createElement("style");
	style.dataset.fontFamily = family;
	style.textContent = source.fontFaces
		.map((fontFace) => {
			const weight = fontFace.weight ?? 400;
			const fontStyle = fontFace.style ?? "normal";
			return `@font-face { font-family: "${fontFace.family.replace(/"/g, '\\"')}"; src: ${fontFace.src}; font-style: ${fontStyle}; font-weight: ${weight}; font-display: swap; }`;
		})
		.join("\n");
	document.head.appendChild(style);
	injectedFontFaces.add(family);
}

export async function loadFullFont({
	family,
	weights = [400, 700],
}: {
	family: string;
	weights?: number[];
}): Promise<void> {
	if (fullLoaded.has(family)) return;
	const customSource = getCustomFontSource({ family });

	if (customSource?.cssHref) {
		await appendStylesheet({ href: customSource.cssHref });
	} else if (customSource?.fontFaces?.length) {
		injectFontFaces({ family });
	} else {
		const url = `${GOOGLE_FONTS_CSS}?family=${encodeGoogleFontsFamily(family)}:wght@${weights.join(";")}&display=swap`;
		await appendStylesheet({ href: url });
	}

	const loadWeights = customSource?.weights?.length ? customSource.weights : weights;
	await Promise.all(
		loadWeights.map((weight) =>
			document.fonts.load(`${weight} 16px "${family.replace(/"/g, '\\"')}"`),
		),
	);
	fullLoaded.add(family);
}

export async function loadFonts({
	families,
}: {
	families: string[];
}): Promise<void> {
	const googleFonts = families.filter((family) => !SYSTEM_FONTS.has(family));
	await Promise.all(googleFonts.map((family) => loadFullFont({ family })));
}
