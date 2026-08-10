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

- `/` — public home (theme + ordered page blocks from DB)
- `/design` — design showcase
- `/admin/login` — admin sign-in
- `/admin` — protected overview
- `/admin/settings` — wedding settings
- `/admin/pages` — page content blocks (hero, story, image, details)
- `/admin/admins` — invite/remove admins (super admin only)

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
# For local Mailpit OTP: also create `.env.local` with keys from `pnpm status`
pnpm supabase:start
pnpm db:reset   # first time / after migration changes
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)  
Mailpit (local OTP emails): [http://127.0.0.1:54324](http://127.0.0.1:54324)

### Useful pnpm scripts

| Script | What it runs |
|--------|----------------|
| `pnpm status` | `supabase status` (API URL, keys, Mailpit) |
| `pnpm supabase:start` | Start local Supabase |
| `pnpm supabase:stop` | Stop local Supabase |
| `pnpm db:reset` | Reset DB + apply migrations/seed |

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

Local Auth has `enable_signup = false`.

**Local Mailpit auth** (when `.env.local` points at `127.0.0.1`):

Only these emails can request an OTP:

| Email | Role |
|-------|------|
| `superadmin@supabase.com` | Super admin |
| `admin@supabase.com` | Admin |

1. `pnpm supabase:start` then `pnpm db:reset` (first time / after migrations)
2. `pnpm dev` — login badge should say **Local · Mailpit**
3. Sign in with one of the emails above → copy OTP from [Mailpit](http://127.0.0.1:54324)

**Production / cloud auth** (`.env` cloud URL, no local override):

1. Super admin is hardcoded: `omilabuolusegun@gmail.com`
2. First login bootstraps that email as `super_admin`
3. Invite other admins from **Admin → Admins** (they use real email + OTP)
4. Enable the Email provider in the Supabase Dashboard
5. (Recommended) configure custom SMTP so OTP emails deliver reliably

### Security model

- Public self-signup disabled (local config + production setting)
- Admin sign-in is **email + 6-digit OTP** (no passwords for admins)
- Admin routes gated in `beforeLoad` via `getAdminSession()`
- Roles: `super_admin` (sole hardcoded email) vs `admin`
- Only super admin can invite/remove admins (`/admin/admins`)
- Regular admins can edit wedding settings / content CRUD
- OTP is only sent to authorized emails (super admin or invited)
- Server functions use cookie session (`@supabase/ssr`)
- Privileged ops use `SUPABASE_SECRET_KEY` only on the server
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

### Wedding settings (Phase 4)

Admins can edit structured wedding facts at `/admin/settings`:

- Partner names
- Optional wedding date (`null` = date to be announced)
- Status, venue name/location, dress code
- Active public theme (Celeste / Botanica / Rosewater / Nocturne)

### Page content (Phase 4b)

Admins edit ordered home-page blocks at `/admin/pages`:

- Block types: `hero`, `story`, `image`, `details`
- Up/down reorder, add/remove, save whole `page_blocks` JSONB array
- Public `/` renders blocks via `DynamicBlock`
- Image blocks store a path in the private `photos` bucket; signed URLs are issued for admin preview and public render

After pulling migrations: `pnpm db:reset` (local) or apply the new migration on cloud.

## Project layout

```text
src/
  routes/admin/     # login, overview, settings, pages, admins
  lib/supabase/     # browser / server / admin clients
  lib/auth/         # session server functions
  lib/wedding/      # public settings + updateWedding
  lib/page-blocks/  # page_blocks types, validation, server fns
  components/blocks # public DynamicBlock renderers
  components/ui/    # Foundations primitives (+ toaster)
supabase/
  migrations/       # schema history
  seed.sql          # fictional wedding row
```

## Implementation phases

| Phase | Focus |
|------:|-------|
| 1 | Bootstrap, local infra, CI |
| 2 | Design foundation / wedding tokens |
| 3 | Supabase schema + admin auth |
| 4 | Wedding settings editing |
| 4b | Page blocks CMS (current) |
| 5 | Public wedding website |
| 6–12 | Story/photos, guests, RSVP, registry, date publish, email, launch |

Do not start the next phase until the previous phase is merged and confirmed.
