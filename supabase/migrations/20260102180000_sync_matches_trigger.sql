-- Migration to sync JSON pairing_schedule to the matches table
-- This allows features like Fantasy Scrabble and Volunteer Entry to work with standard Swiss/RR pairings

-- 1. Ensure we can uniquely identify a match for upsertion
-- We use a combination of tournament, round, and player IDs.
-- Note: BYE matches will have NULL player2_id, so we need to handle that if needed, 
-- but usually we only want to predict/score REAL matches.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_match_per_round') THEN
        ALTER TABLE matches ADD CONSTRAINT unique_match_per_round UNIQUE (tournament_id, round, player1_id, player2_id);
    END IF;
END $$;

-- 2. Trigger function to sync pairings
CREATE OR REPLACE FUNCTION sync_pairing_schedule_to_matches()
RETURNS TRIGGER AS $$
DECLARE
    round_no_text TEXT;
    match_record JSONB;
    p1_id BIGINT;
    p2_id BIGINT;
    r_no INTEGER;
BEGIN
    -- Check if pairing_schedule is null
    IF NEW.pairing_schedule IS NULL THEN
        RETURN NEW;
    END IF;

    -- Loop through all rounds in the schedule
    FOR round_no_text IN SELECT jsonb_object_keys(NEW.pairing_schedule)
    LOOP
        r_no := round_no_text::INTEGER;
        
        -- SYNC LOGIC: Remove existing pending matches for this round before re-inserting
        -- This prevents duplicates if pairings are swapped or edited in the CLI
        DELETE FROM matches 
        WHERE tournament_id = NEW.id 
        AND round = r_no 
        AND status = 'pending';

        -- Process matches for this round
        FOR match_record IN SELECT jsonb_array_elements(NEW.pairing_schedule->round_no_text)
        LOOP
            -- Extract IDs
            p1_id := (match_record->>'player1_id')::BIGINT;
            IF p1_id IS NULL THEN
                 p1_id := (match_record->'player1'->>'player_id')::BIGINT;
            END IF;
            IF p1_id IS NULL THEN
                 p1_id := (match_record->'player1'->>'id')::BIGINT;
            END IF;

            p2_id := (match_record->>'player2_id')::BIGINT;
            IF p2_id IS NULL THEN
                 p2_id := (match_record->'player2'->>'player_id')::BIGINT;
            END IF;
            IF p2_id IS NULL THEN
                 p2_id := (match_record->'player2'->>'id')::BIGINT;
            END IF;

            -- Skip if player1 or player2 (BYE) is missing
            IF p1_id IS NULL OR p2_id IS NULL THEN
                CONTINUE;
            END IF;

            -- Insert the fresh pairing
            INSERT INTO matches (tournament_id, round, player1_id, player2_id, status)
            VALUES (NEW.id, r_no, p1_id, p2_id, 'pending');
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Define the trigger
DROP TRIGGER IF EXISTS trg_sync_pairing_schedule ON tournaments;
CREATE TRIGGER trg_sync_pairing_schedule
AFTER INSERT OR UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION sync_pairing_schedule_to_matches();

-- 4. Initial Sync: Trigger for all existing tournaments to populate matches table
UPDATE tournaments SET name = name WHERE pairing_schedule IS NOT NULL;
