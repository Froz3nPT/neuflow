# NeuFlow — context for Claude Code

This file is loaded automatically by Claude Code. Keep it focused: stack, conventions, guardrails, and the current state of play.

## What we're building

NeuFlow is a task manager for neurodivergent brains — primarily ADHD, but the design layer should hold up for autism and dyslexia too. Co-built with Arina Raven. Edu drives engineering and product.

The product thesis: standard productivity tools punish executive-function struggles (rigid periodicity, streaks, infinite lists) and treat the symptom (forgetting) rather than the cause (initiation paralysis, energy mismatch, decision overload). NeuFlow optimises for *getting started*, not *tracking everything*.

### Core mechanics we believe in

- **Energy-based filtering ("spoons mode")** — every task tagged low/med/high energy; one filter shows only what's doable now.
- **"What now?" single-task mode** — surfaces one task at a time. Decision paralysis is the enemy.
- **Task atomization on demand** — "Clean kitchen" → tap → 5 micro-steps. LLM use-case that's actually load-bearing.
- **Brain dump inbox** — capture without categorising. Triage when calm.
- **Event-triggered tasks** — "after shower", "when home" — not just calendar periodicity.
- **Procrastination decoder** — after 3 skips, ask: still relevant? too big? wrong time?

### Things we're skeptical of (do not silently add these)

- **Streaks** — backfire on perfectionism/OCD. Off by default if added at all.
- **"Done = disappears"** — half-right. ND users with RSD/depression often need a "today's wins" view of the same data.
- **One-size-fits-ND framing** — ADHD, autism, and dyslexia have different needs. Be explicit about which is being served when designing a feature.

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Mobile | Expo (React Native), TypeScript | iOS + Android single codebase |
| Backend | Supabase | Postgres + Auth + Realtime, RLS always on |
| Monorepo | pnpm workspaces + hoisted node-linker | Required for Metro to resolve workspace deps |
| Shared types | `@neuflow/shared` | Imported by mobile; future web/coach view will too |

## Repo layout

```
apps/mobile/        Expo app
  App.tsx
  src/
    env.ts          Env validation, fail-fast
    lib/supabase.ts Supabase client (AsyncStorage-backed auth)
packages/shared/    Cross-app TypeScript (no React)
  src/types/        Domain types — Task, EnergyLevel, TaskTrigger
supabase/           Migrations + edge functions (when we add them)
```

## Conventions

- **TypeScript strict** is on. `noUncheckedIndexedAccess` is on too — array access returns `T | undefined`. Don't fight it; handle the undefined.
- **Domain types live in `@neuflow/shared`**. If you add or change a column in a Supabase migration, update the matching TS type in the same PR.
- **No client secrets**. Anything ending in `_KEY` that isn't `ANON_KEY` belongs in Supabase server-side, never the mobile bundle.
- **RLS on by default** for every table.
- **Migrations are forward-only**. Don't edit a committed migration; add a new one.
- **Energy and trigger are first-class**, not afterthoughts. New task-related features should consider both before shipping.

## Common commands

```bash
pnpm install               # bootstrap
pnpm mobile start          # run the app
pnpm typecheck             # TS across all packages
supabase db push           # apply migrations to linked project
supabase migration new <n> # new migration file
```

## Current state

Brain-dump inbox + triage flow + energy filter shipped. App.tsx hosts two views switched by a top segmented toggle:

- **Inbox** — capture bar at the bottom, tap-to-delete (Alert confirm — placeholder; should become snackbar+undo when a UI primitive lands), long-press an item to open the triage sheet.
- **Tasks** — filter chips above the list (`All / Low / Med / High`), each task shows its energy tag.

Triage sheet is RN's `Modal` (no library). Picking Low / Medium / High moves the item out of inbox storage and into tasks storage with the chosen energy and a `triagedFromInboxId` backref. Both lists persist independently across restarts: `@neuflow/inbox/v1` and `@neuflow/tasks/v1` in AsyncStorage. No auth — data is local-only and throwaway during dev.

Domain shape: `InboxItem` (raw capture) and `Task` (triaged, has energy) are separate types in `@neuflow/shared`. `Task` is intentionally minimal right now — `id`, `text`, `energy`, `createdAt`, `triagedFromInboxId`. Notes, triggers, completion state, and `userId` will return when their features land.

`EnergyLevel` is `'low' | 'med' | 'high'` (note: `med`, not `medium`).

App.tsx is over 300 lines. Splitting into `InboxScreen.tsx` and `TasksScreen.tsx` (plus a `TriageSheet.tsx`) is a reasonable next refactor — flagged as PR follow-up rather than done silently.

Next likely features (not committed):

1. Auth (Supabase magic link) — promotes the local inbox + tasks to per-user
2. Snackbar+undo primitive — replace the `Alert.alert` delete confirm
3. "What now?" single-task surface
4. Procrastination decoder (after N skips, prompt to re-evaluate)
5. Reintroduce `TaskTrigger` when event-triggered surfacing is built

## Ground rules for Claude Code

- **Feature-by-feature.** Don't scaffold three screens to add one. Don't add libraries we don't yet need.
- **Question framing.** If a request implies a productivity-tool cliché (streaks, leaderboards, gamification), pause and check — the product brief is explicitly skeptical of those.
- **Be honest about uncertainty.** If a Supabase API or Expo SDK detail is past the model's knowledge cutoff, say so before guessing.
- **Don't write README sections claiming the product does things it doesn't.** This repo is a scaffold; treat it like one until features actually land.

## Reference

- Expo monorepo guide: https://docs.expo.dev/guides/monorepos/
- Supabase RN auth: https://supabase.com/docs/guides/auth/quickstarts/react-native
- Original product pitch: `neuflow_pitch_v3.pdf` (in this folder)
