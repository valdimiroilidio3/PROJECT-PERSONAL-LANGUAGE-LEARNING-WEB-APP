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

export function englishVoices(): SpeechSynthesisVoice[] {
  if (!speechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('en'));
}

export function speak(text: string, options: { rate?: number; lang?: string } = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!speechSynthesisSupported() || !text.trim()) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang ?? 'en-US';
    utterance.rate = options.rate ?? 1;
    const voice = englishVoices().find((item) => item.lang === utterance.lang);
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
    // Some engines never fire onend; never leave callers waiting indefinitely.
    window.setTimeout(resolve, Math.max(2500, text.length * 120));
  });
}

export interface RecognitionHandlers {
  onText: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

export function startRecognition(handlers: RecognitionHandlers): (() => void) | null {
  const Constructor = recognitionConstructor();
  if (!Constructor) return null;
  const recognition = new Constructor();
  recognition.lang = 'en-US';
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
