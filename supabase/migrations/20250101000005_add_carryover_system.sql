-- Migration: Add Carry-Over System for Player Promotions/Demotions
-- This system allows configurable carry-over of wins and spread when players move between groups/divisions

-- Create enum for carry-over policies
CREATE TYPE carryover_policy AS ENUM ('none', 'full', 'partial', 'capped', 'seedingOnly');

-- Create carry-over configuration table
CREATE TABLE IF NOT EXISTS carryover_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    policy carryover_policy NOT NULL DEFAULT 'none',
    percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100), -- For partial policy
    spread_cap DECIMAL(10,2) CHECK (spread_cap >= 0), -- For capped policy
    show_carryover_in_standings BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id)
);

-- Create promotion events table to track player movements
CREATE TABLE IF NOT EXISTS promotion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    from_group_id BIGINT, -- Can be NULL for initial placement
    to_group_id BIGINT NOT NULL,
    event_type TEXT CHECK (event_type IN ('promotion', 'demotion', 'initial_placement')),
    carryover_wins DECIMAL(10,2) DEFAULT 0,
    carryover_spread DECIMAL(10,2) DEFAULT 0,
    applied_policy carryover_policy NOT NULL,
    policy_config JSONB DEFAULT '{}', -- Store specific policy parameters
    previous_wins INTEGER DEFAULT 0,
    previous_losses INTEGER DEFAULT 0,
    previous_ties INTEGER DEFAULT 0,
    previous_spread DECIMAL(10,2) DEFAULT 0,
    previous_games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add carry-over fields to tournament_players table
ALTER TABLE tournament_players 
ADD COLUMN IF NOT EXISTS carryover_wins DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS carryover_spread DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_ties INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_spread DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_wins DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spread DECIMAL(10,2) DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_carryover_config_tournament_id ON carryover_config(tournament_id);
CREATE INDEX IF NOT EXISTS idx_promotion_events_tournament_id ON promotion_events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_promotion_events_player_id ON promotion_events(player_id);
CREATE INDEX IF NOT EXISTS idx_promotion_events_created_at ON promotion_events(created_at);
CREATE INDEX IF NOT EXISTS idx_tournament_players_carryover ON tournament_players(carryover_wins, carryover_spread);

-- Enable RLS on new tables
ALTER TABLE carryover_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for carryover_config
CREATE POLICY "Tournament directors can manage carryover config" ON carryover_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tournaments t 
            WHERE t.id = carryover_config.tournament_id 
            AND t.user_id = auth.uid()
        )
    );

-- Create RLS policies for promotion_events
CREATE POLICY "Tournament directors can view promotion events" ON promotion_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tournaments t 
            WHERE t.id = promotion_events.tournament_id 
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Tournament directors can create promotion events" ON promotion_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments t 
            WHERE t.id = promotion_events.tournament_id 
            AND t.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON carryover_config TO authenticated;
GRANT SELECT, INSERT ON promotion_events TO authenticated;

-- Function to calculate carry-over values based on policy
CREATE OR REPLACE FUNCTION calculate_carryover(
    p_policy carryover_policy,
    p_percentage DECIMAL DEFAULT NULL,
    p_spread_cap DECIMAL DEFAULT NULL,
    p_wins INTEGER DEFAULT 0,
    p_losses INTEGER DEFAULT 0,
    p_ties INTEGER DEFAULT 0,
    p_spread DECIMAL DEFAULT 0,
    p_games_played INTEGER DEFAULT 0
) RETURNS TABLE(carryover_wins DECIMAL, carryover_spread DECIMAL) AS $$
BEGIN
    CASE p_policy
        WHEN 'none' THEN
            RETURN QUERY SELECT 0::DECIMAL, 0::DECIMAL;
        
        WHEN 'full' THEN
            RETURN QUERY SELECT p_wins::DECIMAL, p_spread::DECIMAL;
        
        WHEN 'partial' THEN
            IF p_percentage IS NULL THEN
                RAISE EXCEPTION 'Percentage required for partial carry-over policy';
            END IF;
            RETURN QUERY 
            SELECT 
                ROUND((p_wins * p_percentage / 100)::DECIMAL, 2),
                ROUND((p_spread * p_percentage / 100)::DECIMAL, 2);
        
        WHEN 'capped' THEN
            IF p_spread_cap IS NULL THEN
                RAISE EXCEPTION 'Spread cap required for capped carry-over policy';
            END IF;
            RETURN QUERY 
            SELECT 
                p_wins::DECIMAL,
                LEAST(p_spread, p_spread_cap * p_games_played)::DECIMAL;
        
        WHEN 'seedingOnly' THEN
            RETURN QUERY SELECT p_wins::DECIMAL, p_spread::DECIMAL;
        
        ELSE
            RAISE EXCEPTION 'Unknown carry-over policy: %', p_policy;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to apply carry-over to a player
