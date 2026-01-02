-- Removal of Fantasy Scrabble Features
-- Drop tables
DROP TABLE IF EXISTS fantasy_predictions CASCADE;
DROP TABLE IF EXISTS fantasy_profiles CASCADE;

-- Drop trigger and function
DROP TRIGGER IF EXISTS on_result_settle_fantasy ON results;
DROP FUNCTION IF EXISTS calculate_fantasy_outcome();
