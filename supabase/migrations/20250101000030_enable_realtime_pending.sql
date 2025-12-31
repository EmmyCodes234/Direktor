DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'pending_results'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE pending_results;
    END IF;
END $$;
