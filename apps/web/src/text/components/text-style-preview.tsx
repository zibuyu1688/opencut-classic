import { cn } from "@/utils/ui";
import type { TextStylePreset } from "@/text/style-presets";
import {
	normalizeTextBackgroundShapePath,
	normalizeTextBackgroundVariant,
} from "@/text/background";
import { Ban } from "lucide-react";

export function TextStylePreview({ preset }: { preset: TextStylePreset }) {
	if (preset.isDisabledStyle) {
		return (
			<div className="flex size-full items-center justify-center rounded-2xl border-2 border-cyan-400 bg-zinc-800/80">
				<Ban className="size-8 text-zinc-300" strokeWidth={1.5} />
			</div>
		);
	}

	const backgroundEnabled = preset.params?.["background.enabled"] === true;
	const backgroundColor =
		typeof preset.params?.["background.color"] === "string"
			? preset.params["background.color"]
			: undefined;
	const variant = normalizeTextBackgroundVariant({
		value: preset.params?.["background.variant"],
	});
	const shapePath = normalizeTextBackgroundShapePath({
		value: preset.params?.["background.shapePath"],
	});
	const shapeFlipX = preset.params?.["background.shapeFlipX"] === true;
	const shapeFlipY = preset.params?.["background.shapeFlipY"] === true;
	const textClassName = cn(
		"select-none text-[2rem] leading-none",
		preset.previewTextClassName ?? "text-white font-bold",
	);

	if (!backgroundEnabled || !backgroundColor) {
		return (
			<div className="flex size-full items-center justify-center rounded-2xl bg-zinc-800/80 px-2 py-1.5">
				<div className={cn(preset.previewInnerClassName)}>
					<span className={textClassName}>T</span>
				</div>
			</div>
		);
	}

	return (
		<div className="flex size-full items-center justify-center rounded-2xl bg-zinc-800/80 px-2 py-1.5">
			<div className="relative flex items-center justify-center">
				<div
					className={cn(
						"relative flex items-center justify-center px-3 py-1.5",
						variant === "capsule" && "rounded-full",
						variant === "rounded" && "rounded-xl",
						variant === "speech-left" && "rounded-2xl",
						variant === "speech-right" && "rounded-2xl",
						variant === "tape" && "-rotate-2",
						variant === "underline" && "rounded-full",
						shapePath === "sticker-cut" && "rounded-none",
						shapePath === "sticker-burst" && "rounded-none",
						shapePath === "sticker-cloud" && "rounded-2xl",
						preset.previewInnerClassName,
					)}
					style={{
						backgroundColor,
						paddingBottom: variant === "underline" ? "0.75rem" : undefined,
						clipPath:
							shapePath === "sticker-cut"
								? "polygon(8% 0, 92% 0, 100% 18%, 100% 82%, 92% 100%, 8% 100%, 0 82%, 0 18%)"
								: shapePath === "speech-point"
									? "polygon(0 0, 100% 0, 100% 78%, 60% 78%, 50% 100%, 42% 78%, 0 78%)"
									: shapePath === "sticker-burst"
										? "polygon(50% 0, 61% 14%, 78% 6%, 80% 24%, 97% 25%, 87% 40%, 100% 52%, 83% 60%, 86% 78%, 68% 76%, 61% 94%, 50% 82%, 39% 94%, 32% 76%, 14% 78%, 17% 60%, 0 52%, 13% 40%, 3% 25%, 20% 24%, 22% 6%, 39% 14%)"
										: undefined,
						transform:
							shapeFlipX || shapeFlipY
								? `scale(${shapeFlipX ? -1 : 1}, ${shapeFlipY ? -1 : 1})`
								: undefined,
					}}
				>
					{(variant === "speech-left" ||
						shapePath === "speech-round" ||
						shapePath === "speech-point") && (
						<div
							className={cn(
								"absolute bottom-[-7px] h-3 w-3 rotate-12",
								shapeFlipX ? "right-1 -rotate-12" : "left-1 rotate-12",
								shapePath === "speech-point" && "h-4 w-3 bottom-[-9px]",
							)}
							style={{
								backgroundColor,
								clipPath:
									shapePath === "speech-point"
										? "polygon(50% 100%, 0 0, 100% 0)"
										: "polygon(0 0, 100% 12%, 28% 100%)",
							}}
						/>
					)}
					{variant === "speech-right" && (
						<div
							className="absolute right-1 bottom-[-7px] h-3 w-3 -rotate-12"
							style={{
								backgroundColor,
								clipPath: "polygon(72% 100%, 0 12%, 100% 0)",
							}}
						/>
					)}
					{variant === "underline" && (
						<div
							className="absolute right-0 bottom-0 left-0 h-2 rounded-full"
							style={{ backgroundColor }}
						/>
					)}
					<span
						className={textClassName}
						style={{
							transform:
								shapeFlipX || shapeFlipY
									? `scale(${shapeFlipX ? -1 : 1}, ${shapeFlipY ? -1 : 1})`
									: undefined,
						}}
					>
						T
					</span>
				</div>
			</div>
		</div>
	);
}