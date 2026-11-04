-- Mutual matches, messaging, notifications, safety (block / report), discovery pause, and contact messages.
-- All writes go through security-definer functions; tables are readable only through row-level security.

alter table public.member_profiles
  add column if not exists paused_at timestamptz;

-- ---------------------------------------------------------------------------
-- Safety
-- ---------------------------------------------------------------------------
create table if not exists public.member_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint member_blocks_not_self check (blocker_id <> blocked_id)
);
create index if not exists member_blocks_blocked_idx on public.member_blocks (blocked_id, blocker_id);
alter table public.member_blocks enable row level security;
revoke all on table public.member_blocks from public, anon, authenticated;

create table if not exists public.member_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('fake_profile', 'harassment', 'inappropriate_content', 'scam', 'underage', 'other')),
  details text not null default '' check (length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint member_reports_not_self check (reporter_id <> reported_id)
);
create index if not exists member_reports_reporter_recent_idx on public.member_reports (reporter_id, created_at desc);
create index if not exists member_reports_status_idx on public.member_reports (status, created_at);
alter table public.member_reports enable row level security;
revoke all on table public.member_reports from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Matches
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'unmatched')),
  created_at timestamptz not null default now(),
  unmatched_at timestamptz,
  constraint matches_ordered check (user_a < user_b),
  constraint matches_pair_unique unique (user_a, user_b)
);
create index if not exists matches_user_b_idx on public.matches (user_b, status);
create index if not exists matches_user_a_idx on public.matches (user_a, status);
alter table public.matches enable row level security;
revoke all on table public.matches from public, anon, authenticated;
grant select on table public.matches to authenticated;

drop policy if exists "Members can read their own matches" on public.matches;
create policy "Members can read their own matches"
  on public.matches for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_match_idx on public.messages (match_id, id desc);
create index if not exists messages_unread_idx on public.messages (match_id, sender_id) where read_at is null;
create index if not exists messages_sender_recent_idx on public.messages (sender_id, created_at desc);
alter table public.messages enable row level security;
revoke all on table public.messages from public, anon, authenticated;
grant select on table public.messages to authenticated;

drop policy if exists "Members can read messages in their active matches" on public.messages;
create policy "Members can read messages in their active matches"
  on public.messages for select to authenticated
  using (
    exists (
      select 1
      from public.matches as mt
      where mt.id = messages.match_id
        and mt.status = 'active'
        and (select auth.uid()) in (mt.user_a, mt.user_b)
    )
  );

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('match', 'verification')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_recent_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
alter table public.notifications enable row level security;
revoke all on table public.notifications from public, anon, authenticated;
grant select on table public.notifications to authenticated;

drop policy if exists "Members can read their own notifications" on public.notifications;
create policy "Members can read their own notifications"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Contact messages (no policies: only the service role and the function below can touch them)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  email text not null check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic text not null check (topic in ('support', 'safety', 'press', 'partnerships', 'other')),
  message text not null check (length(trim(message)) between 10 and 4000),
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_email_recent_idx on public.contact_messages (lower(email), created_at desc);
alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.create_match_on_mutual_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  low_id uuid := least(new.member_id, new.profile_id);
  high_id uuid := greatest(new.member_id, new.profile_id);
  new_match_id uuid;
begin
  if new.action <> 'like' then
    return new;
  end if;

  -- Serialize both directions of a pair so two simultaneous likes cannot miss each other.
  perform pg_advisory_xact_lock(hashtext(low_id::text || ':' || high_id::text));

  if not exists (
    select 1
    from public.member_discover_actions as reciprocal
    where reciprocal.member_id = new.profile_id
      and reciprocal.profile_id = new.member_id
      and reciprocal.action = 'like'
  ) then
    return new;
  end if;

  if exists (
    select 1
    from public.member_blocks as block
    where (block.blocker_id = new.member_id and block.blocked_id = new.profile_id)
       or (block.blocker_id = new.profile_id and block.blocked_id = new.member_id)
  ) then
    return new;
  end if;

  insert into public.matches (user_a, user_b)
  values (low_id, high_id)
  on conflict (user_a, user_b) do nothing
  returning id into new_match_id;

  if new_match_id is not null then
    insert into public.notifications (user_id, type, payload)
    select
      member.user_id,
      'match',
      jsonb_build_object(
        'match_id', new_match_id,
        'name', split_part(trim(other_profile.full_name), ' ', 1)
      )
    from (values (new.member_id, new.profile_id), (new.profile_id, new.member_id)) as member (user_id, other_id)
    join public.member_profiles as other_profile on other_profile.user_id = member.other_id;
  end if;

  return new;
