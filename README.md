# Lumio — Personal Language Learning Web App

Lumio is a private, mobile-first learning app built with Next.js. It teaches several languages and two programming languages with separate curricula, a personal vocabulary notebook with spaced repetition, real-life scenarios, speech practice where it makes sense, and an offline-first tutor with an original yellow robot mascot (Nori).

Everything works without registration, subscription or a paid API. Learning data stays in the browser (IndexedDB) unless you explicitly enable a remote AI model.

## Requirements

- Node.js 20 or newer (Node 22 recommended)
- npm 10 or newer
- A modern browser for speech features (Chrome/Edge give the best Web Speech API support)

## Installation and launch

```bash
git clone <repository-url>
cd PROJECT-PERSONAL-LANGUAGE-LEARNING-WEB-APP
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server binds to `0.0.0.0`, so it also works behind a proxied preview host.

Production build:

```bash
npm run build
npm start
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Next.js development server |
| `npm run build` | Creates an optimized production build |
| `npm start` | Serves the production build |
| `npm run typecheck` | Strict TypeScript check with no emit |
| `npm run lint` | ESLint over `app`, `components`, `lib` and `tests` |
| `npm test` | Runs 44 unit/integration tests (scoring, XP, analytics, SRS, backup, IndexedDB, full lesson flow, language packs, progress isolation and gamification) |

## What is included

- **Eight learning packs, 31 lessons total**, all authored as validated structured data with real questions, Portuguese explanations and examples:
  - English — 16 lessons (A1→B1), the full original curriculum
  - Spanish — 3 lessons, Dutch — 2, French — 2, German — 2, Italian — 2
  - JavaScript — 2 lessons, Python — 2 lessons
  - Programming packs use `L1/L2/L3` difficulty labels instead of inventing CEFR levels and have no fake listening/audio exercises.
- **Progress isolation**: completions, attempts, vocabulary and tutor sessions are tagged with the language id; switching packs never mixes statistics. Backups contain every pack and validate the new fields.
- **Nine exercise formats**: multiple choice, translation, word ordering, matching, fill-in-the-blank, listening, dialogue completion, sentence construction and reading comprehension.
- **Lesson engine** with instant feedback, hearts as gentle feedback (never a hard lock), first-completion XP only, mistake review and a completion summary.
- **Vocabulary notebook** with automatic import from lessons, manual entries, search, filters and editing.
- **Spaced repetition** with transparent intervals (1, 2, 4, 7, 15, 30, 60, 120 days), priority for new/overdue/frequently missed words, four review grades, per-word history and explicit mastery states.
- **Speech service** using the Web Speech API with the selected language's locale: voices, replay, slower playback, optional speech recognition with visible recognized text and a text fallback. No phonetic scoring is claimed; speech controls are hidden for code tracks.
- **Real-life practice** with fifteen scenarios (eight English plus one per additional pack) and keyword-based answer feedback.
- **Tutor** with offline structured dialogues adapted to the selected pack, three personalities, four difficulty levels, European/Brazilian Portuguese support, suggested responses, corrections, natural alternatives, session history and summaries. Remote modes are validated, rate-limited and opt-in.
- **Gamification and analytics** derived only from saved activity: XP, streaks, achievements, weekly calendar, session history and personal bests.
- **Daily quests** computed from today's real completions, attempts, XP and reviews — no invented rewards or rivals.
- **Personal leagues** (Bronze → Diamante) based only on the learner's own saved XP, with clear thresholds and progress to the next tier.
- **Session review** after each lesson: accuracy by exercise type, saved mistakes and a direct link to the review notebook.
- **Adaptive next step** on the dashboard with explicit rules for overdue reviews, repeated mistakes, weak categories and the next unlocked lesson.
- **Backup**: export/import validated JSON and reset with explicit confirmation.
- **Responsive UI**: desktop sidebar and mobile bottom navigation, accessible focus states, reduced-motion support, loading/empty/error states.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Dashboard with real saved metrics, daily challenge and learning path |
| `/onboarding` | Chooses one of eight packs, level, goal, daily goal and a diagnostic drawn from that pack's real exercises |
| `/learn` | Full learning path with locked/unlocked lessons |
| `/lesson/[id]` | Interactive lesson player |
| `/practice` | Real-life scenarios |
| `/tutor` | Offline-first AI conversation interface |
| `/vocabulary` | Personal word notebook |
| `/review` | Spaced-repetition flashcards |
| `/progress` | Analytics and achievements |
| `/settings` | Preferences, data management and browser information |