CREATE OR REPLACE FUNCTION apply_carryover_to_player(
    p_tournament_id BIGINT,
    p_player_id BIGINT,
    p_to_group_id BIGINT,
    p_event_type TEXT DEFAULT 'promotion'
) RETURNS UUID AS $$
DECLARE
    v_config carryover_config%ROWTYPE;
    v_player tournament_players%ROWTYPE;
    v_carryover_wins DECIMAL;
    v_carryover_spread DECIMAL;
    v_promotion_event_id UUID;
    v_games_played INTEGER;
BEGIN
    -- Get carry-over configuration
    SELECT * INTO v_config 
    FROM carryover_config 
    WHERE tournament_id = p_tournament_id;
    
    IF NOT FOUND THEN
        -- Create default config if none exists
        INSERT INTO carryover_config (tournament_id, policy)
        VALUES (p_tournament_id, 'none')
        RETURNING * INTO v_config;
    END IF;
    
    -- Get current player stats
    SELECT * INTO v_player 
    FROM tournament_players 
    WHERE tournament_id = p_tournament_id AND player_id = p_player_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Player not found in tournament';
    END IF;
    
    -- Calculate games played
    v_games_played := COALESCE(v_player.wins, 0) + COALESCE(v_player.losses, 0) + COALESCE(v_player.ties, 0);
    
    -- Calculate carry-over values
    SELECT carryover_wins, carryover_spread INTO v_carryover_wins, v_carryover_spread
    FROM calculate_carryover(
        v_config.policy,
        v_config.percentage,
        v_config.spread_cap,
        COALESCE(v_player.wins, 0),
        COALESCE(v_player.losses, 0),
        COALESCE(v_player.ties, 0),
        COALESCE(v_player.spread, 0),
        v_games_played
    );
    
    -- Create promotion event record
    INSERT INTO promotion_events (
        tournament_id,
        player_id,
        from_group_id,
        to_group_id,
        event_type,
        carryover_wins,
        carryover_spread,
        applied_policy,
        policy_config,
        previous_wins,
        previous_losses,
        previous_ties,
        previous_spread,
        previous_games_played,
        created_by
    ) VALUES (
        p_tournament_id,
        p_player_id,
        v_player.group_id,
        p_to_group_id,
        p_event_type,
        v_carryover_wins,
        v_carryover_spread,
        v_config.policy,
        jsonb_build_object(
            'percentage', v_config.percentage,
            'spread_cap', v_config.spread_cap
        ),
        COALESCE(v_player.wins, 0),
        COALESCE(v_player.losses, 0),
        COALESCE(v_player.ties, 0),
        COALESCE(v_player.spread, 0),
        v_games_played,
        auth.uid()
    ) RETURNING id INTO v_promotion_event_id;
    
    -- Update player stats with carry-over
    UPDATE tournament_players 
    SET 
        group_id = p_to_group_id,
        carryover_wins = v_carryover_wins,
        carryover_spread = v_carryover_spread,
        current_wins = 0,
        current_losses = 0,
        current_ties = 0,
        current_spread = 0,
        total_wins = CASE 
            WHEN v_config.policy = 'seedingOnly' THEN 0 
            ELSE v_carryover_wins 
        END,
        total_spread = CASE 
            WHEN v_config.policy = 'seedingOnly' THEN 0 
            ELSE v_carryover_spread 
        END,
        wins = CASE 
            WHEN v_config.policy = 'seedingOnly' THEN 0 
            ELSE v_carryover_wins 
        END,
        losses = 0,
        ties = 0,
        spread = CASE 
            WHEN v_config.policy = 'seedingOnly' THEN 0 
            ELSE v_carryover_spread 
        END
    WHERE tournament_id = p_tournament_id AND player_id = p_player_id;
    
    RETURN v_promotion_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update total standings when current stats change
