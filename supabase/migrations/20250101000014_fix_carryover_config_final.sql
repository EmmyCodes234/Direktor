-- Migration: Final fix for carryover_config table
-- This ensures the table exists and has the correct structure

-- Drop existing table if it exists
DROP TABLE IF EXISTS carryover_config CASCADE;

-- Create carryover_config table with correct structure
CREATE TABLE carryover_config (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT false,
    carryover_type VARCHAR(20) DEFAULT 'percentage',
    carryover_value DECIMAL(5,2) DEFAULT 0.00,
    max_carryover INTEGER DEFAULT 0,
    show_carryover_in_standings BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_carryover_config_tournament_id ON carryover_config(tournament_id);

-- Enable RLS
ALTER TABLE carryover_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on carryover_config" ON carryover_config;
DROP POLICY IF EXISTS "Users can view carryover config for tournaments they own" ON carryover_config;
DROP POLICY IF EXISTS "Users can insert carryover config for tournaments they own" ON carryover_config;
DROP POLICY IF EXISTS "Users can update carryover config for tournaments they own" ON carryover_config;
DROP POLICY IF EXISTS "Users can delete carryover config for tournaments they own" ON carryover_config;

-- Create RLS policies
CREATE POLICY "Users can view carryover config for tournaments they own" ON carryover_config
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM tournaments 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert carryover config for tournaments they own" ON carryover_config
    FOR INSERT WITH CHECK (
        tournament_id IN (
            SELECT id FROM tournaments 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update carryover config for tournaments they own" ON carryover_config
    FOR UPDATE USING (
        tournament_id IN (
            SELECT id FROM tournaments 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete carryover config for tournaments they own" ON carryover_config
    FOR DELETE USING (
        tournament_id IN (
            SELECT id FROM tournaments 
            WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON carryover_config TO authenticated;
GRANT USAGE ON SEQUENCE carryover_config_id_seq TO authenticated;

-- Add comments
COMMENT ON TABLE carryover_config IS 'Configuration for tournament carryover settings';
COMMENT ON COLUMN carryover_config.carryover_type IS 'Type of carryover: percentage, fixed, or none';
COMMENT ON COLUMN carryover_config.carryover_value IS 'Value for carryover (percentage or fixed amount)';
COMMENT ON COLUMN carryover_config.max_carryover IS 'Maximum carryover allowed';
COMMENT ON COLUMN carryover_config.show_carryover_in_standings IS 'Whether to show carryover in standings display';
