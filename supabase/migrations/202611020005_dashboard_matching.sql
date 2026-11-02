create table if not exists public.supported_cities (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  city text not null,
  country text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180)
);

alter table public.supported_cities enable row level security;
revoke all on table public.supported_cities from public, anon, authenticated;
grant select on table public.supported_cities to authenticated;

drop policy if exists "Members can read supported cities" on public.supported_cities;
create policy "Members can read supported cities"
  on public.supported_cities for select to authenticated
  using (true);

insert into public.supported_cities (display_name, city, country, latitude, longitude)
values
  ('Lagos, Nigeria', 'Lagos', 'Nigeria', 6.5244, 3.3792),
  ('Ikeja, Nigeria', 'Ikeja', 'Nigeria', 6.6018, 3.3515),
  ('Surulere, Nigeria', 'Surulere', 'Nigeria', 6.4969, 3.3507),
  ('Yaba, Nigeria', 'Yaba', 'Nigeria', 6.5095, 3.3711),
  ('Ikoyi, Nigeria', 'Ikoyi', 'Nigeria', 6.4541, 3.4316),
  ('Victoria Island, Nigeria', 'Victoria Island', 'Nigeria', 6.4281, 3.4219),
  ('Ajah, Nigeria', 'Ajah', 'Nigeria', 6.4698, 3.5852),
  ('Ikorodu, Nigeria', 'Ikorodu', 'Nigeria', 6.6194, 3.5105),
  ('Lekki, Nigeria', 'Lekki', 'Nigeria', 6.4698, 3.5852),
  ('Abuja, Nigeria', 'Abuja', 'Nigeria', 9.0579, 7.4951),
  ('Accra, Ghana', 'Accra', 'Ghana', 5.6037, -0.1870),
  ('Nairobi, Kenya', 'Nairobi', 'Kenya', -1.2921, 36.8219),
  ('Johannesburg, South Africa', 'Johannesburg', 'South Africa', -26.2041, 28.0473),
  ('London, United Kingdom', 'London', 'United Kingdom', 51.5072, -0.1276),
  ('Toronto, Canada', 'Toronto', 'Canada', 43.6532, -79.3832),
  ('New York, United States', 'New York', 'United States', 40.7128, -74.0060)
on conflict (display_name) do update
set
  city = excluded.city,
  country = excluded.country,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

alter table public.member_profiles
  add column if not exists city_id uuid references public.supported_cities (id),
  add column if not exists last_active_at timestamptz;

update public.member_profiles as profile
set city_id = city.id
from public.supported_cities as city
where profile.city_id is null
  and lower(trim(profile.location)) = lower(city.display_name);

create index if not exists member_profiles_discovery_idx
  on public.member_profiles (city_id, intent, gender);
create index if not exists member_profiles_last_active_idx
  on public.member_profiles (last_active_at desc);
create index if not exists identity_verifications_status_idx
  on public.identity_verifications (status, user_id);

create table if not exists public.member_discover_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  show_me text not null default 'Women' check (show_me in ('Women', 'Men', 'Everyone')),
  looking_for text not null default 'Marriage Minded'
    check (looking_for in ('Marriage Minded', 'Meaningful Dating', 'Concierge')),
  min_age integer not null default 27 check (min_age between 18 and 48),
  max_age integer not null default 36 check (max_age between 18 and 57 and max_age >= min_age),
  max_distance_km integer not null default 50 check (max_distance_km between 5 and 160),
  minimum_trust_score integer not null default 80 check (minimum_trust_score between 71 and 100),
  verified_only boolean not null default true,
  active_this_week boolean not null default true,
  time_zone text not null default 'UTC',
  updated_at timestamptz not null default now()
);

alter table public.member_discover_preferences enable row level security;
revoke all on table public.member_discover_preferences from public, anon, authenticated;
grant select, insert, update on table public.member_discover_preferences to authenticated;

drop policy if exists "Members can manage their own discover preferences" on public.member_discover_preferences;
create policy "Members can manage their own discover preferences"
  on public.member_discover_preferences for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.member_discover_actions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users (id) on delete cascade,
  profile_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('like', 'pass')),
  created_at timestamptz not null default now(),
  constraint member_discover_actions_not_self check (member_id <> profile_id),
  constraint member_discover_actions_once unique (member_id, profile_id)
);

