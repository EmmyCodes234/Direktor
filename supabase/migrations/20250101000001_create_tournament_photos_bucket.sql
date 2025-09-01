-- Create storage bucket for tournament photos with better security
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tournament-photos',
  'tournament-photos',
  false, -- Changed to false for better security
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload photos for tournaments they own" ON storage.objects;
DROP POLICY IF EXISTS "Users can view photos for tournaments they own" ON storage.objects;
DROP POLICY IF EXISTS "Users can update photos for tournaments they own" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos for tournaments they own" ON storage.objects;
DROP POLICY IF EXISTS "Public can view tournament photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete photos" ON storage.objects;

-- Create secure storage policies
CREATE POLICY "Users can upload photos for tournaments they own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tournament-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1]::bigint IN (
      SELECT id FROM tournaments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view photos for tournaments they own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tournament-photos' AND
    (
      auth.role() = 'authenticated' AND
      (storage.foldername(name))[1]::bigint IN (
        SELECT id FROM tournaments WHERE user_id = auth.uid()
      )
    ) OR
    -- Allow public access to photos (all tournaments are considered public)
    bucket_id = 'tournament-photos'
  );

CREATE POLICY "Users can update photos for tournaments they own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tournament-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1]::bigint IN (
      SELECT id FROM tournaments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos for tournaments they own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tournament-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1]::bigint IN (
      SELECT id FROM tournaments WHERE user_id = auth.uid()
    )
  );

-- Create function to clean up orphaned photos
CREATE OR REPLACE FUNCTION cleanup_orphaned_photos()
RETURNS void AS $$
BEGIN
  -- Delete photos for tournaments that no longer exist
  DELETE FROM player_photos 
  WHERE tournament_id NOT IN (SELECT id FROM tournaments);
  
  -- Delete photos for players that no longer exist
  DELETE FROM player_photos 
  WHERE player_id NOT IN (SELECT id FROM players);
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up orphaned photos (optional)
-- SELECT cron.schedule('cleanup-orphaned-photos', '0 2 * * *', 'SELECT cleanup_orphaned_photos();');
