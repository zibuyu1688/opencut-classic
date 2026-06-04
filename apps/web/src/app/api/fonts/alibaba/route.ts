import {
	ALIBABA_FONT_ASSETS,
	type AlibabaFontAssetId,
} from "@/fonts/alibaba-font-assets";
import { unzipSync } from "fflate";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isAlibabaFontAssetId(value: string): value is AlibabaFontAssetId {
	return value in ALIBABA_FONT_ASSETS;
}

const ZIP_FONT_EXTENSION_PRIORITY = [".woff2", ".woff", ".otf", ".ttf"] as const;

const FONT_CONTENT_TYPES = new Map<string, string>([
	[".woff2", "font/woff2"],
	[".woff", "font/woff"],
	[".otf", "font/otf"],
	[".ttf", "font/ttf"],
]);

function extractFontAssetFromZip(zipData: Uint8Array) {
	const entries = Object.entries(unzipSync(zipData));

	for (const extension of ZIP_FONT_EXTENSION_PRIORITY) {
		const matchedEntry = entries.find(([fileName]) =>
			fileName.toLowerCase().endsWith(extension),
		);

		if (matchedEntry) {
			return {
				data: matchedEntry[1],
				contentType: FONT_CONTENT_TYPES.get(extension) ?? "application/octet-stream",
			};
		}
	}

	return undefined;
}

export async function GET(request: NextRequest) {
	const id = request.nextUrl.searchParams.get("id");
	if (!id || !isAlibabaFontAssetId(id)) {
		return NextResponse.json({ error: "未知字体资源" }, { status: 400 });
	}

	const asset = ALIBABA_FONT_ASSETS[id];
	const upstreamResponse = await fetch(asset.url, {
		headers: {
			Referer: "https://www.alibabafonts.com/",
			"User-Agent": "Mozilla/5.0 OpenCut Font Proxy",
		},
	});

	if (!upstreamResponse.ok) {
		return NextResponse.json(
			{ error: `字体资源请求失败: ${upstreamResponse.status}` },
			{ status: 502 },
		);
	}

	const headers = new Headers();
	headers.set("Cache-Control", "public, max-age=31536000, immutable");
	const etag = upstreamResponse.headers.get("etag");
	if (etag) {
		headers.set("ETag", etag);
	}

	if (asset.kind === "direct") {
		headers.set(
			"Content-Type",
			upstreamResponse.headers.get("content-type") ?? "font/woff2",
		);

		return new NextResponse(upstreamResponse.body, {
			status: 200,
			headers,
		});
	}

	const zipData = new Uint8Array(await upstreamResponse.arrayBuffer());
	const extractedFontAsset = extractFontAssetFromZip(zipData);

	if (!extractedFontAsset) {
		return NextResponse.json(
			{ error: "未在字体压缩包中找到可用字体文件" },
			{ status: 502 },
		);
	}

	headers.set("Content-Type", extractedFontAsset.contentType);

	return new NextResponse(extractedFontAsset.data, {
		status: 200,
		headers,
	});
}