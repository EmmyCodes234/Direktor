-- Create user_profiles table to store user onboarding data
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_skipped BOOLEAN DEFAULT FALSE,
    user_type TEXT CHECK (user_type IN ('director', 'player', 'spectator')),
    onboarding_preferences JSONB DEFAULT '{}',
    onboarding_started_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for onboarding status
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_status ON user_profiles(onboarding_completed, user_type);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Grant permissions for user_profiles
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- Create onboarding_steps table to store step definitions
CREATE TABLE IF NOT EXISTS onboarding_steps (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    step_order INTEGER NOT NULL,
    user_type TEXT CHECK (user_type IN ('director', 'player', 'spectator', 'all')),
    is_required BOOLEAN DEFAULT TRUE,
    component_name TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create onboarding_progress table to track user progress
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    step_id TEXT REFERENCES onboarding_steps(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    step_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, step_id)
);

-- Create onboarding_sessions table to track onboarding sessions
CREATE TABLE IF NOT EXISTS onboarding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_completed_at TIMESTAMP WITH TIME ZONE,
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER,
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_step_id ON onboarding_progress(step_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_user_type ON onboarding_steps(user_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_order ON onboarding_steps(step_order);

-- Enable RLS on new tables
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for onboarding_steps (read-only for all authenticated users)
CREATE POLICY "Anyone can read onboarding steps" ON onboarding_steps
    FOR SELECT USING (true);

-- Create RLS policies for onboarding_progress
CREATE POLICY "Users can view their own onboarding progress" ON onboarding_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress" ON onboarding_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" ON onboarding_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding progress" ON onboarding_progress
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for onboarding_sessions
CREATE POLICY "Users can view their own onboarding sessions" ON onboarding_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding sessions" ON onboarding_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding sessions" ON onboarding_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding sessions" ON onboarding_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON onboarding_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_sessions TO authenticated;

-- Insert default onboarding steps
INSERT INTO onboarding_steps (id, title, description, step_order, user_type, is_required, component_name, metadata) VALUES
('welcome', 'Welcome to Direktor', 'Get started with the most powerful tournament management platform', 1, 'all', true, 'WelcomeStep', '{"icon": "Trophy", "duration": 30}'),
('user-type', 'Choose Your Role', 'Tell us how you plan to use Direktor', 2, 'all', true, 'UserTypeStep', '{"options": ["director", "player", "spectator"]}'),
('tournament-types', 'Tournament Preferences', 'What types of tournaments do you organize?', 3, 'director', false, 'TournamentTypesStep', '{"tournament_types": ["club", "tournament", "championship", "casual"]}'),
('features', 'Key Features', 'Discover what Direktor can do for you', 4, 'all', false, 'FeaturesStep', '{"features": ["pairings", "standings", "results", "reports"]}'),
('preferences', 'Personalize Your Experience', 'Customize your Direktor experience', 5, 'all', false, 'PreferencesStep', '{"preferences": ["notifications", "theme", "language"]}'),
('complete', 'You''re All Set!', 'Welcome to the Direktor community', 6, 'all', true, 'CompleteStep', '{"celebration": true}')
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_steps_updated_at 
    BEFORE UPDATE ON onboarding_steps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at 
    BEFORE UPDATE ON onboarding_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_sessions_updated_at 
    BEFORE UPDATE ON onboarding_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get onboarding progress for a user
CREATE OR REPLACE FUNCTION get_user_onboarding_progress(user_uuid UUID)
RETURNS TABLE (
    step_id TEXT,
    title TEXT,
    description TEXT,
    step_order INTEGER,
    completed BOOLEAN,
    completed_at TIMESTAMP WITH TIME ZONE,
    step_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        os.id as step_id,
        os.title,
        os.description,
        os.step_order,
        COALESCE(op.completed, false) as completed,
        op.completed_at,
        COALESCE(op.step_data, '{}'::jsonb) as step_data
    FROM onboarding_steps os
    LEFT JOIN onboarding_progress op ON os.id = op.step_id AND op.user_id = user_uuid
    WHERE os.user_type = 'all' OR os.user_type = (
        SELECT user_type FROM user_profiles WHERE id = user_uuid
    )
    ORDER BY os.step_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_onboarding_progress(UUID) TO authenticated;

-- Create function to mark onboarding step as complete
CREATE OR REPLACE FUNCTION complete_onboarding_step(
    user_uuid UUID,
    step_id_param TEXT,
    step_data_param JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO onboarding_progress (user_id, step_id, completed, completed_at, step_data)
    VALUES (user_uuid, step_id_param, true, NOW(), step_data_param)
    ON CONFLICT (user_id, step_id)
    DO UPDATE SET 
        completed = true,
        completed_at = NOW(),
        step_data = step_data_param,
        updated_at = NOW();
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION complete_onboarding_step(UUID, TEXT, JSONB) TO authenticated;

-- Create function to reset user onboarding
CREATE OR REPLACE FUNCTION reset_user_onboarding(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete all progress for the user
    DELETE FROM onboarding_progress WHERE user_id = user_uuid;
    
    -- Delete all sessions for the user
    DELETE FROM onboarding_sessions WHERE user_id = user_uuid;
    
    -- Reset profile onboarding fields
    UPDATE user_profiles 
    SET 
        onboarding_completed = false,
        onboarding_skipped = false,
        onboarding_preferences = '{}'::jsonb,
        onboarding_started_at = NULL,
        onboarding_completed_at = NULL,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION reset_user_onboarding(UUID) TO authenticated;
