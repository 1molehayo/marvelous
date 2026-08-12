-- RSVP response lock + admin-only guest disambiguation label

alter table public.guests
  add column if not exists admin_label text,
  add column if not exists allow_rsvp_update boolean not null default true;

comment on column public.guests.admin_label is
  'Admin-only label to distinguish guests with the same name. Never shown to guests.';

comment on column public.guests.allow_rsvp_update is
  'When false and RSVP is submitted, guest cannot change response until admin unlocks.';

-- Already-responded guests should start locked.
update public.guests
set allow_rsvp_update = false
where rsvp_status <> 'pending';
