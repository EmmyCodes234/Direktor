-- Update existing tournaments that use 'lito' pairing system to 'enhanced_swiss'
UPDATE tournaments 
SET pairing_system = 'enhanced_swiss' 
WHERE pairing_system = 'lito';

-- Update advanced pairing modes that use 'lito' to 'enhanced_swiss'
UPDATE tournaments 
SET advanced_pairing_modes = jsonb_set(
    advanced_pairing_modes,
    '{system}',
    '"enhanced_swiss"'
)
WHERE advanced_pairing_modes IS NOT NULL 
AND advanced_pairing_modes::text LIKE '%"lito"%';

-- Function to update tournament_players stats when results change
CREATE OR REPLACE FUNCTION update_tournament_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT case
    IF TG_OP = 'INSERT' THEN
        -- Update player1 stats
        IF NEW.score1 > NEW.score2 THEN
            UPDATE tournament_players 
            SET wins = wins + 1, spread = spread + (NEW.score1 - NEW.score2)
            WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player1_id;
        ELSIF NEW.score2 > NEW.score1 THEN
            UPDATE tournament_players 
            SET losses = losses + 1, spread = spread + (NEW.score1 - NEW.score2)
            WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player1_id;
        ELSE
            UPDATE tournament_players 
            SET ties = ties + 1, spread = spread + (NEW.score1 - NEW.score2)
            WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player1_id;
        END IF;
        
        -- Update player2 stats
        IF NEW.score2 > NEW.score1 THEN
            UPDATE tournament_players 
            SET wins = wins + 1, spread = spread + (NEW.score2 - NEW.score1)
            WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player2_id;
        ELSIF NEW.score1 > NEW.score2 THEN
            UPDATE tournament_players 
            SET losses = losses + 1, spread = spread + (NEW.score2 - NEW.score1)
            WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player2_id;
        ELSE
            UPDATE tournament_players 
            SET ties = ties + 1, spread = spread + (NEW.score2 - NEW.score1)
            WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player2_id;
        END IF;
        
    -- Handle UPDATE case
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only update if scores actually changed
        IF OLD.score1 != NEW.score1 OR OLD.score2 != NEW.score2 THEN
            -- Revert old stats for player1
            IF OLD.score1 > OLD.score2 THEN
                UPDATE tournament_players 
                SET wins = GREATEST(0, wins - 1), spread = spread - (OLD.score1 - OLD.score2)
                WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player1_id;
            ELSIF OLD.score2 > OLD.score1 THEN
                UPDATE tournament_players 
                SET losses = GREATEST(0, losses - 1), spread = spread - (OLD.score1 - OLD.score2)
                WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player1_id;
            ELSE
                UPDATE tournament_players 
                SET ties = GREATEST(0, ties - 1), spread = spread - (OLD.score1 - OLD.score2)
                WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player1_id;
            END IF;
            
            -- Revert old stats for player2
            IF OLD.score2 > OLD.score1 THEN
                UPDATE tournament_players 
                SET wins = GREATEST(0, wins - 1), spread = spread - (OLD.score2 - OLD.score1)
                WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player2_id;
            ELSIF OLD.score1 > OLD.score2 THEN
                UPDATE tournament_players 
                SET losses = GREATEST(0, losses - 1), spread = spread - (OLD.score2 - OLD.score1)
                WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player2_id;
            ELSE
                UPDATE tournament_players 
                SET ties = GREATEST(0, ties - 1), spread = spread - (OLD.score2 - OLD.score1)
                WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player2_id;
            END IF;
            
            -- Apply new stats for player1
            IF NEW.score1 > NEW.score2 THEN
                UPDATE tournament_players 
                SET wins = wins + 1, spread = spread + (NEW.score1 - NEW.score2)
                WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player1_id;
            ELSIF NEW.score2 > NEW.score1 THEN
                UPDATE tournament_players 
                SET losses = losses + 1, spread = spread + (NEW.score1 - NEW.score2)
                WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player1_id;
            ELSE
                UPDATE tournament_players 
                SET ties = ties + 1, spread = spread + (NEW.score1 - NEW.score2)
                WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player1_id;
            END IF;
            
            -- Apply new stats for player2
            IF NEW.score2 > NEW.score1 THEN
                UPDATE tournament_players 
                SET wins = wins + 1, spread = spread + (NEW.score2 - NEW.score1)
                WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player2_id;
            ELSIF NEW.score1 > NEW.score2 THEN
                UPDATE tournament_players 
                SET losses = losses + 1, spread = spread + (NEW.score2 - NEW.score1)
                WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player2_id;
            ELSE
                UPDATE tournament_players 
                SET ties = ties + 1, spread = spread + (NEW.score2 - NEW.score1)
                WHERE tournament_id = NEW.tournament_id AND player_id = NEW.player2_id;
            END IF;
        END IF;
        
    -- Handle DELETE case
    ELSIF TG_OP = 'DELETE' THEN
        -- Revert stats for player1
        IF OLD.score1 > OLD.score2 THEN
            UPDATE tournament_players 
            SET wins = GREATEST(0, wins - 1), spread = spread - (OLD.score1 - OLD.score2)
            WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player1_id;
        ELSIF OLD.score2 > OLD.score1 THEN
            UPDATE tournament_players 
            SET losses = GREATEST(0, losses - 1), spread = spread - (OLD.score1 - OLD.score2)
            WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player1_id;
        ELSE
            UPDATE tournament_players 
            SET ties = GREATEST(0, ties - 1), spread = spread - (OLD.score1 - OLD.score2)
            WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player1_id;
        END IF;
        
        -- Revert stats for player2
        IF OLD.score2 > OLD.score1 THEN
            UPDATE tournament_players 
            SET wins = GREATEST(0, wins - 1), spread = spread - (OLD.score2 - OLD.score1)
            WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player2_id;
        ELSIF OLD.score1 > OLD.score2 THEN
            UPDATE tournament_players 
            SET losses = GREATEST(0, losses - 1), spread = spread - (OLD.score2 - OLD.score1)
            WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player2_id;
        ELSE
            UPDATE tournament_players 
            SET ties = GREATEST(0, ties - 1), spread = spread - (OLD.score2 - OLD.score1)
            WHERE tournament_id = OLD.tournament_id AND player_id = OLD.player2_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update tournament_players stats
DROP TRIGGER IF EXISTS trigger_update_tournament_player_stats ON results;
CREATE TRIGGER trigger_update_tournament_player_stats
    AFTER INSERT OR UPDATE OR DELETE ON results
    FOR EACH ROW
    EXECUTE FUNCTION update_tournament_player_stats();
