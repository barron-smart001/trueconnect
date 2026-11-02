create table if not exists public.identity_verifications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  persona_inquiry_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'under_review', 'approved', 'declined')),
  submitted_at timestamptz not null default now(),
  last_event_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.identity_verifications enable row level security;

revoke all on table public.identity_verifications from public, anon, authenticated;
grant select on table public.identity_verifications to authenticated;

drop policy if exists "Members can read their own verification status" on public.identity_verifications;
create policy "Members can read their own verification status"
  on public.identity_verifications for select to authenticated
  using ((select auth.uid()) = user_id);
