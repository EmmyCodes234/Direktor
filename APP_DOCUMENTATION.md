# Scrabble Direktor - Complete Application Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Authentication System](#authentication-system)
5. [Core Features](#core-features)
6. [Tournament Management](#tournament-management)
7. [Player Management](#player-management)
8. [Ladder System Mode](#ladder-system-mode)
9. [Carry-Over System](#carry-over-system)
10. [Photo Database](#photo-database)
11. [Mobile Responsiveness](#mobile-responsiveness)
12. [UI/UX Components](#uiux-components)
13. [State Management](#state-management)
14. [API Integration](#api-integration)
15. [Error Handling](#error-handling)
16. [Development Setup](#development-setup)
17. [Mobile Development Considerations](#mobile-development-considerations)

---

## Application Overview

**Scrabble Direktor** is a comprehensive tournament management system designed for Scrabble competitions. It provides tournament directors with tools to manage players, track standings, handle pairings, and run multi-division ladder systems with promotion/relegation mechanics.

### Key Capabilities
- **Tournament Creation & Management**: Complete tournament lifecycle management
- **Player Registration & Management**: Player profiles, statistics, and status tracking
- **Real-time Standings**: Live standings updates with multiple view modes
- **Pairing System**: Automated and manual pairing with Swiss system support
- **Ladder System Mode**: Multi-division tournaments with promotion/relegation
- **Carry-Over System**: Configurable stat carry-over between divisions
- **Photo Database**: Player photo management with facial recognition
- **Mobile-First Design**: Fully responsive interface optimized for all devices
- **Audit Logging**: Comprehensive activity tracking
- **Real-time Updates**: Live data synchronization across devices

---

## Technology Stack

### Frontend
- **React 18**: Component-based UI framework
- **Redux Toolkit**: State management with RTK Query
- **Framer Motion**: Advanced animations and transitions
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing
- **Sonner**: Toast notifications
- **Lucide React**: Icon library

### Backend & Database
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Primary database
- **Row Level Security (RLS)**: Database-level security policies
- **Supabase Auth**: Authentication and user management
- **Supabase Storage**: File storage for photos
- **PostgreSQL Functions**: Custom database functions and triggers

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety (partially implemented)
- **Git**: Version control

---

## Database Schema

### Core Tables

#### `tournaments`
```sql
CREATE TABLE tournaments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'setup',
    tournament_type VARCHAR(50) DEFAULT 'standard',
    max_players INTEGER,
    current_round INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `players`
```sql
CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    rating INTEGER DEFAULT 1500,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `tournament_players`
```sql
CREATE TABLE tournament_players (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    group_id BIGINT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    spread INTEGER DEFAULT 0,
    rank INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    carryover_wins DECIMAL(5,2) DEFAULT 0,
    carryover_spread INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `matches`
```sql
CREATE TABLE matches (
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
```

### Ladder System Tables

#### `ladder_system_config`
```sql
CREATE TABLE ladder_system_config (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    is_ladder_mode BOOLEAN DEFAULT FALSE,
    divisions JSONB DEFAULT '[]',
    promotion_rules JSONB DEFAULT '{}',
    carryover_policy VARCHAR(50) DEFAULT 'none',
    carryover_percentage INTEGER DEFAULT 0,
    spread_cap INTEGER DEFAULT 0,
    show_carryover_in_standings BOOLEAN DEFAULT TRUE,
    season_length INTEGER DEFAULT 8,
    season_transition VARCHAR(50) DEFAULT 'carryover',
    rating_system VARCHAR(50) DEFAULT 'elo',
    rating_k_factor INTEGER DEFAULT 32,
    rating_floor INTEGER DEFAULT 1000,
    rating_ceiling INTEGER DEFAULT 2500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `ladder_events`
```sql
CREATE TABLE ladder_events (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(id),
    event_type VARCHAR(50) NOT NULL,
    from_division VARCHAR(100),
    to_division VARCHAR(100),
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `ladder_seasons`
```sql
CREATE TABLE ladder_seasons (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Carry-Over System Tables

#### `carryover_config`
```sql
CREATE TABLE carryover_config (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    policy VARCHAR(50) DEFAULT 'none',
    percentage INTEGER DEFAULT 0,
    spread_cap INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `promotion_events`
```sql
CREATE TABLE promotion_events (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(id),
    from_group_id BIGINT,
    to_group_id BIGINT,
    event_type VARCHAR(50) NOT NULL,
    applied_policy VARCHAR(50),
    carryover_wins DECIMAL(5,2),
    carryover_spread INTEGER,
    previous_wins INTEGER,
    previous_spread INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Onboarding System Tables

#### `user_profiles`
```sql
CREATE TABLE user_profiles (
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
```

### Photo Database Tables

#### `player_photos`
```sql
CREATE TABLE player_photos (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_name VARCHAR(255),
    confidence_score DECIMAL(3,2),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Authentication System

### User Management
- **Supabase Auth**: Handles user registration, login, and session management
- **User Types**: Director, Player, Spectator (configurable during onboarding)
- **Session Persistence**: Automatic session restoration on app reload
- **Password Reset**: Email-based password reset functionality

### Onboarding Flow
1. **User Registration**: Email/password signup
2. **Onboarding Check**: System checks if user has completed onboarding
3. **User Type Selection**: Director, Player, or Spectator
4. **Preferences Setup**: Customizable user preferences
5. **Completion**: User can skip or complete onboarding

### Security Features
- **Row Level Security (RLS)**: Database-level access control
- **User-Specific Data**: Users can only access their own tournaments
- **Session Management**: Secure session handling with automatic logout
- **Input Validation**: Client and server-side validation

---

## Core Features

### Tournament Management

#### Tournament Creation
- **Basic Info**: Name, description, dates, max players
- **Tournament Type**: Standard, Ladder System, or Custom
- **Configuration**: Rounds, pairing system, scoring rules
- **Player Registration**: Manual or bulk import

#### Tournament Lifecycle
1. **Setup Phase**: Configuration and player registration
2. **Active Phase**: Rounds, matches, and standings updates
3. **Completed Phase**: Final results and statistics

#### Tournament Types
- **Standard**: Traditional Swiss system tournament
- **Ladder System**: Multi-division with promotion/relegation
- **Custom**: Configurable tournament formats

### Player Management

#### Player Registration
- **Individual Registration**: Manual player entry
- **Bulk Import**: CSV file import for multiple players
- **Photo Upload**: Optional player photos for identification
- **Rating System**: Elo-based rating calculations

#### Player Status Tracking
- **Active**: Participating in tournament
- **Withdrawn**: Voluntarily left tournament
- **Disqualified**: Removed for rule violations
- **Inactive**: Temporarily suspended

#### Player Statistics
- **Match Record**: Wins, losses, ties
- **Spread**: Point differential
- **Rating**: Elo rating with K-factor adjustments
- **Ranking**: Current tournament position

### Real-time Standings

#### Standings Calculation
- **Primary Sort**: Wins (descending)
- **Secondary Sort**: Spread (descending)
- **Tertiary Sort**: Rating (descending)
- **Real-time Updates**: Automatic recalculation after each match

#### Display Modes
- **Standard View**: Basic standings table
- **Detailed View**: Extended statistics and history
- **Ladder View**: Division-based standings (Ladder System Mode)
- **Mobile Card View**: Touch-optimized card layout

#### Standings Features
- **Live Updates**: Real-time standings changes
- **Filtering**: By status, group, or division
- **Sorting**: Multiple sort criteria
- **Export**: CSV export functionality

### Pairing System

#### Swiss System Pairing
- **First Round**: Random pairing or seeding-based
- **Subsequent Rounds**: Score-based pairing
- **Avoidance Rules**: Prevent repeat matches
- **Bye Handling**: Automatic bye assignment

#### Manual Pairing
- **Custom Pairings**: Director-controlled matchups
- **Drag & Drop**: Visual pairing interface
- **Validation**: Conflict detection and resolution
- **Override Options**: Force specific pairings

#### Pairing Features
- **Score Balancing**: Minimize score differences
- **Color Alternation**: Balance playing colors
- **Bye Distribution**: Fair bye assignment
- **Conflict Resolution**: Handle pairing conflicts

---

## Ladder System Mode

### Overview
The Ladder System Mode transforms a standard tournament into a multi-division competition with automatic promotion and relegation between divisions.

### Division Management

#### Division Configuration
- **Division Names**: Customizable division names (Premier, Division 1, etc.)
- **Rating Ranges**: Min/max rating for each division
- **Color Coding**: Visual division identification
- **Player Limits**: Optional player count limits

#### Default Divisions
```javascript
divisions: [
    { name: 'Premier', minRating: 1800, maxRating: 9999, color: '#FFD700' },
    { name: 'Division 1', minRating: 1600, maxRating: 1799, color: '#C0C0C0' },
    { name: 'Division 2', minRating: 1400, maxRating: 1599, color: '#CD7F32' },
    { name: 'Division 3', minRating: 0, maxRating: 1399, color: '#4A90E2' }
]
```

### Promotion/Relegation Rules

#### Automatic Promotion
- **Top Players**: Configurable number of top players promote
- **Rating Threshold**: Auto-promotion at specific rating levels
- **Minimum Games**: Required games before promotion eligibility

#### Automatic Relegation
- **Bottom Players**: Configurable number of bottom players relegate
- **Rating Threshold**: Auto-relegation at specific rating levels
- **Performance Based**: Poor performance triggers relegation

#### Promotion Types
- **Standard Promotion**: Top finishers move up
- **Auto-Promotion**: High rating triggers immediate promotion
- **Performance Promotion**: Exceptional performance triggers promotion

### Season Management

#### Season Configuration
- **Season Length**: Configurable number of rounds per season
- **Season Transitions**: Carry-over, reset, or partial reset
- **Season History**: Track performance across seasons
- **Season Awards**: Recognition for season achievements

#### Season Transitions
- **Carry-Over**: Stats carry to next season
- **Reset**: Fresh start each season
- **Partial Reset**: Keep some historical data

### Rating System

#### Elo Rating System
- **K-Factor**: Rating change sensitivity (default: 32)
- **Rating Floor**: Minimum rating (default: 1000)
- **Rating Ceiling**: Maximum rating (default: 2500)
- **Expected Score**: Probability-based rating calculations

#### Rating Updates
- **Match Results**: Rating changes based on outcomes
- **Opponent Strength**: Rating impact based on opponent rating
- **Performance Bonus**: Additional rating for exceptional performance
- **Rating Protection**: Prevent excessive rating loss

---

## Carry-Over System

### Overview
The Carry-Over System allows players to retain some of their statistics when moving between divisions or starting new seasons.

### Carry-Over Policies

#### None Policy
- **Description**: Reset all scores on promotion/demotion
- **Use Case**: Fresh start in new division
- **Implementation**: Clear all wins and spread

#### Full Policy
- **Description**: Carry all wins and spread
- **Use Case**: Maintain competitive continuity
- **Implementation**: Transfer all statistics

#### Partial Policy
- **Description**: Carry percentage of wins and spread
- **Use Case**: Balance fresh starts with history
- **Implementation**: Apply configurable percentage (default: 75%)

#### Capped Policy
- **Description**: Carry wins but limit spread per game
- **Use Case**: Prevent overwhelming advantages
- **Implementation**: Cap spread at configurable limit

#### Seeding Only Policy
- **Description**: Use carry-over for initial seeding only
- **Use Case**: Fair initial placement without ongoing advantage
- **Implementation**: Apply carry-over for seeding, then reset

### Implementation Details

#### Database Functions
```sql
-- Calculate carry-over values
CREATE OR REPLACE FUNCTION calculate_carryover(
    p_tournament_id BIGINT,
    p_player_id BIGINT,
    p_policy VARCHAR(50),
    p_percentage INTEGER DEFAULT 75,
    p_spread_cap INTEGER DEFAULT 100
) RETURNS JSONB;

-- Apply carry-over to player
CREATE OR REPLACE FUNCTION apply_carryover_to_player(
    p_tournament_id BIGINT,
    p_player_id BIGINT,
    p_from_group_id BIGINT,
    p_to_group_id BIGINT,
    p_policy VARCHAR(50)
) RETURNS BOOLEAN;
```

#### Frontend Integration
- **Policy Selection**: Dropdown for carry-over policy
- **Configuration**: Dynamic fields based on selected policy
- **Preview**: Show carry-over calculations before applying
- **History**: Track all promotion/demotion events

---

## Photo Database

### Overview
The Photo Database feature allows tournament directors to manage player photos for identification and tournament management.

### Features

#### Photo Upload
- **Multiple Formats**: JPEG, PNG, WebP support
- **Image Compression**: Automatic optimization (max 800px width, 80% quality)
- **Bulk Upload**: Multiple photos at once
- **Drag & Drop**: Intuitive upload interface

#### Photo Management
- **Player Association**: Link photos to specific players
- **Confidence Scoring**: Facial recognition confidence levels
- **Verification System**: Manual verification of auto-detected matches
- **Photo History**: Track all uploaded photos

#### Advanced Features
- **Facial Recognition**: Auto-match photos to players
- **Manual Matching**: Fallback for unrecognized photos
- **Photo Preview**: Thumbnail and full-size views
- **Export Functionality**: CSV export of photo data

### Implementation

#### Image Processing
```javascript
const compressImage = async (file) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            const maxWidth = 800;
            const ratio = Math.min(maxWidth / img.width, 1);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(resolve, 'image/jpeg', 0.8);
        };
        
        img.src = URL.createObjectURL(file);
    });
};
```

#### Storage Management
- **Supabase Storage**: Secure cloud storage
- **Access Control**: RLS policies for photo access
- **Cleanup**: Automatic cleanup of unused photos
- **Backup**: Regular backup of photo database

---

## Mobile Responsiveness

### Mobile-First Design Philosophy

#### Breakpoint System
```css
/* Custom mobile-first breakpoints */
mobile: '320px',
mobile-lg: '480px',
mobile-xl: '640px',
tablet: '768px',
desktop: '1024px',
desktop-lg: '1280px'
```

#### Responsive Utilities
- **Safe Area Insets**: iOS notch and home indicator support
- **Touch Targets**: Minimum 44px touch targets
- **Mobile Cards**: Card-based layouts for small screens
- **Mobile Navigation**: Compact navigation for mobile

### Mobile-Specific Components

#### Mobile Card View
```javascript
const MobileCardView = ({ data, columns }) => (
    <div className="space-y-4">
        {data.map((item, index) => (
            <div key={index} className="mobile-card p-4 bg-card rounded-lg border border-border">
                {/* Card content */}
            </div>
        ))}
    </div>
);
```

#### Mobile Navigation
- **Bottom Navigation**: Fixed bottom navigation bar
- **Hamburger Menu**: Collapsible navigation menu
- **Touch Gestures**: Swipe navigation and actions
- **Quick Actions**: Floating action buttons

### Mobile Optimizations

#### Performance
- **Lazy Loading**: Load components on demand
- **Image Optimization**: Responsive images with srcset
- **Touch Optimization**: Optimized touch interactions
- **Battery Efficiency**: Minimize background processes

#### User Experience
- **Gesture Support**: Swipe, pinch, and tap gestures
- **Haptic Feedback**: Touch feedback on interactions
- **Offline Support**: Basic offline functionality
- **Progressive Web App**: PWA capabilities

---

## UI/UX Components

### Component Library

#### Button Component
```javascript
const buttonVariants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    mobile: "touch-manipulation mobile-tap-highlight"
};
```

#### Modal Component
```javascript
const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'md',
    mobileFullScreen = false 
}) => {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full',
        mobile: 'w-full max-w-full mx-4'
    };
};
```

#### Table Component
```javascript
const Table = ({ 
    data, 
    columns, 
    mobileCardView,
    pagination = false,
    searchable = false 
}) => {
    // Responsive table with mobile card fallback
};
```

### Animation System

#### Framer Motion Integration
```javascript
const motionVariants = {
    fadeIn: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    },
    slideIn: {
        initial: { x: -100, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 100, opacity: 0 }
    },
    scaleIn: {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 }
    }
};
```

#### Page Transitions
- **Route Transitions**: Smooth page-to-page navigation
- **Loading States**: Skeleton screens and loading animations
- **Micro-interactions**: Button hover, focus, and active states
- **Gesture Animations**: Swipe and drag animations

### Design System

#### Color Palette
```css
:root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
}
```

#### Typography Scale
```css
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
```

---

## State Management

### Redux Toolkit Implementation

#### Store Configuration
```javascript
import { configureStore } from '@reduxjs/toolkit';
import { tournamentsApi } from './services/tournamentsApi';
import tournamentsReducer from './slices/tournamentsSlice';
import playersReducer from './slices/playersSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
    reducer: {
        [tournamentsApi.reducerPath]: tournamentsApi.reducer,
        tournaments: tournamentsReducer,
        players: playersReducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(tournamentsApi.middleware),
});
```

#### API Slices (RTK Query)
```javascript
export const tournamentsApi = createApi({
    reducerPath: 'tournamentsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/',
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Tournament', 'Player', 'Match'],
    endpoints: (builder) => ({
        getTournaments: builder.query({
            query: (userId) => `tournaments?user_id=${userId}`,
            providesTags: ['Tournament'],
        }),
        createTournament: builder.mutation({
            query: (tournament) => ({
                url: 'tournaments',
                method: 'POST',
                body: tournament,
            }),
            invalidatesTags: ['Tournament'],
        }),
    }),
});
```

#### Slice Examples
```javascript
const tournamentsSlice = createSlice({
    name: 'tournaments',
    initialState: {
        tournaments: [],
        currentTournament: null,
        loading: false,
        error: null,
    },
    reducers: {
        setCurrentTournament: (state, action) => {
            state.currentTournament = action.payload;
        },
        updateTournament: (state, action) => {
            const index = state.tournaments.findIndex(t => t.id === action.payload.id);
            if (index !== -1) {
                state.tournaments[index] = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTournaments.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchTournaments.fulfilled, (state, action) => {
                state.loading = false;
                state.tournaments = action.payload;
            })
            .addCase(fetchTournaments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});
```

### Context API Usage

#### Onboarding Context
```javascript
const OnboardingContext = createContext();

export const OnboardingProvider = ({ children }) => {
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);
    const [userType, setUserType] = useState(null);
    const [preferences, setPreferences] = useState({});

    const completeOnboarding = async (userData) => {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    id: userData.id,
                    onboarding_completed: true,
                    user_type: userData.userType,
                    onboarding_preferences: userData.preferences,
                    onboarding_completed_at: new Date().toISOString(),
                });

            if (error) throw error;
            
            setOnboardingCompleted(true);
            setUserType(userData.userType);
            setPreferences(userData.preferences);
        } catch (error) {
            console.error('Error completing onboarding:', error);
        }
    };

    return (
        <OnboardingContext.Provider value={{
            onboardingCompleted,
            userType,
            preferences,
            completeOnboarding,
            skipOnboarding,
        }}>
            {children}
        </OnboardingContext.Provider>
    );
};
```

---

## API Integration

### Supabase Client Configuration
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});
```

### Database Functions

#### Tournament Management
```sql
-- Get tournament with all related data
CREATE OR REPLACE FUNCTION get_tournament_details(p_tournament_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'tournament', t,
        'players', COALESCE(players_data, '[]'::jsonb),
        'matches', COALESCE(matches_data, '[]'::jsonb),
        'standings', COALESCE(standings_data, '[]'::jsonb)
    ) INTO result
    FROM tournaments t
    LEFT JOIN (
        SELECT tournament_id, jsonb_agg(p.*) as players_data
        FROM tournament_players tp
        JOIN players p ON tp.player_id = p.id
        WHERE tournament_id = p_tournament_id
        GROUP BY tournament_id
    ) players ON t.id = players.tournament_id
    LEFT JOIN (
        SELECT tournament_id, jsonb_agg(m.*) as matches_data
        FROM matches m
        WHERE tournament_id = p_tournament_id
        GROUP BY tournament_id
    ) matches ON t.id = matches.tournament_id
    WHERE t.id = p_tournament_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### Standings Calculation
```sql
-- Calculate tournament standings
CREATE OR REPLACE FUNCTION calculate_standings(p_tournament_id BIGINT)
RETURNS TABLE (
    player_id BIGINT,
    player_name VARCHAR,
    wins INTEGER,
    losses INTEGER,
    ties INTEGER,
    spread INTEGER,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tp.player_id,
        p.name as player_name,
        tp.wins,
        tp.losses,
        tp.ties,
        tp.spread,
        ROW_NUMBER() OVER (
            ORDER BY tp.wins DESC, tp.spread DESC, p.rating DESC
        ) as rank
    FROM tournament_players tp
    JOIN players p ON tp.player_id = p.id
    WHERE tp.tournament_id = p_tournament_id
    AND tp.status = 'active'
    ORDER BY tp.wins DESC, tp.spread DESC, p.rating DESC;
END;
$$ LANGUAGE plpgsql;
```

### Real-time Subscriptions
```javascript
// Subscribe to tournament updates
const subscribeToTournament = (tournamentId) => {
    return supabase
        .channel(`tournament-${tournamentId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `tournament_id=eq.${tournamentId}`
        }, (payload) => {
            // Handle match updates
            console.log('Match updated:', payload);
        })
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'tournament_players',
            filter: `tournament_id=eq.${tournamentId}`
        }, (payload) => {
            // Handle player updates
            console.log('Player updated:', payload);
        })
        .subscribe();
};
```

---

## Error Handling

### Global Error Boundary
```javascript
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // Log to error reporting service
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Something went wrong</h2>
                    <p>Please refresh the page or contact support.</p>
                    <button onClick={() => window.location.reload()}>
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
```

### API Error Handling
```javascript
const handleApiError = (error) => {
    if (error.code === 'PGRST116') {
        // No data found - not an error
        return;
    }
    
    if (error.code === '42P01') {
        // Table doesn't exist - migration needed
        console.warn('Database migration required:', error.message);
        return;
    }
    
    if (error.code === '42501') {
        // Permission denied
        toast.error('You do not have permission to perform this action');
        return;
    }
    
    // Generic error handling
    console.error('API Error:', error);
    toast.error('An error occurred. Please try again.');
};
```

### Graceful Degradation
```javascript
const LadderSystemConfigSection = ({ tournamentId }) => {
    const [config, setConfig] = useState(defaultConfig);
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('ladder_system_config')
                .select('*')
                .eq('tournament_id', parseInt(tournamentId))
                .single();

            if (error && error.code !== 'PGRST116') {
                if (error.code === '42P01') {
                    // Table doesn't exist - show migration notice
                    console.warn('Ladder system table not available yet.');
                    setLoading(false);
                    return;
                }
                throw error;
            }

            if (data) {
                setConfig(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Failed to fetch ladder config:', error);
            // Don't show error toast for missing table
            if (error.code !== '42P01') {
                toast.error('Failed to load ladder system configuration');
            }
        } finally {
            setLoading(false);
        }
    };
};
```

---

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Supabase account

### Installation
```bash
# Clone repository
git clone <repository-url>
cd scrabble-direktor-main

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=Scrabble Direktor
VITE_APP_VERSION=1.0.0
```

### Database Setup
```bash
# Apply database migrations
npx supabase db push

# Reset database (if needed)
npx supabase db reset

# Generate types (if using TypeScript)
npx supabase gen types typescript --local > src/types/database.ts
```

### Build Commands
```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

---

## Mobile Development Considerations

### React Native Migration Strategy

#### Component Mapping
| Web Component | React Native Equivalent | Notes |
|---------------|------------------------|-------|
| `div` | `View` | Basic container |
| `button` | `TouchableOpacity` | Touch interactions |
| `input` | `TextInput` | Text input fields |
| `img` | `Image` | Image display |
| `table` | `FlatList` | List rendering |
| `modal` | `Modal` | Overlay dialogs |

#### State Management
- **Redux Toolkit**: Can be reused with `@reduxjs/toolkit`
- **AsyncStorage**: Replace localStorage for persistence
- **React Query**: Can be used for API caching

#### Navigation
```javascript
// React Navigation setup
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const AppNavigator = () => (
    <NavigationContainer>
        <Stack.Navigator>
            <Stack.Screen name="TournamentLobby" component={TournamentLobby} />
            <Stack.Screen name="TournamentDashboard" component={TournamentDashboard} />
            <Stack.Screen name="TournamentSettings" component={TournamentSettings} />
        </Stack.Navigator>
    </NavigationContainer>
);
```

### Mobile-Specific Features

#### Offline Support
```javascript
// Offline data management
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const useOfflineData = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingActions, setPendingActions] = useState([]);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected);
        });

        return unsubscribe;
    }, []);

    const syncPendingActions = async () => {
        if (!isOnline) return;
        
        const actions = await AsyncStorage.getItem('pendingActions');
        if (actions) {
            // Process pending actions
            await AsyncStorage.removeItem('pendingActions');
        }
    };
};
```

#### Push Notifications
```javascript
// Push notification setup
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';

