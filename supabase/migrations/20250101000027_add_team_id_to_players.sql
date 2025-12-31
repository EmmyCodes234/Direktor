-- Add 'team_id' column to 'tournament_players' table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tournament_players'
        AND column_name = 'team_id'
    ) THEN
        ALTER TABLE tournament_players ADD COLUMN team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add index for faster team filtering
CREATE INDEX IF NOT EXISTS idx_tournament_players_team_id ON tournament_players(team_id);
