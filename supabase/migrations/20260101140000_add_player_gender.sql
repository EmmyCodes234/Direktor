-- Add gender column to players table
alter table public.players 
add column if not exists gender varchar(20); -- 'Male', 'Female', 'Other'

-- Update RLS if needed (existing polices should cover new column usually, but verifying is good practice if strict)
-- In this case, standard select policies usually cover all columns unless restricted.
