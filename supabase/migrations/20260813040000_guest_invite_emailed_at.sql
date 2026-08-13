-- Track when an RSVP invite email was last sent (admin visibility / re-send awareness).
alter table public.guests
  add column if not exists invite_emailed_at timestamptz;

comment on column public.guests.invite_emailed_at is
  'Last time an RSVP invite email was successfully sent to this guest.';
