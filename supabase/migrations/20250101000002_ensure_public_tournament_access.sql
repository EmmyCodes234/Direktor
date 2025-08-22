-- Migration to ensure public access to tournaments
-- This allows the public tournament page to access tournament data

-- First, let's check if RLS is enabled and create policies for public access
DO $$
BEGIN
    -- Enable RLS on tournaments table if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournaments' 
        AND policyname = 'Public can view non-draft tournaments'
    ) THEN
        -- Create policy for public access to non-draft tournaments
        CREATE POLICY "Public can view non-draft tournaments" ON tournaments
        FOR SELECT
        TO public
        USING (status != 'draft');
        
        RAISE NOTICE 'Created public access policy for tournaments';
    ELSE
        RAISE NOTICE 'Public access policy already exists for tournaments';
    END IF;
    
    -- Also ensure public access to tournament_players for public pages
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_players' 
        AND policyname = 'Public can view tournament players'
    ) THEN
        CREATE POLICY "Public can view tournament players" ON tournament_players
        FOR SELECT
        TO public
        USING (true);
        
        RAISE NOTICE 'Created public access policy for tournament_players';
    ELSE
        RAISE NOTICE 'Public access policy already exists for tournament_players';
    END IF;
    
    -- Ensure public access to players table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'players' 
        AND policyname = 'Public can view players'
    ) THEN
        CREATE POLICY "Public can view players" ON players
        FOR SELECT
        TO public
        USING (true);
        
        RAISE NOTICE 'Created public access policy for players';
    ELSE
        RAISE NOTICE 'Public access policy already exists for players';
    END IF;
    
    -- Ensure public access to results table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'results' 
        AND policyname = 'Public can view results'
    ) THEN
        CREATE POLICY "Public can view results" ON results
        FOR SELECT
        TO public
        USING (true);
        
        RAISE NOTICE 'Created public access policy for results';
    ELSE
        RAISE NOTICE 'Public access policy already exists for results';
    END IF;
    
    -- Ensure public access to teams table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'teams' 
        AND policyname = 'Public can view teams'
    ) THEN
        CREATE POLICY "Public can view teams" ON teams
        FOR SELECT
        TO public
        USING (true);
        
        RAISE NOTICE 'Created public access policy for teams';
    ELSE
        RAISE NOTICE 'Public access policy already exists for teams';
    END IF;
    
    -- Ensure public access to prizes table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prizes' 
        AND policyname = 'Public can view prizes'
    ) THEN
        CREATE POLICY "Public can view prizes" ON prizes
        FOR SELECT
        TO public
        USING (true);
        
        RAISE NOTICE 'Created public access policy for prizes';
    ELSE
        RAISE NOTICE 'Public access policy already exists for prizes';
    END IF;
    
    -- Ensure public access to matches table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'matches' 
        AND policyname = 'Public can view matches'
    ) THEN
        CREATE POLICY "Public can view matches" ON matches
        FOR SELECT
        TO public
        USING (true);
        
        RAISE NOTICE 'Created public access policy for matches';
    ELSE
        RAISE NOTICE 'Public access policy already exists for matches';
    END IF;
    
    -- Ensure public access to announcements table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'announcements' 
        AND policyname = 'Public can view announcements'
    ) THEN
        CREATE POLICY "Public can view announcements" ON announcements
        FOR SELECT
        TO public
        USING (true);
        
        RAISE NOTICE 'Created public access policy for announcements';
    ELSE
        RAISE NOTICE 'Public access policy already exists for announcements';
    END IF;
    
    -- Ensure public access to player_photos table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'player_photos' 
        AND policyname = 'Public can view player photos'
    ) THEN
        CREATE POLICY "Public can view player photos" ON player_photos
        FOR SELECT
        TO public
        USING (true);
        
        RAISE NOTICE 'Created public access policy for player_photos';
    ELSE
        RAISE NOTICE 'Public access policy already exists for player_photos';
    END IF;
    
END $$;

-- Grant necessary permissions to public role
GRANT SELECT ON tournaments TO public;
GRANT SELECT ON tournament_players TO public;
GRANT SELECT ON players TO public;
GRANT SELECT ON results TO public;
GRANT SELECT ON teams TO public;
GRANT SELECT ON prizes TO public;
GRANT SELECT ON matches TO public;
GRANT SELECT ON announcements TO public;
GRANT SELECT ON player_photos TO public;

-- Ensure RLS is enabled on all relevant tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_photos ENABLE ROW LEVEL SECURITY;
