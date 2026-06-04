import { BaseNode } from "./base-node";
import type { TextElement } from "@/timeline";
import type { EffectPass } from "@/effects/types";
import type { BlendMode, Transform } from "@/rendering";
import {
	drawMeasuredTextLayout,
	strokeMeasuredTextLayout,
} from "@/text/primitives";
import type { MeasuredTextElement } from "@/text/measure-element";

export type TextNodeParams = TextElement & {
	transform: Transform;
	opacity: number;
	blendMode?: BlendMode;
	canvasCenter: { x: number; y: number };
	canvasHeight: number;
	textBaseline?: CanvasTextBaseline;
};

export interface ResolvedTextNodeState {
	transform: Transform;
	opacity: number;
	textColor: string;
	backgroundColor: string;
	effectPasses: EffectPass[][];
	measuredText: MeasuredTextElement;
}

export class TextNode extends BaseNode<TextNodeParams, ResolvedTextNodeState> {}

export function renderTextToContext({
	node,
	ctx,
}: {
	node: TextNode;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}): void {
	const resolved = node.resolved;
	if (!resolved) {
		return;
	}

	const x = resolved.transform.position.x + node.params.canvasCenter.x;
	const y = resolved.transform.position.y + node.params.canvasCenter.y;
	const baseline = node.params.textBaseline ?? "middle";

	ctx.save();
	ctx.translate(x, y);
	ctx.scale(resolved.transform.scaleX, resolved.transform.scaleY);
	if (resolved.transform.rotate) {
		ctx.rotate((resolved.transform.rotate * Math.PI) / 180);
	}

	const { resolvedStyle } = resolved.measuredText;
	const glowHorizontalRad = (resolvedStyle.glow.horizontalAngle * Math.PI) / 180;
	const glowVerticalRad = (resolvedStyle.glow.verticalAngle * Math.PI) / 180;
	const glowOffsetX = Math.cos(glowHorizontalRad) * resolvedStyle.glow.range;
	const glowOffsetY = Math.sin(glowVerticalRad) * resolvedStyle.glow.range;
	const shadowAngleRad = (resolvedStyle.shadow.angle * Math.PI) / 180;
	const shadowOffsetX =
		resolvedStyle.shadow.distance !== 0
			? Math.cos(shadowAngleRad) * resolvedStyle.shadow.distance
			: resolvedStyle.shadow.offsetX;
	const shadowOffsetY =
		resolvedStyle.shadow.distance !== 0
			? Math.sin(shadowAngleRad) * resolvedStyle.shadow.distance
			: resolvedStyle.shadow.offsetY;

	if (resolvedStyle.glow.enabled && resolvedStyle.glow.blur > 0) {
		ctx.save();
		ctx.translate(glowOffsetX, glowOffsetY);
		ctx.shadowColor = resolvedStyle.glow.color;
		ctx.shadowBlur =
			resolvedStyle.glow.blur +
			(resolvedStyle.glow.style === "burst"
				? resolvedStyle.glow.range * 0.8
				: resolvedStyle.glow.range * 0.45);
		ctx.globalAlpha = Math.min(
			1,
			Math.max(0.12, resolvedStyle.glow.intensity / 100),
		);
		drawMeasuredTextLayout({
			ctx,
			layout: resolved.measuredText,
			textColor: resolvedStyle.glow.color,
			textBaseline: baseline,
		});
		ctx.restore();
	}

	if (resolvedStyle.shadow.enabled) {
		ctx.save();
		ctx.translate(shadowOffsetX, shadowOffsetY);
		ctx.globalAlpha = Math.min(
			1,
			Math.max(0, resolvedStyle.shadow.opacity / 100),
		);
		if (resolvedStyle.shadow.blur > 0) {
			ctx.shadowColor = resolvedStyle.shadow.color;
			ctx.shadowBlur = resolvedStyle.shadow.blur;
		}
		drawMeasuredTextLayout({
			ctx,
			layout: resolved.measuredText,
			textColor: resolvedStyle.shadow.color,
			textBaseline: baseline,
		});
		ctx.restore();
	}

	if (resolvedStyle.stroke.enabled && resolvedStyle.stroke.width > 0) {
		strokeMeasuredTextLayout({
			ctx,
			layout: resolved.measuredText,
			strokeColor: resolvedStyle.stroke.color,
			strokeWidth: resolvedStyle.stroke.width,
			textBaseline: baseline,
		});
	}

	drawMeasuredTextLayout({
		ctx,
		layout: resolved.measuredText,
		textColor: resolved.textColor,
		background: resolved.measuredText.resolvedBackground,
		backgroundColor: resolved.backgroundColor,
		textBaseline: baseline,
	});

	ctx.restore();
}
