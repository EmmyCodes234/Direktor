-- Create player_photos table
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

-- Create RLS policies
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
CREATE TRIGGER update_player_photos_updated_at
    BEFORE UPDATE ON player_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_player_photos_updated_at();
