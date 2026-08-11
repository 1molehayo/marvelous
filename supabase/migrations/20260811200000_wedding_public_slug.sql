-- Public wedding URL slug (v1 single wedding; v2 multi-wedding ready)

alter table public.weddings
  add column if not exists public_slug text;

-- Backfill from bride-groom-year (bride first). Year from wedding_date or created_at.
update public.weddings
set public_slug = lower(
  trim(both '-' from regexp_replace(
    regexp_replace(
      coalesce(nullif(trim(bride_name), ''), 'bride') || '-' ||
      coalesce(nullif(trim(groom_name), ''), 'groom') || '-' ||
      coalesce(
        to_char(wedding_date, 'YYYY'),
        to_char(created_at at time zone 'utc', 'YYYY')
      ),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    ),
    '-+',
    '-',
    'g'
  ))
)
where public_slug is null or trim(public_slug) = '';

-- Deduplicate any collisions by appending short id suffix.
update public.weddings as w
set public_slug = w.public_slug || '-' || substr(replace(w.id::text, '-', ''), 1, 6)
where exists (
  select 1
  from public.weddings as other
  where other.public_slug = w.public_slug
    and other.id < w.id
);

alter table public.weddings
  alter column public_slug set not null;

create unique index if not exists weddings_public_slug_uidx
  on public.weddings (public_slug);

comment on column public.weddings.public_slug is
  'Stable public path segment: /{public_slug}. Do not derive from live name edits blindly.';
