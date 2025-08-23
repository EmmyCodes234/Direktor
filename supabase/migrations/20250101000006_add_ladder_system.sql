-- Migration: Add Ladder System Mode
-- This system provides multi-division tournament support with promotion/relegation and carry-over

-- Create ladder system configuration table
CREATE TABLE IF NOT EXISTS ladder_system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    is_ladder_mode BOOLEAN DEFAULT FALSE,
    divisions JSONB DEFAULT '[]', -- Array of division objects with name, minRating, maxRating, color
    promotion_rules JSONB DEFAULT '{}', -- Object with topPromote, bottomRelegate, autoPromoteRating, etc.
    carryover_policy carryover_policy DEFAULT 'partial',
    carryover_percentage DECIMAL(5,2) DEFAULT 75,
    spread_cap DECIMAL(10,2) DEFAULT 100,
    show_carryover_in_standings BOOLEAN DEFAULT TRUE,
    season_length INTEGER DEFAULT 8,
    season_transition TEXT DEFAULT 'carryover' CHECK (season_transition IN ('carryover', 'reset', 'partial_reset')),
    rating_system TEXT DEFAULT 'elo' CHECK (rating_system IN ('elo', 'glicko', 'custom')),
    rating_k_factor INTEGER DEFAULT 32,
    rating_floor INTEGER DEFAULT 1000,
    rating_ceiling INTEGER DEFAULT 2500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id)
);

-- Create ladder events table to track promotions/relegations
CREATE TABLE IF NOT EXISTS ladder_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('promotion', 'relegation', 'auto_promotion', 'auto_relegation', 'season_transition')),
    from_division TEXT,
    to_division TEXT,
    reason TEXT, -- 'top_performance', 'bottom_performance', 'rating_threshold', 'manual', 'season_end'
    previous_rating INTEGER,
    new_rating INTEGER,
    carryover_wins DECIMAL(10,2) DEFAULT 0,
    carryover_spread DECIMAL(10,2) DEFAULT 0,
    season_number INTEGER DEFAULT 1,
    round_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create season management table
CREATE TABLE IF NOT EXISTS ladder_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'transitioning')),
    total_rounds INTEGER DEFAULT 8,
    completed_rounds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, season_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ladder_system_config_tournament_id ON ladder_system_config(tournament_id);
CREATE INDEX IF NOT EXISTS idx_ladder_events_tournament_id ON ladder_events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_ladder_events_player_id ON ladder_events(player_id);
CREATE INDEX IF NOT EXISTS idx_ladder_events_created_at ON ladder_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ladder_seasons_tournament_id ON ladder_seasons(tournament_id);
CREATE INDEX IF NOT EXISTS idx_ladder_seasons_status ON ladder_seasons(status);

-- Enable RLS on new tables
ALTER TABLE ladder_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ladder_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ladder_seasons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ladder_system_config
CREATE POLICY "Tournament directors can manage ladder config" ON ladder_system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tournaments t 
            WHERE t.id = ladder_system_config.tournament_id 
            AND t.user_id = auth.uid()
        )
    );

-- Create RLS policies for ladder_events
CREATE POLICY "Tournament directors can view ladder events" ON ladder_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tournaments t 
            WHERE t.id = ladder_events.tournament_id 
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Tournament directors can create ladder events" ON ladder_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments t 
            WHERE t.id = ladder_events.tournament_id 
            AND t.user_id = auth.uid()
        )
    );

-- Create RLS policies for ladder_seasons
CREATE POLICY "Tournament directors can manage ladder seasons" ON ladder_seasons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tournaments t 
            WHERE t.id = ladder_seasons.tournament_id 
            AND t.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ladder_system_config TO authenticated;
GRANT SELECT, INSERT ON ladder_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ladder_seasons TO authenticated;

-- Function to get player's current division based on rating
CREATE OR REPLACE FUNCTION get_player_division(
    p_tournament_id BIGINT,
    p_player_id BIGINT
) RETURNS TEXT AS $$
DECLARE
    v_divisions JSONB;
    v_player_rating INTEGER;
    v_division_name TEXT;
    v_division JSONB;
