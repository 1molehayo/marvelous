-- Admin invite lifecycle + archive (emails unique only on active profiles)

alter table public.admin_profiles
  add column if not exists invite_token text,
  add column if not exists invited_at timestamptz,
  add column if not exists invite_accepted_at timestamptz,
  add column if not exists cancelled_at timestamptz;

-- Backfill legacy profiles that already signed in as accepted.
update public.admin_profiles as profile
set
  invite_accepted_at = coalesce(profile.invite_accepted_at, profile.created_at),
  invited_at = coalesce(profile.invited_at, profile.created_at)
from auth.users as users
where users.id = profile.id
  and users.last_sign_in_at is not null
  and profile.invite_accepted_at is null;

-- Remaining rows are pending invites — ensure invited_at + token for resend.
update public.admin_profiles
set
  invited_at = coalesce(invited_at, created_at),
  invite_token = coalesce(
    invite_token,
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
  )
where invite_accepted_at is null;

create unique index if not exists admin_profiles_invite_token_uidx
  on public.admin_profiles (invite_token)
  where invite_token is not null;

-- Active admin emails must be unique (archived table allows repeats).
create unique index if not exists admin_profiles_email_uidx
  on public.admin_profiles (lower(email))
  where email is not null;

create table if not exists public.archived_admins (
  id uuid primary key default gen_random_uuid(),
  original_user_id uuid not null,
  email text not null,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  role public.admin_role not null default 'admin',
  wedding_id uuid,
  deletion_requested_at timestamptz,
  deletion_reason text,
  invite_token text,
  invited_at timestamptz,
  invite_accepted_at timestamptz,
  cancelled_at timestamptz,
  profile_created_at timestamptz,
  profile_updated_at timestamptz,
  archived_at timestamptz not null default now(),
  archived_by uuid,
  archive_reason text
);

create index if not exists archived_admins_email_idx
  on public.archived_admins (lower(email));

create index if not exists archived_admins_original_user_id_idx
  on public.archived_admins (original_user_id);

alter table public.archived_admins enable row level security;

grant select, insert, update, delete on table public.archived_admins to service_role;
-- Super-admin reads go through service-role server fns; no authenticated policies.

comment on table public.archived_admins is
  'Soft-deleted admin snapshots. Email is not unique — same address may be archived many times.';
comment on column public.admin_profiles.invite_token is
  'Opaque token for /admin/invite/$token accept links.';
