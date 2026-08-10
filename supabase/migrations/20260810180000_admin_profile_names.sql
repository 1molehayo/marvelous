-- Admin profile: structured names, optional phone, deletion request fields.
-- first_name / last_name are nullable in DB so bootstrap can create a row;
-- app requires them before regular admins continue (profile gate).

alter table public.admin_profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_reason text;

-- Backfill from legacy display_name / email local-part.
update public.admin_profiles
set
  first_name = coalesce(
    nullif(trim(split_part(coalesce(display_name, ''), ' ', 1)), ''),
    nullif(trim(split_part(coalesce(email, ''), '@', 1)), ''),
    'Admin'
  ),
  last_name = coalesce(
    nullif(
      trim(
        substring(
          coalesce(display_name, '')
          from length(split_part(coalesce(display_name, ''), ' ', 1)) + 2
        )
      ),
      ''
    ),
    ''
  )
where first_name is null or last_name is null;

-- Keep display_name as first name for any legacy reads.
update public.admin_profiles
set display_name = first_name
where first_name is not null
  and (display_name is distinct from first_name);
