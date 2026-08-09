# Marvelous & Lillian

Custom wedding website and lightweight admin dashboard for Marvelous & Lillian.

Built as a single **TanStack Start** (React + TypeScript) application. Production hosting is **Vercel** (existing GitHub → Vercel integration). Data/auth/storage use **Supabase**; transactional email will use **Resend** in a later phase.

> **Product principle:** a wedding date is optional. The site must remain fully usable with `weddingDate = null`. Never invent a placeholder date.

## Stack

- React 19 + TypeScript
- TanStack Start (SSR + server functions) + Nitro (Vercel-compatible)
- Tailwind CSS v4 + Significa Foundations primitives (admin)
- Public themes: Celeste, Botanica, Rosewater, Nocturne (each light + dark)
- Typography: Cormorant Garamond + Inter
- Supabase (Postgres, Auth, Storage) + RLS
- Vitest, ESLint, Prettier, mise (Node 22.22.1 / pnpm 10.28.0)
- GitHub Actions CI (no deploy job — Vercel handles production)

Useful routes:

- `/` — public coming-soon
- `/design` — design showcase
- `/admin/login` — admin sign-in
- `/admin` — protected overview (Phase 3 stub)

## Prerequisites

- [mise](https://mise.jdx.dev/) (recommended — pins Node + pnpm via `mise.toml`)
- Docker Desktop (for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npx supabase` works if not installed globally)

Pinned toolchain (see `mise.toml` and `package.json`):

- Node.js `22.22.1`
- pnpm `10.28.0`

## Local setup

```bash
mise install
mise trust  # first time in this repo
pnpm install
cp .env.example .env
# fill Supabase keys (local or cloud)
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)

### Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Supabase

### Environment variables

| Name | Where | Purpose |
|------|--------|---------|
| `VITE_SUPABASE_URL` | browser + server | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser + server | Publishable key (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | **server only** | Secret key (`sb_secret_…`) for privileged ops (first-login admin profile) |

Never put the secret key in a `VITE_` variable. Mark it Sensitive in Vercel.

### Local stack

```bash
npx supabase start
npx supabase db reset   # applies migrations + seed
npx supabase status     # copy URL + keys into .env
```

Local Auth has `enable_signup = false`. Create admins via Studio:

1. Open local Studio URL from `supabase status`
2. **Authentication → Users → Add user**
3. Create with email + password (auto-confirm)
4. Sign in at `/admin/login`
5. On first login the app creates `admin_profiles` and links the user to the seeded wedding

### Production

1. Ensure Vercel has the three Supabase env vars (Production)
2. Apply migrations to the cloud project, e.g. `npx supabase db push` (linked project) or run the SQL in `supabase/migrations/` via the SQL editor
3. In Supabase Dashboard → **Authentication → Providers / Settings**: disable public sign-ups
4. **Authentication → Users → Add user** for each admin
5. Sign in at `https://your-domain/admin/login`

### Security model (Phase 3)

- Public self-signup disabled (local config + production setting)
- Admin routes gated in `beforeLoad` via `getAdminSession()`
- Server functions use cookie session (`@supabase/ssr`)
- Privileged profile bootstrap uses `SUPABASE_SECRET_KEY` only on the server
- RLS: authenticated admins can read/update `weddings` / `admin_profiles`
- Storage bucket `photos` is private; admin-only object policies (upload UX in Phase 6)
- `wedding_date` is nullable from the first migration

## Docker (portable runtime)

Production deploys natively on Vercel. The `Dockerfile` is for reproducible Node/Nitro runs:

```bash
docker build -t marvelous .
docker run --rm -p 3000:3000 marvelous
```

## Deployment

1. Feature branch → push → GitHub Actions CI
2. Pull request / review
3. Merge to `main`
4. Existing Vercel Git integration deploys production automatically

## Project layout

```text
src/
  routes/admin/     # login + protected overview
  lib/supabase/     # browser / server / admin clients
  lib/auth/         # session server functions
  components/ui/    # Foundations primitives
supabase/
  migrations/       # schema history
  seed.sql          # fictional wedding row
```

## Implementation phases

| Phase | Focus |
|------:|-------|
| 1 | Bootstrap, local infra, CI |
| 2 | Design foundation / wedding tokens |
| 3 | Supabase schema + admin auth (current) |
| 4 | Admin dashboard shell / settings editing |
| 5 | Public wedding website |
| 6–12 | Story/photos, guests, RSVP, registry, date publish, email, launch |

Do not start the next phase until the previous phase is merged and confirmed.
