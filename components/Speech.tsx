'use client';

import { useEffect, useState } from 'react';
import { Mic, Square, Volume2 } from 'lucide-react';
import { speak, speechRecognitionSupported, speechSynthesisSupported, startRecognition } from '@/lib/speech';
import { useApp } from './AppContext';

export function SpeakControl({ text, compact = false }: { text: string; compact?: boolean }) {
  const { language } = useApp();
  const [slow, setSlow] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(speechSynthesisSupported());
    setSpeaking(false);
  }, [text]);

  if (!supported || !language.speech) return null;

  const play = async () => {
    setSpeaking(true);
    await speak(text, { rate: slow ? 0.65 : 1, lang: language.locale });
    setSpeaking(false);
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => void play()}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-ink/30 hover:bg-sun-soft"
        aria-label={speaking ? 'A reproduzir áudio' : 'Ouvir a frase em inglês'}
        title="Ouvir em inglês"
      >
        <Volume2 size={16} className={speaking ? 'animate-pulse' : ''} />
      </button>
      {!compact && (
        <button
          type="button"
          onClick={() => setSlow((value) => !value)}
          className={`rounded-full px-2.5 py-1.5 text-[11px] font-extrabold transition ${slow ? 'bg-sun text-ink' : 'bg-cream text-muted hover:text-ink'}`}
          aria-pressed={slow}
          title="Reprodução mais lenta"
        >
          0.75×
        </button>
      )}
    </div>
  );
}

export function SpeechInput({
  value,
  onChange,
  placeholder = 'Escreva a sua resposta…',
  minRows = 2,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const { language } = useApp();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stopRecognition, setStopRecognition] = useState<(() => void) | null>(null);

  useEffect(() => setSupported(speechRecognitionSupported() && language.speech), [language.speech]);

  const toggle = () => {
    if (listening) {
      stopRecognition?.();
      setListening(false);
      return;
    }
    setMessage(null);
    const stop = startRecognition({
      onText: (text) => onChange(text),
      onError: (error) => setMessage(error),
      onEnd: () => {
        setListening(false);
        setStopRecognition(null);
      },
    }, language.locale);
    if (!stop) {
      setMessage('Este browser não suporta reconhecimento de voz. Use o campo de texto.');
      return;
    }
    setStopRecognition(() => () => stop);
    setListening(true);
  };

  return (
    <div>
      <div className="flex items-start gap-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className="input resize-y"
          aria-label="Resposta na língua alvo"
        />
        {supported && (
          <button
            type="button"
            onClick={toggle}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${listening ? 'bg-danger text-white' : 'border border-line bg-white text-ink hover:bg-sun-soft'}`}
            aria-label={listening ? 'Parar gravação' : 'Falar a resposta'}
            title={listening ? 'Parar gravação' : 'Falar a resposta'}
          >
            {listening ? <Square size={17} /> : <Mic size={18} />}
          </button>
        )}
      </div>
      {value && supported && (
        <p className="mt-2 text-xs text-muted">
          Texto reconhecido para confirmação: <span className="font-semibold text-ink">{value}</span>
        </p>
      )}
      {message && <p className="mt-2 text-xs text-danger">{message}</p>}
      {!supported && (
        <p className="mt-2 text-xs text-muted">
          O reconhecimento de voz não está disponível neste browser. Pode sempre escrever; a pronúncia não é avaliada automaticamente.
        </p>
      )}
    </div>
  );
}
