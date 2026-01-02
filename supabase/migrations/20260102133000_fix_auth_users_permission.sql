-- Migration: Fix Auth Users Permission Error
-- Description: Replaces direct access to auth.users (which fails for standard users) 
-- with `auth.jwt() ->> 'email'` in RLS policies and RPC.

-- 1. Helper for getting email (optional but clean)
-- We'll just inline it to be safe and standard.

-- 2. Update Policies on tournament_collaborators

DROP POLICY IF EXISTS "Collaborators can view own entries" ON tournament_collaborators;

CREATE POLICY "Collaborators can view own entries" ON tournament_collaborators
    FOR SELECT
    USING (
        email = (auth.jwt() ->> 'email')
    );


-- 3. Update Policies on tournaments

DROP POLICY IF EXISTS "Collaborators can view assigned tournaments" ON tournaments;
DROP POLICY IF EXISTS "Collaborators can update assigned tournaments" ON tournaments;

CREATE POLICY "Collaborators can view assigned tournaments" ON tournaments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournament_collaborators
            WHERE tournament_collaborators.tournament_id = tournaments.id
            AND tournament_collaborators.email = (auth.jwt() ->> 'email')
        )
    );

CREATE POLICY "Collaborators can update assigned tournaments" ON tournaments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tournament_collaborators
            WHERE tournament_collaborators.tournament_id = tournaments.id
            AND tournament_collaborators.email = (auth.jwt() ->> 'email')
        )
    );


-- 4. RPC Function Update
-- Even though SECURITY DEFINER *can* access auth.users, it's consistent to use JWT.
-- Plus, using auth.users might be slightly slower than parsing the claim.

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
            AND tournament_collaborators.email = (auth.jwt() ->> 'email')
        )
    ORDER BY created_at DESC;
$$;
