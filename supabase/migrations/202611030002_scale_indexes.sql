-- Scale and cost work: indexable ages for discovery, per-recipient Realtime filtering, and history pruning.

-- ---------------------------------------------------------------------------
-- Discovery: store the parsed birth date so age filters can use an index
-- ---------------------------------------------------------------------------
alter table public.member_profiles
  add column if not exists birth_date date;

update public.member_profiles
set birth_date = public.try_parse_member_birth_date(date_of_birth)
where birth_date is null;

create or replace function public.set_member_birth_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.birth_date := public.try_parse_member_birth_date(new.date_of_birth);
  return new;
end;
$$;

drop trigger if exists member_profiles_set_birth_date on public.member_profiles;
create trigger member_profiles_set_birth_date
  before insert or update of date_of_birth on public.member_profiles
  for each row execute function public.set_member_birth_date();

create index if not exists member_profiles_discoverable_idx
  on public.member_profiles (city_id, birth_date)
  where paused_at is null;


-- ---------------------------------------------------------------------------
-- Messages: address each message to its recipient so Realtime can filter per member
-- (Realtime checks row-level security once per subscriber for every insert; a recipient filter lets the
-- server skip everyone else's subscriptions cheaply).
-- ---------------------------------------------------------------------------
alter table public.messages
  add column if not exists recipient_id uuid references auth.users (id) on delete cascade;

update public.messages as message
set recipient_id = case when message.sender_id = mt.user_a then mt.user_b else mt.user_a end
from public.matches as mt
where mt.id = message.match_id and message.recipient_id is null;

alter table public.messages alter column recipient_id set not null;
create index if not exists messages_recipient_unread_idx
  on public.messages (recipient_id) where read_at is null;

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
      extract(year from age(current_date, profile.birth_date))::integer as profile_age,
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
      and city.latitude between viewer_latitude - (p_max_distance_km / 111.0)
                            and viewer_latitude + (p_max_distance_km / 111.0)
    left join public.identity_verifications as verification on verification.user_id = profile.user_id
    where profile.user_id <> current_user_id
      and profile.paused_at is null
      and profile.birth_date is not null
      -- Sargable age window so the (city_id, birth_date) index prunes candidates before any per-row work.
      and profile.birth_date <= (current_date - make_interval(years => p_min_age))::date
      and profile.birth_date > (current_date - make_interval(years => p_max_age + 1))::date
      and not exists (
        select 1
        from public.member_blocks as block
        where (block.blocker_id = current_user_id and block.blocked_id = profile.user_id)
           or (block.blocker_id = profile.user_id and block.blocked_id = current_user_id)
      )
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

create or replace function public.send_message(p_match_id uuid, p_body text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  trimmed_body text := trim(coalesce(p_body, ''));
  new_id bigint;
  other_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in to send messages.';
  end if;
  if length(trimmed_body) not between 1 and 2000 then
    raise exception 'Messages must be between 1 and 2000 characters.';
  end if;
  select case when mt.user_a = current_user_id then mt.user_b else mt.user_a end
  into other_id
  from public.matches as mt
  where mt.id = p_match_id
    and mt.status = 'active'
    and current_user_id in (mt.user_a, mt.user_b);
  if other_id is null then
    raise exception 'This conversation is no longer available.';
  end if;

  perform pg_advisory_xact_lock(hashtext('send_message:' || current_user_id::text));
  if (
    select count(*)
    from public.messages as recent
    where recent.sender_id = current_user_id
      and recent.created_at >= now() - interval '1 minute'
  ) >= 30 then
    raise exception 'You are sending messages too quickly. Please wait a moment.';
  end if;

  insert into public.messages (match_id, sender_id, recipient_id, body)
  values (p_match_id, current_user_id, other_id, trimmed_body)
  returning id into new_id;

  update public.member_profiles set last_active_at = now() where user_id = current_user_id;
  return new_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Housekeeping: keep append-only history tables bounded.
-- Schedule with Supabase Cron (Integrations -> Cron): select public.prune_history();
-- ---------------------------------------------------------------------------
create index if not exists member_discover_impressions_seen_idx
  on public.member_discover_impressions (seen_at);

create or replace function public.prune_history()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.member_discover_impressions where seen_at < now() - interval '30 days';
  delete from public.notifications where created_at < now() - interval '90 days';
$$;

revoke all on function public.prune_history() from public, anon, authenticated;
revoke all on function public.set_member_birth_date() from public, anon, authenticated;
revoke all on function public.get_discover_profiles(text, text, integer, integer, integer, integer, boolean, boolean, integer) from public, anon;
revoke all on function public.send_message(uuid, text) from public, anon;
grant execute on function public.get_discover_profiles(text, text, integer, integer, integer, integer, boolean, boolean, integer) to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;
