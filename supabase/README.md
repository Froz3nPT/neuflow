# Supabase

This folder holds database migrations, edge functions, and seed data for the NeuFlow Supabase project.

## First-time setup

1. Create a project at https://app.supabase.com (free tier is fine to start).
2. Install the Supabase CLI: https://supabase.com/docs/guides/cli
3. From the repo root: `supabase login` then `supabase link --project-ref <your-ref>`.
4. Copy the project URL and anon key into `apps/mobile/.env` (see `.env.example`).

## Workflow

- `supabase migration new <name>` — create a new migration file under `migrations/`.
- `supabase db push` — apply local migrations to the linked remote project.
- `supabase db reset` — wipe and re-apply migrations against your local Postgres (requires Docker).

## Conventions

- Every table gets Row-Level Security ON. RLS-off is a footgun, not a feature.
- Migrations are forward-only. If you need to change something, add a new migration.
- Domain shapes live in `packages/shared/src/types/`. When a migration changes a column, the matching TS type must move with it in the same PR.