const setupNotifications = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;

    if (enabled) {
        const token = await messaging().getToken();
        // Send token to server
    }
};
```

#### Camera Integration
```javascript
// Camera for photo upload
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const takePhoto = () => {
    launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
    }, (response) => {
        if (response.assets) {
            uploadPhoto(response.assets[0]);
        }
    });
};
```

### Performance Optimization

#### Image Optimization
```javascript
// React Native image optimization
import FastImage from 'react-native-fast-image';

const OptimizedImage = ({ uri, style }) => (
    <FastImage
        source={{ uri }}
        style={style}
        resizeMode={FastImage.resizeMode.cover}
        priority={FastImage.priority.normal}
    />
);
```

#### List Optimization
```javascript
// Optimized list rendering
import { FlatList } from 'react-native';

const OptimizedList = ({ data, renderItem }) => (
    <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        getItemLayout={(data, index) => ({
            length: 80,
            offset: 80 * index,
            index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
    />
);
```

### Testing Strategy

#### Unit Testing
```javascript
// Jest testing setup
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '../store';

const renderWithProvider = (component) => {
    return render(
        <Provider store={store}>
            {component}
        </Provider>
    );
};

test('tournament creation', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
        <TournamentCreation />
    );
    
    fireEvent.changeText(getByPlaceholderText('Tournament Name'), 'Test Tournament');
    fireEvent.press(getByText('Create Tournament'));
    
    // Assert expected behavior
});
```

#### E2E Testing
```javascript
// Detox E2E testing
import { device, element, by } from 'detox';

describe('Tournament Flow', () => {
    it('should create and manage tournament', async () => {
        await device.launchApp();
        
        await element(by.text('Create Tournament')).tap();
        await element(by.placeholder('Tournament Name')).typeText('E2E Test');
        await element(by.text('Next')).tap();
        
        // Continue with tournament setup
    });
});
```

This comprehensive documentation provides all the technical details needed to understand the current application architecture and develop a mobile version. The modular design and clear separation of concerns make it well-suited for React Native migration.