BEGIN
    -- Get ladder configuration
    SELECT divisions INTO v_divisions
    FROM ladder_system_config
    WHERE tournament_id = p_tournament_id AND is_ladder_mode = TRUE;
    
    IF v_divisions IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get player rating
    SELECT rating INTO v_player_rating
    FROM players
    WHERE id = p_player_id;
    
    IF v_player_rating IS NULL THEN
        v_player_rating := 1500; -- Default rating
    END IF;
    
    -- Find matching division
    FOR v_division IN SELECT * FROM jsonb_array_elements(v_divisions)
    LOOP
        IF v_player_rating >= (v_division->>'minRating')::INTEGER 
           AND v_player_rating <= (v_division->>'maxRating')::INTEGER THEN
            RETURN v_division->>'name';
        END IF;
    END LOOP;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if player should be promoted/relegated
CREATE OR REPLACE FUNCTION check_promotion_relegation(
    p_tournament_id BIGINT,
    p_player_id BIGINT
) RETURNS TABLE(
    should_promote BOOLEAN,
    should_relegate BOOLEAN,
    reason TEXT,
    target_division TEXT
) AS $$
DECLARE
    v_config ladder_system_config%ROWTYPE;
    v_player_division TEXT;
    v_division_index INTEGER;
    v_division_players INTEGER;
    v_player_rank INTEGER;
    v_player_rating INTEGER;
    v_divisions JSONB;
    v_current_division JSONB;
    v_next_division JSONB;
    v_prev_division JSONB;
BEGIN
    -- Get ladder configuration
    SELECT * INTO v_config
    FROM ladder_system_config
    WHERE tournament_id = p_tournament_id AND is_ladder_mode = TRUE;
    
    IF v_config IS NULL THEN
        RETURN;
    END IF;
    
    -- Get player's current division
    v_player_division := get_player_division(p_tournament_id, p_player_id);
    IF v_player_division IS NULL THEN
        RETURN;
    END IF;
    
    -- Get player rating
    SELECT rating INTO v_player_rating
    FROM players
    WHERE id = p_player_id;
    
    IF v_player_rating IS NULL THEN
        v_player_rating := 1500;
    END IF;
    
    -- Find division index
    v_divisions := v_config.divisions;
    FOR i IN 0..jsonb_array_length(v_divisions)-1 LOOP
        IF (v_divisions->i->>'name') = v_player_division THEN
            v_division_index := i;
            EXIT;
        END IF;
    END LOOP;
    
    -- Get current division config
    v_current_division := v_divisions->v_division_index;
    
    -- Check auto-promotion by rating
    IF v_player_rating >= (v_config.promotion_rules->>'autoPromoteRating')::INTEGER THEN
        -- Find next division
        IF v_division_index > 0 THEN
            v_next_division := v_divisions->(v_division_index-1);
            RETURN QUERY SELECT 
                TRUE, FALSE, 'rating_threshold', v_next_division->>'name';
            RETURN;
        END IF;
    END IF;
    
    -- Check auto-relegation by rating
    IF v_player_rating <= (v_config.promotion_rules->>'autoRelegateRating')::INTEGER THEN
        -- Find previous division
        IF v_division_index < jsonb_array_length(v_divisions)-1 THEN
            v_prev_division := v_divisions->(v_division_index+1);
            RETURN QUERY SELECT 
                FALSE, TRUE, 'rating_threshold', v_prev_division->>'name';
            RETURN;
        END IF;
    END IF;
    
    -- Get player rank in current division
    SELECT COUNT(*) + 1 INTO v_player_rank
    FROM tournament_players tp
    JOIN players p ON p.id = tp.player_id
    WHERE tp.tournament_id = p_tournament_id
    AND get_player_division(p_tournament_id, tp.player_id) = v_player_division
    AND (p.rating > v_player_rating OR (p.rating = v_player_rating AND p.id < p_player_id));
    
    -- Get total players in division
    SELECT COUNT(*) INTO v_division_players
    FROM tournament_players tp
    WHERE tp.tournament_id = p_tournament_id
    AND get_player_division(p_tournament_id, tp.player_id) = v_player_division;
    
    -- Check promotion (top performers)
    IF v_division_index > 0 AND v_player_rank <= (v_config.promotion_rules->>'topPromote')::INTEGER THEN
        v_next_division := v_divisions->(v_division_index-1);
        RETURN QUERY SELECT 
            TRUE, FALSE, 'top_performance', v_next_division->>'name';
        RETURN;
    END IF;
    
    -- Check relegation (bottom performers)
    IF v_division_index < jsonb_array_length(v_divisions)-1 
       AND v_player_rank > v_division_players - (v_config.promotion_rules->>'bottomRelegate')::INTEGER THEN
        v_prev_division := v_divisions->(v_division_index+1);
        RETURN QUERY SELECT 
            FALSE, TRUE, 'bottom_performance', v_prev_division->>'name';
        RETURN;
    END IF;
    
    -- No promotion/relegation needed
    RETURN QUERY SELECT FALSE, FALSE, NULL, NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to process automatic promotions/relegations
