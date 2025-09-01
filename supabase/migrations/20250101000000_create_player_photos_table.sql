-- Create player_photos table with proper references
CREATE TABLE IF NOT EXISTS player_photos (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one photo per player per tournament
    UNIQUE(tournament_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_photos_tournament_id ON player_photos(tournament_id);
CREATE INDEX IF NOT EXISTS idx_player_photos_player_id ON player_photos(player_id);
CREATE INDEX IF NOT EXISTS idx_player_photos_uploaded_at ON player_photos(uploaded_at);

-- Enable Row Level Security
ALTER TABLE player_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view photos for tournaments they own" ON player_photos;
DROP POLICY IF EXISTS "Users can insert photos for tournaments they own" ON player_photos;
DROP POLICY IF EXISTS "Users can update photos for tournaments they own" ON player_photos;
DROP POLICY IF EXISTS "Users can delete photos for tournaments they own" ON player_photos;

-- Create RLS policies with better security
CREATE POLICY "Users can view photos for tournaments they own" ON player_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tournaments 
            WHERE tournaments.id = player_photos.tournament_id 
            AND tournaments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert photos for tournaments they own" ON player_photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments 
            WHERE tournaments.id = player_photos.tournament_id 
            AND tournaments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update photos for tournaments they own" ON player_photos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tournaments 
            WHERE tournaments.id = player_photos.tournament_id 
            AND tournaments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete photos for tournaments they own" ON player_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tournaments 
            WHERE tournaments.id = player_photos.tournament_id 
            AND tournaments.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_player_photos_updated_at ON player_photos;
CREATE TRIGGER update_player_photos_updated_at
    BEFORE UPDATE ON player_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_player_photos_updated_at();

-- Add a view for easier photo access
DROP VIEW IF EXISTS player_photos_with_details;
CREATE OR REPLACE VIEW player_photos_with_details AS
SELECT 
    pp.id,
    pp.tournament_id,
    pp.player_id,
    pp.photo_url,
    pp.filename,
    pp.uploaded_at,
    pp.created_at,
    pp.updated_at,
    p.name as player_name,
    t.name as tournament_name,
    tp.seed,
    tp.status
FROM player_photos pp
JOIN players p ON pp.player_id = p.id
JOIN tournaments t ON pp.tournament_id = t.id
LEFT JOIN tournament_players tp ON pp.tournament_id = tp.tournament_id AND pp.player_id = tp.player_id;
