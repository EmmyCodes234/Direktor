-- Migration: Fix carryover_config table structure
-- This migration ensures all required columns exist in the carryover_config table

-- First, let's check if the table exists and drop it if it's incomplete
DROP TABLE IF EXISTS carryover_config CASCADE;

-- Recreate the carryover_config table with the correct structure
CREATE TABLE carryover_config (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    carryover_type VARCHAR(20) DEFAULT 'percentage' CHECK (carryover_type IN ('percentage', 'fixed', 'none')),
    carryover_value DECIMAL(5,2) DEFAULT 0.00,
    max_carryover INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE carryover_config IS 'Configuration for tournament carryover settings';
COMMENT ON COLUMN carryover_config.carryover_type IS 'Type of carryover: percentage, fixed, or none';
COMMENT ON COLUMN carryover_config.carryover_value IS 'Value for carryover (percentage or fixed amount)';
COMMENT ON COLUMN carryover_config.max_carryover IS 'Maximum carryover allowed';

-- Create index for better performance
CREATE INDEX idx_carryover_config_tournament_id ON carryover_config(tournament_id);

-- Enable Row Level Security
ALTER TABLE carryover_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view carryover config for tournaments they own" ON carryover_config
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM tournaments WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert carryover config for tournaments they own" ON carryover_config
    FOR INSERT WITH CHECK (
        tournament_id IN (
            SELECT id FROM tournaments WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update carryover config for tournaments they own" ON carryover_config
    FOR UPDATE USING (
        tournament_id IN (
            SELECT id FROM tournaments WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete carryover config for tournaments they own" ON carryover_config
    FOR DELETE USING (
        tournament_id IN (
            SELECT id FROM tournaments WHERE user_id = auth.uid()
        )
    );
