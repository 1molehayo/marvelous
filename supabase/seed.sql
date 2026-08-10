-- Fictional/local seed only. Never put real secrets here.
-- Admins sign in with email + OTP. Auth users are created on OTP request (super admin)
-- or via in-app invite (other admins).

insert into public.weddings (
  partner_one_name,
  partner_two_name,
  wedding_date,
  status,
  venue_location,
  dress_code,
  active_public_theme
)
select
  'Lillian',
  'Marvelous',
  null,
  'planning',
  'Woodridge, Illinois · Chicago',
  'Formal attire',
  'celeste'
where not exists (select 1 from public.weddings);
