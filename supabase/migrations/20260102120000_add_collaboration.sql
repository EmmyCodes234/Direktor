-- Migration: Add Collaboration System
-- Description: Adds tournament_collaborators table and get_managed_tournaments RPC.
-- Rewritten to be idempotent (safe to run multiple times).

-- 1. Create Collaborators Table
CREATE TABLE IF NOT EXISTS tournament_collaborators (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'editor', -- editor, viewer (future proofing)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, email)
);

-- 2. Enable RLS
ALTER TABLE tournament_collaborators ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Collaborators Table

-- Drop existing policies first to allow re-running
DROP POLICY IF EXISTS "Owners can view collaborators" ON tournament_collaborators;
DROP POLICY IF EXISTS "Owners can add collaborators" ON tournament_collaborators;
DROP POLICY IF EXISTS "Owners can remove collaborators" ON tournament_collaborators;
DROP POLICY IF EXISTS "Collaborators can view own entries" ON tournament_collaborators;

-- Owners can view collaborators for their tournaments
CREATE POLICY "Owners can view collaborators" ON tournament_collaborators
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_collaborators.tournament_id
            AND tournaments.user_id = auth.uid()
        )
    );

-- Owners can insert collaborators
CREATE POLICY "Owners can add collaborators" ON tournament_collaborators
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_collaborators.tournament_id
            AND tournaments.user_id = auth.uid()
        )
    );

-- Owners can delete collaborators
CREATE POLICY "Owners can remove collaborators" ON tournament_collaborators
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_collaborators.tournament_id
            AND tournaments.user_id = auth.uid()
        )
    );

-- Collaborators can view themselves (optional, but good for UI "Shared with me")
CREATE POLICY "Collaborators can view own entries" ON tournament_collaborators
    FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        email = (SELECT current_setting('request.jwt.claim.email', true))
    );


-- 4. Update Tournaments RLS to allow Collaborators to Access
-- Drop existing policies first to allow re-running
DROP POLICY IF EXISTS "Collaborators can view assigned tournaments" ON tournaments;
DROP POLICY IF EXISTS "Collaborators can update assigned tournaments" ON tournaments;

CREATE POLICY "Collaborators can view assigned tournaments" ON tournaments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournament_collaborators
            WHERE tournament_collaborators.tournament_id = tournaments.id
            AND (
                tournament_collaborators.email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
                tournament_collaborators.email = (SELECT current_setting('request.jwt.claim.email', true))
            )
        )
    );

CREATE POLICY "Collaborators can update assigned tournaments" ON tournaments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tournament_collaborators
            WHERE tournament_collaborators.tournament_id = tournaments.id
            AND (
                tournament_collaborators.email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
                tournament_collaborators.email = (SELECT current_setting('request.jwt.claim.email', true))
            )
        )
    );

-- 5. RPC Function to Fetch All Managed Tournaments (Owned + Shared) in one request
-- This is more efficient than client-side merging and safer for pagination if needed later.

CREATE OR REPLACE FUNCTION get_managed_tournaments()
RETURNS SETOF tournaments
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM tournaments
    WHERE 
        -- Owned
        user_id = auth.uid()
        OR
        -- Shared
        EXISTS (
            SELECT 1 FROM tournament_collaborators
            WHERE tournament_collaborators.tournament_id = tournaments.id
            AND (
                tournament_collaborators.email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
                tournament_collaborators.email = (SELECT current_setting('request.jwt.claim.email', true))
            )
        )
    ORDER BY created_at DESC;
$$;