CREATE OR REPLACE FUNCTION update_player_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_config carryover_config%ROWTYPE;
BEGIN
    -- Get carry-over configuration
    SELECT * INTO v_config 
    FROM carryover_config 
    WHERE tournament_id = NEW.tournament_id;
    
    IF NOT FOUND THEN
        -- No carry-over config, use simple totals
        NEW.total_wins := COALESCE(NEW.current_wins, 0) + COALESCE(NEW.carryover_wins, 0);
        NEW.total_spread := COALESCE(NEW.current_spread, 0) + COALESCE(NEW.carryover_spread, 0);
        NEW.wins := NEW.total_wins;
        NEW.spread := NEW.total_spread;
        RETURN NEW;
    END IF;
    
    -- Calculate totals based on policy
    IF v_config.policy = 'seedingOnly' THEN
        -- For seedingOnly, totals are just current values
        NEW.total_wins := COALESCE(NEW.current_wins, 0);
        NEW.total_spread := COALESCE(NEW.current_spread, 0);
        NEW.wins := NEW.total_wins;
        NEW.spread := NEW.total_spread;
    ELSE
        -- For other policies, add carry-over to current
        NEW.total_wins := COALESCE(NEW.current_wins, 0) + COALESCE(NEW.carryover_wins, 0);
        NEW.total_spread := COALESCE(NEW.current_spread, 0) + COALESCE(NEW.carryover_spread, 0);
        NEW.wins := NEW.total_wins;
        NEW.spread := NEW.total_spread;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update totals
DROP TRIGGER IF EXISTS trigger_update_player_totals ON tournament_players;
CREATE TRIGGER trigger_update_player_totals
    BEFORE UPDATE ON tournament_players
    FOR EACH ROW
    EXECUTE FUNCTION update_player_totals();

-- Function to get player standings with carry-over information
CREATE OR REPLACE FUNCTION get_player_standings_with_carryover(p_tournament_id BIGINT)
RETURNS TABLE(
    player_id BIGINT,
    player_name TEXT,
    group_id BIGINT,
    carryover_wins DECIMAL,
    carryover_spread DECIMAL,
    current_wins INTEGER,
    current_losses INTEGER,
    current_ties INTEGER,
    current_spread DECIMAL,
    total_wins DECIMAL,
    total_spread DECIMAL,
    games_played INTEGER,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tp.player_id,
        p.name as player_name,
        tp.group_id,
        COALESCE(tp.carryover_wins, 0) as carryover_wins,
        COALESCE(tp.carryover_spread, 0) as carryover_spread,
        COALESCE(tp.current_wins, 0) as current_wins,
        COALESCE(tp.current_losses, 0) as current_losses,
        COALESCE(tp.current_ties, 0) as current_ties,
        COALESCE(tp.current_spread, 0) as current_spread,
        COALESCE(tp.total_wins, 0) as total_wins,
        COALESCE(tp.total_spread, 0) as total_spread,
        (COALESCE(tp.current_wins, 0) + COALESCE(tp.current_losses, 0) + COALESCE(tp.current_ties, 0)) as games_played,
        ROW_NUMBER() OVER (
            PARTITION BY tp.group_id 
            ORDER BY 
                COALESCE(tp.total_wins, 0) DESC,
                COALESCE(tp.total_spread, 0) DESC,
                p.name
        ) as rank
    FROM tournament_players tp
    JOIN players p ON p.id = tp.player_id
    WHERE tp.tournament_id = p_tournament_id
    ORDER BY tp.group_id, rank;
END;
$$ LANGUAGE plpgsql;

-- Initialize carry-over config for existing tournaments
INSERT INTO carryover_config (tournament_id, policy, show_carryover_in_standings)
SELECT id, 'none', TRUE
FROM tournaments
WHERE id NOT IN (SELECT tournament_id FROM carryover_config);

-- Update existing tournament_players to have proper carry-over fields
UPDATE tournament_players 
SET 
    carryover_wins = 0,
    carryover_spread = 0,
    current_wins = COALESCE(wins, 0),
    current_losses = COALESCE(losses, 0),
    current_ties = COALESCE(ties, 0),
    current_spread = COALESCE(spread, 0),
    total_wins = COALESCE(wins, 0),
    total_spread = COALESCE(spread, 0)
WHERE carryover_wins IS NULL;
