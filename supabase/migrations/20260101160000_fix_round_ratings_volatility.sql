-- Add volatility column to round_ratings to store Glicko-2 sigma
ALTER TABLE public.round_ratings
ADD COLUMN IF NOT EXISTS volatility float DEFAULT 0.06;
