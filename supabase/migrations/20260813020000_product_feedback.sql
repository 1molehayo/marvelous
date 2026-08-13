-- Product feedback for v1 → v2 roadmap (Supabase-backed backlog).

create type public.feedback_category as enum (
  'general',
  'bug',
  'idea',
  'praise'
);

create type public.feedback_status as enum (
  'new',
  'planned',
  'done',
  'dismissed'
);

create table public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  admin_profile_id uuid not null references public.admin_profiles (id) on delete cascade,
  wedding_id uuid references public.weddings (id) on delete set null,
  category public.feedback_category not null default 'general',
  message text not null,
  page_path text,
  status public.feedback_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_feedback_message_len check (
    char_length(trim(message)) >= 3
    and char_length(message) <= 4000
  )
);

create index product_feedback_status_created_idx
  on public.product_feedback (status, created_at desc);

create index product_feedback_category_idx
  on public.product_feedback (category);

create trigger product_feedback_set_updated_at
before update on public.product_feedback
for each row execute function public.set_updated_at();

alter table public.product_feedback enable row level security;

-- Admins can insert their own feedback; reads go through service role (super-admin UI).
create policy "Admins can insert own feedback"
on public.product_feedback
for insert
to authenticated
with check (
  admin_profile_id = auth.uid()
  and public.is_admin()
);

grant select, insert, update on public.product_feedback to service_role;
grant insert on public.product_feedback to authenticated;

comment on table public.product_feedback is
  'In-app product feedback. Super admins review via service-role server functions.';
