-- Migration: Create ladder_system_config table
-- This table stores ladder system configuration for tournaments

-- Create ladder_system_config table
CREATE TABLE IF NOT EXISTS ladder_system_config (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    ladder_type VARCHAR(20) DEFAULT 'swiss' CHECK (ladder_type IN ('swiss', 'round_robin', 'elimination', 'hybrid')),
    max_rounds INTEGER DEFAULT 7,
    pairing_method VARCHAR(20) DEFAULT 'swiss' CHECK (pairing_method IN ('swiss', 'random', 'seeded', 'manual')),
    tiebreak_method VARCHAR(20) DEFAULT 'buchholz' CHECK (tiebreak_method IN ('buchholz', 'sonneborn_berger', 'koya', 'custom')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE ladder_system_config IS 'Configuration for tournament ladder system settings';
COMMENT ON COLUMN ladder_system_config.ladder_type IS 'Type of ladder system: swiss, round_robin, elimination, or hybrid';
COMMENT ON COLUMN ladder_system_config.max_rounds IS 'Maximum number of rounds for the tournament';
COMMENT ON COLUMN ladder_system_config.pairing_method IS 'Method used for pairing players';
COMMENT ON COLUMN ladder_system_config.tiebreak_method IS 'Method used for breaking ties in standings';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ladder_system_config_tournament_id ON ladder_system_config(tournament_id);

-- Enable Row Level Security
ALTER TABLE ladder_system_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view ladder system config for tournaments they own" ON ladder_system_config
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM tournaments WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert ladder system config for tournaments they own" ON ladder_system_config
    FOR INSERT WITH CHECK (
        tournament_id IN (
            SELECT id FROM tournaments WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update ladder system config for tournaments they own" ON ladder_system_config
    FOR UPDATE USING (
        tournament_id IN (
            SELECT id FROM tournaments WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete ladder system config for tournaments they own" ON ladder_system_config
    FOR DELETE USING (
        tournament_id IN (
            SELECT id FROM tournaments WHERE user_id = auth.uid()
        )
    );
