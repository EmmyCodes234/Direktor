-- Migration: Add forfeit_player and bye_player columns to results table
-- This allows tracking which specific player forfeited or received a bye

-- Add forfeit_player column to track which player forfeited
ALTER TABLE results ADD COLUMN IF NOT EXISTS forfeit_player VARCHAR(20) CHECK (forfeit_player IN ('player1', 'player2'));

-- Add bye_player column to track which player received the bye
ALTER TABLE results ADD COLUMN IF NOT EXISTS bye_player VARCHAR(20) CHECK (bye_player IN ('player1', 'player2'));

-- Add comments for documentation
COMMENT ON COLUMN results.forfeit_player IS 'Which player forfeited: player1 or player2';
COMMENT ON COLUMN results.bye_player IS 'Which player received the bye: player1 or player2';

-- Create index for better performance when querying by match status
CREATE INDEX IF NOT EXISTS idx_results_match_status ON results(is_bye, is_forfeit, forfeit_player, bye_player);
