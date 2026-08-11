-- Phase 7: tokenized guest RSVP (public form + admin override)

create type public.rsvp_status as enum ('pending', 'attending', 'declined');

alter table public.guests
  add column rsvp_token text not null
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
    constraint guests_rsvp_token_unique unique,
  add column rsvp_status public.rsvp_status not null default 'pending',
  add column rsvp_responded_at timestamptz,
  add column attending_count integer
    check (
      attending_count is null
      or (attending_count >= 0 and attending_count <= 21)
    ),
  add column dietary_notes text,
  add column rsvp_message text;

create index guests_rsvp_token_idx on public.guests (rsvp_token);
create index guests_wedding_rsvp_status_idx on public.guests (wedding_id, rsvp_status);

comment on column public.guests.rsvp_token is
  'Opaque public RSVP link token; never expose guest id in public URLs.';
comment on column public.guests.attending_count is
  'Total heads attending including the guest; null when pending or declined.';
