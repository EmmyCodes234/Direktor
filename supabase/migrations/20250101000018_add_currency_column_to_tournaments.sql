-- Migration: Add currency column to tournaments table
-- This migration specifically adds the currency column to existing tournaments tables

-- Add currency column to tournaments table if it doesn't exist
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT '$';

-- Add a comment for documentation
COMMENT ON COLUMN tournaments.currency IS 'Currency symbol or code for tournament prize values';

-- Update any existing tournaments to have the default currency if null
UPDATE tournaments 
SET currency = '$' 
WHERE currency IS NULL;

-- Create index for better performance (if needed)
-- CREATE INDEX IF NOT EXISTS idx_tournaments_currency ON tournaments(currency);