## Optional AI providers (server-side adapters)

The tutor works fully offline with no configuration. To enable a remote/local model, create `.env.local`:

```env
# Option A: local Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Option B: any OpenAI-compatible endpoint
OPENAI_COMPATIBLE_BASE_URL=https://your-provider.example/v1
OPENAI_COMPATIBLE_MODEL=your-model
OPENAI_COMPATIBLE_API_KEY=your-server-side-key
```

Notes:

- `GET /api/tutor` reports which modes are configured **without exposing keys**.
- `POST /api/tutor` builds the prompt and keeps credentials on the server. The browser never receives API keys.
- If a provider is unavailable, the app shows a clear error and offers to continue the same conversation offline.
- Ollama must be reachable from the server process. For local development `http://localhost:11434` works; on Vercel use a reachable endpoint or keep the offline mode.

## Data and privacy

- IndexedDB stores preferences, lesson completions, exercise attempts, vocabulary, review schedules and tutor sessions in `components/AppContext.tsx` via `lib/db.ts`.
- If IndexedDB is blocked, the app falls back to session-only memory storage and displays a warning.
- No learning data is transmitted anywhere by default. Tutor offline mode is entirely local.
- Export/import lives in **Settings**. Imports are validated by `lib/backup.ts` before any data is replaced.
- Reset requires typing `REDEFINIR`.

## Project structure

```text
app/                 App Router pages and the server-side tutor API
components/          Shared UI, AppContext, lesson player, speech controls, mascot
lib/content/         Validated lesson packs and practice scenarios for all eight tracks
lib/analytics.ts     Metrics derived from saved events
lib/scoring.ts       Answer checking and XP rules
lib/srs.ts           Spaced-repetition scheduling
lib/db.ts            IndexedDB wrapper with memory fallback
lib/languages.ts     Language catalogue, locales, labels and metadata
lib/tutor/           Offline dialogue engine per pack
tests/               Unit tests
```

## Deployment on Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. No environment variables are required for the offline app. Add only the optional provider variables shown above if you want remote tutor modes.
4. Deploy. The app is statically rendered where possible and uses a single Node.js API route for the optional tutor adapters.

## Offline resources

Fonts use the local system/Inter stack (no Google Fonts request), the mascot is an inline SVG, icons are bundled from `lucide-react`, and lessons/scenarios are TypeScript data in `lib/content/`. The learning flow makes no network requests. Only the optional tutor adapters in `app/api/tutor/route.ts` can reach external endpoints, and they are disabled unless environment variables are configured.

## Design system

See `DESIGN_SYSTEM.md` for the documented colour, typography, spacing, radius, elevation, motion and component tokens used by the existing Tailwind setup.

## Design notes

The visual system uses yellow `#FFE500`, warm cream `#F7F5EF`, dark ink `#20201D`, soft green success states and warm red errors with Inter/system typography, rounded cards and restrained Framer Motion transitions. The mascot, name, illustrations and layouts are original to this project and are not copies of any reference app.

## Limitations

- Speech recognition quality depends on the browser, microphone permissions and accent; it is presented for confirmation, not as pronunciation scoring.
- CEFR labels (natural languages) and L1/L2/L3 labels (programming) describe content difficulty. The app does not issue assessed levels or certificates.
- AI feedback is learning assistance, not guaranteed linguistic assessment.
- Remote tutor rate limiting is per server process; serverless platforms may run several instances.
- The full lesson flow and language isolation are covered by integration tests with simulated IndexedDB; speech recognition and real-browser checks are documented in `VALIDATION_REPORT.md`.
