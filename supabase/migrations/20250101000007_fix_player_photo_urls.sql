-- Fix existing player photo URLs that point to non-existent 'player-avatars' bucket
-- This migration updates photo_url values to use the correct 'tournament-photos' bucket

-- First, let's see what we're working with
-- SELECT id, name, photo_url FROM players WHERE photo_url LIKE '%player-avatars%';

-- Update photo URLs from 'player-avatars' to 'tournament-photos'
-- Note: This assumes the photos were stored with the old path structure
-- If you need to preserve the actual file paths, you may need to adjust this

UPDATE players 
SET photo_url = REPLACE(
    photo_url, 
    'player-avatars', 
    'tournament-photos'
)
WHERE photo_url LIKE '%player-avatars%';

-- Alternative approach: If you want to completely reconstruct the URLs
-- This assumes you want to move photos to a more organized structure
-- Uncomment and modify the tournament_id if needed

/*
UPDATE players 
SET photo_url = CASE 
    WHEN photo_url LIKE '%player-avatars%' THEN
        -- Extract the player ID from the old URL and reconstruct
        -- Format: https://your-project.supabase.co/storage/v1/object/tournament-photos/public/{player_id}/{filename}
        CONCAT(
            SPLIT_PART(photo_url, '/storage/v1/object/', 1),
            '/storage/v1/object/tournament-photos/public/',
            SPLIT_PART(photo_url, '/', -2), -- player_id
            '/',
            SPLIT_PART(photo_url, '/', -1)  -- filename
        )
    ELSE photo_url
END
WHERE photo_url LIKE '%player-avatars%';
*/

-- Verify the changes
-- SELECT id, name, photo_url FROM players WHERE photo_url LIKE '%tournament-photos%';

-- If you need to completely remove broken photo URLs (nuclear option)
-- Uncomment this to set all broken URLs to NULL
/*
UPDATE players 
SET photo_url = NULL
WHERE photo_url LIKE '%player-avatars%' 
   OR photo_url LIKE '%xvkrzuatiaercizyblub.supabase.co%';
*/
