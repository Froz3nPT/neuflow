# NeuFlow — context for Claude Code

This file is loaded automatically by Claude Code. Keep it focused: stack, conventions, guardrails, and the current state of play.

## What we're building

NeuFlow is a task manager for neurodivergent brains — primarily ADHD, but the design layer should hold up for autism and dyslexia too. Co-built with Monica Charrua. Edu drives engineering and product.

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

Foundation only. App.tsx renders a placeholder ("Foundation ready. Let's build."). No screens, no auth flow, no data layer beyond a configured Supabase client.

Next likely features (not committed):

1. Auth (Supabase magic link)
2. Brain-dump inbox (the simplest possible capture-and-list)
3. Energy tag on tasks
4. "What now?" surface (one-task view)

## Ground rules for Claude Code

- **Feature-by-feature.** Don't scaffold three screens to add one. Don't add libraries we don't yet need.
- **Question framing.** If a request implies a productivity-tool cliché (streaks, leaderboards, gamification), pause and check — the product brief is explicitly skeptical of those.
- **Be honest about uncertainty.** If a Supabase API or Expo SDK detail is past the model's knowledge cutoff, say so before guessing.
- **Don't write README sections claiming the product does things it doesn't.** This repo is a scaffold; treat it like one until features actually land.

## Reference

- Expo monorepo guide: https://docs.expo.dev/guides/monorepos/
- Supabase RN auth: https://supabase.com/docs/guides/auth/quickstarts/react-native
- Original product pitch: `neuflow_pitch_v3.pdf` (in this folder)
