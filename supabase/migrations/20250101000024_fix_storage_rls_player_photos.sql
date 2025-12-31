-- Transaction to ensure atomic execution
begin;

-- 1. Allow authenticated uploads (Insert)
drop policy if exists "Allow authenticated uploads to player-photos" on storage.objects;
create policy "Allow authenticated uploads to player-photos"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'player-photos' );

-- 2. Allow authenticated updates (Update)
drop policy if exists "Allow authenticated updates to player-photos" on storage.objects;
create policy "Allow authenticated updates to player-photos"
on storage.objects for update
to authenticated
using ( bucket_id = 'player-photos' );

-- 3. Allow public read access (Select)
drop policy if exists "Allow public read access to player-photos" on storage.objects;
create policy "Allow public read access to player-photos"
on storage.objects for select
to public
using ( bucket_id = 'player-photos' );

commit;
