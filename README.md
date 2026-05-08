# NeuFlow

Task management built for neurodivergent brains. Side project with Monica Charrua.

## Stack

- **Mobile**: Expo (React Native) — iOS + Android from one codebase
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Language**: TypeScript everywhere
- **Monorepo**: pnpm workspaces

## Layout

```
neuflow/
├── apps/
│   └── mobile/            # Expo app — the user-facing thing
├── packages/
│   └── shared/            # Domain types shared across apps
├── supabase/
│   ├── migrations/        # SQL migrations (forward-only)
│   └── README.md
├── package.json           # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── CLAUDE.md              # Project context for Claude Code
```

## Prerequisites (one-time, on your machine)

- Node 20+ (`.nvmrc` pins it)
- pnpm: `corepack enable` then `corepack prepare pnpm@latest --activate`
- Expo Go app on your phone (or a simulator)
- A Supabase project: https://app.supabase.com

## Getting started

```bash
# 1. Install everything
pnpm install

# 2. Configure env
cp .env.example apps/mobile/.env
# fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

# 3. Run the app
pnpm mobile start
# scan the QR with Expo Go, or press i / a for simulators
```

## Common scripts

| Command | What it does |
|--------|-------------|
| `pnpm mobile start` | Start the Expo dev server |
| `pnpm mobile android` | Open in Android emulator |
| `pnpm mobile ios` | Open in iOS simulator (Mac only) |
| `pnpm typecheck` | Run TS across all workspaces |
| `pnpm lint` | Run lint across all workspaces (lint not configured yet) |

## Build philosophy

- Feature by feature. Don't pre-build infra we won't need this month.
- Local-first feel: optimistic updates, offline-tolerant. Sync is a means, not the product.
- Honest constraints over aspirational design. If a screen would overwhelm an ND user, simplify before shipping.

## Notes

- Expo SDK pinned to 51.x. If the SDK has moved by the time you install, run `pnpm --filter @neuflow/mobile dlx expo upgrade` and re-pin in the lockfile.
- See `CLAUDE.md` for conventions and context Claude Code should know.
