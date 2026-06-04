"use client";

import { Section, SectionContent } from "@/components/section";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import { useEditor } from "@/editor/use-editor";
import type { TextElement } from "@/timeline";
import {
	buildTextStyleParams,
	TEXT_STYLE_PRESET_TABS,
	type TextStylePreset,
} from "@/text/style-presets";
import { TextStylePreview } from "@/text/components/text-style-preview";
import { cn } from "@/utils/ui";

export function TextStylePresetsSection({
	element,
	trackId,
}: {
	element: TextElement;
	trackId: string;
}) {
	const editor = useEditor();

	const handleApplyPreset = ({ preset }: { preset: TextStylePreset }) => {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					patch: {
						params: buildTextStyleParams({ preset }),
					},
				},
			],
		});
	};

	return (
		<Section sectionKey={`${element.id}:text-style-presets`}>
			<SectionContent className="pt-4">
				<div className="flex flex-col gap-3">
					<div className="text-sm text-foreground/90">预设样式</div>
					<Tabs defaultValue="basic" className="flex flex-col gap-3">
						<TabsList className="grid h-9 w-full grid-cols-3">
							{TEXT_STYLE_PRESET_TABS.map((tab) => (
								<TabsTrigger key={tab.id} value={tab.id}>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
						{TEXT_STYLE_PRESET_TABS.map((tab) => (
							<TabsContent key={tab.id} value={tab.id} className="mt-0">
								<div className="grid grid-cols-4 gap-2">
									{tab.presets.map((preset) => {
										const isActive = isPresetApplied({ element, preset });
										return (
											<button
												key={preset.id}
												type="button"
												onClick={() => handleApplyPreset({ preset })}
												className={cn(
													"flex flex-col gap-1 rounded-md border p-1 text-left transition-colors",
													isActive
														? "border-primary bg-accent"
														: "border-border hover:bg-accent/50",
												)}
											>
												<div className="aspect-[5/4] w-full overflow-hidden rounded-sm">
													<TextStylePreview preset={preset} />
												</div>
												<div className="truncate text-[11px] text-foreground/90">
													{preset.name}
												</div>
											</button>
										);
									})}
								</div>
							</TabsContent>
						))}
					</Tabs>
				</div>
			</SectionContent>
		</Section>
	);
}

function isPresetApplied({
	element,
	preset,
}: {
	element: TextElement;
	preset: TextStylePreset;
}): boolean {
	const targetParams = buildTextStyleParams({ preset });

	return Object.entries(targetParams).every(([key, value]) => {
		return element.params[key] === value;
	});
}