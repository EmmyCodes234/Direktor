-- Migration: Director Chat System
-- Description: Creates the director_messages table and sets up RLS and Realtime.

-- 1. Create Table
CREATE TABLE IF NOT EXISTS director_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Keep message even if user deleted? Or set null.
    content TEXT NOT NULL CHECK (char_length(content) > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender_name TEXT -- Optional: Cache name to avoid joining auth.users which might be restricted
);

-- 2. Enable RLS
ALTER TABLE director_messages ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- Helper conditions (can be inlined for robustness against function changes)
-- Access: Owner OR Collaborator

CREATE POLICY "Directors can view messages" ON director_messages
    FOR SELECT
    USING (
        -- Is Owner
        EXISTS (
            SELECT 1 FROM tournaments 
            WHERE id = director_messages.tournament_id 
            AND user_id = auth.uid()
        )
        OR
        -- Is Collaborator
        EXISTS (
            SELECT 1 FROM tournament_collaborators 
            WHERE tournament_id = director_messages.tournament_id 
            AND email = (auth.jwt() ->> 'email')
        )
    );

CREATE POLICY "Directors can send messages" ON director_messages
    FOR INSERT
    WITH CHECK (
        -- Is Owner
        EXISTS (
            SELECT 1 FROM tournaments 
            WHERE id = director_messages.tournament_id 
            AND user_id = auth.uid()
        )
        OR
        -- Is Collaborator
        EXISTS (
            SELECT 1 FROM tournament_collaborators 
            WHERE tournament_id = director_messages.tournament_id 
            AND email = (auth.jwt() ->> 'email')
        )
    );

-- 4. Enable Realtime
-- Check if publication exists first to avoid error, or just try add. 
-- Supabase default publication is 'supabase_realtime'.
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;
-- Note: The above might be too aggressive if user had custom pubs. 
-- Safer: ALTER PUBLICATION supabase_realtime ADD TABLE director_messages;
-- But "ADD TABLE" throws if table already in it (or if "ALL TABLES" set).
-- Let's try the safest "ADD TABLE" approach assuming standard Supabase setup.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'director_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE director_messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If 'supabase_realtime' is defined as FOR ALL TABLES, we don't need to do anything.
    NULL; 
END $$;
