-- Phase 3: core wedding + admin foundation
-- wedding_date is intentionally nullable.

create type public.wedding_status as enum (
  'planning',
  'date_confirmed',
  'invitations_sent',
  'completed'
);

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  partner_one_name text not null,
  partner_two_name text not null,
  wedding_date date,
  status public.wedding_status not null default 'planning',
  venue_name text,
  venue_location text,
  dress_code text,
  active_public_theme text not null default 'celeste'
    check (
      active_public_theme in ('celeste', 'botanica', 'rosewater', 'nocturne')
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index admin_profiles_wedding_id_idx on public.admin_profiles (wedding_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger weddings_set_updated_at
before update on public.weddings
for each row execute function public.set_updated_at();

create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.weddings enable row level security;
alter table public.admin_profiles enable row level security;

create policy "Admins can select weddings"
on public.weddings
for select
to authenticated
using (public.is_admin());

create policy "Admins can update weddings"
on public.weddings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can select admin profiles"
on public.admin_profiles
for select
to authenticated
using (public.is_admin());

create policy "Admins can update own admin profile"
on public.admin_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Photos bucket (private). Object policies refined in Phase 6.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Admins can read photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'photos' and public.is_admin());

create policy "Admins can upload photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'photos' and public.is_admin());

create policy "Admins can update photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'photos' and public.is_admin())
with check (bucket_id = 'photos' and public.is_admin());

create policy "Admins can delete photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'photos' and public.is_admin());