alter table public.member_discover_actions enable row level security;
revoke all on table public.member_discover_actions from public, anon, authenticated;
create index if not exists member_discover_actions_member_created_idx
  on public.member_discover_actions (member_id, created_at desc);

create table if not exists public.member_discover_impressions (
  member_id uuid not null references auth.users (id) on delete cascade,
  profile_id uuid not null references auth.users (id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (member_id, profile_id),
  constraint member_discover_impressions_not_self check (member_id <> profile_id)
);

alter table public.member_discover_impressions enable row level security;
revoke all on table public.member_discover_impressions from public, anon, authenticated;
create index if not exists member_discover_impressions_recent_idx
  on public.member_discover_impressions (member_id, profile_id, seen_at desc);

create table if not exists public.member_saved_profiles (
  member_id uuid not null references auth.users (id) on delete cascade,
  profile_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, profile_id),
  constraint member_saved_profiles_not_self check (member_id <> profile_id)
);

alter table public.member_saved_profiles enable row level security;
revoke all on table public.member_saved_profiles from public, anon, authenticated;

create or replace function public.can_read_member_profile_photo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.identity_verifications as viewer
      where viewer.user_id = (select auth.uid())
        and viewer.status = 'approved'
    )
    and exists (
      select 1
      from public.member_profiles as owner_profile
      join public.identity_verifications as owner_verification
        on owner_verification.user_id = owner_profile.user_id
      where owner_profile.user_id::text = (storage.foldername(object_name))[1]
        and object_name = any(owner_profile.photo_paths)
        and owner_verification.status = 'approved'
    );
$$;

revoke all on function public.can_read_member_profile_photo(text) from public, anon;
grant execute on function public.can_read_member_profile_photo(text) to authenticated;

drop policy if exists "Verified members can view approved member profile photos" on storage.objects;
create policy "Verified members can view approved member profile photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'member-profile-photos'
    and (select public.can_read_member_profile_photo(name))
  );

create or replace function public.try_parse_member_birth_date(value text)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  parsed date;
begin
  if value !~ '^[0-9]{2}/[0-9]{2}/[0-9]{2}$' then
    return null;
  end if;
  parsed := to_date(value, 'DD/MM/YY');
  if to_char(parsed, 'DD/MM/YY') <> value then
    return null;
  end if;
  return parsed;
exception
  when others then return null;
end;
$$;

