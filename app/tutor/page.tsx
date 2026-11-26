'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Bot, Check, MessageCircle, Plus, Send, Sparkles } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { Mascot } from '@/components/Mascot';
import { SpeakControl, SpeechInput } from '@/components/Speech';
import { PageHeader, Tag } from '@/components/ui';
import { scenarios } from '@/lib/content/scenarios';
import { offlineReply, type Personality, type TutorMode, type TutorReply } from '@/lib/tutor/offline';
import type { GrammarCorrection, LearnerLevel, TutorMessage, TutorSession } from '@/lib/types';

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

function summarize(messages: TutorMessage[], scenarioTitle: string): string {
  const corrections = messages.reduce((sum, item) => sum + (item.corrections?.length ?? 0), 0);
  return `${messages.filter((item) => item.role === 'user').length} mensagens · ${corrections} correções · ${scenarioTitle}`;
}

export default function TutorPage() {
  const { profile, sessions, saveSession, recordAttempt } = useApp();
  const [scenarioId, setScenarioId] = useState('introduce-yourself');
  const [personality, setPersonality] = useState<Personality>('friendly');
  const [difficulty, setDifficulty] = useState<LearnerLevel>(profile.level);
  const [mode, setMode] = useState<TutorMode>('offline');
  const [remoteModes, setRemoteModes] = useState<TutorMode[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];

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
    if (chosenMode === 'offline') {
      reply = offlineReply({
        scenarioId,
        personality,
        difficulty,
        userText: text,
        turn: nextMessages.filter((item) => item.role === 'user').length - 1,
      });
    } else {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: chosenMode,
          scenarioId,
          personality,
          difficulty,
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

  const send = async (overrideMode?: TutorMode) => {
    if (!input.trim() || pending) return;
    const text = input.trim();
    const chosenMode = overrideMode ?? mode;
    const userMessage: TutorMessage = {
      id: newId(),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      scenarioId,
      provider: chosenMode,
    };
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

  const openSession = (session: TutorSession) => {
    setActiveId(session.id);
    setMessages(session.messages);
    setScenarioId(session.scenarioId);
    setPersonality(session.personality as Personality);
    setDifficulty(session.difficulty);
    setShowSetup(false);
    setError(null);
  };

  const startNew = () => {
    if (messages.length > 0) persist(messages);
    setActiveId(null);
    setMessages([]);
    setInput('');
    setError(null);
    setShowSetup(true);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Conversação guiada"
        title="Tutor de inglês"
        description="Conversa sobre situações reais, recebe sugestões e vê correções em português. Funciona sem API; podes ativar um modelo local se quiseres."
        action={<button type="button" onClick={startNew} className="btn-primary"><Plus size={16} /> Nova conversa</button>}
      />

      {error && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm" role="alert">
          <AlertCircle size={18} className="text-danger" />
          <p className="flex-1">{error}</p>
          <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => void retryOffline()}>Continuar offline</button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[270px_1fr]">
        <aside className="space-y-4">
          <details className="card lg:hidden" open={sessions.length === 0}>
            <summary className="cursor-pointer text-sm font-black">Definições e histórico</summary>
            <div className="mt-4"><SetupPanel {...{ scenarioId, setScenarioId, personality, setPersonality, difficulty, setDifficulty, mode, setMode, remoteModes, sessions, openSession, showSetup, setShowSetup }} /></div>
          </details>
          <div className="hidden space-y-4 lg:block">
            <SetupPanel {...{ scenarioId, setScenarioId, personality, setPersonality, difficulty, setDifficulty, mode, setMode, remoteModes, sessions, openSession, showSetup, setShowSetup }} />
          </div>
        </aside>

        <section className="card flex min-h-[560px] flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <Mascot className="h-11 w-11" mood="wink" />
              <div>
                <p className="font-black">{scenario.title}</p>
                <p className="text-xs text-muted">{personality} · {difficulty} · {mode === 'offline' ? 'sem API' : mode}</p>
              </div>
            </div>
            <Tag tone={mode === 'offline' ? 'green' : 'sun'}>{mode === 'offline' ? 'Modo offline' : 'Modelo externo'}</Tag>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <Bot size={34} className="text-muted" />
              <h2 className="mt-3 text-xl font-black">Começa uma conversa</h2>
              <p className="mt-2 max-w-sm text-sm text-muted">
                {scenario.description} Escreve em inglês ou usa o microfone. O tutor responde em inglês com apoio em português.
              </p>
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
                  </div>
                </motion.div>
              ))}
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
            <SpeechInput value={input} onChange={setInput} placeholder="Escreve a tua resposta em inglês…" minRows={2} />
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
  scenarioId: string;
  setScenarioId: (value: string) => void;
  personality: Personality;
  setPersonality: (value: Personality) => void;
  difficulty: LearnerLevel;
  setDifficulty: (value: LearnerLevel) => void;
  mode: TutorMode;
  setMode: (value: TutorMode) => void;
  remoteModes: TutorMode[];
  sessions: TutorSession[];
  openSession: (session: TutorSession) => void;
  showSetup: boolean;
  setShowSetup: (value: boolean) => void;
}

function SetupPanel({ scenarioId, setScenarioId, personality, setPersonality, difficulty, setDifficulty, mode, setMode, remoteModes, sessions, openSession, showSetup, setShowSetup }: SetupProps) {
  return (
    <>
      {showSetup && (
        <>
          <div>
            <p className="label">Situação</p>
            <select className="input" value={scenarioId} onChange={(event) => setScenarioId(event.target.value)} aria-label="Situação do tutor">
              {scenarios.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.cefr}</option>)}
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