end;
$$;

drop trigger if exists discover_action_creates_match on public.member_discover_actions;
create trigger discover_action_creates_match
  after insert on public.member_discover_actions
  for each row execute function public.create_match_on_mutual_like();

create or replace function public.notify_verification_result()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('approved', 'declined') and new.status is distinct from old.status then
    insert into public.notifications (user_id, type, payload)
    values (new.user_id, 'verification', jsonb_build_object('status', new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists identity_verification_notifies on public.identity_verifications;
create trigger identity_verification_notifies
  after update of status on public.identity_verifications
  for each row execute function public.notify_verification_result();

-- ---------------------------------------------------------------------------
-- Discovery functions: now block-, pause- and match-aware
-- ---------------------------------------------------------------------------
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
      and city.latitude between viewer_latitude - (p_max_distance_km / 111.0)
                            and viewer_latitude + (p_max_distance_km / 111.0)
    left join public.identity_verifications as verification on verification.user_id = profile.user_id
    where profile.user_id <> current_user_id
      and profile.paused_at is null
      and public.try_parse_member_birth_date(profile.date_of_birth) is not null
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
        and not exists (
          select 1 from public.matches as mt
          where mt.user_a = least(action.member_id, action.profile_id)
            and mt.user_b = greatest(action.member_id, action.profile_id)
        )
    ),
    coalesce((
      select array_agg(saved.profile_id)
      from public.member_saved_profiles as saved
      where saved.member_id = current_user_id
    ), array[]::uuid[]);
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
      and not exists (
        select 1 from public.matches as mt
        where mt.user_a = least(latest.member_id, latest.profile_id)
          and mt.user_b = greatest(latest.member_id, latest.profile_id)
      )
    order by latest.created_at desc
    limit 1
  )
  returning action.id into removed_id;

  return removed_id is not null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Conversations, matches and saved profiles
