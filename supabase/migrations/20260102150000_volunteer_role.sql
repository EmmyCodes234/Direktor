-- Migration: Volunteer Role & Permissions
-- Description: Refines RLS policies to support restricted 'volunteer' role.

-- 1. Ensure Role Column Exists (It should from previous migration, but safe to check/modify)
-- The previous migration defined: role VARCHAR(50) DEFAULT 'editor'
-- We will use 'volunteer' and 'editor' (or 'admin'/'collaborator') as values.

-- 2. Update Tournaments Policies
-- Volunteers can VIEW (Select) but CANNOT UPDATE.
-- Editors/Owners can UPDATE.

DROP POLICY IF EXISTS "Collaborators can update assigned tournaments" ON tournaments;

CREATE POLICY "Collab (Editor) can update assigned tournaments" ON tournaments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tournament_collaborators
            WHERE tournament_collaborators.tournament_id = tournaments.id
            AND tournament_collaborators.email = (auth.jwt() ->> 'email')
            AND (tournament_collaborators.role IS NULL OR tournament_collaborators.role != 'volunteer')
        )
    );

-- 3. Results Permissions
-- Volunteers MUST be able to INSERT and UPDATE results.
-- Enable RLS on results if not already.
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Collaborators can manage results" ON results;
-- Or whatever previous policy existed. Let's create a comprehensive one.

CREATE POLICY "Collaborators (All Roles) can view results" ON results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = results.tournament_id
            AND (
                tournaments.user_id = auth.uid() -- Owner
                OR EXISTS ( -- Collaborator (Any Role)
                    SELECT 1 FROM tournament_collaborators
                    WHERE tournament_collaborators.tournament_id = results.tournament_id
                    AND tournament_collaborators.email = (auth.jwt() ->> 'email')
                )
            )
        )
    );

CREATE POLICY "Collaborators (All Roles) can insert results" ON results
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = results.tournament_id
            AND (
                tournaments.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM tournament_collaborators
                    WHERE tournament_collaborators.tournament_id = results.tournament_id
                    AND tournament_collaborators.email = (auth.jwt() ->> 'email')
                )
            )
        )
    );

CREATE POLICY "Collaborators (All Roles) can update results" ON results
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = results.tournament_id
            AND (
                tournaments.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM tournament_collaborators
                    WHERE tournament_collaborators.tournament_id = results.tournament_id
                    AND tournament_collaborators.email = (auth.jwt() ->> 'email')
                )
            )
        )
    );

-- Delete might be restricted for volunteers? 
-- Let's restrict DELETE to non-volunteers.
CREATE POLICY "Collab (Editor) can delete results" ON results
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = results.tournament_id
            AND (
                tournaments.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM tournament_collaborators
                    WHERE tournament_collaborators.tournament_id = results.tournament_id
                    AND tournament_collaborators.email = (auth.jwt() ->> 'email')
                    AND role != 'volunteer'
                )
            )
        )
    );

-- 4. Matches Permissions
-- Volunteers need to View Matches to select them for result entry.
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collaborators can view matches" ON matches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = matches.tournament_id
            AND (
                tournaments.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM tournament_collaborators
                    WHERE tournament_collaborators.tournament_id = matches.tournament_id
                    AND tournament_collaborators.email = (auth.jwt() ->> 'email')
                )
            )
        )
    );

-- Volunteers should NOT be able to create/delete matches (pairings).
-- Only Editors/Owners.

CREATE POLICY "Collab (Editor) can manage matches" ON matches
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = matches.tournament_id
            AND (
                tournaments.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM tournament_collaborators
                    WHERE tournament_collaborators.tournament_id = matches.tournament_id
                    AND tournament_collaborators.email = (auth.jwt() ->> 'email')
                    AND role != 'volunteer'
                )
            )
        )
    );
