insert into public.weddings (
  groom_name,
  bride_name,
  wedding_date,
  status,
  venue_location,
  dress_code,
  active_public_theme,
  public_slug
)
select
  'Marvelous',
  'Lillian',
  null,
  'planning',
  'Woodridge, Illinois · Chicago',
  'Formal attire',
  'celeste',
  'lillian-marvelous-2026'
where not exists (select 1 from public.weddings);
