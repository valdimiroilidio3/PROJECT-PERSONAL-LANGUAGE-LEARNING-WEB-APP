import { NextResponse, type NextRequest } from 'next/server';
import type { TutorReply } from '@/lib/tutor/offline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const providerModes = ['ollama', 'openai-compatible'] as const;
type ProviderMode = (typeof providerModes)[number];

function isProviderMode(value: unknown): value is ProviderMode {
  return typeof value === 'string' && (providerModes as readonly string[]).includes(value);
}

function availableModes(): ProviderMode[] {
  const modes: ProviderMode[] = [];
  if (process.env.OLLAMA_BASE_URL && process.env.OLLAMA_MODEL) modes.push('ollama');
  if (process.env.OPENAI_COMPATIBLE_BASE_URL && process.env.OPENAI_COMPATIBLE_MODEL && process.env.OPENAI_COMPATIBLE_API_KEY) modes.push('openai-compatible');
  return modes;
}

export async function GET() {
  return NextResponse.json({ modes: availableModes() });
}

function systemPrompt(scenarioId: string, personality: string, difficulty: string): string {
  return `You are Lumio's English tutor in a personal learning app. Scenario: ${scenarioId}. Personality: ${personality}. Learner level: ${difficulty}.
Reply in simple English appropriate to the level. Give a short Portuguese translation of your reply, 1-2 more natural alternatives the learner could use, and gentle grammar/vocabulary corrections in Portuguese when useful.
Never claim to score pronunciation. Be encouraging and brief.
Respond only with JSON in this exact shape:
{"text":"English reply","translation":"Tradução em português","alternatives":["alternative 1"],"corrections":[{"original":"...","corrected":"...","explanation":"explicação em português"}]}`;
}

function extractJson(content: string): TutorReply {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<TutorReply>;
    if (parsed && typeof parsed.text === 'string' && parsed.text.trim()) {
      return {
        text: parsed.text,
        translation: typeof parsed.translation === 'string' ? parsed.translation : '',
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.filter((item): item is string => typeof item === 'string').slice(0, 3) : [],
        corrections: Array.isArray(parsed.corrections) ? parsed.corrections.filter((item) => item && typeof item.original === 'string' && typeof item.corrected === 'string' && typeof item.explanation === 'string').slice(0, 2) : [],
      };
    }
  }
  return { text: cleaned.slice(0, 800) || 'Could you say that again?', translation: '', alternatives: [], corrections: [] };
}

interface ChatLine {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  let body: { mode?: unknown; scenarioId?: unknown; personality?: unknown; difficulty?: unknown; messages?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  if (!isProviderMode(body.mode)) return NextResponse.json({ error: 'Modo de tutor desconhecido.' }, { status: 400 });
  if (!availableModes().includes(body.mode)) {
    return NextResponse.json({ error: 'Este modo não está configurado no servidor. Podes continuar no modo offline.' }, { status: 503 });
  }
  if (!Array.isArray(body.messages)) return NextResponse.json({ error: 'Falta o histórico da conversa.' }, { status: 400 });

  const messages = body.messages
    .filter((item): item is ChatLine => Boolean(item) && typeof item === 'object' && typeof (item as ChatLine).content === 'string' && ['user', 'assistant'].includes((item as ChatLine).role))
    .slice(-16);
  const prompt = systemPrompt(String(body.scenarioId ?? 'everyday'), String(body.personality ?? 'friendly'), String(body.difficulty ?? 'beginner'));
  const signal = AbortSignal.timeout(30_000);

  try {
    let content = '';
    if (body.mode === 'ollama') {
      const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL,
          stream: false,
          messages: [{ role: 'system', content: prompt }, ...messages],
        }),
        signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Ollama devolveu ${response.status}.`);
      const data = (await response.json()) as { message?: { content?: string } };
      content = data.message?.content ?? '';
    } else {
      const response = await fetch(`${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_COMPATIBLE_MODEL,
          temperature: 0.6,
          messages: [{ role: 'system', content: prompt }, ...messages],
        }),
        signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`O fornecedor devolveu ${response.status}.`);
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      content = data.choices?.[0]?.message?.content ?? '';
    }
    if (!content.trim()) throw new Error('O modelo não devolveu texto.');
    return NextResponse.json(extractJson(content));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ error: `Não foi possível falar com o modelo (${message}). Continua no modo offline sem perder a conversa.` }, { status: 502 });
  }
}
