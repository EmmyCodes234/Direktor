-- Migration: Add banner_path to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS banner_path TEXT;

-- Optional: Set the demo banner for the existing tournament (if it matches known slug/name or just the latest)
-- Validating assumption: User is working on 'akada-scrabble-games-2025' or similar.
-- We'll just add the column for now.
