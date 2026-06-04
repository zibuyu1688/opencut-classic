import type { TrackType } from "@/timeline";

const LEGACY_TRACK_NAMES: Record<TrackType, string> = {
	video: "Video track",
	text: "Text track",
	audio: "Audio track",
	graphic: "Graphic track",
	effect: "Effect track",
} as const;

export const DEFAULT_TRACK_NAMES: Record<TrackType, string> = {
	video: "视频轨道",
	text: "文字轨道",
	audio: "音频轨道",
	graphic: "图形轨道",
	effect: "特效轨道",
} as const;

export function getDisplayTrackName({
	trackName,
	trackType,
}: {
	trackName: string;
	trackType: TrackType;
}): string {
	return trackName === LEGACY_TRACK_NAMES[trackType]
		? DEFAULT_TRACK_NAMES[trackType]
		: trackName;
}
