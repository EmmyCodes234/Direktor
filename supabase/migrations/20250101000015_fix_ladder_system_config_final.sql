-- Migration: Final fix for ladder_system_config table
-- This ensures the table exists and has the correct structure

-- Drop existing table if it exists
DROP TABLE IF EXISTS ladder_system_config CASCADE;

-- Create ladder_system_config table with correct structure
CREATE TABLE ladder_system_config (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT false,
    ladder_type VARCHAR(20) DEFAULT 'swiss',
    max_rounds INTEGER DEFAULT 7,
    pairing_method VARCHAR(20) DEFAULT 'swiss',
    tiebreak_method VARCHAR(20) DEFAULT 'buchholz',
    promotion_threshold INTEGER DEFAULT 3,
    demotion_threshold INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_ladder_system_config_tournament_id ON ladder_system_config(tournament_id);

-- Enable RLS
ALTER TABLE ladder_system_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on ladder_system_config" ON ladder_system_config;
DROP POLICY IF EXISTS "Users can view ladder system config for tournaments they own" ON ladder_system_config;
DROP POLICY IF EXISTS "Users can insert ladder system config for tournaments they own" ON ladder_system_config;
DROP POLICY IF EXISTS "Users can update ladder system config for tournaments they own" ON ladder_system_config;
DROP POLICY IF EXISTS "Users can delete ladder system config for tournaments they own" ON ladder_system_config;

-- Create RLS policies
CREATE POLICY "Users can view ladder system config for tournaments they own" ON ladder_system_config
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM tournaments 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert ladder system config for tournaments they own" ON ladder_system_config
    FOR INSERT WITH CHECK (
        tournament_id IN (
            SELECT id FROM tournaments 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update ladder system config for tournaments they own" ON ladder_system_config
    FOR UPDATE USING (
        tournament_id IN (
            SELECT id FROM tournaments 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete ladder system config for tournaments they own" ON ladder_system_config
    FOR DELETE USING (
        tournament_id IN (
            SELECT id FROM tournaments 
            WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ladder_system_config TO authenticated;
GRANT USAGE ON SEQUENCE ladder_system_config_id_seq TO authenticated;

-- Add comments
COMMENT ON TABLE ladder_system_config IS 'Configuration for tournament ladder system settings';
COMMENT ON COLUMN ladder_system_config.ladder_type IS 'Type of ladder: swiss, round_robin, or elimination';
COMMENT ON COLUMN ladder_system_config.max_rounds IS 'Maximum number of rounds in the tournament';
COMMENT ON COLUMN ladder_system_config.pairing_method IS 'Method for pairing players: swiss, random, or seeded';
COMMENT ON COLUMN ladder_system_config.tiebreak_method IS 'Method for breaking ties: buchholz, sonneborn_berger, or head_to_head';
COMMENT ON COLUMN ladder_system_config.promotion_threshold IS 'Number of wins needed for promotion';
COMMENT ON COLUMN ladder_system_config.demotion_threshold IS 'Number of losses that trigger demotion';
