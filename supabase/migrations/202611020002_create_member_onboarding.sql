create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  date_of_birth text not null check (date_of_birth ~ '^[0-9]{2}/[0-9]{2}/[0-9]{2}$'),
  gender text not null check (gender in ('Female', 'Male', 'Prefer not to say')),
  phone text not null check (length(trim(phone)) > 4),
  location text not null check (length(trim(location)) > 0),
  intent text not null check (intent in ('Marriage-minded', 'Meaningful Dating', 'Concierge & discreet')),
  bio text not null default '' check (length(bio) <= 500),
  prompt text not null,
  prompt_answer text not null default '',
  updated_at timestamptz not null default now(),
  constraint member_profiles_prompt_valid
    check (prompt in ('A perfect Sunday looks like…', 'My love language is…', 'Non-negotiable for me is…', 'Family means…'))
);

create table if not exists public.member_compatibility (
  user_id uuid primary key references auth.users (id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  love_languages text[] not null default '{}'
    check (cardinality(love_languages) <= 2 and love_languages <@ array[
      'Quality time',
      'Acts of service',
      'Words of affirmation',
      'Physical touch',
      'Thoughtful gifts'
    ]::text[]),
  notes text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.member_profiles enable row level security;
alter table public.member_compatibility enable row level security;

revoke all on table public.member_profiles, public.member_compatibility from public, anon, authenticated;
grant select, insert, update on table public.member_profiles, public.member_compatibility to authenticated;

drop policy if exists "Members can read their own profile" on public.member_profiles;
create policy "Members can read their own profile"
  on public.member_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Members can create their own profile" on public.member_profiles;
create policy "Members can create their own profile"
  on public.member_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members can update their own profile" on public.member_profiles;
create policy "Members can update their own profile"
  on public.member_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members can read their own compatibility answers" on public.member_compatibility;
create policy "Members can read their own compatibility answers"
  on public.member_compatibility for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Members can create their own compatibility answers" on public.member_compatibility;
create policy "Members can create their own compatibility answers"
  on public.member_compatibility for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members can update their own compatibility answers" on public.member_compatibility;
create policy "Members can update their own compatibility answers"
  on public.member_compatibility for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