-- ---------------------------------------------------------------------------
create or replace function public.list_conversations()
returns table (
  match_id uuid,
  profile_id uuid,
  name text,
  age integer,
  location text,
  intent text,
  verified boolean,
  photo_paths text[],
  matched_at timestamptz,
  last_message text,
  last_message_at timestamptz,
  last_sender_id uuid,
  unread_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Sign in to view your matches.';
  end if;

  return query
  select
    mt.id,
    other_profile.user_id,
    split_part(trim(other_profile.full_name), ' ', 1),
    extract(year from age(current_date, public.try_parse_member_birth_date(other_profile.date_of_birth)))::integer,
    other_profile.location,
    other_profile.intent,
    coalesce(verification.status = 'approved', false),
    case when verification.status = 'approved' then other_profile.photo_paths else array[]::text[] end,
    mt.created_at,
    latest.body,
    latest.created_at,
    latest.sender_id,
    (
      select count(*)::integer
      from public.messages as unread
      where unread.match_id = mt.id
        and unread.sender_id <> current_user_id
        and unread.read_at is null
    )
  from public.matches as mt
  join public.member_profiles as other_profile
    on other_profile.user_id = case when mt.user_a = current_user_id then mt.user_b else mt.user_a end
  left join public.identity_verifications as verification on verification.user_id = other_profile.user_id
  left join lateral (
    select message.body, message.created_at, message.sender_id
    from public.messages as message
    where message.match_id = mt.id
    order by message.id desc
    limit 1
  ) as latest on true
  where mt.status = 'active'
    and current_user_id in (mt.user_a, mt.user_b)
  order by coalesce(latest.created_at, mt.created_at) desc
  limit 200;
end;
$$;

create or replace function public.get_saved_profiles()
returns table (
  profile_id uuid,
  name text,
  age integer,
  location text,
  intent text,
  verified boolean,
  photo_paths text[],
  saved_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Sign in to view saved profiles.';
  end if;

  return query
  select
    other_profile.user_id,
    split_part(trim(other_profile.full_name), ' ', 1),
    extract(year from age(current_date, public.try_parse_member_birth_date(other_profile.date_of_birth)))::integer,
    other_profile.location,
    other_profile.intent,
    coalesce(verification.status = 'approved', false),
    case when verification.status = 'approved' then other_profile.photo_paths else array[]::text[] end,
    saved.created_at
  from public.member_saved_profiles as saved
  join public.member_profiles as other_profile on other_profile.user_id = saved.profile_id
  left join public.identity_verifications as verification on verification.user_id = other_profile.user_id
  where saved.member_id = current_user_id
    and other_profile.paused_at is null
    and not exists (
      select 1
      from public.member_blocks as block
      where (block.blocker_id = current_user_id and block.blocked_id = saved.profile_id)
         or (block.blocker_id = saved.profile_id and block.blocked_id = current_user_id)
    )
  order by saved.created_at desc
  limit 200;
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
begin
  if current_user_id is null then
    raise exception 'Sign in to send messages.';
  end if;
  if length(trimmed_body) not between 1 and 2000 then
    raise exception 'Messages must be between 1 and 2000 characters.';
  end if;
  if not exists (
    select 1
    from public.matches as mt
    where mt.id = p_match_id
      and mt.status = 'active'
      and current_user_id in (mt.user_a, mt.user_b)
  ) then
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

  insert into public.messages (match_id, sender_id, body)
  values (p_match_id, current_user_id, trimmed_body)
  returning id into new_id;

  update public.member_profiles set last_active_at = now() where user_id = current_user_id;
  return new_id;
end;
$$;

create or replace function public.mark_conversation_read(p_match_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  updated_count integer;
begin
  if current_user_id is null then
    raise exception 'Sign in to read messages.';
  end if;

  update public.messages as message
  set read_at = now()
  where message.match_id = p_match_id
    and message.sender_id <> current_user_id
    and message.read_at is null
    and exists (
      select 1
      from public.matches as mt
      where mt.id = message.match_id
        and current_user_id in (mt.user_a, mt.user_b)
    );
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.mark_notifications_read()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to view notifications.';
  end if;
  update public.notifications
  set read_at = now()
  where user_id = (select auth.uid()) and read_at is null;
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.unmatch_member(p_match_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Sign in to manage matches.';
  end if;
  update public.matches
  set status = 'unmatched', unmatched_at = now()
  where id = p_match_id
    and status = 'active'
    and current_user_id in (user_a, user_b);
  return found;
end;
$$;

create or replace function public.block_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Sign in to block a member.';
  end if;
  if p_member_id is null or p_member_id = current_user_id then
    raise exception 'Invalid member.';
  end if;

  insert into public.member_blocks (blocker_id, blocked_id)
  values (current_user_id, p_member_id)
  on conflict do nothing;

  update public.matches
  set status = 'unmatched', unmatched_at = now()
  where user_a = least(current_user_id, p_member_id)
    and user_b = greatest(current_user_id, p_member_id)
    and status = 'active';

  delete from public.member_saved_profiles
  where (member_id = current_user_id and profile_id = p_member_id)
     or (member_id = p_member_id and profile_id = current_user_id);
end;
$$;

create or replace function public.report_member(p_member_id uuid, p_reason text, p_details text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Sign in to report a member.';
  end if;
  if p_member_id is null or p_member_id = current_user_id then
    raise exception 'Invalid member.';
  end if;
  if p_reason not in ('fake_profile', 'harassment', 'inappropriate_content', 'scam', 'underage', 'other') then
    raise exception 'Choose a reason for your report.';
  end if;
  if not exists (select 1 from public.member_profiles where user_id = p_member_id) then
    raise exception 'Member not found.';
  end if;
  if length(coalesce(p_details, '')) > 1000 then
    raise exception 'Details must be 1000 characters or fewer.';
  end if;

  perform pg_advisory_xact_lock(hashtext('report:' || current_user_id::text));
  if (
    select count(*)
    from public.member_reports as recent
    where recent.reporter_id = current_user_id
      and recent.created_at >= now() - interval '24 hours'
  ) >= 10 then
    raise exception 'You have reached today''s report limit. Contact support if this is urgent.';
  end if;

  insert into public.member_reports (reporter_id, reported_id, reason, details)
  values (current_user_id, p_member_id, p_reason, trim(coalesce(p_details, '')));
end;
$$;

create or replace function public.set_discovery_paused(p_paused boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to change your visibility.';
  end if;
  update public.member_profiles
  set paused_at = case when p_paused then now() else null end
  where user_id = (select auth.uid());
  if not found then
    raise exception 'Complete your profile first.';
  end if;
  return p_paused;
end;
$$;

create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_topic text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
begin
  if length(trim(coalesce(p_name, ''))) not between 1 and 120 then
    raise exception 'Enter your name.';
  end if;
  if normalized_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(normalized_email) > 254 then
    raise exception 'Enter a valid email address.';
  end if;
  if p_topic not in ('support', 'safety', 'press', 'partnerships', 'other') then
    raise exception 'Choose a topic.';
  end if;
  if length(trim(coalesce(p_message, ''))) not between 10 and 4000 then
    raise exception 'Your message must be between 10 and 4000 characters.';
  end if;

  perform pg_advisory_xact_lock(hashtext('contact:' || normalized_email));
  if (
    select count(*)
    from public.contact_messages as recent
    where lower(recent.email) = normalized_email
      and recent.created_at >= now() - interval '1 hour'
  ) >= 3 then
    raise exception 'We already received your messages. Please wait before sending another.';
  end if;

  insert into public.contact_messages (name, email, topic, message, user_id)
  values (trim(p_name), normalized_email, p_topic, trim(p_message), (select auth.uid()));
end;
$$;

create or replace function public.get_onboarding_summary()
returns table (location text, nearby_count integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Sign in to continue.';
  end if;

  return query
  select
    own.location,
    (
      select count(*)::integer
      from public.member_profiles as other_profile
      join public.identity_verifications as verification
        on verification.user_id = other_profile.user_id and verification.status = 'approved'
      where other_profile.city_id = own.city_id
        and other_profile.intent = own.intent
        and other_profile.user_id <> current_user_id
        and other_profile.paused_at is null
    )
  from public.member_profiles as own
  where own.user_id = current_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke all on function public.create_match_on_mutual_like() from public, anon, authenticated;
revoke all on function public.notify_verification_result() from public, anon, authenticated;
revoke all on function public.get_onboarding_summary() from public, anon;
revoke all on function public.list_conversations() from public, anon;
revoke all on function public.get_saved_profiles() from public, anon;
revoke all on function public.send_message(uuid, text) from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
revoke all on function public.mark_notifications_read() from public, anon;
revoke all on function public.unmatch_member(uuid) from public, anon;
revoke all on function public.block_member(uuid) from public, anon;
revoke all on function public.report_member(uuid, text, text) from public, anon;
revoke all on function public.set_discovery_paused(boolean) from public, anon;
revoke all on function public.submit_contact_message(text, text, text, text) from public;
revoke all on function public.get_discover_profiles(text, text, integer, integer, integer, integer, boolean, boolean, integer) from public, anon;
revoke all on function public.get_discover_state(text) from public, anon;
revoke all on function public.undo_last_discover_action(text) from public, anon;

grant execute on function public.get_onboarding_summary() to authenticated;
grant execute on function public.list_conversations() to authenticated;
grant execute on function public.get_saved_profiles() to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.mark_notifications_read() to authenticated;
grant execute on function public.unmatch_member(uuid) to authenticated;
grant execute on function public.block_member(uuid) to authenticated;
grant execute on function public.report_member(uuid, text, text) to authenticated;
grant execute on function public.set_discovery_paused(boolean) to authenticated;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;
grant execute on function public.get_discover_profiles(text, text, integer, integer, integer, integer, boolean, boolean, integer) to authenticated;
grant execute on function public.get_discover_state(text) to authenticated;
grant execute on function public.undo_last_discover_action(text) to authenticated;

-- Realtime: deliver new messages and notifications to the members who may read them (RLS applies).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
      alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end;
$$;
