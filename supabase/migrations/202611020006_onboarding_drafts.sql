create table if not exists public.member_onboarding_drafts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile_draft jsonb,
  profile_photo_paths text[] not null default '{}',
  compatibility_draft jsonb,
  updated_at timestamptz not null default now()
);

alter table public.member_onboarding_drafts enable row level security;
revoke all on table public.member_onboarding_drafts from public, anon, authenticated;
grant select, insert, update on table public.member_onboarding_drafts to authenticated;

drop policy if exists "Members can manage their own onboarding drafts" on public.member_onboarding_drafts;
create policy "Members can manage their own onboarding drafts"
  on public.member_onboarding_drafts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
