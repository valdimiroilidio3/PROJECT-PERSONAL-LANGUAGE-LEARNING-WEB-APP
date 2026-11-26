# Lumio — Design System

Este documento descreve o sistema visual **já implementado** no projeto. Os tokens vivem em `tailwind.config.ts`, os componentes base em `app/globals.css` e os componentes partilhados em `components/ui.tsx`. Não existe um segundo sistema de estilos.

## Cores semânticas

| Token | Valor | Uso |
| --- | --- | --- |
| `sun` | `#FFE500` | Ação principal, destaque, progresso |
| `sun-deep` | `#E8CE00` | Hover da ação principal |
| `sun-soft` | `#FFF9D6` | Superfícies de destaque suaves |
| `cream` | `#F7F5EF` | Fundo da aplicação |
| `ink` | `#20201D` | Texto principal e superfícies escuras |
| `muted` | `#77766F` | Texto secundário |
| `line` | `#E9E6DD` | Bordas discretas |
| `white` | `#FFFFFF` | Superfícies de conteúdo |
| `success` / `success-soft` | `#3FA66B` / `#E8F5EC` | Correção, conquistas |
| `danger` / `danger-soft` | `#E46B5A` / `#FDECE8` | Erro, eliminação |
| `sky` / `lilac` | `#DCEBF7` / `#ECE6F7` | Superfícies informativas ocasionais |

## Tipografia

- Família: `Inter`, `Geist`, `ui-sans-serif`, sistema.
- Sem pedido externo de fontes: a app usa a pilha local do dispositivo.
- Escala em uso:
  - `text-xs` / `text-[11px]` — metadados e rótulos;
  - `text-sm` — corpo e descrições;
  - `text-base` / `text-lg` — conteúdo de exercícios;
  - `text-xl` / `text-2xl` — títulos de secção;
  - `text-3xl` / `text-4xl` — títulos editoriais.
- Pesos: `font-bold` para rótulos, `font-extrabold` para botões e destaques, `font-black` para títulos e métricas.

## Espaçamento e raios

- Espaçamento base: múltiplos de 4 px (`gap-2`, `p-4`, `py-7`, etc.).
- Secções: `space-y-8`; cartões: `p-5`; formulários: `gap-4`.
- Raios: `rounded-2xl` para controlos, `rounded-3xl` para cartões, `rounded-4xl` (2 rem) para herói e painéis amplos.
- Botões e etiquetas: `rounded-full`.

## Elevação

- `shadow-card` — cartões normais (sombra suave).
- `shadow-soft` — destaque ocasional.
- `shadow-lift` — reservado para botões com elevação deliberada; não usado por defeito.

## Breakpoints

- Mobile-first: layout base com navegação inferior.
- `sm` — cartões em duas colunas.
- `lg` — sidebar fixa de 256 px e grelhas multi-coluna.
- Navegação inferior desaparece em `lg`.

## Movimento

- Framer Motion com entradas curtas (`opacity` + `y`), duração `0.2–0.35 s`.
- `prefers-reduced-motion: reduce` anula animações e transições em `app/globals.css`.
- Nenhuma animação bloqueia interação ou leitura.

## Componentes partilhados

| Componente | Localização | Finalidade |
| --- | --- | --- |
| `PageHeader` | `components/ui.tsx` | Cabeçalho consistente das páginas |
| `SectionTitle` | `components/ui.tsx` | Título de secção com ação opcional |
| `StatTile` | `components/ui.tsx` | Métrica com rótulo, valor e origem |
| `ProgressBar` | `components/ui.tsx` | Progresso com `role=progressbar` |
| `Tag` | `components/ui.tsx` | Etiqueta semântica (neutro, sol, verde, vermelho) |
| `EmptyState` | `components/ui.tsx` | Estado vazio com ação opcional |
| `btn-primary` / `btn-ghost` | `app/globals.css` | Botões principal e secundário |
| `input` / `label` | `app/globals.css` | Formulários |
| `Mascot` | `components/Mascot.tsx` | Nori, SVG original, estados `happy`, `wink`, `celebrate` |
| `SpeakControl` / `SpeechInput` | `components/Speech.tsx` | Áudio e entrada por voz com fallback textual |

## Estados

| Estado | Tratamento visual |
| --- | --- |
| Foco | `:focus-visible` com contorno de 3 px em `ink` e offset de 3 px |
| Hover | Borda mais escura ou fundo `cream` / `sun-soft` |
| Ativo | `aria-pressed` nos seletores; cor `sun` ou `ink` |
| Desativado | `disabled:opacity-50` e `disabled:cursor-not-allowed` |
| Erro | Borda/texto `danger`, `role=alert` quando apropriado |
| Sucesso | Borda/texto `success`, `role=status` |
| Carregamento | Placeholder com mascote; dados nunca simulados |
| Vazio | `EmptyState` com explicação e próxima ação |

## Regras de uso

1. Usar tokens existentes; não introduzir valores arbitrários de cor.
2. Um único botão principal por vista.
3. Cartões apenas quando agrupam informação ou ação; evitar cartões dentro de cartões.
4. Ícones `lucide-react` com `strokeWidth` coerente (1.7–2.2).
5. Toda a ação icon-only precisa de `aria-label`.
6. Nunca usar texto cinzento sobre cinzento para informação essencial.
