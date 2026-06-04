export type TtsProvider = "qwen" | "minimax";

export type TtsProviderKeys = Record<TtsProvider, string>;

export type TtsStoredCredentials = {
	providerKeys: TtsProviderKeys;
	qwenBaseUrl: string;
	minimaxTokenPlanKey: string;
};

export type TtsVoicePreset = {
	id: string;
	label: string;
};

export const TTS_PROVIDER_LABELS: Record<TtsProvider, string> = {
	qwen: "阿里巴巴 Qwen-TTS",
	minimax: "MiniMax",
};

export const TTS_PROVIDER_MODELS: Record<TtsProvider, string> = {
	qwen: "qwen-tts-latest",
	minimax: "speech-2.8-hd",
};

const QWEN_TTS_LATEST_VOICE_PRESETS: TtsVoicePreset[] = [
	{ id: "Cherry", label: "芊悦" },
	{ id: "Serena", label: "苏瑶" },
	{ id: "Ethan", label: "晨煦" },
	{ id: "Chelsie", label: "千雪" },
	{ id: "Momo", label: "茉兔" },
	{ id: "Vivian", label: "十三" },
	{ id: "Moon", label: "月白" },
	{ id: "Maia", label: "四月" },
	{ id: "Kai", label: "凯" },
	{ id: "Jada", label: "上海-阿珍" },
	{ id: "Dylan", label: "北京-晓东" },
	{ id: "Sunny", label: "四川-晴儿" },
	{ id: "Eric", label: "四川-川仔" },
	{ id: "Rocky", label: "粤语-阿强" },
	{ id: "Kiki", label: "粤语-阿清" },
];

