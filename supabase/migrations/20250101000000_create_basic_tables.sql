-- Migration: Create basic tournament tables
-- This creates the core tables needed for the tournament system

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    venue TEXT,
    date DATE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'setup',
    tournament_type VARCHAR(50) DEFAULT 'standard',
    mode VARCHAR(50) DEFAULT 'individual',
    max_players INTEGER,
    current_round INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id),
    slug VARCHAR(255) UNIQUE,
    is_public BOOLEAN DEFAULT false,
    is_remote_submission_enabled BOOLEAN DEFAULT false,
    remote_submission_code VARCHAR(50),
    gibson_rule_enabled BOOLEAN DEFAULT false,
    pairing_system VARCHAR(50) DEFAULT 'swiss',
    best_of_value INTEGER DEFAULT 15,
    max_spread INTEGER,
    round_status JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    rating INTEGER DEFAULT 1500,
    status VARCHAR(50) DEFAULT 'active',
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_players table
CREATE TABLE IF NOT EXISTS tournament_players (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    group_id BIGINT,
    seed INTEGER,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    spread INTEGER DEFAULT 0,
    rank INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    carryover_wins DECIMAL(5,2) DEFAULT 0,
    carryover_spread INTEGER DEFAULT 0,
    current_wins INTEGER DEFAULT 0,
    current_losses INTEGER DEFAULT 0,
    current_ties INTEGER DEFAULT 0,
    current_spread DECIMAL(10,2) DEFAULT 0,
    total_wins DECIMAL(10,2) DEFAULT 0,
    total_spread DECIMAL(10,2) DEFAULT 0,
    match_wins INTEGER DEFAULT 0,
    match_losses INTEGER DEFAULT 0,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    player1_id BIGINT REFERENCES players(id),
    player2_id BIGINT REFERENCES players(id),
    player1_score INTEGER,
    player2_score INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create results table
CREATE TABLE IF NOT EXISTS results (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    player1_id BIGINT,
    player2_id BIGINT,
    player1_name VARCHAR(255),
    player2_name VARCHAR(255),
    score1 INTEGER,
    score2 INTEGER,
    match_id UUID REFERENCES matches(id),
    is_bye BOOLEAN DEFAULT FALSE,
    is_forfeit BOOLEAN DEFAULT FALSE,
    forfeit_player VARCHAR(10), -- 'player1' or 'player2'
    bye_player VARCHAR(10), -- 'player1' or 'player2'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prizes table
CREATE TABLE IF NOT EXISTS prizes (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    value VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_user_id ON tournaments(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament_id ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_player_id ON tournament_players(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_round ON matches(tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_results_tournament_round ON results(tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_prizes_tournament_id ON prizes(tournament_id);
CREATE INDEX IF NOT EXISTS idx_announcements_tournament_id ON announcements(tournament_id);

-- Add constraints for data integrity (only if they don't exist)
DO $$
BEGIN
    -- Add score validation constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_valid_scores' AND table_name = 'results') THEN
        ALTER TABLE results ADD CONSTRAINT check_valid_scores 
            CHECK (score1 >= 0 AND score2 >= 0);
    END IF;
    
    -- Add player status constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_valid_status' AND table_name = 'tournament_players') THEN
        ALTER TABLE tournament_players ADD CONSTRAINT check_valid_status 
            CHECK (status IN ('active', 'withdrawn', 'disqualified'));
    END IF;
END $$;