'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, HardDrive, Info, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { PageHeader, SectionTitle, Tag } from '@/components/ui';
import { createSnapshot, parseSnapshot } from '@/lib/backup';
import type { LearnerGoal, LearnerLevel } from '@/lib/types';

const levels: { id: LearnerLevel; label: string }[] = [
  { id: 'beginner', label: 'Iniciante' },
  { id: 'elementary', label: 'Elementar' },
  { id: 'intermediate', label: 'Intermédio' },
  { id: 'advanced', label: 'Avançado' },
];

const goals: { id: LearnerGoal; label: string }[] = [
  { id: 'everyday', label: 'Vida diária' },
  { id: 'work', label: 'Trabalho' },
  { id: 'travel', label: 'Viagens' },
  { id: 'study', label: 'Estudo' },
  { id: 'fluency', label: 'Fluência geral' },
];

export default function SettingsPage() {
  const { profile, updateProfile, completions, attempts, vocabulary, sessions, storageMode, importSnapshot, resetAll } = useApp();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [remoteModes, setRemoteModes] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetch('/api/tutor')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { modes?: string[] }) => setRemoteModes(data.modes ?? []))
      .catch(() => setRemoteModes([]));
  }, []);

  const exportData = () => {
    const snapshot = createSnapshot({ profile, completions, attempts, vocabulary, sessions });
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Backup exportado. Guarda o ficheiro num local seguro.');
    setError(null);
  };

  const importFile = async (file: File) => {
    setMessage(null);
    setError(null);
    try {
      const snapshot = parseSnapshot(await file.text());
      await importSnapshot(snapshot);
      setMessage('Backup importado com sucesso. Os dados anteriores foram substituídos.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível importar o ficheiro.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const reset = async () => {
    if (confirmation !== 'REDEFINIR') {
      setError('Escreve REDEFINIR para confirmar.');
      return;
    }
    await resetAll();
    setConfirmation('');
    setMessage('Todos os dados locais foram apagados.');
    setError(null);
  };

  return (
    <div>
      <PageHeader eyebrow="Preferências e dados" title="Definições" description="Ajusta o teu plano e gere os teus dados pessoais. Nada é enviado para a nuvem sem uma ação explícita." />

      {message && <div className="mb-5 rounded-2xl border border-success/30 bg-success-soft p-4 text-sm font-bold text-success" role="status">{message}</div>}
      {error && <div className="mb-5 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm font-bold text-danger" role="alert">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Plano de aprendizagem" />
          <div className="card space-y-5">
            <div>
              <p className="label">Idiomas</p>
              <div className="flex flex-wrap gap-2"><Tag>🇵🇹 Português → 🇬🇧 Inglês</Tag><Tag>Definido no arranque</Tag></div>
            </div>
            <div>
              <label className="label" htmlFor="level">Nível atual</label>
              <select id="level" className="input" value={profile.level} onChange={(event) => void updateProfile({ level: event.target.value as LearnerLevel })}>
                {levels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="goal">Objetivo principal</label>
              <select id="goal" className="input" value={profile.goal} onChange={(event) => void updateProfile({ goal: event.target.value as LearnerGoal })}>
                {goals.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="support-locale">Português de apoio</label>
              <select id="support-locale" className="input" value={profile.supportLocale ?? 'pt-PT'} onChange={(event) => void updateProfile({ supportLocale: event.target.value as 'pt-PT' | 'pt-BR' })}>
                <option value="pt-PT">Português europeu</option>
                <option value="pt-BR">Português brasileiro</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="minutes">Meta diária</label>
              <select id="minutes" className="input" value={profile.dailyGoalMinutes} onChange={(event) => void updateProfile({ dailyGoalMinutes: Number(event.target.value) as 5 | 10 | 15 | 20 })}>
                {[5, 10, 15, 20].map((value) => <option key={value} value={value}>{value} minutos/dia</option>)}
              </select>
            </div>
            {profile.diagnosticScore !== undefined && (
              <p className="rounded-2xl bg-cream p-3 text-xs text-muted">Mini-diagnóstico: {profile.diagnosticScore} pontos. Não é um nível CEFR oficial.</p>
            )}
          </div>
        </section>

        <section>
          <SectionTitle title="Privacidade e armazenamento" />
          <div className="card space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="mt-0.5 text-success" />
              <div>
                <p className="font-extrabold">Tudo fica neste browser</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">Lições, vocabulário, conversas e estatísticas são guardados localmente. Não existe conta nem envio automático de dados.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <HardDrive size={20} className="mt-0.5 text-muted" />
              <div>
                <p className="font-extrabold">Modo de armazenamento: {storageMode === 'indexeddb' ? 'IndexedDB' : 'memória (sessão atual)'}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {storageMode === 'indexeddb' ? 'O progresso sobrevive ao fechar o browser.' : 'O browser bloqueou o armazenamento local. Exporta um backup antes de fechar a página.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Info size={20} className="mt-0.5 text-muted" />
              <div>
                <p className="font-extrabold">Tutor e modelos externos</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">O modo offline não envia nada. Os modos Ollama/compatível usam um adaptador no servidor; chaves ficam apenas nas variáveis de ambiente do servidor. {remoteModes.length > 0 ? `Disponíveis: ${remoteModes.join(', ')}.` : 'Nenhum modelo externo configurado.'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8">
        <SectionTitle title="Backup e restauro" />
        <div className="card">
          <p className="text-sm leading-relaxed text-muted">Exporta os teus dados em JSON para os guardar noutro dispositivo. O ficheiro inclui preferências, lições, tentativas, vocabulário e conversas.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={exportData} className="btn-primary"><Download size={16} /> Exportar dados</button>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost"><Upload size={16} /> Importar backup</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
            }} aria-label="Ficheiro de backup" />
          </div>
          <p className="mt-3 text-xs text-muted">O backup é validado antes de substituir qualquer dado.</p>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="Repor progresso" />
        <div className="rounded-3xl border border-danger/30 bg-danger-soft p-5">
          <p className="text-sm font-bold">Isto apaga permanentemente todas as lições, XP, vocabulário e conversas guardadas neste browser.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="confirm-reset">Confirmação</label>
            <input id="confirm-reset" className="input max-w-xs" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Escreve REDEFINIR" />
            <button type="button" onClick={() => void reset()} className="inline-flex items-center gap-2 rounded-full bg-danger px-5 py-3 text-sm font-extrabold text-white transition hover:brightness-95 disabled:opacity-50" disabled={confirmation !== 'REDEFINIR'}>
              <Trash2 size={16} /> Apagar todos os dados
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="Acessibilidade e voz" />
        <div className="card text-sm leading-relaxed text-muted">
          <p>A síntese de voz usa as vozes inglesas disponíveis no teu browser (Web Speech API). A velocidade lenta está disponível nos controlos de áudio.</p>
          <p className="mt-2">O reconhecimento de voz depende de permissão do microfone e de suporte do browser (melhor em Chrome/Edge). Há sempre um campo de texto alternativo. Não oferecemos pontuação fonética automática.</p>
        </div>
      </section>
    </div>
  );
}
