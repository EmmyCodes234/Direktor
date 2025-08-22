-- Create storage bucket for tournament photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tournament-photos',
  'tournament-photos',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload photos for tournaments they own" ON storage.objects;
DROP POLICY IF EXISTS "Users can view photos for tournaments they own" ON storage.objects;
DROP POLICY IF EXISTS "Users can update photos for tournaments they own" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos for tournaments they own" ON storage.objects;
DROP POLICY IF EXISTS "Public can view tournament photos" ON storage.objects;

-- Create simpler, more permissive storage policies
CREATE POLICY "Allow authenticated users to upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tournament-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to view photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tournament-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to update photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tournament-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to delete photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tournament-photos' AND
    auth.role() = 'authenticated'
  );

-- Allow public read access to tournament photos (for public tournament pages)
CREATE POLICY "Public can view tournament photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tournament-photos'
  );
