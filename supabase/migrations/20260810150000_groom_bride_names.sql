-- Rename generic partners to groom / bride.

alter table public.weddings
  rename column partner_one_name to groom_name;

alter table public.weddings
  rename column partner_two_name to bride_name;

-- Local/default seed historically stored Lillian then Marvelous as partner_one/two.
-- Flip only that known pair so groom/bride match reality.
update public.weddings
set
  groom_name = 'Marvelous',
  bride_name = 'Lillian'
where groom_name = 'Lillian'
  and bride_name = 'Marvelous';
