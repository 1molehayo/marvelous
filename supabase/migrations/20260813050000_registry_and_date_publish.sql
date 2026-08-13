-- Phase 9–10: registry (gifts + cash accounts) and deliberate date publish.

-- ---------------------------------------------------------------------------
-- Date publish: wedding_date may be saved as a draft; public only after publish.
-- ---------------------------------------------------------------------------
alter table public.weddings
  add column if not exists date_published_at timestamptz;

comment on column public.weddings.date_published_at is
  'When set with wedding_date, the date is visible on the public site. Null keeps TBA even if a draft date is saved.';

-- Existing rows that already have a date were public before this column existed.
update public.weddings
set date_published_at = coalesce(updated_at, now())
where wedding_date is not null
  and date_published_at is null;

-- ---------------------------------------------------------------------------
-- Registry items (external buy-as-gift / gift-card links; admin-managed qty)
-- ---------------------------------------------------------------------------
create type public.registry_item_status as enum (
  'available',
  'reserved',
  'purchased'
);

create table public.registry_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  description text,
  store_url text not null,
  price_label text,
  desired_qty integer not null default 1
    check (desired_qty >= 1 and desired_qty <= 100),
  claimed_qty integer not null default 0
    check (claimed_qty >= 0),
  status public.registry_item_status not null default 'available',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registry_items_claimed_lte_desired
    check (claimed_qty <= desired_qty)
);

create index registry_items_wedding_id_idx
  on public.registry_items (wedding_id, sort_order, created_at);

create trigger registry_items_set_updated_at
before update on public.registry_items
for each row execute function public.set_updated_at();

alter table public.registry_items enable row level security;

grant select, insert, update, delete on table public.registry_items to authenticated;
grant select, insert, update, delete on table public.registry_items to service_role;

create policy "Admins can select registry items for their wedding"
on public.registry_items
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

create policy "Admins can insert registry items for their wedding"
on public.registry_items
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

create policy "Admins can update registry items for their wedding"
on public.registry_items
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

create policy "Admins can delete registry items for their wedding"
on public.registry_items
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

-- Soft reservations (guest-facing; privacy-light — name optional)
create table public.registry_reservations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  item_id uuid not null references public.registry_items (id) on delete cascade,
  guest_name text,
  quantity integer not null default 1
    check (quantity >= 1 and quantity <= 20),
  created_at timestamptz not null default now()
);

create index registry_reservations_item_id_idx
  on public.registry_reservations (item_id, created_at desc);

create index registry_reservations_wedding_id_idx
  on public.registry_reservations (wedding_id);

alter table public.registry_reservations enable row level security;

grant select, insert, update, delete on table public.registry_reservations to authenticated;
grant select, insert, update, delete on table public.registry_reservations to service_role;

create policy "Admins can select registry reservations for their wedding"
on public.registry_reservations
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

create policy "Admins can delete registry reservations for their wedding"
on public.registry_reservations
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

-- ---------------------------------------------------------------------------
-- Cash / bank accounts (no payment processing)
-- ---------------------------------------------------------------------------
create table public.registry_accounts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  label text not null,
  bank_name text,
  currency text not null default 'USD',
  account_name text not null,
  account_number text not null,
  routing_number text,
  notes text,
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index registry_accounts_wedding_id_idx
  on public.registry_accounts (wedding_id, sort_order, created_at);

create trigger registry_accounts_set_updated_at
before update on public.registry_accounts
for each row execute function public.set_updated_at();

alter table public.registry_accounts enable row level security;

grant select, insert, update, delete on table public.registry_accounts to authenticated;
grant select, insert, update, delete on table public.registry_accounts to service_role;

create policy "Admins can select registry accounts for their wedding"
on public.registry_accounts
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

create policy "Admins can insert registry accounts for their wedding"
on public.registry_accounts
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

create policy "Admins can update registry accounts for their wedding"
on public.registry_accounts
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

create policy "Admins can delete registry accounts for their wedding"
on public.registry_accounts
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
