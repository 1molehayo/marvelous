-- Allow admin profiles before a wedding exists (super admin bootstrap / pre-onboarding).

alter table public.admin_profiles
  alter column wedding_id drop not null;
