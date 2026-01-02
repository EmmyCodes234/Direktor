-- Fix Fantasy Trigger: Use Scores instead of winner_id
-- The results table uses score1/score2 to determine the winner.

CREATE OR REPLACE FUNCTION calculate_fantasy_outcome()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
    prediction_record RECORD;
    winner_rating INT;
    loser_rating INT;
    is_upset BOOLEAN;
    base_points INT := 10;
    upset_bonus INT := 5;
    points_awarded INT;
    streak_mult NUMERIC := 1.5;
    p_winner_id BIGINT;
    p_loser_id BIGINT;
BEGIN
    -- 1. Determine Winner from scores
    IF NEW.score1 > NEW.score2 THEN
        p_winner_id := NEW.player1_id;
        p_loser_id := NEW.player2_id;
    ELSIF NEW.score2 > NEW.score1 THEN
        p_winner_id := NEW.player2_id;
        p_loser_id := NEW.player1_id;
    ELSE
        -- Draw or incomplete score
        RETURN NEW;
    END IF;

    -- 2. Get Ratings for Upset Calculation
    SELECT rating INTO winner_rating FROM players WHERE id = p_winner_id;
    SELECT rating INTO loser_rating FROM players WHERE id = p_loser_id;

    -- Determine Upset (Winner is >100 pts lower rated)
    -- We use COALESCE to handle 0 or null ratings safely
    is_upset := (COALESCE(winner_rating, 0) < (COALESCE(loser_rating, 0) - 100));

    -- 3. Loop through all predictions for this match that haven't been settled
    FOR prediction_record IN 
        SELECT fp.*, prof.current_streak 
        FROM fantasy_predictions fp
        LEFT JOIN fantasy_profiles prof ON prof.user_id = fp.user_id AND prof.tournament_id = fp.tournament_id
        WHERE fp.match_id = NEW.match_id AND fp.is_correct IS NULL
    LOOP
        -- Check if profile exists (Create if missing)
        IF NOT EXISTS (SELECT 1 FROM fantasy_profiles WHERE user_id = prediction_record.user_id AND tournament_id = NEW.tournament_id) THEN
            INSERT INTO fantasy_profiles (tournament_id, user_id) VALUES (NEW.tournament_id, prediction_record.user_id);
        END IF;

        IF prediction_record.predicted_winner_id = p_winner_id THEN
            -- CORRECT PICK
            points_awarded := base_points;
            IF is_upset THEN points_awarded := points_awarded + upset_bonus; END IF;
            
            -- Apply Streak Multiplier (If hitting 3rd win or more)
            IF (COALESCE(prediction_record.current_streak, 0) + 1) >= 3 THEN
                points_awarded := ROUND(points_awarded * streak_mult);
            END IF;

            -- Update Prediction
            UPDATE fantasy_predictions 
            SET is_correct = TRUE, points_earned = points_awarded 
            WHERE id = prediction_record.id;
            
            -- Update Profile
            UPDATE fantasy_profiles SET
                total_points = total_points + points_awarded,
                current_streak = current_streak + 1,
                best_streak = GREATEST(best_streak, current_streak + 1)
            WHERE tournament_id = NEW.tournament_id AND user_id = prediction_record.user_id;

        ELSE
            -- INCORRECT PICK
            UPDATE fantasy_predictions 
            SET is_correct = FALSE, points_earned = 0 
            WHERE id = prediction_record.id;
             
            UPDATE fantasy_profiles 
            SET current_streak = 0
            WHERE tournament_id = NEW.tournament_id AND user_id = prediction_record.user_id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;
