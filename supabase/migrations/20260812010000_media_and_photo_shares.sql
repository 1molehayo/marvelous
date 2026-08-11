-- Media library + private guest photo share groups

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  storage_path text not null,
  filename text not null,
  content_type text,
  byte_size bigint,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (wedding_id, storage_path)
);

create index media_assets_wedding_id_idx on public.media_assets (wedding_id);
create index media_assets_wedding_created_idx
  on public.media_assets (wedding_id, created_at desc);

alter table public.media_assets enable row level security;

grant select, insert, update, delete on table public.media_assets to authenticated;
grant select, insert, update, delete on table public.media_assets to service_role;

create policy "Admins can select media for their wedding"
on public.media_assets for select to authenticated
using (
  public.is_admin()
  and wedding_id in (
    select wedding_id from public.admin_profiles
    where id = auth.uid() and wedding_id is not null
  )
);

create policy "Admins can insert media for their wedding"
on public.media_assets for insert to authenticated
with check (
  public.is_admin()
  and wedding_id in (
    select wedding_id from public.admin_profiles
    where id = auth.uid() and wedding_id is not null
  )
);

create policy "Admins can delete media for their wedding"
on public.media_assets for delete to authenticated
using (
  public.is_admin()
  and wedding_id in (
    select wedding_id from public.admin_profiles
    where id = auth.uid() and wedding_id is not null
  )
);

-- Private share groups (not on the public wedding site)

create table public.photo_share_groups (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  share_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index photo_share_groups_wedding_id_idx
  on public.photo_share_groups (wedding_id);

create trigger photo_share_groups_set_updated_at
before update on public.photo_share_groups
for each row execute function public.set_updated_at();

alter table public.photo_share_groups enable row level security;

grant select, insert, update, delete on table public.photo_share_groups to authenticated;
grant select, insert, update, delete on table public.photo_share_groups to service_role;

create policy "Admins can manage photo share groups for their wedding"
on public.photo_share_groups for all to authenticated
using (
  public.is_admin()
  and wedding_id in (
    select wedding_id from public.admin_profiles
    where id = auth.uid() and wedding_id is not null
  )
)
with check (
  public.is_admin()
  and wedding_id in (
    select wedding_id from public.admin_profiles
    where id = auth.uid() and wedding_id is not null
  )
);

create table public.photo_share_group_assets (
  group_id uuid not null references public.photo_share_groups (id) on delete cascade,
  media_asset_id uuid not null references public.media_assets (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (group_id, media_asset_id)
);

create index photo_share_group_assets_asset_idx
  on public.photo_share_group_assets (media_asset_id);

alter table public.photo_share_group_assets enable row level security;

grant select, insert, update, delete on table public.photo_share_group_assets to authenticated;
grant select, insert, update, delete on table public.photo_share_group_assets to service_role;

create policy "Admins can manage share group assets for their wedding"
on public.photo_share_group_assets for all to authenticated
using (
  public.is_admin()
  and group_id in (
    select g.id from public.photo_share_groups g
    join public.admin_profiles p on p.wedding_id = g.wedding_id
    where p.id = auth.uid() and p.wedding_id is not null
  )
)
with check (
  public.is_admin()
  and group_id in (
    select g.id from public.photo_share_groups g
    join public.admin_profiles p on p.wedding_id = g.wedding_id
    where p.id = auth.uid() and p.wedding_id is not null
  )
);

-- A guest may belong to at most one share group (unique guest_id).
create table public.photo_share_group_guests (
  group_id uuid not null references public.photo_share_groups (id) on delete cascade,
  guest_id uuid not null references public.guests (id) on delete cascade,
  primary key (group_id, guest_id),
  unique (guest_id)
);

create index photo_share_group_guests_group_idx
  on public.photo_share_group_guests (group_id);

alter table public.photo_share_group_guests enable row level security;

grant select, insert, update, delete on table public.photo_share_group_guests to authenticated;
grant select, insert, update, delete on table public.photo_share_group_guests to service_role;

create policy "Admins can manage share group guests for their wedding"
on public.photo_share_group_guests for all to authenticated
using (
  public.is_admin()
  and group_id in (
    select g.id from public.photo_share_groups g
    join public.admin_profiles p on p.wedding_id = g.wedding_id
    where p.id = auth.uid() and p.wedding_id is not null
  )
)
with check (
  public.is_admin()
  and group_id in (
    select g.id from public.photo_share_groups g
    join public.admin_profiles p on p.wedding_id = g.wedding_id
    where p.id = auth.uid() and p.wedding_id is not null
  )
);

create table public.photo_share_opens (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.photo_share_groups (id) on delete cascade,
  guest_id uuid references public.guests (id) on delete set null,
  opened_at timestamptz not null default now(),
  user_agent text
);

create index photo_share_opens_group_idx
  on public.photo_share_opens (group_id, opened_at desc);

alter table public.photo_share_opens enable row level security;

grant select, insert on table public.photo_share_opens to authenticated;
grant select, insert, update, delete on table public.photo_share_opens to service_role;

create policy "Admins can select share opens for their wedding"
on public.photo_share_opens for select to authenticated
using (
  public.is_admin()
  and group_id in (
    select g.id from public.photo_share_groups g
    join public.admin_profiles p on p.wedding_id = g.wedding_id
    where p.id = auth.uid() and p.wedding_id is not null
  )
);

comment on table public.media_assets is
  'Couple media library (private photos bucket). Used by guest photo shares.';
comment on table public.photo_share_groups is
  'Private photo shares for selected guests — not shown on the public wedding site.';
