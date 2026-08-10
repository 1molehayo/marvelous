-- Table privileges required for PostgREST roles.
-- RLS still applies to authenticated; service_role bypasses RLS but still needs GRANT.

grant select, insert, update, delete on table public.weddings to authenticated;
grant select, insert, update, delete on table public.weddings to service_role;

grant select, insert, update, delete on table public.admin_profiles to authenticated;
grant select, insert, update, delete on table public.admin_profiles to service_role;

-- First-login bootstrap: allow a signed-in user to read their own profile row
-- (is_admin() is false until the profile exists — chicken-and-egg).
create policy "Users can select own admin profile"
on public.admin_profiles
for select
to authenticated
using (id = auth.uid());
