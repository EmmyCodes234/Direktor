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
        UPDATE tournaments 
        SET pairing_schedule = (
            SELECT jsonb_object_agg(round_key, round_value)
            FROM (
                SELECT 
                    key as round_key,
                    jsonb_agg(pairing) as round_value
                FROM tournaments t,
                jsonb_each(t.pairing_schedule) as rounds(key, value),
                jsonb_array_elements(rounds.value) as pairing
                WHERE t.id = p_tournament_id
                AND pairing_schedule IS NOT NULL
                AND (
                    (pairing->>'player1_id')::bigint != p_player_id 
                    AND (pairing->>'player2_id')::bigint != p_player_id
                    AND (pairing->'player1'->>'player_id')::bigint != p_player_id
                    AND (pairing->'player2'->>'player_id')::bigint != p_player_id
                )
                GROUP BY key
            ) filtered_rounds
        )
        WHERE id = p_tournament_id;
        
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
