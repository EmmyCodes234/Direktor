-- Database Janitor: Cleanup stale states
-- Fixes current_round counters and completes matches with results

-- 1. Mark matches as complete if they have a result
UPDATE matches m
SET status = 'complete'
FROM results r
WHERE (m.status != 'complete') AND (
    r.match_id = m.id OR (
        r.tournament_id = m.tournament_id AND r.round = m.round AND (
            (r.player1_id = m.player1_id AND r.player2_id = m.player2_id) OR
            (r.player1_id = m.player2_id AND r.player2_id = m.player1_id)
        )
    )
);

-- 2. Sync tournaments.current_round with the highest round in matches
-- This ensures that the 'Active Round' filter is accurate
UPDATE tournaments t
SET current_round = (
    SELECT COALESCE(MAX(round), 1) 
    FROM matches 
    WHERE tournament_id = t.id
)
WHERE pairing_schedule IS NOT NULL;

-- 3. Fix the trigger one last time to skip rounds that are fully complete?
-- No, the current trigger is fine, but it should only sync to the LATEST round pairings.
-- Actually, the user might want to see upcoming pairings too.
-- For now, let's just make sure the current_round is correct.
