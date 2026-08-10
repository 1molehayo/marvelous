-- Phase 4b: ordered JSON page blocks on the single wedding site.

alter table public.weddings
  add column if not exists page_blocks jsonb not null default '[]'::jsonb;

-- Seed default blocks when empty so the public home is not blank.
update public.weddings
set page_blocks = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'hero',
    'fields', jsonb_build_object(
      'title', null,
      'tagline', 'We''re getting married'
    )
  ),
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'story',
    'fields', jsonb_build_object(
      'title', 'Our story',
      'body', 'We''re preparing the details of our celebration. Check back soon.'
    )
  ),
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'details',
    'fields', jsonb_build_object(
      'showVenue', true,
      'showDressCode', true
    )
  )
)
where page_blocks = '[]'::jsonb
   or page_blocks is null;
