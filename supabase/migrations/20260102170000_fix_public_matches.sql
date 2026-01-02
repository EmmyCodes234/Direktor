-- Migration: Fix Public Access to Matches
-- Description: Ensures that public users (anonymous) can read matches.

-- Policy: Public can view matches
-- (Using simplified logic: All matches are viewable. 
-- Realistically might want to limit to 'published' tournaments, but for now open is fine).

DROP POLICY IF EXISTS "Public can view matches" ON matches;

CREATE POLICY "Public can view matches" ON matches
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view players" ON players;
CREATE POLICY "Public can view players" ON players
    FOR SELECT
    USING (true);