create or replace function public.get_discover_profiles(
  p_show_me text,
  p_looking_for text,
  p_min_age integer,
  p_max_age integer,
  p_max_distance_km integer,
  p_minimum_trust_score integer,
  p_verified_only boolean,
  p_active_this_week boolean,
  p_limit integer default 20
)
returns table (
  id uuid,
  name text,
  age integer,
  gender text,
  location text,
  distance integer,
  intent text,
  trust integer,
  verified boolean,
  prompt text,
  photo_paths text[]
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  viewer_latitude double precision;
  viewer_longitude double precision;
begin
  if current_user_id is null then
    raise exception 'Sign in to discover profiles.';
  end if;
  if p_show_me not in ('Women', 'Men', 'Everyone')
    or p_looking_for not in ('Marriage Minded', 'Meaningful Dating', 'Concierge')
    or p_min_age < 18
    or p_max_age > 57
    or p_max_age < p_min_age
    or p_max_distance_km not between 5 and 160
    or p_minimum_trust_score not between 71 and 100 then
    raise exception 'Invalid discovery filters.';
  end if;
  if not exists (
    select 1
    from public.identity_verifications
    where user_id = current_user_id and status = 'approved'
  ) then
    raise exception 'Complete identity verification before discovering profiles.';
  end if;

  select city.latitude, city.longitude
  into viewer_latitude, viewer_longitude
  from public.member_profiles as profile
  join public.supported_cities as city on city.id = profile.city_id
  where profile.user_id = current_user_id;

  if viewer_latitude is null or viewer_longitude is null then
    raise exception 'Choose a supported city in your profile before discovering profiles.';
  end if;

  update public.member_profiles
  set last_active_at = now()
  where user_id = current_user_id;

  return query
  with candidates as (
    select
      profile.user_id as profile_id,
      split_part(trim(profile.full_name), ' ', 1) as first_name,
      extract(year from age(
        current_date,
        public.try_parse_member_birth_date(profile.date_of_birth)
      ))::integer as profile_age,
      case profile.gender
        when 'Female' then 'Women'
        when 'Male' then 'Men'
        else 'Prefer not to say'
      end as profile_gender,
      profile.location as profile_location,
      round(6371 * 2 * asin(sqrt(least(1.0, greatest(0.0,
        power(sin(radians(city.latitude - viewer_latitude) / 2), 2)
        + cos(radians(viewer_latitude)) * cos(radians(city.latitude))
        * power(sin(radians(city.longitude - viewer_longitude) / 2), 2)
      )))))::integer as distance_km,
      case profile.intent
        when 'Marriage-minded' then 'Marriage Minded'
        when 'Meaningful Dating' then 'Meaningful Dating'
        else 'Concierge'
      end as profile_intent,
      coalesce(verification.status = 'approved', false) as is_verified,
      (
        case when verification.status = 'approved' then 40 else 0 end
        + round((
          (case when length(trim(profile.bio)) > 0 then 1 else 0 end)
          + (case when cardinality(profile.photo_paths) >= 3 then 1 else 0 end)
          + (case when length(trim(profile.prompt_answer)) > 0 then 1 else 0 end)
        ) * 40.0 / 3)::integer
        + case when profile.last_active_at >= now() - interval '7 days' then 20 else 0 end
      )::integer as trust_score,
      concat_ws(' ', nullif(trim(profile.prompt), ''), nullif(trim(profile.prompt_answer), '')) as profile_prompt,
      profile.photo_paths as profile_photo_paths,
      profile.last_active_at
    from public.member_profiles as profile
    join public.supported_cities as city on city.id = profile.city_id
    left join public.identity_verifications as verification on verification.user_id = profile.user_id
    where profile.user_id <> current_user_id
      and public.try_parse_member_birth_date(profile.date_of_birth) is not null
      and not exists (
        select 1
        from public.member_discover_actions as action
        where action.member_id = current_user_id
          and action.profile_id = profile.user_id
      )
  ),
  eligible as materialized (
    select *
    from candidates
    where candidates.profile_age between p_min_age and p_max_age
      and candidates.distance_km <= p_max_distance_km
      and candidates.profile_intent = p_looking_for
      and candidates.trust_score >= p_minimum_trust_score
      and (p_show_me = 'Everyone' or candidates.profile_gender = p_show_me)
      and (not p_verified_only or candidates.is_verified)
      and (not p_active_this_week or candidates.last_active_at >= now() - interval '7 days')
    order by md5(current_user_id::text || candidates.profile_id::text)
    limit least(greatest(p_limit, 1), 50)
  ),
  logged as (
    insert into public.member_discover_impressions (member_id, profile_id, seen_at)
    select current_user_id, eligible.profile_id, now()
    from eligible
    on conflict (member_id, profile_id) do update
      set seen_at = excluded.seen_at
    returning profile_id
  )
  select
    eligible.profile_id,
    eligible.first_name,
    eligible.profile_age,
    eligible.profile_gender,
    eligible.profile_location,
    eligible.distance_km,
    eligible.profile_intent,
    eligible.trust_score,
    eligible.is_verified,
    eligible.profile_prompt,
    eligible.profile_photo_paths
  from eligible
  join logged on logged.profile_id = eligible.profile_id
  order by md5(current_user_id::text || eligible.profile_id::text);
end;
$$;

create or replace function public.get_discover_state(p_time_zone text default 'UTC')
returns table (
  used_count integer,
  daily_limit integer,
  can_undo boolean,
  saved_profile_ids uuid[]
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  time_zone_name text := p_time_zone;
  local_today date;
begin
  if current_user_id is null then
    raise exception 'Sign in to view discovery.';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = time_zone_name) then
    raise exception 'Invalid time zone.';
  end if;
  local_today := (now() at time zone time_zone_name)::date;

  return query
  select
    (
      select count(*)::integer
      from public.member_discover_actions as action
      where action.member_id = current_user_id
        and (action.created_at at time zone time_zone_name)::date = local_today
    ),
    15,
    exists (
      select 1
      from public.member_discover_actions as action
      where action.member_id = current_user_id
        and (action.created_at at time zone time_zone_name)::date = local_today
    ),
    coalesce((
      select array_agg(saved.profile_id)
      from public.member_saved_profiles as saved
      where saved.member_id = current_user_id
    ), array[]::uuid[]);
end;
$$;

create or replace function public.record_discover_action(
  p_profile_id uuid,
  p_action text,
  p_time_zone text default 'UTC'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  time_zone_name text := p_time_zone;
  local_today date;
  used_today integer;
begin
  if current_user_id is null then
    raise exception 'Sign in to record an introduction.';
  end if;
  if p_action not in ('like', 'pass') or p_profile_id = current_user_id then
    raise exception 'Invalid introduction action.';
  end if;
  if not exists (
    select 1 from public.member_profiles where user_id = p_profile_id
  ) then
    raise exception 'Profile is no longer available.';
  end if;
  if not exists (
    select 1
    from public.member_discover_impressions as impression
    where impression.member_id = current_user_id
      and impression.profile_id = p_profile_id
      and impression.seen_at >= now() - interval '24 hours'
  ) then
    raise exception 'Profile is no longer available.';
  end if;
  if not exists (
    select 1
    from public.identity_verifications
    where user_id = current_user_id and status = 'approved'
  ) then
    raise exception 'Complete identity verification before discovering profiles.';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = time_zone_name) then
    raise exception 'Invalid time zone.';
  end if;
  perform pg_advisory_xact_lock(hashtext(current_user_id::text));
  local_today := (now() at time zone time_zone_name)::date;

  select count(*)::integer
  into used_today
  from public.member_discover_actions as action
  where action.member_id = current_user_id
    and (action.created_at at time zone time_zone_name)::date = local_today;
  if used_today >= 15 then
    raise exception 'You have used all of today''s introductions.';
  end if;

  insert into public.member_discover_actions (member_id, profile_id, action)
  values (current_user_id, p_profile_id, p_action);

  update public.member_profiles
  set last_active_at = now()
  where user_id = current_user_id;

  return used_today + 1;
end;
$$;

create or replace function public.undo_last_discover_action(p_time_zone text default 'UTC')
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  time_zone_name text := p_time_zone;
  local_today date;
  removed_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in to undo an introduction.';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = time_zone_name) then
    raise exception 'Invalid time zone.';
  end if;
  local_today := (now() at time zone time_zone_name)::date;

  delete from public.member_discover_actions as action
  where action.id = (
    select latest.id
    from public.member_discover_actions as latest
    where latest.member_id = current_user_id
      and (latest.created_at at time zone time_zone_name)::date = local_today
    order by latest.created_at desc
    limit 1
  )
  returning action.id into removed_id;

  return removed_id is not null;
end;
$$;

create or replace function public.toggle_saved_profile(p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  was_removed boolean;
begin
  if current_user_id is null then
    raise exception 'Sign in to save profiles.';
  end if;
  if p_profile_id = current_user_id then
    raise exception 'You cannot save your own profile.';
  end if;
  if not exists (select 1 from public.member_profiles where user_id = p_profile_id) then
    raise exception 'Profile is no longer available.';
  end if;
  if not exists (
    select 1
    from public.member_discover_impressions as impression
    where impression.member_id = current_user_id
      and impression.profile_id = p_profile_id
      and impression.seen_at >= now() - interval '24 hours'
  ) then
    raise exception 'Profile is no longer available.';
  end if;

  perform pg_advisory_xact_lock(hashtext(current_user_id::text));
  delete from public.member_saved_profiles
  where member_id = current_user_id and profile_id = p_profile_id;
  was_removed := found;
  if was_removed then
    return false;
  end if;

  insert into public.member_saved_profiles (member_id, profile_id)
  values (current_user_id, p_profile_id);
  return true;
end;
$$;

revoke all on function public.try_parse_member_birth_date(text) from public, anon, authenticated;
revoke all on function public.get_discover_profiles(text, text, integer, integer, integer, integer, boolean, boolean, integer) from public, anon;
revoke all on function public.get_discover_state(text) from public, anon;
revoke all on function public.record_discover_action(uuid, text, text) from public, anon;
revoke all on function public.undo_last_discover_action(text) from public, anon;
revoke all on function public.toggle_saved_profile(uuid) from public, anon;
grant execute on function public.get_discover_profiles(text, text, integer, integer, integer, integer, boolean, boolean, integer) to authenticated;
grant execute on function public.get_discover_state(text) to authenticated;
grant execute on function public.record_discover_action(uuid, text, text) to authenticated;
grant execute on function public.undo_last_discover_action(text) to authenticated;
grant execute on function public.toggle_saved_profile(uuid) to authenticated;
