/** Browser speech utilities. All features degrade gracefully when unsupported. */

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

function recognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function speechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speechRecognitionSupported(): boolean {
  return recognitionConstructor() !== undefined;
}

// ---------------------------------------------------------------------------
// Synthesis voices: personas + per-language voice selection.
// 100% local: personas reshape the system voice (pitch/rate); the selectable
// voices are the ones the browser/OS actually exposes. Nothing is synthesized
// server-side and nothing leaves the device.
// ---------------------------------------------------------------------------

export type VoicePersonaId = 'auto' | 'nori' | 'mentor' | 'expresso';

export interface VoicePersona {
  id: VoicePersonaId;
  label: string;
  description: string;
  pitch: number;
  rate: number;
}

export const VOICE_PERSONAS: readonly VoicePersona[] = [
  { id: 'auto', label: 'Voz automática', description: 'Usa a melhor voz do sistema para cada língua, na velocidade normal.', pitch: 1, rate: 1 },
  { id: 'nori', label: 'Nori · energético', description: 'Mais aguda e viva, como a mascote. Boa para frases curtas e revisão.', pitch: 1.32, rate: 1.04 },
  { id: 'mentor', label: 'Mentor · calmo', description: 'Grave e pausada. Boa para escuta atenta e leitura de exemplos longos.', pitch: 0.8, rate: 0.92 },
  { id: 'expresso', label: 'Expresso', description: 'Mais rápida, para quem já conhece a frase e quer ganhar tempo.', pitch: 1.06, rate: 1.2 },
] as const;

export interface VoiceDescriptor {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
  isDefault: boolean;
}

export function langPrefix(lang: string): string {
  return lang.split('-')[0].toLowerCase();
}

export function describeVoice(voice: {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
  default: boolean;
}): VoiceDescriptor {
  return {
    name: voice.name,
    lang: voice.lang,
    voiceURI: voice.voiceURI,
    localService: voice.localService,
    isDefault: voice.default,
  };
}

/** Pure ranking (exported for tests). Higher score wins; -1 means "not for this language". */
export function scoreVoice(voice: VoiceDescriptor, lang: string): number {
  const target = lang.toLowerCase();
  const prefix = langPrefix(lang);
  const voiceLang = voice.lang.toLowerCase();
  let score = -1;
  if (voiceLang === target) score = 100;
  else if (voiceLang.startsWith(prefix)) score = 60;
  if (score < 0) return -1;
  if (voice.localService) score += 15;
  if (voice.isDefault) score += 10;
  // Prefer fuller engines over compact/espeak variants when the engine exposes it in the name.
  if (!/compact|espeak|eloquence/i.test(voice.name)) score += 5;
  return score;
}

export function rankVoices(voices: VoiceDescriptor[], lang: string): VoiceDescriptor[] {
  return voices
    .map((voice) => ({ voice, score: scoreVoice(voice, lang) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.voice);
}

export function pickVoice(
  voices: VoiceDescriptor[],
  lang: string,
  preferredURI: string | null,
): VoiceDescriptor | undefined {
  const ranked = rankVoices(voices, lang);
  if (preferredURI) {
    const preferred = ranked.find((voice) => voice.voiceURI === preferredURI);
    if (preferred) return preferred;
  }
  return ranked[0];
}

const PERSONA_STORAGE_KEY = 'lumio.voicePersona';
const VOICE_STORAGE_KEY = 'lumio.voiceSelection';

function canUseStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function voicePersona(): VoicePersona {
  if (!canUseStorage()) return VOICE_PERSONAS[0];
  try {
    const id = window.localStorage.getItem(PERSONA_STORAGE_KEY) as VoicePersonaId | null;
    return VOICE_PERSONAS.find((persona) => persona.id === id) ?? VOICE_PERSONAS[0];
  } catch {
    return VOICE_PERSONAS[0];
  }
}

export function setVoicePersona(id: VoicePersonaId): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(PERSONA_STORAGE_KEY, id);
  } catch {
    /* storage bloqueado — a preferência simplesmente não fica guardada */
  }
}

function readVoiceMap(): Record<string, string> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(VOICE_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const map: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') map[key] = value;
    }
    return map;
  } catch {
    return {};
  }
}

/** Preferência guardada para a língua (por prefixo, ex.: "es"). */
export function preferredVoiceURI(lang: string): string | null {
  return readVoiceMap()[langPrefix(lang)] ?? null;
}

export function setPreferredVoice(lang: string, voiceURI: string | null): void {
  if (!canUseStorage()) return;
  try {
    const map = readVoiceMap();
    const prefix = langPrefix(lang);
    if (voiceURI) map[prefix] = voiceURI;
    else delete map[prefix];
    window.localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage bloqueado — ignora silenciosamente */
  }
}

export function listVoicesFor(lang: string): VoiceDescriptor[] {
  if (!speechSynthesisSupported()) return [];
  return rankVoices(window.speechSynthesis.getVoices().map(describeVoice), lang);
}

/** getVoices() loads asynchronously in several engines; wait once with a timeout. */
function loadVoices(timeoutMs = 800): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const current = synth.getVoices();
    if (current.length > 0) {
      resolve(current);
      return;
    }
    const timer = window.setTimeout(() => {
      synth.onvoiceschanged = null;
      resolve(synth.getVoices());
    }, timeoutMs);
    synth.onvoiceschanged = () => {
      window.clearTimeout(timer);
      synth.onvoiceschanged = null;
      resolve(synth.getVoices());
    };
  });
}

export function speak(
  text: string,
  options: { rate?: number; lang?: string; personaId?: VoicePersonaId } = {},
): Promise<void> {
  return new Promise((resolve) => {
    if (!speechSynthesisSupported() || !text.trim()) {
      resolve();
      return;
    }
    void (async () => {
      window.speechSynthesis.cancel();
      const lang = options.lang ?? 'en-US';
      const persona =
        VOICE_PERSONAS.find((item) => item.id === options.personaId) ?? voicePersona();
      const voices = await loadVoices();
      const chosen = pickVoice(voices.map(describeVoice), lang, preferredVoiceURI(lang));
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = options.rate ?? persona.rate;
      utterance.pitch = persona.pitch;
      if (chosen) {
        const match = voices.find((voice) => voice.voiceURI === chosen.voiceURI);
        if (match) utterance.voice = match;
      }
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
      // Some engines never fire onend; never leave callers waiting indefinitely.
      window.setTimeout(resolve, Math.max(2500, text.length * 140));
    })();
  });
}

export interface RecognitionHandlers {
  onText: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

export function startRecognition(handlers: RecognitionHandlers, locale = 'en-US'): (() => void) | null {
  const Constructor = recognitionConstructor();
  if (!Constructor) return null;
  const recognition = new Constructor();
  recognition.lang = locale;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i += 1) {
      transcript += event.results[i][0]?.transcript ?? '';
    }
    handlers.onText(transcript.trim());
  };
  recognition.onerror = (event) => {
    const message =
      event.error === 'not-allowed'
        ? 'O microfone foi bloqueado. Autorize o acesso nas definições do browser.'
        : event.error === 'no-speech'
          ? 'Não foi detetada fala. Tente novamente ou escreva a resposta.'
          : `Reconhecimento de voz indisponível (${event.error ?? 'erro'}).`;
    handlers.onError?.(message);
  };
  recognition.onend = () => handlers.onEnd?.();
  try {
    recognition.start();
  } catch {
    handlers.onError?.('Não foi possível iniciar o microfone.');
    return null;
  }
  return () => recognition.stop();
}