CREATE OR REPLACE FUNCTION process_ladder_movements(
    p_tournament_id BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_movements_count INTEGER := 0;
    v_player RECORD;
    v_movement RECORD;
    v_config ladder_system_config%ROWTYPE;
BEGIN
    -- Get ladder configuration
    SELECT * INTO v_config
    FROM ladder_system_config
    WHERE tournament_id = p_tournament_id AND is_ladder_mode = TRUE;
    
    IF v_config IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Process each player
    FOR v_player IN 
        SELECT DISTINCT tp.player_id
        FROM tournament_players tp
        WHERE tp.tournament_id = p_tournament_id
    LOOP
        -- Check if player should move
        SELECT * INTO v_movement
        FROM check_promotion_relegation(p_tournament_id, v_player.player_id);
        
        IF v_movement.should_promote OR v_movement.should_relegate THEN
            -- Record the ladder event
            INSERT INTO ladder_events (
                tournament_id,
                player_id,
                event_type,
                from_division,
                to_division,
                reason,
                previous_rating,
                new_rating,
                created_by
            ) VALUES (
                p_tournament_id,
                v_player.player_id,
                CASE 
                    WHEN v_movement.should_promote THEN 'promotion'
                    ELSE 'relegation'
                END,
                get_player_division(p_tournament_id, v_player.player_id),
                v_movement.target_division,
                v_movement.reason,
                (SELECT rating FROM players WHERE id = v_player.player_id),
                (SELECT rating FROM players WHERE id = v_player.player_id),
                auth.uid()
            );
            
            v_movements_count := v_movements_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_movements_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get ladder standings with division information
CREATE OR REPLACE FUNCTION get_ladder_standings(p_tournament_id BIGINT)
RETURNS TABLE(
    player_id BIGINT,
    player_name TEXT,
    rating INTEGER,
    division TEXT,
    division_color TEXT,
    current_wins INTEGER,
    current_losses INTEGER,
    current_ties INTEGER,
    current_spread DECIMAL,
    carryover_wins DECIMAL,
    carryover_spread DECIMAL,
    total_wins DECIMAL,
    total_spread DECIMAL,
    rank_in_division INTEGER,
    promotion_status TEXT,
    games_played INTEGER
) AS $$
DECLARE
    v_config ladder_system_config%ROWTYPE;
    v_divisions JSONB;
    v_division JSONB;
    v_division_name TEXT;
    v_division_color TEXT;
BEGIN
    -- Get ladder configuration
    SELECT * INTO v_config
    FROM ladder_system_config
    WHERE tournament_id = p_tournament_id AND is_ladder_mode = TRUE;
    
    IF v_config IS NULL THEN
        -- Return empty result if not ladder mode
        RETURN;
    END IF;
    
    v_divisions := v_config.divisions;
    
    -- For each division, get standings
    FOR i IN 0..jsonb_array_length(v_divisions)-1 LOOP
        v_division := v_divisions->i;
        v_division_name := v_division->>'name';
        v_division_color := v_division->>'color';
        
        -- Return players in this division
        RETURN QUERY
        SELECT 
            tp.player_id,
            p.name as player_name,
            p.rating,
            v_division_name as division,
            v_division_color as division_color,
            COALESCE(tp.current_wins, 0) as current_wins,
            COALESCE(tp.current_losses, 0) as current_losses,
            COALESCE(tp.current_ties, 0) as current_ties,
            COALESCE(tp.current_spread, 0) as current_spread,
            COALESCE(tp.carryover_wins, 0) as carryover_wins,
            COALESCE(tp.carryover_spread, 0) as carryover_spread,
            COALESCE(tp.total_wins, 0) as total_wins,
            COALESCE(tp.total_spread, 0) as total_spread,
            ROW_NUMBER() OVER (
                PARTITION BY v_division_name
                ORDER BY 
                    COALESCE(tp.total_wins, 0) DESC,
                    COALESCE(tp.total_spread, 0) DESC,
                    p.name
            ) as rank_in_division,
            CASE 
                WHEN ROW_NUMBER() OVER (
                    PARTITION BY v_division_name
                    ORDER BY 
                        COALESCE(tp.total_wins, 0) DESC,
                        COALESCE(tp.total_spread, 0) DESC,
                        p.name
                ) <= (v_config.promotion_rules->>'topPromote')::INTEGER 
                AND i > 0 THEN 'promote'
                WHEN ROW_NUMBER() OVER (
                    PARTITION BY v_division_name
                    ORDER BY 
                        COALESCE(tp.total_wins, 0) DESC,
                        COALESCE(tp.total_spread, 0) DESC,
                        p.name
                ) > COUNT(*) OVER (PARTITION BY v_division_name) - (v_config.promotion_rules->>'bottomRelegate')::INTEGER
                AND i < jsonb_array_length(v_divisions)-1 THEN 'relegate'
                ELSE 'stable'
            END as promotion_status,
            (COALESCE(tp.current_wins, 0) + COALESCE(tp.current_losses, 0) + COALESCE(tp.current_ties, 0)) as games_played
        FROM tournament_players tp
        JOIN players p ON p.id = tp.player_id
        WHERE tp.tournament_id = p_tournament_id
        AND get_player_division(p_tournament_id, tp.player_id) = v_division_name
        ORDER BY v_division_name, rank_in_division;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to start a new season
CREATE OR REPLACE FUNCTION start_new_ladder_season(
    p_tournament_id BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_config ladder_system_config%ROWTYPE;
    v_current_season INTEGER;
    v_new_season_number INTEGER;
BEGIN
    -- Get ladder configuration
    SELECT * INTO v_config
    FROM ladder_system_config
    WHERE tournament_id = p_tournament_id AND is_ladder_mode = TRUE;
    
    IF v_config IS NULL THEN
        RAISE EXCEPTION 'Tournament is not in ladder mode';
    END IF;
    
    -- Get current season number
    SELECT COALESCE(MAX(season_number), 0) INTO v_current_season
    FROM ladder_seasons
    WHERE tournament_id = p_tournament_id;
    
    v_new_season_number := v_current_season + 1;
    
    -- End current season if active
    UPDATE ladder_seasons
    SET 
        end_date = NOW(),
        status = 'completed'
    WHERE tournament_id = p_tournament_id 
    AND status = 'active';
    
    -- Create new season
    INSERT INTO ladder_seasons (
        tournament_id,
        season_number,
        start_date,
        status,
        total_rounds
    ) VALUES (
        p_tournament_id,
        v_new_season_number,
        NOW(),
        'active',
        v_config.season_length
    );
    
    -- Process season transition based on configuration
    IF v_config.season_transition = 'reset' THEN
        -- Reset all player stats
        UPDATE tournament_players
        SET 
            carryover_wins = 0,
            carryover_spread = 0,
            current_wins = 0,
            current_losses = 0,
            current_ties = 0,
            current_spread = 0,
            total_wins = 0,
            total_spread = 0,
            wins = 0,
            losses = 0,
            ties = 0,
            spread = 0
        WHERE tournament_id = p_tournament_id;
    ELSIF v_config.season_transition = 'partial_reset' THEN
        -- Carry over 50% of wins and spread
        UPDATE tournament_players
        SET 
            carryover_wins = ROUND(total_wins * 0.5, 2),
            carryover_spread = ROUND(total_spread * 0.5, 2),
            current_wins = 0,
            current_losses = 0,
            current_ties = 0,
            current_spread = 0,
            total_wins = ROUND(total_wins * 0.5, 2),
            total_spread = ROUND(total_spread * 0.5, 2),
            wins = ROUND(total_wins * 0.5, 2),
            losses = 0,
            ties = 0,
            spread = ROUND(total_spread * 0.5, 2)
        WHERE tournament_id = p_tournament_id;
    END IF;
    
    -- Record season transition event
    INSERT INTO ladder_events (
        tournament_id,
        event_type,
        reason,
        season_number,
        created_by
    ) VALUES (
        p_tournament_id,
        'season_transition',
        'season_end',
        v_new_season_number,
        auth.uid()
    );
    
    RETURN v_new_season_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ladder events when player rating changes
CREATE OR REPLACE FUNCTION update_ladder_on_rating_change()
RETURNS TRIGGER AS $$
DECLARE
    v_tournament_id BIGINT;
    v_old_division TEXT;
    v_new_division TEXT;
BEGIN
    -- Get tournament ID for this player
    SELECT tournament_id INTO v_tournament_id
    FROM tournament_players
    WHERE player_id = NEW.id
    LIMIT 1;
    
    IF v_tournament_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check if tournament is in ladder mode
    IF NOT EXISTS (
        SELECT 1 FROM ladder_system_config 
        WHERE tournament_id = v_tournament_id AND is_ladder_mode = TRUE
    ) THEN
        RETURN NEW;
    END IF;
    
    -- Get old and new divisions
    v_old_division := get_player_division(v_tournament_id, OLD.id);
    v_new_division := get_player_division(v_tournament_id, NEW.id);
    
    -- If division changed, record the event
    IF v_old_division IS NOT NULL AND v_new_division IS NOT NULL AND v_old_division != v_new_division THEN
        INSERT INTO ladder_events (
            tournament_id,
            player_id,
            event_type,
            from_division,
            to_division,
            reason,
            previous_rating,
            new_rating,
            created_by
        ) VALUES (
            v_tournament_id,
            NEW.id,
            CASE 
                WHEN (SELECT minRating FROM jsonb_array_elements(
                    (SELECT divisions FROM ladder_system_config WHERE tournament_id = v_tournament_id)
                ) WHERE value->>'name' = v_new_division)::INTEGER >
                     (SELECT minRating FROM jsonb_array_elements(
                    (SELECT divisions FROM ladder_system_config WHERE tournament_id = v_tournament_id)
                ) WHERE value->>'name' = v_old_division)::INTEGER
                THEN 'auto_promotion'
                ELSE 'auto_relegation'
            END,
            v_old_division,
            v_new_division,
            'rating_change',
            OLD.rating,
            NEW.rating,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating changes
DROP TRIGGER IF EXISTS trigger_ladder_rating_change ON players;
CREATE TRIGGER trigger_ladder_rating_change
    AFTER UPDATE OF rating ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_ladder_on_rating_change();

-- Initialize ladder system config for existing tournaments (optional)
-- This can be run manually if needed
-- INSERT INTO ladder_system_config (tournament_id, is_ladder_mode, divisions, promotion_rules)
-- SELECT id, FALSE, '[]', '{}' FROM tournaments WHERE id NOT IN (SELECT tournament_id FROM ladder_system_config);
