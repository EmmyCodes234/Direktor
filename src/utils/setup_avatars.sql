-- Enable storage (idempotent)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Drop existing policies to avoid conflicts
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Users can update their own avatar." on storage.objects;

-- Re-create policies

-- 1. Public Read Access
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- 2. Authenticated Upload Access
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- 3. Owner Update/Delete Access
create policy "Users can update their own avatar."
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );

create policy "Users can delete their own avatar."
  on storage.objects for delete
  using ( auth.uid() = owner and bucket_id = 'avatars' );
