-- Operational limits live in the database instead of being repeated in function bodies.
-- Change a limit with: update public.app_settings set value = to_jsonb(20) where key = 'daily_introductions';

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  description text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
revoke all on table public.app_settings from public, anon, authenticated;

insert into public.app_settings (key, value, description) values
  ('daily_introductions', to_jsonb(15), 'Likes and passes each member can record per local day.'),
  ('max_messages_per_minute', to_jsonb(30), 'Messages one member can send per minute.'),
  ('max_reports_per_day', to_jsonb(10), 'Reports one member can file per 24 hours.'),
  ('max_contact_messages_per_hour', to_jsonb(3), 'Contact form messages accepted per email per hour.')
on conflict (key) do nothing;

create or replace function public.get_setting_int(p_key text)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  setting_value integer;
begin
  select (value #>> '{}')::integer into setting_value from public.app_settings where key = p_key;
  if setting_value is null then
    raise exception 'Missing app setting: %', p_key;
  end if;
  return setting_value;
end;
$$;

revoke all on function public.get_setting_int(text) from public, anon, authenticated;

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
    public.get_setting_int('daily_introductions'),
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
  if used_today >= public.get_setting_int('daily_introductions') then
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
  ) >= public.get_setting_int('max_messages_per_minute') then
    raise exception 'You are sending messages too quickly. Please wait a moment.';
  end if;

  insert into public.messages (match_id, sender_id, recipient_id, body)
  values (p_match_id, current_user_id, other_id, trimmed_body)
  returning id into new_id;

  update public.member_profiles set last_active_at = now() where user_id = current_user_id;
  return new_id;
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
  ) >= public.get_setting_int('max_reports_per_day') then
    raise exception 'You have reached today''s report limit. Contact support if this is urgent.';
  end if;

  insert into public.member_reports (reporter_id, reported_id, reason, details)
  values (current_user_id, p_member_id, p_reason, trim(coalesce(p_details, '')));
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
  ) >= public.get_setting_int('max_contact_messages_per_hour') then
    raise exception 'We already received your messages. Please wait before sending another.';
  end if;

  insert into public.contact_messages (name, email, topic, message, user_id)
  values (trim(p_name), normalized_email, p_topic, trim(p_message), (select auth.uid()));
end;
$$;

revoke all on function public.get_discover_state(text) from public, anon;
revoke all on function public.record_discover_action(uuid, text, text) from public, anon;
revoke all on function public.send_message(uuid, text) from public, anon;
revoke all on function public.report_member(uuid, text, text) from public, anon;
revoke all on function public.submit_contact_message(text, text, text, text) from public;
grant execute on function public.get_discover_state(text) to authenticated;
grant execute on function public.record_discover_action(uuid, text, text) to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;
grant execute on function public.report_member(uuid, text, text) to authenticated;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;
