alter table public.member_profiles
  add column if not exists photo_paths text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-profile-photos',
  'member-profile-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can read their own profile photos" on storage.objects;
create policy "Members can read their own profile photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'member-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Members can upload their own profile photos" on storage.objects;
create policy "Members can upload their own profile photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'member-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Members can update their own profile photos" on storage.objects;
create policy "Members can update their own profile photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'member-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'member-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Members can delete their own profile photos" on storage.objects;
create policy "Members can delete their own profile photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'member-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
