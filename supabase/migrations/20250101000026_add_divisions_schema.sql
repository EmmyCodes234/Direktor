-- Add 'divisions' JSONB column to 'tournaments' table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tournaments'
        AND column_name = 'divisions'
    ) THEN
        ALTER TABLE tournaments ADD COLUMN divisions JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add 'division' TEXT column to 'tournament_players' table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tournament_players'
        AND column_name = 'division'
    ) THEN
        ALTER TABLE tournament_players ADD COLUMN division TEXT;
    END IF;
END $$;

-- Add index for faster division filtering
CREATE INDEX IF NOT EXISTS idx_tournament_players_division ON tournament_players(division);
