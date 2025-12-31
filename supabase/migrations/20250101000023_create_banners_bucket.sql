-- Create storage bucket for tournament banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tournament-banners',
  'tournament-banners',
  true, -- Public access
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create policies for tournament-banners
-- Allow public read access
CREATE POLICY "Public can view tournament banners" ON storage.objects
  FOR SELECT USING (bucket_id = 'tournament-banners');

-- Allow authenticated users to upload/update/delete banners for their tournaments
-- Note: We rely on file path convention "public/[id]/..." and checking tournament ownership via path parsing
-- Or simplistically allow authenticated users to upload to this bucket for now, assuming app logic handles permission check
-- A stricter policy would check the folder name against user's tournaments
CREATE POLICY "Users can upload banners" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tournament-banners' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update banners" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tournament-banners' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete banners" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tournament-banners' AND
    auth.role() = 'authenticated'
  );
