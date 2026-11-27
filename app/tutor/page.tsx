'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Check, MessageCircle, Mic, Play, Plus, Send, Sparkles, Volume2 } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { SpeakControl, SpeechInput } from '@/components/Speech';
import { PageHeader, Tag } from '@/components/ui';
import { scenariosFor } from '@/lib/content';
import { levelLabel } from '@/lib/languages';
import { offlineReply, scenarioOpening, type Personality, type TutorMode, type TutorReply } from '@/lib/tutor/offline';
import { characterFor } from '@/lib/tutor/characters';
import { analyzeFluency, difficultyHint } from '@/lib/tutor/fluency';
import { speak, speechRecognitionSupported, speechSynthesisSupported } from '@/lib/speech';
import type { SupportLocale } from '@/lib/tutor/validation';
import type { LearnerLevel, PracticeScenario, TutorMessage, TutorSession } from '@/lib/types';

const personalities: { id: Personality; label: string; description: string }[] = [
  { id: 'friendly', label: 'Amigável', description: 'Leve e incentivador' },
  { id: 'patient', label: 'Paciente', description: 'Mais devagar e repetitivo' },
  { id: 'formal', label: 'Formal', description: 'Tom mais profissional' },
];

const difficulties: { id: LearnerLevel; label: string }[] = [
  { id: 'beginner', label: 'Iniciante' },
  { id: 'elementary', label: 'Elementar' },
  { id: 'intermediate', label: 'Intermédio' },
  { id: 'advanced', label: 'Avançado' },
];

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function spokenWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function summarize(messages: TutorMessage[], scenarioTitle: string): string {
  const corrections = messages.reduce((sum, item) => sum + (item.corrections?.length ?? 0), 0);
  return `${messages.filter((item) => item.role === 'user').length} mensagens · ${corrections} correções · ${scenarioTitle}`;
}

