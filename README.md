# Wedding Website Builder

Whitelabel wedding website + admin, built by **Onemole**.

**v1 (current):** one deploy = one wedding. Couple facts, themes, and page blocks live in Supabase; product chrome is Onemole.

**v2 (planned):** generate and host **multiple** live wedding websites from one platform — see [Future plan](#future-plan).

Built as a single **TanStack Start** (React + TypeScript) application. Production hosting is **Vercel**. Data/auth/storage use **Supabase**; Auth OTP email uses **Resend** (custom SMTP).

> **Product principle:** a wedding date is optional. The site must remain fully usable with `weddingDate = null`. Never invent a placeholder date.

> **Naming:** **Wedding Website Builder** / **Onemole** = product. **Groom** and **bride** names = this wedding (Wedding settings). Do not hardcode the couple into the admin product chrome.

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
- `/admin/settings` — wedding settings (groom, bride, date, venue, theme)
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

## Whitelabel: launch checklist for a new wedding (v1)

v1 is **one codebase deploy → one couple**. To ship another wedding, you typically clone/fork or re-deploy with a new Supabase project + Vercel project, then walk this list.

Couple-facing copy in the **app** comes from the DB (Wedding settings + page blocks). Several **dashboard** values are still couple-specific and must be updated by hand.

### A. Code / repo (usually once per product; change per couple only if needed)

| What | Where | Notes |
|------|--------|--------|
| Product name / tagline | `src/lib/constants.ts` (`PRODUCT_*`) | Keep as Onemole product branding unless white-labeling the builder itself |
| Production super admin email | `src/lib/auth/roles.ts` → `PRODUCTION_SUPER_ADMIN_EMAIL` | Who can bootstrap `/admin` on first login |
| Local OTP email subject | `supabase/config.toml` → `[auth.email.template.magic_link].subject` | e.g. `Marvelous & Lillian Wedding` |
| Local OTP email body | `supabase/templates/magic_link.html` | Keep `{{ .Token }}` — do not replace with a real code |
| Seed couple | `supabase/seed.sql` | `groom_name` / `bride_name` for local resets |
| Fallback couple (DB down) | `src/lib/wedding/public-settings.ts` → `FALLBACK_PUBLIC_WEDDING` | Emergency public fallback only |

### B. Supabase Dashboard (cloud project for this wedding)

| What | Where | Set to |
|------|--------|--------|
| Site URL | **Authentication → URL Configuration** | Production site origin, e.g. `https://your-site.vercel.app` (include `https://`) |
| Redirect URLs | same page | Same production origin (+ preview URLs if needed) |
| Email provider | **Authentication → Providers → Email** | Enabled |
| Custom SMTP | **Project Settings → Authentication → SMTP** (or Resend integration) | **Required** to edit Auth email templates on hosted Supabase |
| Magic link / OTP **subject** | **Authentication → Emails → Magic link or OTP** | Couple wedding title, e.g. `Marvelous & Lillian Wedding` |
| Magic link / OTP **body** | same template | OTP-only HTML (see below). Must include `{{ .Token }}` |
| Migrations | CLI: `npx supabase db push` (or SQL editor) | Apply all `supabase/migrations/*` including `page_blocks`, `groom_name` / `bride_name` |
| Wedding row | Admin UI after login, or seed | Groom, bride, theme, venue, page blocks |

**OTP email body (hosted template):**

```html
<h2>Your admin sign-in code</h2>
<p>Use this one-time code to sign in:</p>
<p style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em">
  {{ .Token }}
</p>
<p>This code expires shortly and can only be used once.</p>
```

Leave `{{ .Token }}` exactly as written. Subject is where the couple name belongs (Resend/Supabase cannot pull groom/bride from our DB for Auth emails).

### C. Resend

| What | Where | Notes |
|------|--------|--------|
| Account + API key | [resend.com](https://resend.com) | Used as Supabase Auth SMTP password |
| Sending domain | Resend → Domains | Use a domain you control (`example.com`), **not** `*.vercel.app` |
| Sender identity | Supabase SMTP “Sender email” | Must be allowed by Resend (verified domain, or `onboarding@resend.dev` for tests only) |
| SMTP into Supabase | Host `smtp.resend.com`, port `465`, user `resend`, password = API key | Unlocks editable Auth templates |

Resend does **not** store the OTP subject/body — those live in **Supabase Email Templates**. Resend only delivers whatever Supabase sends.

### D. Vercel

| What | Where | Notes |
|------|--------|--------|
| Project | linked to this GitHub repo | One Vercel project per wedding site in v1 |
| Env vars | Project → Settings → Environment Variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (Sensitive) for **this** wedding’s Supabase project |
| Domain | Domains | Temporary `*.vercel.app` is fine; custom domain later |

Do **not** point production at local Mailpit keys.

### E. After first deploy — in-app

1. Open `/admin/login` → send OTP → enter the **6-digit code** from email (not a magic link).
2. Confirm **Wedding settings**: groom, bride, date (or empty), venue, dress code, theme.
3. Confirm **Page content** blocks and public `/`.
4. Invite additional admins from **Admins** if needed.

### Quick “new couple” pass

When reusing this product for another wedding:

1. New Supabase project + push migrations  
2. New (or retargeted) Vercel project + env keys  
3. Resend SMTP connected on that Supabase project  
4. Auth **Site URL** / redirects = that site’s URL  
5. Auth email **subject** = `{Groom} & {Bride} Wedding`  
6. Auth email **body** = OTP template with `{{ .Token }}`  
7. Update `PRODUCTION_SUPER_ADMIN_EMAIL` if a different owner should bootstrap  
8. Update local `config.toml` subject + `seed.sql` if you care about local parity  
9. Sign in → set groom/bride/content in admin  

## Supabase

### Environment variables

| Name | Where | Purpose |
|------|--------|---------|
| `VITE_SUPABASE_URL` | browser + server | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser + server | Publishable key (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | **server only** | Secret key (`sb_secret_…`) for privileged ops (first-login admin profile) |
| `RESEND_API_KEY` | optional / later | App transactional email (Phase 11+). Auth OTP uses Resend via **Supabase SMTP**, not this var, unless you wire it later |

Never put the secret key in a `VITE_` variable. Mark it Sensitive in Vercel.

### Local stack

```bash
npx supabase start
npx supabase db reset   # applies migrations + seed
npx supabase status     # copy URL + keys into .env
```

Local Auth has `enable_signup = false`. Local OTP uses Mailpit + `supabase/templates/magic_link.html` (no Resend required locally).

**Local Mailpit auth** (when `.env.local` points at `127.0.0.1`):

| Email | Role |
|-------|------|
| `superadmin@supabase.com` | Super admin |
| `admin@supabase.com` | Admin |

1. `pnpm supabase:start` then `pnpm db:reset` (first time / after migrations)
2. `pnpm dev` — login badge should say **Local · Mailpit**
3. Sign in with one of the emails above → copy OTP from [Mailpit](http://127.0.0.1:54324)

**Production / cloud auth** (`.env` cloud URL, no local override):

1. Super admin email is hardcoded in `src/lib/auth/roles.ts` (`PRODUCTION_SUPER_ADMIN_EMAIL`)
2. First login bootstraps that email as `super_admin`
3. Invite other admins from **Admin → Admins**
4. Enable Email provider + custom SMTP (Resend) + OTP template (see checklist above)

### Security model

- Public self-signup disabled (local config + production setting)
- Admin sign-in is **email + 6-digit OTP** (no passwords for admins)
- Admin routes gated in `beforeLoad` via `getAdminSession()`
- Roles: `super_admin` (production hardcoded email) vs `admin`
- Only super admin can invite/remove admins (`/admin/admins`)
- Regular admins can edit wedding settings / content CRUD
- OTP is only sent to authorized emails (super admin or invited)
- Server functions use cookie session (`@supabase/ssr`)
- Privileged ops use `SUPABASE_SECRET_KEY` only on the server
- RLS: authenticated admins can read/update `weddings` / `admin_profiles`
- Storage bucket `photos` is private; admin-only object policies
- `wedding_date` is nullable from the first migration

## Docker (portable runtime)

Production deploys natively on Vercel. The `Dockerfile` is for reproducible Node/Nitro runs:

```bash
docker build -t wedding-website-builder .
docker run --rm -p 3000:3000 wedding-website-builder
```

## Deployment

1. Feature branch → push → GitHub Actions CI
2. Pull request / review
3. Merge to `main`
4. Vercel Git integration deploys production automatically
5. Confirm cloud migrations + Auth/Resend checklist before relying on `/admin`

### Wedding settings (Phase 4)

Admins edit structured facts at `/admin/settings`:

- Groom and bride names
- Optional wedding date (`null` = date to be announced)
- Status, venue name/location, dress code
- Active public theme (Celeste / Botanica / Rosewater / Nocturne)

### Page content (Phase 4b)

Admins edit ordered home-page blocks at `/admin/pages`:

- Block types: `hero`, `story`, `image`, `details`
- Up/down reorder, add/remove, save whole `page_blocks` JSONB array
- Public `/` renders blocks via `DynamicBlock`
- Image blocks store a path in the private `photos` bucket; signed URLs for admin preview and public render

After pulling migrations: `pnpm db:reset` (local) or `npx supabase db push` (cloud).

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
  seed.sql          # default wedding row (local)
  templates/        # local Auth email (OTP)
```

## Implementation phases (v1)

| Phase | Focus |
|------:|-------|
| 1 | Bootstrap, local infra, CI |
| 2 | Design foundation / wedding tokens |
| 3 | Supabase schema + admin auth |
| 4 | Wedding settings editing |
| 4b | Page blocks CMS (current) |
| 5 | Public wedding website polish |
| 6–12 | Story/photos, guests, RSVP, registry, date publish, email, launch |

Do not start the next phase until the previous phase is merged and confirmed.

## Future plan

| Version | Goal |
|--------:|------|
| **v1** | Single wedding per deploy (this repo). Whitelabel by reconfiguring Supabase / Resend / Vercel / seed + admin content. |
| **v2** | Multi-wedding platform: create many live wedding websites from one product (tenancy, per-wedding domains, shared admin/builder, provisioning). Auth email subjects/templates and super-admin bootstrap must become data-driven instead of per-project dashboard edits. |

Track v2 explicitly so we do not bolt multi-site onto v1 accidentally. Until then, treat each production wedding as its own Supabase + Vercel surface and use the [launch checklist](#whitelabel-launch-checklist-for-a-new-wedding-v1).
