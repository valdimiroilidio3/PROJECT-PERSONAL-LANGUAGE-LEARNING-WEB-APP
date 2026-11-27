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
| `npm test` | Runs 92 unit/integration tests (scoring, XP, analytics, SRS, backup, IndexedDB, full lesson flow, language packs, progress isolation, gamification, weekly and monthly routines, voice ranking, tutor fluency and characters, visual life, content catalogue, sample exams) |

## What is included

- **Eight learning packs, 46 lessons total**, all authored as validated structured data with real questions, Portuguese explanations and examples:
  - English — 17 lessons (A1→B1), the full original curriculum plus an exam-style reading/formal-email drill
  - Spanish — 5 lessons, Dutch — 4, French — 4, German — 4, Italian — 4 (each with a new A2 exam-format drill: notices, announcements and formal register)
  - JavaScript — 4 lessons, Python — 4 lessons (an L3 code-reading exam drill each)
  - Programming packs use `L1/L2/L3` difficulty labels instead of inventing CEFR levels and have no fake listening/audio exercises.
- **Progress isolation**: completions, attempts, vocabulary and tutor sessions are tagged with the language id; switching packs never mixes statistics. Backups contain every pack and validate the new fields.
- **Nine exercise formats**: multiple choice, translation, word ordering, matching, fill-in-the-blank, listening, dialogue completion, sentence construction and reading comprehension.
- **Lesson engine** with instant feedback, hearts as gentle feedback (never a hard lock), first-completion XP only, mistake review and a completion summary.
- **Vocabulary notebook** with automatic import from lessons, manual entries, search, filters and editing.
- **Spaced repetition** with transparent intervals (1, 2, 4, 7, 15, 30, 60, 120 days), priority for new/overdue/frequently missed words, four review grades, per-word history and explicit mastery states.
- **Speech service** using the Web Speech API with the selected language's locale: voices, replay, slower playback, optional speech recognition with visible recognized text and a text fallback. No phonetic scoring is claimed; speech controls are hidden for code tracks.
- **Voice personas and per-language voice selection** in Settings: four speaking styles (automática, Nori energético, Mentor calmo and Expresso) that reshape the system voice, plus a ranked picker of the voices the browser/OS actually exposes per language, with a preview button. Honest empty state when no voice is detected. Fully local; nothing is recorded or transmitted.
- **Real-life practice** with twenty-eight scenarios (nine English plus two–three per additional pack, including A2 formal job interviews in five languages) and keyword-based answer feedback.
- **Tutor with role-play characters and voice conversation**: each scenario is a realistic character who stays in scene (Nori, Maya, Tomás, Rui, Sofia, Leo, Dr.ª Campos, Ana, Lucía, Sanne, Théo, Jonas, Giulia, Dev Ruiz, Priya, Elena Ruiz, Mark, Chloé, Hannah and Marco). The action bar has a **Conversa por voz** toggle (only when the browser supports speech synthesis and recognition): speak, the message is transcribed and sent when you stop talking, and the character answers out loud in your chosen voice persona. User messages sent by voice are labelled as browser dictation, and the correction/feedback flow is unchanged. A local **fluency panel** ("Como está a tua fluência") works from the text you wrote or dictated only — words, variety, filler words and average sentence length, plus a one-click difficulty suggestion. It never claims to score pronunciation, accent, intonation or speaking times.
- **Tutor** with offline structured dialogues adapted to the selected pack, three personalities, four difficulty levels, European/Brazilian Portuguese support, in-character dialogue (the AI opens the scene when you press "Começar com {personagem}"), suggested responses, corrections, natural alternatives, session history and summaries. Remote modes are validated, rate-limited and opt-in, and stay in character with short replies and pronunciation study tips (never pronunciation scores).
- **Gamification and analytics** derived only from saved activity: XP, streaks, achievements, weekly calendar, session history and personal bests.
- **Six daily missions**: four fixed (first lesson, ten answers, XP goal, three reviews) plus two rotating ones chosen deterministically by the local calendar day from a pool of seven (practice scenario, correct answers, second lesson, study minutes, listening reps, perfect lesson, notebook words) — always measured from today's saved activity.
- **Personal leagues** (Bronze → Diamante) based only on the learner's own saved XP, with clear thresholds and progress to the next tier.
- **Session review** after each lesson: accuracy by exercise type, saved mistakes and a direct link to the review notebook.
- **Weekly challenges**: four of six rotating goals (weekly XP, active days, answers, reviews, 45 study minutes, two flawless lessons) shown with a Monday-to-Sunday window; all values come from that week's saved events.
- **Monthly challenge**: one large monthly goal chosen by the local calendar (400 XP, 12 active days, 120 answers or 8 lessons), measured only from this month's saved events.
- **Habit garden**: 28 calendar days with real saved activity only. Empty days are never penalised and never reduce XP, league or achievements.
- **Motion feedback**: confetti burst on correct answers, a short card shake plus the lost heart pop on mistakes, bouncing mascot and counted-up XP/accuracy/minutes on the summary screen, animated skill bars and a pulsing streak flame — all respecting `prefers-reduced-motion`.
- **Simulados on the dashboard and in review**: the home sidebar shows a real card per available exam (best score, attempts, XP earned and pass status, derived only from saved practice attempts), and the review page carries a banner with the best exam result and a direct link to `/exames`. Programming packs get an honest line instead of an empty card.
- **Adaptive next step** on the dashboard with explicit rules for overdue reviews, repeated mistakes, weak categories and the next unlocked lesson.
- **Original illustrations** (Nori's journey for onboarding and OpenGraph, the league podium, the habit garden, Nori at the café counter for practice, Nori at his reading nook for review/empty states, Nori on the summit for progress, Nori on the path for learn and Nori at the chalkboard for lesson intros) were commissioned for Lumio and live in `public/images/`. The mascot remains an inline SVG; no borrowed characters or assets.
- **Motion feedback**: confetti on correct answers and lesson/practice/review completions, counted-up XP, staggered entrances on grids (practice scenarios), fade-up section entrances, shimmer on progress bars and spring-pop achievement badges — all respecting `prefers-reduced-motion`. Illustrated empty states (review, vocabulary) keep no-data screens friendly instead of blank.
- **Backup**: export/import validated JSON and reset with explicit confirmation.
- **Sample exams (“Simulados”)**: original mock exams at `/exames` — A1 for English, Spanish, Dutch, French, German and Italian (10 questions, 10 minutes), plus A2 for English and Spanish (15 questions, 15 minutes, reading 6 / listening 5 / vocabulary 4). Reading questions share a passage, listening uses the system voice (replayable) and vocabulary checks exam-register terms; strict timer with automatic submission, per-section scoring, indicative pass mark of 60%, XP (1 per correct answer + 10 pass bonus) and confetti on approval. Every question is original, not taken from any official exam; results are indicative only and never certify anything. Attempts are stored as regular practice attempts. En/ES learners get an A1–A2 level picker; programming packs get an honest empty state instead of a fake exam.
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
| `/exames` | Sample A1 (all natural packs) and A2 (English, Spanish) exams with timer, per-section scoring and indicative results |
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
components/          Shared UI, AppContext, lesson player, speech controls, mascot, celebration effects (confetti, count-up)
public/images/       Original Nori illustrations used by onboarding, league, garden, practice, review, vocabulary and progress
lib/content/         Validated lesson packs and practice scenarios for all eight tracks
lib/exams.ts         Original sample A1/A2 exams (reading, listening, vocabulary) and scoring
lib/analytics.ts     Metrics derived from saved events
lib/scoring.ts       Answer checking and XP rules
lib/srs.ts           Spaced-repetition scheduling
lib/db.ts            IndexedDB wrapper with memory fallback
lib/languages.ts     Language catalogue, locales, labels and metadata
lib/tutor/           Offline dialogue engine, role-play characters and local fluency analysis per pack
tests/               Unit tests
```

## Deployment on Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. No environment variables are required for the offline app. Add only the optional provider variables shown above if you want remote tutor modes.
4. Deploy. The app is statically rendered where possible and uses a single Node.js API route for the optional tutor adapters.

## Offline resources

Fonts use the local system/Inter stack (no Google Fonts request), the mascot is an inline SVG, illustrations are local JPGs bundled in `public/images/`, icons are bundled from `lucide-react`, and lessons/scenarios are TypeScript data in `lib/content/`. The learning flow makes no network requests. Only the optional tutor adapters in `app/api/tutor/route.ts` can reach external endpoints, and they are disabled unless environment variables are configured.

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
