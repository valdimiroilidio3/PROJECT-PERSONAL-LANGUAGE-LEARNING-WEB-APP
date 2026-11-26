'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { SpeakControl } from '@/components/Speech';
import { EmptyState, PageHeader, Tag } from '@/components/ui';
import { masteryStatus } from '@/lib/srs';
import { createVocabularyItem } from '@/lib/vocabulary';
import type { VocabularyItem } from '@/lib/types';

type Filter = 'all' | 'new' | 'learning' | 'known';

export default function VocabularyPage() {
  const { profile, language, vocabulary, addVocabulary, deleteVocabulary } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VocabularyItem | null>(null);
  const [form, setForm] = useState({ term: '', translation: '', example: '', context: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return vocabulary
      .filter((item) => (item.term.toLowerCase().includes(term) || item.translation.toLowerCase().includes(term)))
      .filter((item) => {
        if (filter === 'new') return item.familiarity === 0 && item.correctCount === 0;
        if (filter === 'learning') return item.familiarity > 0 && item.familiarity < 3;
        if (filter === 'known') return item.familiarity >= 3;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [vocabulary, query, filter]);

  const openForm = (item?: VocabularyItem) => {
    setEditing(item ?? null);
    setForm(item ? { term: item.term, translation: item.translation, example: item.example, context: item.context } : { term: '', translation: '', example: '', context: '' });
    setError(null);
    setFormOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.term.trim() || !form.translation.trim()) {
      setError(`Preenche o termo em ${language.label.toLowerCase()} e a explicação.`);
      return;
    }
    setSaving(true);
    const item = editing
      ? { ...editing, ...form }
      : createVocabularyItem({ ...form, term: form.term.trim(), translation: form.translation.trim() }, { source: 'manual', languageId: profile.targetLanguage });
    await addVocabulary(item);
    setSaving(false);
    setFormOpen(false);
    setEditing(null);
    setForm({ term: '', translation: '', example: '', context: '' });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Caderno pessoal"
        title="O meu vocabulário"
        description="Todas as palavras das lições ficam aqui. Podes acrescentar as tuas e acompanhar a familiaridade de cada uma."
        action={<button type="button" onClick={() => openForm()} className="btn-primary"><Plus size={16} /> Nova palavra</button>}
      />

      {formOpen && (
        <form onSubmit={(event) => void save(event)} className="card mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">{editing ? 'Editar palavra' : 'Adicionar palavra'}</h2>
            <button type="button" onClick={() => setFormOpen(false)} aria-label="Fechar formulário"><X size={18} /></button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="term">{language.termLabel} *</label><input id="term" className="input" value={form.term} onChange={(event) => setForm({ ...form, term: event.target.value })} placeholder={language.kind === 'programming' ? 'ex.: const' : 'ex.: to improve'} /></div>
            <div><label className="label" htmlFor="translation">{language.translationLabel} *</label><input id="translation" className="input" value={form.translation} onChange={(event) => setForm({ ...form, translation: event.target.value })} placeholder="ex.: melhorar" /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="example">Frase de exemplo</label><input id="example" className="input" value={form.example} onChange={(event) => setForm({ ...form, example: event.target.value })} placeholder="I want to improve my English." /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="context">Contexto</label><input id="context" className="input" value={form.context} onChange={(event) => setForm({ ...form, context: event.target.value })} placeholder="Onde encontraste esta palavra?" /></div>
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <div className="mt-5 flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'A guardar…' : 'Guardar palavra'}</button>
            <button type="button" className="btn-ghost" onClick={() => setFormOpen(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar palavra…" aria-label="Pesquisar vocabulário" />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {([['all', 'Todas'], ['new', 'Novas'], ['learning', 'A aprender'], ['known', 'Conhecidas']] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-extrabold ${filter === id ? 'bg-ink text-white' : 'border border-line bg-white text-muted'}`} aria-pressed={filter === id}>{label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={vocabulary.length === 0 ? 'O caderno está vazio' : 'Nenhuma palavra encontrada'}
          description={vocabulary.length === 0 ? 'Conclui uma lição para importar o vocabulário automaticamente ou adiciona uma palavra manualmente.' : 'Experimenta outro termo ou muda o filtro.'}
          href={vocabulary.length === 0 ? '/learn' : undefined}
          linkLabel={vocabulary.length === 0 ? 'Ver lições' : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <article key={item.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black">{item.term}</p>
                  <p className="text-sm font-bold text-muted">{item.translation}</p>
                </div>
                {language.speech && <SpeakControl text={item.example || item.term} compact />}
              </div>
              {item.example && <p className="mt-3 text-sm italic text-ink/80">“{item.example}”</p>}
              {item.context && <p className="mt-1 text-xs text-muted">{item.context}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Tag tone={masteryStatus(item) === 'mastered' ? 'green' : masteryStatus(item) === 'new' ? 'sun' : 'neutral'}>
                  {masteryStatus(item) === 'mastered' ? 'Dominada' : masteryStatus(item) === 'new' ? 'Nova' : 'Em aprendizagem'} · {item.familiarity}/7
                </Tag>
                <Tag>Histórico: {item.history?.length ?? 0}</Tag>
                <Tag>{item.correctCount} certo · {item.incorrectCount} errado</Tag>
                <Tag>Próxima: {new Date(item.nextReviewAt).toLocaleDateString('pt-PT')}</Tag>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-3">
                <button type="button" onClick={() => openForm(item)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-muted hover:bg-cream hover:text-ink"><Pencil size={13} /> Editar</button>
                <button type="button" onClick={() => void deleteVocabulary(item.id)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger-soft"><Trash2 size={13} /> Eliminar</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="mt-6 flex items-center gap-2 text-xs text-muted"><BookOpen size={14} /> As palavras acrescentadas por ti também entram no sistema de revisão espaçada.</p>
      <Link href="/review" className="btn-ghost mt-3">Ir para revisão</Link>
    </div>
  );
}