const MINIMAX_SYSTEM_VOICE_PRESETS: TtsVoicePreset[] = [
	{
		id: "Chinese (Mandarin)_Reliable_Executive",
		label: "普通话 · Steady Executive",
	},
	{
		id: "Chinese (Mandarin)_News_Anchor",
		label: "普通话 · News Anchor (Female)",
	},
	{
		id: "Chinese (Mandarin)_Unrestrained_Young_Man",
		label: "普通话 · Unrestrained Young Man",
	},
	{
		id: "Chinese (Mandarin)_Mature_Woman",
		label: "普通话 · Mature Woman",
	},
	{ id: "Arrogant_Miss", label: "普通话 · Arrogant Miss" },
	{ id: "Robot_Armor", label: "普通话 · Robot Armor" },
	{
		id: "Chinese (Mandarin)_Kind-hearted_Antie",
		label: "普通话 · Kind-hearted Auntie",
	},
	{
		id: "Chinese (Mandarin)_HK_Flight_Attendant",
		label: "普通话 · HK Flight Attendant",
	},
	{
		id: "Chinese (Mandarin)_Humorous_Elder",
		label: "普通话 · Humorous Elder",
	},
	{ id: "Chinese (Mandarin)_Gentleman", label: "普通话 · Gentleman" },
	{
		id: "Chinese (Mandarin)_Warm_Bestie",
		label: "普通话 · Warm Bestie",
	},
	{
		id: "Chinese (Mandarin)_Stubborn_Friend",
		label: "普通话 · Stubborn Friend",
	},
	{
		id: "Chinese (Mandarin)_Sweet_Lady",
		label: "普通话 · Sweet Lady",
	},
	{
		id: "Chinese (Mandarin)_Southern_Young_Man",
		label: "普通话 · Southern Young Man",
	},
	{
		id: "Chinese (Mandarin)_Wise_Women",
		label: "普通话 · Wise Woman",
	},
	{
		id: "Chinese (Mandarin)_Gentle_Youth",
		label: "普通话 · Gentle Youth",
	},
	{
		id: "Chinese (Mandarin)_Warm_Girl",
		label: "普通话 · Warm Girl",
	},
	{
		id: "Chinese (Mandarin)_Male_Announcer",
		label: "普通话 · Male Announcer",
	},
	{
		id: "Chinese (Mandarin)_Kind-hearted_Elder",
		label: "普通话 · Kind-hearted Elder",
	},
	{
		id: "Chinese (Mandarin)_Cute_Spirit",
		label: "普通话 · Cute Spirit",
	},
	{
		id: "Chinese (Mandarin)_Radio_Host",
		label: "普通话 · Radio Host",
	},
	{
		id: "Chinese (Mandarin)_Lyrical_Voice",
		label: "普通话 · Lyrical Voice",
	},
	{
		id: "Chinese (Mandarin)_Straightforward_Boy",
		label: "普通话 · Straightforward Boy",
	},
	{
		id: "Chinese (Mandarin)_Sincere_Adult",
		label: "普通话 · Sincere Adult",
	},
	{
		id: "Chinese (Mandarin)_Gentle_Senior",
		label: "普通话 · Gentle Senior",
	},
	{
		id: "Chinese (Mandarin)_Crisp_Girl",
		label: "普通话 · Crisp Girl",
	},
	{
		id: "Chinese (Mandarin)_Pure-hearted_Boy",
		label: "普通话 · Pure-hearted Boy",
	},
	{
		id: "Chinese (Mandarin)_Soft_Girl",
		label: "普通话 · Soft Girl",
	},
	{
		id: "Chinese (Mandarin)_IntellectualGirl",
		label: "普通话 · Intellectual Girl",
	},
	{
		id: "Chinese (Mandarin)_Warm_HeartedGirl",
		label: "普通话 · Warm-hearted Girl",
	},
	{
		id: "Chinese (Mandarin)_Laid_BackGirl",
		label: "普通话 · Laid-back Girl",
	},
	{
		id: "Chinese (Mandarin)_ExplorativeGirl",
		label: "普通话 · Explorative Girl",
	},
	{
		id: "Chinese (Mandarin)_Warm-HeartedAunt",
		label: "普通话 · Warm-hearted Aunt",
	},
	{
		id: "Chinese (Mandarin)_BashfulGirl",
		label: "普通话 · Bashful Girl",
	},
	{
		id: "Cantonese_ProfessionalHost (F)",
		label: "粤语 · Professional Female Host",
	},
	{
		id: "Cantonese_GentleLady",
		label: "粤语 · Gentle Lady",
	},
	{
		id: "Cantonese_ProfessionalHost (M)",
		label: "粤语 · Professional Male Host",
	},
	{
		id: "Cantonese_PlayfulMan",
		label: "粤语 · Playful Man",
	},
	{
		id: "Cantonese_CuteGirl",
		label: "粤语 · Cute Girl",
	},
	{
		id: "Cantonese_KindWoman",
		label: "粤语 · Kind Woman",
	},
	{
		id: "English_expressive_narrator",
		label: "英语 · Expressive Narrator",
	},
	{ id: "English_radiant_girl", label: "英语 · Radiant Girl" },
	{
		id: "English_magnetic_voiced_man",
		label: "英语 · Magnetic-voiced Male",
	},
	{ id: "English_compelling_lady1", label: "英语 · Compelling Lady" },
	{ id: "English_Aussie_Bloke", label: "英语 · Aussie Bloke" },
	{
		id: "English_captivating_female1",
		label: "英语 · Captivating Female",
	},
	{ id: "English_Upbeat_Woman", label: "英语 · Upbeat Woman" },
	{ id: "English_Trustworth_Man", label: "英语 · Trustworthy Man" },
	{ id: "English_CalmWoman", label: "英语 · Calm Woman" },
	{ id: "English_UpsetGirl", label: "英语 · Upset Girl" },
	{
		id: "English_Gentle-voiced_man",
		label: "英语 · Gentle-voiced Man",
	},
	{ id: "English_Whispering_girl", label: "英语 · Whispering Girl" },
	{ id: "English_Diligent_Man", label: "英语 · Diligent Man" },
	{ id: "English_Graceful_Lady", label: "英语 · Graceful Lady" },
	{
		id: "English_ReservedYoungMan",
		label: "英语 · Reserved Young Man",
	},
	{ id: "English_PlayfulGirl", label: "英语 · Playful Girl" },
	{
		id: "English_ManWithDeepVoice",
		label: "英语 · Man With Deep Voice",
	},
	{ id: "English_MaturePartner", label: "英语 · Mature Partner" },
	{ id: "English_FriendlyPerson", label: "英语 · Friendly Guy" },
	{ id: "English_MatureBoss", label: "英语 · Bossy Lady" },
	{ id: "English_Debator", label: "英语 · Male Debater" },
	{ id: "English_LovelyGirl", label: "英语 · Lovely Girl" },
	{ id: "English_Steadymentor", label: "英语 · Reliable Man" },
	{
		id: "English_Deep-VoicedGentleman",
		label: "英语 · Deep-voiced Gentleman",
	},
	{ id: "English_Wiselady", label: "英语 · Wise Lady" },
	{
		id: "English_CaptivatingStoryteller",
		label: "英语 · Captivating Storyteller",
	},
	{ id: "English_DecentYoungMan", label: "英语 · Decent Young Man" },
	{ id: "English_SentimentalLady", label: "英语 · Sentimental Lady" },
	{ id: "English_ImposingManner", label: "英语 · Imposing Queen" },
	{ id: "English_SadTeen", label: "英语 · Teen Boy" },
	{
		id: "English_PassionateWarrior",
		label: "英语 · Passionate Warrior",
	},
	{ id: "English_WiseScholar", label: "英语 · Wise Scholar" },
	{ id: "English_Soft-spokenGirl", label: "英语 · Soft-Spoken Girl" },
	{ id: "English_SereneWoman", label: "英语 · Serene Woman" },
	{ id: "English_ConfidentWoman", label: "英语 · Confident Woman" },
	{ id: "English_PatientMan", label: "英语 · Patient Man" },
	{ id: "English_Comedian", label: "英语 · Comedian" },
	{ id: "English_BossyLeader", label: "英语 · Bossy Leader" },
	{
		id: "English_Strong-WilledBoy",
		label: "英语 · Strong-Willed Boy",
	},
	{ id: "English_StressedLady", label: "英语 · Stressed Lady" },
	{ id: "English_AssertiveQueen", label: "英语 · Assertive Queen" },
	{ id: "English_AnimeCharacter", label: "英语 · Female Narrator" },
	{ id: "English_Jovialman", label: "英语 · Jovial Man" },
	{ id: "English_WhimsicalGirl", label: "英语 · Whimsical Girl" },
	{
		id: "English_Kind-heartedGirl",
		label: "英语 · Kind-Hearted Girl",
	},
];