export default function TutorPage() {
  const { profile, language, sessions, saveSession, recordAttempt, updateProfile } = useApp();
  const scenarios = useMemo(() => scenariosFor(profile.targetLanguage), [profile.targetLanguage]);
  const [scenarioId, setScenarioId] = useState('');
  const [personality, setPersonality] = useState<Personality>('friendly');
  const [difficulty, setDifficulty] = useState<LearnerLevel>(profile.level);
  const [supportLocale, setSupportLocale] = useState<SupportLocale>(profile.supportLocale ?? 'pt-PT');
  const [mode, setMode] = useState<TutorMode>('offline');
  const [remoteModes, setRemoteModes] = useState<TutorMode[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceMessageIds, setVoiceMessageIds] = useState<string[]>([]);
  const lastSpokenRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
  const character = characterFor(scenario.id);
  const voiceSupported =
    typeof window !== 'undefined' && speechSynthesisSupported() && speechRecognitionSupported() && language.speech;

  useEffect(() => {
    try {
      setVoiceMode(window.localStorage.getItem('lumio.voiceConvo') === '1');
    } catch {
      setVoiceMode(false);
    }
  }, []);

  const toggleVoiceMode = () => {
    setVoiceMode((current) => {
      const next = !current;
      try {
        window.localStorage.setItem('lumio.voiceConvo', next ? '1' : '0');
      } catch {
        /* storage bloqueado — vale só para esta visita */
      }
      return next;
    });
  };

  useEffect(() => {
    setMessages([]);
    setActiveId(null);
    setError(null);
    setVoiceMessageIds([]);
    setScenarioId(scenarios[0]?.id ?? '');
  }, [profile.targetLanguage, scenarios]);

  // Lê em voz alta cada resposta do tutor enquanto a conversa por voz está ligada.
  useEffect(() => {
    if (!voiceMode) return;
    const lastTutor = [...messages].reverse().find((item) => item.role === 'tutor');
    if (lastTutor && lastTutor.id !== lastSpokenRef.current) {
      lastSpokenRef.current = lastTutor.id;
      void speak(lastTutor.text, { lang: language.locale });
    }
  }, [messages, voiceMode, language.locale]);

  useEffect(() => {
    void fetch('/api/tutor')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Configuração indisponível'))))
      .then((data: { modes?: string[] }) => setRemoteModes((data.modes ?? []) as TutorMode[]))
      .catch(() => setRemoteModes([]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pending]);

  const persist = (next: TutorMessage[]) => {
    const id = activeId ?? newId();
    if (!activeId) setActiveId(id);
    const session: TutorSession = {
      id,
      createdAt: sessions.find((item) => item.id === id)?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scenarioId,
      personality,
      difficulty,
      messages: next,
      summary: summarize(next, scenario.title),
    };
    void saveSession(session);
  };

  const replyWith = async (text: string, nextMessages: TutorMessage[], chosenMode: TutorMode) => {
    let reply: TutorReply;
    // Se a sessão começou pela fala de abertura da personagem (mensagens[0] é tutor),
    // o primeiro turno útil já é a fala seguinte do guião — evita repetir a abertura.
    const seededOffset = nextMessages[0]?.role === 'tutor' ? 1 : 0;
    if (chosenMode === 'offline') {
      reply = offlineReply({
        languageId: profile.targetLanguage,
        scenarioId,
        personality,
        difficulty,
        userText: text,
        turn: nextMessages.filter((item) => item.role === 'user').length - 1 + seededOffset,
        supportLocale,
      });
    } else {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: chosenMode,
          languageId: profile.targetLanguage,
          scenarioId,
          personality,
          difficulty,
          supportLocale,
          messages: nextMessages.filter((item) => item.provider !== 'offline').map((item) => ({ role: item.role === 'user' ? 'user' : 'assistant', content: item.text })),
        }),
      });
      const data = (await response.json()) as TutorReply & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Servidor indisponível.');
      reply = { text: data.text, translation: data.translation ?? '', alternatives: data.alternatives ?? [], corrections: data.corrections ?? [] };
    }

    const tutorMessage: TutorMessage = {
      id: newId(),
      role: 'tutor',
      text: reply.text,
      translation: reply.translation,
      alternatives: reply.alternatives,
      corrections: reply.corrections,
      timestamp: new Date().toISOString(),
      scenarioId,
      provider: chosenMode,
    };
    const finalMessages = [...nextMessages, tutorMessage];
    setMessages(finalMessages);
    persist(finalMessages);
    void recordAttempt({
      lessonId: `tutor-${scenarioId}`,
      exerciseId: `tutor-turn-${nextMessages.length}`,
      exerciseType: 'sentence',
      category: scenario.category,
      correct: reply.corrections.length === 0,
      userAnswer: text,
      correctAnswer: reply.text,
      durationMs: Math.min(300_000, Math.max(1000, Date.now() - new Date(nextMessages[nextMessages.length - 1].timestamp).getTime())),
      xpAwarded: 0,
      source: 'tutor',
    });
  };

  const fluencyReport = useMemo(
    () => analyzeFluency(messages.filter((item) => item.role === 'user').map((item) => item.text)),
    [messages],
  );
  const hint = useMemo(() => difficultyHint(messages), [messages]);
  const difficultyOrder: LearnerLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced'];
  const hintedDifficulty = hint
    ? difficultyOrder[Math.min(difficultyOrder.length - 1, Math.max(0, difficultyOrder.indexOf(difficulty) + (hint === 'up' ? 1 : -1)))]
    : null;

  const startAsCharacter = () => {
    if (messages.length > 0) return;
    const opening = scenarioOpening(scenarioId, supportLocale);
    const tutorMessage: TutorMessage = {
      id: newId(),
      role: 'tutor',
      text: opening.text,
      translation: opening.translation,
      alternatives: [],
      corrections: [],
      timestamp: new Date().toISOString(),
      scenarioId,
      provider: 'offline',
    };
    const next = [tutorMessage];
    setMessages(next);
    persist(next);
  };

  const sendText = async (rawText: string, viaVoice: boolean, overrideMode?: TutorMode) => {
    const text = rawText.trim();
    if (!text || pending) return;
    const chosenMode = overrideMode ?? mode;
    const userMessage: TutorMessage = {
      id: newId(),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      scenarioId,
      provider: chosenMode,
    };
    if (viaVoice) {
      setVoiceMessageIds((previous) => (previous.includes(userMessage.id) ? previous : [...previous, userMessage.id]));
    }
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setPending(true);
    try {
      await replyWith(text, nextMessages, chosenMode);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível obter uma resposta.');
    } finally {
      setPending(false);
    }
  };

  const send = (overrideMode?: TutorMode) => sendText(input, false, overrideMode);

  const retryOffline = async () => {
    const lastUserIndex = messages.map((item) => item.role).lastIndexOf('user');
    if (lastUserIndex < 0 || pending) return;
    const lastUser = messages[lastUserIndex];
    setPending(true);
    setError(null);
    try {
      await replyWith(lastUser.text, messages.slice(0, lastUserIndex + 1), 'offline');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível continuar offline.');
    } finally {
      setPending(false);
    }
  };

  const changeSupportLocale = (value: SupportLocale) => {
    setSupportLocale(value);
    void updateProfile({ supportLocale: value });
  };

  const openSession = (session: TutorSession) => {
    setActiveId(session.id);
    setMessages(session.messages);
    setScenarioId(session.scenarioId);
    setPersonality(session.personality as Personality);
    setDifficulty(session.difficulty);
    setShowSetup(false);
    setVoiceMessageIds([]);
    setError(null);
  };

  const startNew = () => {
    if (messages.length > 0) persist(messages);
    setActiveId(null);
    setMessages([]);
    setInput('');
    setVoiceMessageIds([]);
    setError(null);
    setShowSetup(true);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Conversa por voz e texto"
        title={`Tutor de ${language.label.toLowerCase()} com personagens`}
        description="Fala ou escreve com a personagem da situação — ela responde, segue o teu nível e corrige gramática e vocabulário. Funciona offline; com um modelo local/compatível, as conversas são livres. Sem avaliação fonética — a voz vem da transcrição do browser."
        action={<button type="button" onClick={startNew} className="btn-primary"><Plus size={16} /> Nova conversa</button>}
      />

      {error && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm" role="alert">
          <AlertCircle size={18} className="text-danger" />
          <p className="flex-1">{error}</p>
          <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => void retryOffline()}>Continuar offline</button>
        </div>
      )}

      {mode !== 'offline' && (
        <div className="mb-5 rounded-2xl border border-sun bg-sun-soft p-4 text-sm" role="note">
          <p className="font-black">Este modo utiliza um serviço externo.</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">A conversa é enviada para o modelo configurado no servidor. Não introduzas dados pessoais. O modo offline continua disponível sem ligação à Internet.</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[270px_1fr]">
        <aside className="space-y-4">
          <details className="card lg:hidden" open={sessions.length === 0}>
            <summary className="cursor-pointer text-sm font-black">Definições e histórico</summary>
            <div className="mt-4"><SetupPanel {...{ scenarios, scenarioId, setScenarioId, personality, setPersonality, difficulty, setDifficulty, supportLocale, setSupportLocale: changeSupportLocale, mode, setMode, remoteModes, sessions, openSession, showSetup, setShowSetup }} /></div>
          </details>
          <div className="hidden space-y-4 lg:block">
            <SetupPanel {...{ scenarios, scenarioId, setScenarioId, personality, setPersonality, difficulty, setDifficulty, supportLocale, setSupportLocale: changeSupportLocale, mode, setMode, remoteModes, sessions, openSession, showSetup, setShowSetup }} />
          </div>
        </aside>

        <section className="card flex min-h-[560px] flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sun-soft text-2xl" aria-hidden>{character.emoji}</span>
              <div className="min-w-0">
                <p className="truncate font-black">{character.name} · {scenario.title}</p>
                <p className="truncate text-xs text-muted">{character.role}</p>
                <p className="text-[11px] text-muted">{personality} · {difficulty} · {mode === 'offline' ? 'sem API' : mode}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceMode}
                disabled={!voiceSupported}
                aria-pressed={voiceMode}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${voiceMode ? 'bg-ink text-white' : 'border border-line bg-white text-muted hover:text-ink'}`}
                title={voiceSupported ? 'Ligar/desligar conversa por voz' : 'O teu browser não suporta síntese ou reconhecimento de voz'}
              >
                {voiceMode ? <Volume2 size={14} /> : <Mic size={14} />} Conversa por voz{voiceMode ? ' · ativa' : ''}
              </button>
              <Tag tone={mode === 'offline' ? 'green' : 'sun'}>{mode === 'offline' ? 'Modo offline' : 'Modelo externo'}</Tag>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-sun-soft text-5xl" aria-hidden>{character.emoji}</span>
              <h2 className="mt-4 text-xl font-black">{character.name}</h2>
              <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-muted">{character.role}</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                {scenario.description} {voiceMode ? 'Fala ao microfone ou escreve — a personagem responde em voz alta.' : `Escreve em ${language.label.toLowerCase()} ou liga a conversa por voz — a personagem responde com apoio em português.`}
              </p>
              <button type="button" onClick={startAsCharacter} className="btn-primary mt-6">
                <Play size={16} /> Começar com {character.name}
              </button>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {scenario.hints.slice(0, 3).map((hint) => (
                  <button key={hint} type="button" onClick={() => setInput(hint)} className="rounded-full border border-line bg-cream px-3 py-2 text-xs font-bold hover:border-ink/30">{hint}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-4 py-5" aria-live="polite">
              {messages.map((message) => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm sm:max-w-[75%] ${message.role === 'user' ? 'bg-sun text-ink' : 'border border-line bg-cream'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-relaxed">{message.text}</p>
                      {message.role === 'tutor' && <SpeakControl text={message.text} compact />}
                    </div>
                    {message.translation && <p className="mt-2 text-xs italic text-muted">{message.translation}</p>}
                    {message.corrections && message.corrections.length > 0 && (
                      <div className="mt-3 rounded-2xl bg-white p-3 text-xs">
                        <p className="font-black">Correções</p>
                        {message.corrections.map((correction, index) => (
                          <div key={index} className="mt-2 border-t border-line pt-2">
                            <p><span className="text-danger line-through">{correction.original}</span> → <strong className="text-success">{correction.corrected}</strong></p>
                            <p className="mt-1 text-muted">{correction.explanation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.alternatives && message.alternatives.length > 0 && (
                      <div className="mt-3 text-xs">
                        <p className="font-black">Outras formas de dizer</p>
                        <ul className="mt-1 space-y-1 text-muted">
                          {message.alternatives.map((alternative, index) => <li key={index}>· {alternative}</li>)}
                        </ul>
                      </div>
                    )}
                    {message.role === 'user' && voiceMessageIds.includes(message.id) && (
                      <p className="mt-2 flex items-center gap-1 border-t border-ink/10 pt-2 text-[10px] leading-snug text-ink/70">
                        <Mic size={10} /> Ditado por voz · {spokenWords(message.text)} palavras · a transcrição vem do browser e não mede pronúncia
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
              {messages.filter((item) => item.role === 'user').length >= 2 && (
                <details className="rounded-2xl border border-line bg-white p-4 text-xs">
                  <summary className="cursor-pointer text-xs font-black">Como está a tua fluência (texto)</summary>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl bg-cream p-2 text-center"><p className="text-base font-black">{fluencyReport.words}</p><p className="text-[10px] font-bold text-muted">palavras</p></div>
                    <div className="rounded-xl bg-cream p-2 text-center"><p className="text-base font-black">{Math.round(fluencyReport.uniqueRatio * 100)}%</p><p className="text-[10px] font-bold text-muted">variedade</p></div>
                    <div className="rounded-xl bg-cream p-2 text-center"><p className="text-base font-black">{fluencyReport.fillers}</p><p className="text-[10px] font-bold text-muted">muletas</p></div>
                    <div className="rounded-xl bg-cream p-2 text-center"><p className="text-base font-black">{fluencyReport.avgSentenceLength}</p><p className="text-[10px] font-bold text-muted">palavras/frase</p></div>
                  </div>
                  {fluencyReport.suggestions.length > 0 && (
                    <ul className="mt-3 list-inside list-disc space-y-1 leading-relaxed text-muted">
                      {fluencyReport.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
                    </ul>
                  )}
                  {hint && hintedDifficulty && hintedDifficulty !== difficulty && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-sun-soft p-2">
                      <p className="min-w-0 flex-1 font-bold">
                        {hint === 'up'
                          ? 'Sem correções registadas e frases sólidas — podes subir de dificuldade.'
                          : 'Várias correções — consolida este nível antes de subir.'}
                      </p>
                      <button type="button" className="btn-ghost !px-3 !py-1 text-[11px]" onClick={() => setDifficulty(hintedDifficulty)}>
                        {hint === 'up' ? `Subir para ${difficulties.find((item) => item.id === hintedDifficulty)?.label ?? hintedDifficulty}` : `Consolidar em ${difficulties.find((item) => item.id === hintedDifficulty)?.label ?? hintedDifficulty}`}
                      </button>
                    </div>
                  )}
                  <p className="mt-3 text-[10px] leading-relaxed text-muted">
                    Análise do texto que escreveste ou dictaste — palavras, variedade, muletas e tamanho das frases. Não avalia pronúncia, sotaque, entoação nem tempos verbais de fala.
                  </p>
                </details>
              )}
              {pending && <p className="text-center text-xs font-bold text-muted">O tutor está a pensar…</p>}
              <div ref={bottomRef} />
            </div>
          )}

          <div className="border-t border-line pt-4">
            {difficulty === 'beginner' && messages.length === 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {scenario.modelAnswers.slice(0, 2).map((answer) => (
                  <button key={answer} type="button" onClick={() => setInput(answer)} className="inline-flex items-center gap-1 rounded-full bg-sun-soft px-3 py-1.5 text-xs font-bold"><Sparkles size={12} /> {answer}</button>
                ))}
              </div>
            )}
            <SpeechInput
              value={input}
              onChange={setInput}
              placeholder={voiceMode ? 'Diz a tua resposta…' : `Escreve a tua resposta em ${language.label.toLowerCase()}…`}
              minRows={2}
              autoSendOnFinal={voiceMode}
              onSend={(text) => void sendText(text, true)}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted">Feedback de aprendizagem, não avaliação fonética oficial.</p>
              <button type="button" onClick={() => void send()} disabled={!input.trim() || pending} className="btn-primary !px-5">
                <Send size={16} /> Enviar
              </button>
            </div>
          </div>
        </section>
      </div>

      {activeId && messages.length > 0 && (
        <p className="mt-4 flex items-center gap-2 text-xs text-muted"><Check size={14} /> Conversa guardada automaticamente: {summarize(messages, scenario.title)}</p>
      )}

    </div>
  );
}

interface SetupProps {
  scenarios: PracticeScenario[];
  scenarioId: string;
  setScenarioId: (value: string) => void;
  personality: Personality;
  setPersonality: (value: Personality) => void;
  difficulty: LearnerLevel;
  setDifficulty: (value: LearnerLevel) => void;
  supportLocale: SupportLocale;
  setSupportLocale: (value: SupportLocale) => void;
  mode: TutorMode;
  setMode: (value: TutorMode) => void;
  remoteModes: TutorMode[];
  sessions: TutorSession[];
  openSession: (session: TutorSession) => void;
  showSetup: boolean;
  setShowSetup: (value: boolean) => void;
}

function SetupPanel({ scenarios, scenarioId, setScenarioId, personality, setPersonality, difficulty, setDifficulty, supportLocale, setSupportLocale, mode, setMode, remoteModes, sessions, openSession, showSetup, setShowSetup }: SetupProps) {
  return (
    <>
      {showSetup && (
        <>
          <div>
            <p className="label">Situação</p>
            <select className="input" value={scenarioId} onChange={(event) => setScenarioId(event.target.value)} aria-label="Situação do tutor">
              {scenarios.map((item) => <option key={item.id} value={item.id}>{item.title} · {levelLabel(item.languageId, item.level)}</option>)}
            </select>
          </div>
          <div className="mt-4">
            <p className="label">Personalidade</p>
            <div className="space-y-2">
              {personalities.map((item) => (
                <button key={item.id} type="button" onClick={() => setPersonality(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${personality === item.id ? 'border-ink bg-sun-soft' : 'border-line hover:border-ink/30'}`} aria-pressed={personality === item.id}>
                  <span className="block text-sm font-extrabold">{item.label}</span>
                  <span className="block text-[11px] text-muted">{item.description}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="label">Dificuldade</p>
            <select className="input" value={difficulty} onChange={(event) => setDifficulty(event.target.value as LearnerLevel)} aria-label="Dificuldade do tutor">
              {difficulties.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
          <div className="mt-4">
            <label className="label" htmlFor="support-locale">Português de apoio</label>
            <select id="support-locale" className="input" value={supportLocale} onChange={(event) => setSupportLocale(event.target.value as SupportLocale)}>
              <option value="pt-PT">Português europeu</option>
              <option value="pt-BR">Português brasileiro</option>
            </select>
          </div>
          <div className="mt-4">
            <p className="label">Modo</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setMode('offline')} className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${mode === 'offline' ? 'bg-ink text-white' : 'border border-line bg-white text-muted'}`}>Offline</button>
              {remoteModes.map((item) => (
                <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${mode === item ? 'bg-ink text-white' : 'border border-line bg-white text-muted'}`}>{item === 'ollama' ? 'Ollama' : 'Compatível'}</button>
              ))}
            </div>
            {remoteModes.length === 0 && <p className="mt-2 text-[11px] leading-relaxed text-muted">Sem modelo configurado. O modo offline funciona sempre.</p>}
          </div>
          <button type="button" onClick={() => setShowSetup(false)} className="btn-ghost mt-5 w-full">Guardar e conversar</button>
        </>
      )}
      {!showSetup && <button type="button" onClick={() => setShowSetup(true)} className="btn-ghost mb-4 w-full">Alterar situação</button>}
      {sessions.length > 0 && (
        <div className="mt-5">
          <p className="label">Conversas anteriores</p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {sessions.map((session) => (
              <button key={session.id} type="button" onClick={() => openSession(session)} className="w-full rounded-2xl border border-line bg-white p-3 text-left transition hover:border-ink/30">
                <span className="flex items-center gap-1 text-xs font-extrabold"><MessageCircle size={13} /> {scenarios.find((item) => item.id === session.scenarioId)?.title ?? session.scenarioId}</span>
                <span className="mt-1 block text-[11px] text-muted">{session.summary ?? `${session.messages.length} mensagens`}</span>
                <span className="mt-1 block text-[10px] text-muted">{new Date(session.updatedAt).toLocaleDateString('pt-PT')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
