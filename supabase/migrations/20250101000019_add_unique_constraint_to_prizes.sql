-- Migration: Add unique constraint to prizes table to prevent duplicate ranks
-- This migration handles existing duplicates and adds a unique constraint on (tournament_id, rank) combination

-- First, identify and remove duplicate prizes, keeping only the first one inserted
DELETE FROM prizes
WHERE id NOT IN (
    SELECT MIN(id)
    FROM prizes
    GROUP BY tournament_id, rank
);

-- Add unique constraint to prevent duplicate ranks within the same tournament
ALTER TABLE prizes 
ADD CONSTRAINT unique_tournament_rank UNIQUE (tournament_id, rank);

-- Create index for better performance on the unique constraint
CREATE INDEX IF NOT EXISTS idx_prizes_tournament_rank ON prizes(tournament_id, rank);