export const TTS_DEFAULT_VOICES: Record<TtsProvider, string> = {
	qwen: "Cherry",
	minimax: "Chinese (Mandarin)_Reliable_Executive",
};

export const TTS_VOICE_PRESETS: Record<TtsProvider, TtsVoicePreset[]> = {
	qwen: QWEN_TTS_LATEST_VOICE_PRESETS,
	minimax: MINIMAX_SYSTEM_VOICE_PRESETS,
};

const TTS_KEYS_STORAGE_KEY = "opencut.tts.provider-keys";

export function createEmptyTtsProviderKeys(): TtsProviderKeys {
	return {
		qwen: "",
		minimax: "",
	};
}

export function createEmptyTtsStoredCredentials(): TtsStoredCredentials {
	return {
		providerKeys: createEmptyTtsProviderKeys(),
		qwenBaseUrl: "",
		minimaxTokenPlanKey: "",
	};
}

export function isTtsProvider(value: string): value is TtsProvider {
	return value === "qwen" || value === "minimax";
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function getTtsVoicePresetValue({
	provider,
	voiceId,
}: {
	provider: TtsProvider;
	voiceId: string;
}): string {
	return TTS_VOICE_PRESETS[provider].some((preset) => preset.id === voiceId)
		? voiceId
		: "custom";
}

export function loadStoredTtsProviderKeys(): TtsProviderKeys {
	return loadStoredTtsCredentials().providerKeys;
}

export function loadStoredTtsCredentials(): TtsStoredCredentials {
	if (typeof window === "undefined") {
		return createEmptyTtsStoredCredentials();
	}

	try {
		const rawValue = window.localStorage.getItem(TTS_KEYS_STORAGE_KEY);
		if (!rawValue) {
			return createEmptyTtsStoredCredentials();
		}

		const parsed: unknown = JSON.parse(rawValue);
		if (!isObjectRecord(parsed)) {
			return createEmptyTtsStoredCredentials();
		}

		const providerKeys = {
			qwen: typeof parsed.qwen === "string" ? parsed.qwen : "",
			minimax: typeof parsed.minimax === "string" ? parsed.minimax : "",
		};

		return {
			providerKeys,
			qwenBaseUrl:
				typeof parsed.qwenBaseUrl === "string" ? parsed.qwenBaseUrl : "",
			minimaxTokenPlanKey:
				typeof parsed.minimaxTokenPlanKey === "string"
					? parsed.minimaxTokenPlanKey
					: "",
		};
	} catch {
		return createEmptyTtsStoredCredentials();
	}
}

export function saveStoredTtsProviderKeys({
	keys,
}: {
	keys: TtsProviderKeys;
}) {
	const currentCredentials = loadStoredTtsCredentials();
	saveStoredTtsCredentials({
		credentials: {
			providerKeys: keys,
			qwenBaseUrl: currentCredentials.qwenBaseUrl,
			minimaxTokenPlanKey: currentCredentials.minimaxTokenPlanKey,
		},
	});
}

export function saveStoredTtsCredentials({
	credentials,
}: {
	credentials: TtsStoredCredentials;
}) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(
		TTS_KEYS_STORAGE_KEY,
		JSON.stringify({
			qwen: credentials.providerKeys.qwen,
			minimax: credentials.providerKeys.minimax,
			qwenBaseUrl: credentials.qwenBaseUrl,
			minimaxTokenPlanKey: credentials.minimaxTokenPlanKey,
		}),
	);
}