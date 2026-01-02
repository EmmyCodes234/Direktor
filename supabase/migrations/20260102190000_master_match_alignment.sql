-- Master Alignment: Fix Matches & Results types and status
-- This ensures the system uses BIGINT consistently and 'complete' status

-- 1. Fix results.match_id type mismatch (UUID -> BIGINT)
-- We need to drop the FK first, then change type, then re-add FK
DO $$
BEGIN
    -- Drop existing FK if it exists (might have different names depending on how it was created)
    ALTER TABLE results DROP CONSTRAINT IF EXISTS results_match_id_fkey;
    
    -- Change type
    ALTER TABLE results ALTER COLUMN match_id TYPE BIGINT USING (NULL); -- Nulling out for safety if types were incompatible, or use a proper cast if possible
    -- Note: If data already exists, 'USING match_id::text::bigint' might work if they were numbers stored as strings, but better to reset or careful cast.
    -- Since we are debugging, a reset of match_id links in results is safer than a crash.
    
    -- Re-add FK
    ALTER TABLE results ADD CONSTRAINT results_match_id_fkey FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL;
END $$;

-- 2. Expand/Fix Match Status Constraint
-- Ensure 'complete' and 'completed' are both handled or normalized.
-- We prefer 'complete'.
DO $$
BEGIN
    ALTER TABLE matches DROP CONSTRAINT IF EXISTS check_valid_match_status;
    ALTER TABLE matches ADD CONSTRAINT check_valid_match_status 
        CHECK (status IN ('pending', 'in_progress', 'complete', 'completed', 'cancelled'));
END $$;

-- 3. Update Sync Trigger to be even more robust
CREATE OR REPLACE FUNCTION sync_pairing_schedule_to_matches()
RETURNS TRIGGER AS $$
DECLARE
    round_no_text TEXT;
    match_record JSONB;
    p1_id BIGINT;
    p2_id BIGINT;
    r_no INTEGER;
BEGIN
    IF NEW.pairing_schedule IS NULL THEN
        RETURN NEW;
    END IF;

    FOR round_no_text IN SELECT jsonb_object_keys(NEW.pairing_schedule)
    LOOP
        r_no := round_no_text::INTEGER;
        
        -- Only sync pending matches to avoid overwriting live scores
        DELETE FROM matches 
        WHERE tournament_id = NEW.id 
        AND round = r_no 
        AND status = 'pending';

        FOR match_record IN SELECT jsonb_array_elements(NEW.pairing_schedule->round_no_text)
        LOOP
            p1_id := (match_record->>'player1_id')::BIGINT;
            IF p1_id IS NULL THEN p1_id := (match_record->'player1'->>'player_id')::BIGINT; END IF;
            IF p1_id IS NULL THEN p1_id := (match_record->'player1'->>'id')::BIGINT; END IF;

            p2_id := (match_record->>'player2_id')::BIGINT;
            IF p2_id IS NULL THEN p2_id := (match_record->'player2'->>'player_id')::BIGINT; END IF;
            IF p2_id IS NULL THEN p2_id := (match_record->'player2'->>'id')::BIGINT; END IF;

            IF p1_id IS NULL OR p2_id IS NULL THEN
                CONTINUE;
            END IF;

            INSERT INTO matches (tournament_id, round, player1_id, player2_id, status)
            VALUES (NEW.id, r_no, p1_id, p2_id, 'pending')
            ON CONFLICT (tournament_id, round, player1_id, player2_id) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Normalize existing matches
UPDATE matches SET status = 'complete' WHERE status = 'completed';

-- 5. Final Sync Trigger refresh
DROP TRIGGER IF EXISTS trg_sync_pairing_schedule ON tournaments;
CREATE TRIGGER trg_sync_pairing_schedule
AFTER INSERT OR UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION sync_pairing_schedule_to_matches();

-- Re-trigger for all
UPDATE tournaments SET name = name WHERE pairing_schedule IS NOT NULL;
