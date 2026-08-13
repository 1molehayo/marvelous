-- Optional “I donated” notes so we can thank supporters.

create table public.donation_thanks (
  id uuid primary key default gen_random_uuid(),
  admin_profile_id uuid not null references public.admin_profiles (id) on delete cascade,
  wedding_id uuid references public.weddings (id) on delete set null,
  donor_name text not null,
  donor_email text not null,
  message text,
  created_at timestamptz not null default now(),
  constraint donation_thanks_name_len check (
    char_length(trim(donor_name)) >= 1
    and char_length(donor_name) <= 120
  ),
  constraint donation_thanks_email_len check (
    char_length(trim(donor_email)) >= 3
    and char_length(donor_email) <= 254
  ),
  constraint donation_thanks_message_len check (
    message is null or char_length(message) <= 1000
  )
);

create index donation_thanks_created_idx
  on public.donation_thanks (created_at desc);

alter table public.donation_thanks enable row level security;

create policy "Admins can insert own donation thanks"
on public.donation_thanks
for insert
to authenticated
with check (
  admin_profile_id = auth.uid()
  and public.is_admin()
);

grant select, insert on public.donation_thanks to service_role;
grant insert on public.donation_thanks to authenticated;

comment on table public.donation_thanks is
  'Optional post-donation contact info so the creator can thank supporters.';
