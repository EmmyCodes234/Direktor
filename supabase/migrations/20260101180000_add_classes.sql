-- Add class_definitions to tournaments to store configuration (e.g., [{name: 'A', min: 1800, max: 2000}])
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS class_definitions JSONB DEFAULT '[]'::jsonb;

-- Add class to tournament_players to store the assigned class (e.g., 'A')
ALTER TABLE public.tournament_players
ADD COLUMN IF NOT EXISTS class TEXT DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.tournaments.class_definitions IS 'JSON configuration for rating-based classes';
COMMENT ON COLUMN public.tournament_players.class IS 'Assigned class name based on rating (e.g. A, B, Pro)';
