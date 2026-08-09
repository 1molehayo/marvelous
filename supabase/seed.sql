-- Fictional/local seed only. Never put real secrets or production passwords here.
-- Auth users are created in the Supabase Dashboard (Auth → Users → Add user).
-- On first login, the app links that user to admin_profiles automatically.

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
