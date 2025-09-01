-- Optional migration: Add is_public column to tournaments table
-- This allows for future public/private tournament functionality

-- Add is_public column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tournaments' 
        AND column_name = 'is_public'
    ) THEN
        ALTER TABLE tournaments ADD COLUMN is_public BOOLEAN DEFAULT true;
        
        -- Update existing tournaments to be public by default
        UPDATE tournaments SET is_public = true WHERE is_public IS NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_tournaments_is_public ON tournaments(is_public);
        
        RAISE NOTICE 'Added is_public column to tournaments table';
    ELSE
        RAISE NOTICE 'is_public column already exists in tournaments table';
    END IF;
END $$;

-- Update the storage policy to use is_public if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tournaments' 
        AND column_name = 'is_public'
    ) THEN
        -- Drop the simplified policy
        DROP POLICY IF EXISTS "Users can view photos for tournaments they own" ON storage.objects;
        
        -- Create the enhanced policy with is_public check
        CREATE POLICY "Users can view photos for tournaments they own" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'tournament-photos' AND
            (
              auth.role() = 'authenticated' AND
              (storage.foldername(name))[1]::bigint IN (
                SELECT id FROM tournaments WHERE user_id = auth.uid()
              )
            ) OR
            -- Allow public access to photos for public tournaments
            (storage.foldername(name))[1]::bigint IN (
              SELECT id FROM tournaments WHERE is_public = true
            )
          );
          
        RAISE NOTICE 'Updated storage policy to use is_public column';
    END IF;
END $$;
