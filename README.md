# Marvelous & Lillian

Custom wedding website and lightweight admin dashboard for Marvelous & Lillian.

Built as a single **TanStack Start** (React + TypeScript) application. Production hosting is **Vercel** (existing GitHub → Vercel integration). Data/auth/storage will use **Supabase**; transactional email will use **Resend** in a later phase.

> **Product principle:** a wedding date is optional. The site must remain fully usable with `weddingDate = null`. Never invent a placeholder date.

## Stack (Phase 1)

- React 19 + TypeScript
- TanStack Start (SSR + server functions) + Nitro (Vercel-compatible)
- Tailwind CSS v4
- Significa Foundations prerequisites (`cva`, `tailwind-merge`, Phosphor icons, token baseline)
- Supabase local CLI project (no business schema yet)
- Vitest, ESLint, Prettier
- GitHub Actions CI (no deploy job — Vercel handles production)

## Prerequisites

- [mise](https://mise.jdx.dev/) (recommended — pins Node + pnpm via `mise.toml`)
- Docker Desktop (for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npx supabase` works if not installed globally)

Pinned toolchain (see `mise.toml` and `package.json`):

- Node.js `22.22.1`
- pnpm `10.28.0`

## Local setup

```bash
# Install and activate the pinned Node + pnpm versions
mise install
mise trust  # first time in this repo

# Confirm versions
node -v   # v22.22.1
pnpm -v   # 10.28.0

pnpm install
cp .env.example .env
pnpm dev
```

If you already have mise’s shell hook enabled (`mise activate`), entering the project directory will select the pinned tools automatically after `mise install`.

App: [http://localhost:3000](http://localhost:3000)

### Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Local Supabase

Supabase CLI uses Docker for the local stack. From the repo root:

```bash
npx supabase start
npx supabase status
npx supabase stop
```

Copy local URL + publishable/secret keys (or local CLI equivalents) into `.env` when you begin using the clients (Phase 3+).
Use the new **publishable** / **secret** API keys (not the legacy anon / service_role keys).

- Config: `supabase/config.toml`
- Migrations: `supabase/migrations/` (empty in Phase 1 — no business schema yet)
- Seed: `supabase/seed.sql` (placeholder only)

Do not commit secrets. Keep `.env` local; only `.env.example` is tracked.

## Docker (portable runtime)

Production deploys natively on Vercel. The `Dockerfile` provides a reproducible Node/Nitro runtime for local or portable use:

```bash
docker build -t marvelous .
docker run --rm -p 3000:3000 marvelous
```

## Deployment

Expected flow:

1. Feature branch → push → GitHub Actions CI
2. Pull request / review
3. Merge to `main`
4. Existing Vercel Git integration deploys production automatically

CI intentionally does **not** deploy, to avoid double-deploying with Vercel.

## Project layout

```text
src/
  routes/           # File-based routes (__root, home)
  components/ui/    # Reserved for Foundations primitives (Phase 2+)
  lib/utils.ts      # Foundations cn/cva helpers
  styles/app.css    # Tailwind + Foundations @theme baseline
supabase/           # Local Supabase project
.github/workflows/  # CI only
```

## Implementation phases

Work proceeds **one phase at a time**. Phase 1 is bootstrap/infrastructure only.

| Phase | Focus |
|------:|-------|
| 1 | Bootstrap, local infra, CI (current) |
| 2 | Design foundation / wedding tokens |
| 3 | Supabase schema + admin auth |
| 4 | Admin dashboard shell |
| 5 | Public wedding website |
| 6–12 | Story/photos, guests, RSVP, registry, date publish, email, launch |

Do not start the next phase until the previous phase is merged and confirmed.
