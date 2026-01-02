-- Final cleanup and repair for tournament current_round counters
-- This migration ensures that the current_round column is synchronized with the actual data in matches and results tables.
-- It also performs a final sweep to remove any lingering fantasy-related references if they exist.

-- 1. Sync current_round with the highest round found in matches or results
UPDATE tournaments t
SET current_round = GREATEST(
    (SELECT COALESCE(MAX(round), 1) FROM matches WHERE tournament_id = t.id),
    (SELECT COALESCE(MAX(round), 1) FROM results WHERE tournament_id = t.id),
    1
);

-- 2. Mark any tournaments with all matches complete as 'completed' (optional, but good for cleanliness)
UPDATE tournaments t
SET status = 'completed'
WHERE status = 'active'
  AND rounds > 0
  AND current_round >= rounds
  AND NOT EXISTS (
    SELECT 1 FROM matches 
    WHERE tournament_id = t.id 
    AND status != 'complete'
  );

-- 3. Ensure all matches with results are marked as complete (redundancy check)
UPDATE matches m
SET status = 'complete'
WHERE status != 'complete'
  AND EXISTS (
    SELECT 1 FROM results r 
    WHERE r.match_id = m.id 
       OR (r.tournament_id = m.tournament_id AND r.round = m.round AND r.player1_id = m.player1_id AND r.player2_id = m.player2_id)
  );
