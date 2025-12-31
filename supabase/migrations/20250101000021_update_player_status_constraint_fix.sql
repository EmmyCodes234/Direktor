-- Migration: Update player status constraint to include 'paused'

DO $$
BEGIN
    -- Drop the existing constraint
    ALTER TABLE tournament_players DROP CONSTRAINT IF EXISTS check_valid_status;
    
    -- Add the updated constraint including 'paused'
    ALTER TABLE tournament_players ADD CONSTRAINT check_valid_status 
        CHECK (status IN ('active', 'withdrawn', 'disqualified', 'paused'));
END $$;
