-- Super admin + invite-only admins
-- Only the hardcoded super-admin email can auto-bootstrap a profile on first login.
-- Other admins must be invited by the super admin.

create type public.admin_role as enum ('super_admin', 'admin');

alter table public.admin_profiles
  add column role public.admin_role not null default 'admin',
  add column email text;

-- Backfill email + promote the known super admin if they already have a profile.
update public.admin_profiles as profile
set
  email = lower(users.email),
  role = case
    when lower(users.email) = 'omilabuolusegun@gmail.com' then 'super_admin'::public.admin_role
    else profile.role
  end
from auth.users as users
where profile.id = users.id
  and users.email is not null;
