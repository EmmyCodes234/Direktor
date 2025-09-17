-- Migration: Add stored procedure for safe player removal from tournaments
-- This procedure handles all related data cleanup when a player is removed

CREATE OR REPLACE FUNCTION remove_player_from_tournament(
    p_tournament_id BIGINT,
    p_player_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_schedule JSONB;
    updated_schedule JSONB;
    round_key TEXT;
    round_pairings JSONB;
    filtered_pairings JSONB;
    pairing JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- Step 1: Delete all results involving this player in this tournament
        DELETE FROM results 
        WHERE tournament_id = p_tournament_id 
        AND (player1_id = p_player_id OR player2_id = p_player_id);
        
        -- Step 2: Delete all matches involving this player in this tournament
        DELETE FROM matches 
        WHERE tournament_id = p_tournament_id 
        AND (player1_id = p_player_id OR player2_id = p_player_id);
        
        -- Step 3: Remove player from tournament_players
        DELETE FROM tournament_players 
        WHERE tournament_id = p_tournament_id AND player_id = p_player_id;
        
        -- Step 4: Clean up pairing schedule to remove this player
        -- Get current pairing schedule
        SELECT pairing_schedule INTO current_schedule 
        FROM tournaments 
        WHERE id = p_tournament_id;
        
        -- Only process if pairing_schedule exists and is not null
        IF current_schedule IS NOT NULL AND jsonb_typeof(current_schedule) = 'object' THEN
            updated_schedule := '{}'::jsonb;
            
            -- Process each round
            FOR round_key, round_pairings IN SELECT * FROM jsonb_each(current_schedule)
            LOOP
                filtered_pairings := '[]'::jsonb;
                
                -- Process each pairing in the round
                FOR pairing IN SELECT * FROM jsonb_array_elements(round_pairings)
                LOOP
                    -- Check if this pairing involves the removed player
                    -- Handle both direct player_id format and nested player object format
                    IF NOT (
                        (pairing->>'player1_id')::bigint = p_player_id OR
                        (pairing->>'player2_id')::bigint = p_player_id OR
                        (pairing->'player1'->>'player_id')::bigint = p_player_id OR
                        (pairing->'player2'->>'player_id')::bigint = p_player_id
                    ) THEN
                        -- Keep this pairing
                        filtered_pairings := filtered_pairings || pairing;
                    END IF;
                END LOOP;
                
                -- Only add the round if it has remaining pairings
                IF jsonb_array_length(filtered_pairings) > 0 THEN
                    updated_schedule := updated_schedule || jsonb_build_object(round_key, filtered_pairings);
                END IF;
            END LOOP;
            
            -- Update the tournament with the cleaned pairing schedule
            UPDATE tournaments 
            SET pairing_schedule = updated_schedule
            WHERE id = p_tournament_id;
        END IF;
        
        -- Step 5: Recalculate player stats for remaining players
        -- This will be handled by the existing trigger on results table
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback transaction on any error
            RAISE EXCEPTION 'Failed to remove player from tournament: %', SQLERRM;
    END;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION remove_player_from_tournament IS 'Safely removes a player from a tournament by cleaning up all related data including results, matches, tournament_players, and pairing schedule';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION remove_player_from_tournament TO authenticated;
