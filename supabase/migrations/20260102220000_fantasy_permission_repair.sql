-- Fantasy System Repair: Permissions & Links
-- 1. Explicit Grants for all Fantasy tables
GRANT ALL ON fantasy_profiles TO authenticated;
GRANT ALL ON fantasy_predictions TO authenticated;
GRANT ALL ON fantasy_profiles TO service_role;
GRANT ALL ON fantasy_predictions TO service_role;
GRANT SELECT ON fantasy_profiles TO anon;

-- 2. Expand RLS Policies for Predictions (Allow Update/Refind)
DROP POLICY IF EXISTS "Users update own predictions" ON fantasy_predictions;
CREATE POLICY "Users update own predictions" ON fantasy_predictions 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own predictions" ON fantasy_predictions;
CREATE POLICY "Users delete own predictions" ON fantasy_predictions 
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Link existing results to matches (Crucial for scoring!)
-- This fix is needed if scores were submitted before the match_id link was stable
UPDATE results r
SET match_id = m.id
FROM matches m
WHERE (r.match_id IS NULL OR r.match_id::text != m.id::text) -- Handle potential stale UUIDs vs BigInts
AND r.tournament_id = m.tournament_id 
AND r.round = m.round 
AND (
    (r.player1_id = m.player1_id AND r.player2_id = m.player2_id) OR
    (r.player1_id = m.player2_id AND r.player2_id = m.player1_id)
);

-- 4. Retroactive Scoring
-- If results exist but predictions aren't scored, trigger a safe "touch" to settle them
UPDATE results SET score1 = score1 WHERE match_id IS NOT NULL;
