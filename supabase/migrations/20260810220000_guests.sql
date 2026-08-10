-- Phase 6: guest list foundation (RSVP comes later)

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  party_name text,
  plus_ones integer not null default 0
    check (plus_ones >= 0 and plus_ones <= 20),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guests_wedding_id_idx on public.guests (wedding_id);
create index guests_wedding_name_idx on public.guests (wedding_id, last_name, first_name);

create trigger guests_set_updated_at
before update on public.guests
for each row execute function public.set_updated_at();

alter table public.guests enable row level security;

grant select, insert, update, delete on table public.guests to authenticated;
grant select, insert, update, delete on table public.guests to service_role;

-- v1: any admin can manage guests for the wedding they belong to.
-- Super admin with null wedding_id uses service-role server fns (bypasses RLS).
create policy "Admins can select guests for their wedding"
on public.guests
for select
to authenticated
using (
  public.is_admin()
  and wedding_id in (
    select wedding_id
    from public.admin_profiles
    where id = auth.uid() and wedding_id is not null
  )
);

create policy "Admins can insert guests for their wedding"
on public.guests
for insert
to authenticated
with check (
  public.is_admin()
  and wedding_id in (
    select wedding_id
    from public.admin_profiles
    where id = auth.uid() and wedding_id is not null
  )
);

create policy "Admins can update guests for their wedding"
on public.guests
for update
to authenticated
using (
  public.is_admin()
  and wedding_id in (
    select wedding_id
    from public.admin_profiles
    where id = auth.uid() and wedding_id is not null
  )
)
with check (
  public.is_admin()
  and wedding_id in (
    select wedding_id
    from public.admin_profiles
    where id = auth.uid() and wedding_id is not null
  )
);

create policy "Admins can delete guests for their wedding"
on public.guests
for delete
to authenticated
using (
  public.is_admin()
  and wedding_id in (
    select wedding_id
    from public.admin_profiles
    where id = auth.uid() and wedding_id is not null
  )
);
