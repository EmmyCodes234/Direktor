-- Migration to add 'location' column to 'tournaments' table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tournaments'
        AND column_name = 'location'
    ) THEN
        ALTER TABLE tournaments ADD COLUMN location TEXT;
    END IF;
END $$;
