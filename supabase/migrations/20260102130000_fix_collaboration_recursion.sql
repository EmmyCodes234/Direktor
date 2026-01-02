-- Migration: Fix Collaboration RLS Recursion
-- Description: Introduces a SECURITY DEFINER function to check ownership without triggering RLS on tournaments table.

-- 1. Create Helper Function
-- SECURITY DEFINER means this function runs with the privileges of the creator (postgres/superuser),
-- effectively bypassing RLS on the tables it queries.
CREATE OR REPLACE FUNCTION is_tournament_owner(_tournament_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM tournaments
        WHERE id = _tournament_id
        AND user_id = auth.uid()
    );
$$;

-- 2. Update Policies on tournament_collaborators to use the function
-- We drop and recreate to ensure clean state.

DROP POLICY IF EXISTS "Owners can view collaborators" ON tournament_collaborators;
DROP POLICY IF EXISTS "Owners can add collaborators" ON tournament_collaborators;
DROP POLICY IF EXISTS "Owners can remove collaborators" ON tournament_collaborators;

CREATE POLICY "Owners can view collaborators" ON tournament_collaborators
    FOR SELECT
    USING ( is_tournament_owner(tournament_id) );

CREATE POLICY "Owners can add collaborators" ON tournament_collaborators
    FOR INSERT
    WITH CHECK ( is_tournament_owner(tournament_id) );

CREATE POLICY "Owners can remove collaborators" ON tournament_collaborators
    FOR DELETE
    USING ( is_tournament_owner(tournament_id) );
