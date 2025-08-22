-- Fix tournament logic issues
-- Add missing fields for proper tournament management

-- Add match status tracking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add player status tracking
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMP WITH TIME ZONE;

-- Add result validation fields
ALTER TABLE results ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id);
ALTER TABLE results ADD COLUMN IF NOT EXISTS is_bye BOOLEAN DEFAULT FALSE;
ALTER TABLE results ADD COLUMN IF NOT EXISTS is_forfeit BOOLEAN DEFAULT FALSE;

-- Add tournament configuration fields
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS best_of_value INTEGER DEFAULT 15;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_spread INTEGER;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS round_status JSONB DEFAULT '{}';

-- Add team match tracking
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_tournament_round ON matches(tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_results_match_id ON results(match_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_status ON tournament_players(status);

-- Add constraints for data integrity (using DO block to handle existing constraints)
DO $$
BEGIN
    -- Add score validation constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_valid_scores' AND table_name = 'results') THEN
        ALTER TABLE results ADD CONSTRAINT check_valid_scores 
            CHECK (score1 >= 0 AND score2 >= 0);
    END IF;
    
    -- Add player status constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_valid_status' AND table_name = 'tournament_players') THEN
        ALTER TABLE tournament_players ADD CONSTRAINT check_valid_status 
            CHECK (status IN ('active', 'withdrawn', 'disqualified'));
    END IF;
    
    -- Add match status constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_valid_match_status' AND table_name = 'matches') THEN
        ALTER TABLE matches ADD CONSTRAINT check_valid_match_status 
            CHECK (status IN ('pending', 'in_progress', 'complete', 'cancelled'));
    END IF;
END $$;

-- Update existing data
UPDATE matches SET status = 'complete' WHERE status IS NULL;
UPDATE tournament_players SET status = 'active' WHERE status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN matches.status IS 'Match status: pending, in_progress, complete, cancelled';
COMMENT ON COLUMN tournament_players.status IS 'Player status: active, withdrawn, disqualified';
COMMENT ON COLUMN results.is_bye IS 'Whether this result represents a bye (automatic win)';
COMMENT ON COLUMN results.is_forfeit IS 'Whether this result represents a forfeit';
COMMENT ON COLUMN tournaments.best_of_value IS 'Number of games in a best-of series (default 15)';
COMMENT ON COLUMN tournaments.max_spread IS 'Maximum allowed spread for result validation';
COMMENT ON COLUMN tournaments.current_round IS 'Current round number for the tournament';
COMMENT ON COLUMN tournaments.round_status IS 'JSON object tracking status of each round';
