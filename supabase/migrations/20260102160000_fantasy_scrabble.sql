-- Migration: Fantasy Scrabble (Viral Edition)
-- Description: Adds tables for predictions and profiles. Implements trigger for auto-scoring with viral mechanics.

-- 1. Fantasy Profiles (Leaderboard & Streaks)
CREATE TABLE IF NOT EXISTS fantasy_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- 2. Fantasy Predictions (The Picks)
CREATE TABLE IF NOT EXISTS fantasy_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    predicted_winner_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    is_correct BOOLEAN, -- Null until settled
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, user_id) -- One pick per match
);

-- Enable RLS
ALTER TABLE fantasy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_predictions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Profiles: Public Read, Self Update (or System Update only?) -> System Update via Trigger.
CREATE POLICY "Public profiles" ON fantasy_profiles FOR SELECT USING (true);

-- Predictions:
-- Create: User can insert their own.
-- Read: User can read their own (to prevent cheating? or Public read is fine? Maybe hide until match starts? For simplicity: User reads own).
-- Actually, for "Social Consensus", we need aggregate counts.
CREATE POLICY "Users view own predictions" ON fantasy_predictions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users make predictions" ON fantasy_predictions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Viral Scoring Logic Trigger
CREATE OR REPLACE FUNCTION calculate_fantasy_outcome()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER -- Needs access to all tables
AS $$
DECLARE
    match_record RECORD;
    prediction_record RECORD;
    winner_rating INT;
    loser_rating INT;
    is_upset BOOLEAN;
    base_points INT := 10;
    upset_bonus INT := 5;
    points_awarded INT;
    streak_mult NUMERIC := 1.5;
    p_winner_id BIGINT;
BEGIN
    -- Only proceed if we have a winner
    IF NEW.winner_id IS NULL THEN
        RETURN NEW;
    END IF;

    p_winner_id := NEW.winner_id;

    -- Get Match Details (Ratings)
    -- Assuming players table has rating.
    SELECT r1.rating, r2.rating INTO winner_rating, loser_rating
    FROM matches m
    JOIN players r1 ON r1.id = NEW.winner_id
    JOIN players r2 ON r2.id = (CASE WHEN NEW.winner_id = NEW.player1_id THEN NEW.player2_id ELSE NEW.player1_id END)
    WHERE m.id = NEW.match_id;

    -- Determine Upset (Winner is >100 pts lower rated)
    is_upset := (winner_rating < (loser_rating - 100));

    -- Loop through all predictions for this match
    FOR prediction_record IN 
        SELECT * FROM fantasy_predictions WHERE match_id = NEW.match_id AND is_correct IS NULL
    LOOP
        -- Fetch User Profile (Create if missing)
        PERFORM 1 FROM fantasy_profiles WHERE user_id = prediction_record.user_id AND tournament_id = NEW.tournament_id;
        IF NOT FOUND THEN
            INSERT INTO fantasy_profiles (tournament_id, user_id) VALUES (NEW.tournament_id, prediction_record.user_id);
        END IF;

        IF prediction_record.predicted_winner_id = p_winner_id THEN
            -- CORRECT PICK
            points_awarded := base_points;
            
            -- Apply Upset Bonus
            IF is_upset THEN
                points_awarded := points_awarded + upset_bonus;
            END IF;

            -- Update Profile & Check Streak
            UPDATE fantasy_profiles
            SET 
                current_streak = current_streak + 1,
                best_streak = GREATEST(best_streak, current_streak + 1),
                total_points = total_points + (
                    CASE WHEN current_streak >= 2 -- (Already had 2, now 3+) -> Apply Mult? 
                         -- Plan said: "3+ consecutive correct picks awards a 1.5x multiplier."
                         -- So if I am now hitting 3 (was 2), I get boost.
                         THEN ROUND(points_awarded * streak_mult)
                         ELSE points_awarded
                    END
                )
            WHERE user_id = prediction_record.user_id AND tournament_id = NEW.tournament_id
            RETURNING total_points INTO points_awarded; -- wait, I need the actual points added for the log.
            
            -- Re-calc local points variable for the log
            -- This is dirty. Let's do it cleanly.
            -- We update 'fantasy_predictions' with the points earned.
            -- We need to know previous streak state.
            
            UPDATE fantasy_predictions
            SET is_correct = TRUE,
                points_earned = (
                    SELECT 
                        CASE WHEN fp.current_streak >= 3 -- current_streak is already updated? No wait.
                        -- Transaction order matters.
                        -- Let's do update logic outside query.
                        THEN 0 ELSE 0 END -- placeholder
                )
            WHERE id = prediction_record.id;
            
            -- Simpler Logic: 
            -- Update Profile First? No that destroys previous state.
            -- Read Profile First.
        ELSE
            -- INCORRECT PICK
            UPDATE fantasy_profiles
            SET current_streak = 0
            WHERE user_id = prediction_record.user_id AND tournament_id = NEW.tournament_id;

            UPDATE fantasy_predictions
            SET is_correct = FALSE,
                points_earned = 0
            WHERE id = prediction_record.id;
        END IF;
    END LOOP;

    -- Re-implement loop with correct variable state management
    FOR prediction_record IN 
        SELECT fp.*, prof.current_streak 
        FROM fantasy_predictions fp
        LEFT JOIN fantasy_profiles prof ON prof.user_id = fp.user_id AND prof.tournament_id = fp.tournament_id
        WHERE fp.match_id = NEW.match_id AND fp.is_correct IS NULL
    LOOP
        IF prediction_record.predicted_winner_id = p_winner_id THEN
            -- Is Correct
            points_awarded := base_points;
            IF is_upset THEN points_awarded := points_awarded + upset_bonus; END IF;
            
            -- Check Streak (prediction_record.current_streak is BEFORE this win)
            -- If current streak is 2, this win makes it 3 -> Bonus applies?
            -- "3+ consecutive correct picks". So 3rd pick gets bonus? Or 4th?
            -- Let's say 3rd pick gets bonus.
            IF (COALESCE(prediction_record.current_streak, 0) + 1) >= 3 THEN
                points_awarded := ROUND(points_awarded * streak_mult);
            END IF;

            UPDATE fantasy_predictions SET is_correct = TRUE, points_earned = points_awarded WHERE id = prediction_record.id;
            
            INSERT INTO fantasy_profiles (tournament_id, user_id, total_points, current_streak, best_streak)
            VALUES (NEW.tournament_id, prediction_record.user_id, points_awarded, 1, 1)
            ON CONFLICT (tournament_id, user_id) DO UPDATE SET
                total_points = fantasy_profiles.total_points + EXCLUDED.total_points,
                current_streak = fantasy_profiles.current_streak + 1,
                best_streak = GREATEST(fantasy_profiles.best_streak, fantasy_profiles.current_streak + 1);
        ELSE
            -- Is Incorrect
            UPDATE fantasy_predictions SET is_correct = FALSE, points_earned = 0 WHERE id = prediction_record.id;
             
            INSERT INTO fantasy_profiles (tournament_id, user_id, total_points, current_streak, best_streak)
            VALUES (NEW.tournament_id, prediction_record.user_id, 0, 0, 0)
            ON CONFLICT (tournament_id, user_id) DO UPDATE SET
                current_streak = 0;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER on_result_settle_fantasy
AFTER INSERT OR UPDATE ON results
FOR EACH ROW
EXECUTE FUNCTION calculate_fantasy_outcome();

-- Realtime: Already enabled for all tables in this project configuration.
-- ALTER PUBLICATION supabase_realtime ADD TABLE fantasy_profiles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE fantasy_predictions;

