-- Stable Match Sync & Auto-Completion
-- This prevents ID recycling and ensures matches disappear from Fantasy when scored

-- 1. Improved Sync Trigger (Preserves IDs)
CREATE OR REPLACE FUNCTION sync_pairing_schedule_to_matches()
RETURNS TRIGGER AS $$
DECLARE
    round_no_text TEXT;
    match_record JSONB;
    p1_id BIGINT;
    p2_id BIGINT;
    r_no INTEGER;
    existing_status VARCHAR(50);
BEGIN
    IF NEW.pairing_schedule IS NULL THEN
        RETURN NEW;
    END IF;

    FOR round_no_text IN SELECT jsonb_object_keys(NEW.pairing_schedule)
    LOOP
        r_no := round_no_text::INTEGER;
        
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

            -- UPSERT: Preserves ID if pairing already exists
            -- We only set status to 'pending' if it doesn't exist yet
            INSERT INTO matches (tournament_id, round, player1_id, player2_id, status)
            VALUES (NEW.id, r_no, p1_id, p2_id, 'pending')
            ON CONFLICT (tournament_id, round, player1_id, player2_id) 
            DO UPDATE SET updated_at = NOW(); 
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. New Trigger: Auto-Complete Match on Result
CREATE OR REPLACE FUNCTION mark_match_as_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.match_id IS NOT NULL THEN
        UPDATE matches 
        SET status = 'complete' 
        WHERE id = NEW.match_id;
    ELSE
        -- Fallback: If match_id isn't provided, try to find it by pairing
        UPDATE matches 
        SET status = 'complete'
        WHERE tournament_id = NEW.tournament_id 
        AND round = NEW.round 
        AND (
            (player1_id = NEW.player1_id AND player2_id = NEW.player2_id) OR
            (player1_id = NEW.player2_id AND player2_id = NEW.player1_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mark_match_complete ON results;
CREATE TRIGGER trg_mark_match_complete
AFTER INSERT ON results
FOR EACH ROW
EXECUTE FUNCTION mark_match_as_complete();

-- 3. Cleanup: Existing Results should complete their matches
UPDATE matches m
SET status = 'complete'
FROM results r
WHERE r.match_id = m.id OR (
    r.tournament_id = m.tournament_id AND r.round = m.round AND (
        (r.player1_id = m.player1_id AND r.player2_id = m.player2_id) OR
        (r.player1_id = m.player2_id AND r.player2_id = m.player1_id)
    )
);

-- 4. Initial Sync Trigger refresh
DROP TRIGGER IF EXISTS trg_sync_pairing_schedule ON tournaments;
CREATE TRIGGER trg_sync_pairing_schedule
AFTER INSERT OR UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION sync_pairing_schedule_to_matches();

-- Re-trigger for all
UPDATE tournaments SET name = name WHERE pairing_schedule IS NOT NULL;
