-- Migration: Add first_name, last_name, and slug to players table
-- This allows for structural name storage and slug based lookups

ALTER TABLE players
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create index on slug for faster lookups if needed (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_players_slug ON players(slug);
