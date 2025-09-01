-- Migration: Simple table creation without complex RLS
-- This creates the basic tables needed for the tournament dashboard

-- Drop existing tables if they exist
DROP TABLE IF EXISTS carryover_config CASCADE;
DROP TABLE IF EXISTS ladder_system_config CASCADE;

-- Create carryover_config table (simple version)
CREATE TABLE carryover_config (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT false,
    carryover_type VARCHAR(20) DEFAULT 'percentage',
    carryover_value DECIMAL(5,2) DEFAULT 0.00,
    max_carryover INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ladder_system_config table (simple version)
CREATE TABLE ladder_system_config (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT false,
    ladder_type VARCHAR(20) DEFAULT 'swiss',
    max_rounds INTEGER DEFAULT 7,
    pairing_method VARCHAR(20) DEFAULT 'swiss',
    tiebreak_method VARCHAR(20) DEFAULT 'buchholz',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX idx_carryover_config_tournament_id ON carryover_config(tournament_id);
CREATE INDEX idx_ladder_system_config_tournament_id ON ladder_system_config(tournament_id);

-- Enable RLS but with simple policies
ALTER TABLE carryover_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ladder_system_config ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies that allow all operations for now
CREATE POLICY "Allow all operations on carryover_config" ON carryover_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on ladder_system_config" ON ladder_system_config FOR ALL USING (true);
