# Carry-Over System for Player Promotions/Demotions

## Overview

The Carry-Over System is a comprehensive solution for managing player movements between groups or divisions in tournaments. It provides configurable policies for carrying over wins and spread (point differential) when players are promoted or demoted, ensuring fair and transparent competition.

## Features

### 🎯 **Five Configurable Policies**

1. **None** - Reset scores on promotion/demotion
2. **Full** - Carry all wins and spread
3. **Partial** - Carry a percentage of wins and spread (rounded to 2 decimals)
4. **Capped** - Carry wins but limit spread to a maximum cap per game
5. **Seeding Only** - Carry-over counts only for initial seeding, not official totals

### 📊 **Enhanced Standings Display**

- Separate columns for Carryover, Current, and Total values
- Visual indicators for players with carry-over
- Mobile-responsive design
- Configurable display options

### 🔍 **Audit Trail**

- Complete history of all promotion/demotion events
- Detailed records of applied policies and calculations
- Justification for all adjustments
- Exportable audit logs

### ⚙️ **Tournament Director Controls**

- Easy policy configuration in tournament settings
- Real-time preview of carry-over calculations
- Bulk player movement capabilities
- Policy validation and error handling

## Database Schema

### Core Tables

#### `carryover_config`
```sql
CREATE TABLE carryover_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    policy carryover_policy NOT NULL DEFAULT 'none',
    percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    spread_cap DECIMAL(10,2) CHECK (spread_cap >= 0),
    show_carryover_in_standings BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id)
);
```

#### `promotion_events`
```sql
CREATE TABLE promotion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    from_group_id UUID,
    to_group_id UUID NOT NULL,
    event_type TEXT CHECK (event_type IN ('promotion', 'demotion', 'initial_placement')),
    carryover_wins DECIMAL(10,2) DEFAULT 0,
    carryover_spread DECIMAL(10,2) DEFAULT 0,
    applied_policy carryover_policy NOT NULL,
    policy_config JSONB DEFAULT '{}',
    previous_wins INTEGER DEFAULT 0,
    previous_losses INTEGER DEFAULT 0,
    previous_ties INTEGER DEFAULT 0,
    previous_spread DECIMAL(10,2) DEFAULT 0,
    previous_games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

#### Enhanced `tournament_players`
```sql
ALTER TABLE tournament_players 
ADD COLUMN carryover_wins DECIMAL(10,2) DEFAULT 0,
ADD COLUMN carryover_spread DECIMAL(10,2) DEFAULT 0,
ADD COLUMN current_wins INTEGER DEFAULT 0,
ADD COLUMN current_losses INTEGER DEFAULT 0,
ADD COLUMN current_ties INTEGER DEFAULT 0,
ADD COLUMN current_spread DECIMAL(10,2) DEFAULT 0,
ADD COLUMN total_wins DECIMAL(10,2) DEFAULT 0,
ADD COLUMN total_spread DECIMAL(10,2) DEFAULT 0;
```

### Database Functions

#### `calculate_carryover()`
Calculates carry-over values based on policy and player stats.

#### `apply_carryover_to_player()`
Applies carry-over to a player and creates audit record.

#### `update_player_totals()`
Automatically updates total standings when current stats change.

#### `get_player_standings_with_carryover()`
Returns enhanced standings with carry-over information.

## Frontend Components

### 1. CarryoverConfigSection
**Location**: `src/components/settings/CarryoverConfigSection.jsx`

Configuration interface for tournament directors to set carry-over policies.

**Features**:
- Policy selection with descriptions
- Dynamic configuration fields based on policy
- Real-time policy examples
- Save/load configuration

### 2. PlayerPromotionManager
**Location**: `src/components/players/PlayerPromotionManager.jsx`

Interface for promoting/demoting players with carry-over preview.

**Features**:
- Player and target group selection
- Real-time carry-over calculation preview
- Policy information display
- Confirmation workflow

### 3. CarryoverStandingsTable
**Location**: `src/components/players/CarryoverStandingsTable.jsx`

Enhanced standings table with carry-over columns.

**Features**:
- Configurable column display
- Mobile-responsive design
- Visual indicators for carry-over
- Policy information display

### 4. PromotionEventsHistory
**Location**: `src/components/players/PromotionEventsHistory.jsx`

Audit trail viewer for promotion events.

**Features**:
- Complete event history
- Policy details and calculations
- Summary statistics
- Mobile-responsive design

## Policy Examples

### None Policy
```
Player: 8 wins, 2 losses, +150 spread
Result: 0.00 wins, +0.00 spread carried over
```

### Full Policy
```
Player: 8 wins, 2 losses, +150 spread
Result: 8.00 wins, +150.00 spread carried over
```

### Partial Policy (50%)
```
Player: 8 wins, 2 losses, +150 spread
Result: 4.00 wins, +75.00 spread carried over
```

### Capped Policy (100 points per game)
```
Player: 8 wins, 2 losses, +150 spread (10 games)
Result: 8.00 wins, +100.00 spread carried over (capped at 100 × 10 = 1000)
```

### Seeding Only Policy
```
Player: 8 wins, 2 losses, +150 spread
Result: Used for seeding only, not counted in official totals
```

## Usage Guide

### For Tournament Directors

1. **Configure Policy**:
   - Go to Tournament Settings
   - Navigate to "Carry-Over Configuration"
   - Select desired policy
   - Configure policy-specific parameters
   - Save configuration

2. **Promote/Demote Players**:
   - Access Player Management
   - Select "Promote/Demote Player"
   - Choose player and target group
   - Review carry-over preview
   - Confirm action

3. **View Audit Trail**:
   - Access Promotion Events History
   - Review all player movements
   - Export audit logs if needed

### For Players

1. **View Standings**:
   - Check tournament standings
   - See carry-over values (if enabled)
   - Understand how totals are calculated

2. **Track Progress**:
   - Monitor carry-over from previous groups
   - See current performance in new group
   - View combined totals

## API Endpoints

### Carry-Over Configuration
```javascript
// Get configuration
GET /carryover_config?tournament_id=eq.{id}

// Update configuration
PUT /carryover_config
{
  "tournament_id": "uuid",
  "policy": "partial",
  "percentage": 50,
  "show_carryover_in_standings": true
}
```

### Player Movement
```javascript
// Apply carry-over to player
POST /rpc/apply_carryover_to_player
{
  "p_tournament_id": "uuid",
  "p_player_id": "uuid",
  "p_to_group_id": "uuid",
  "p_event_type": "promotion"
}
```

### Standings
```javascript
// Get enhanced standings
GET /rpc/get_player_standings_with_carryover
{
  "p_tournament_id": "uuid"
}
```

## Testing

### Unit Tests
**Location**: `src/tests/carryover.test.js`

Comprehensive test suite covering:
- All policy calculations
- Edge cases and error handling
- Complex scenarios
- Data validation
- Integration tests

### Test Coverage
- ✅ Policy calculations (none, full, partial, capped, seedingOnly)
- ✅ Edge cases (zero stats, negative spread, decimal wins)
- ✅ Error handling (missing parameters, invalid policies)
- ✅ Complex scenarios (multiple carry-overs, high spreads)
- ✅ Data validation (null values, string numbers)

## Security

### Row Level Security (RLS)
- Tournament directors can only manage their own tournaments
- Players can only view their own data
- Audit trail preserves user accountability

### Data Integrity
- Database constraints ensure valid policy parameters
- Triggers automatically update totals
- Foreign key constraints maintain referential integrity

## Performance

### Optimizations
- Indexed queries for fast standings retrieval
- Efficient carry-over calculations
- Minimal database calls
- Cached policy configurations

### Scalability
- Supports large tournaments with many players
- Efficient audit trail storage
- Optimized for mobile devices

## Migration Guide

### From Existing Tournaments
1. Run migration: `npx supabase db push`
2. Existing tournaments get default 'none' policy
3. Existing player stats are preserved
4. Carry-over fields are initialized to zero

### Data Migration
```sql
-- Initialize carry-over config for existing tournaments
INSERT INTO carryover_config (tournament_id, policy, show_carryover_in_standings)
SELECT id, 'none', TRUE
FROM tournaments
WHERE id NOT IN (SELECT tournament_id FROM carryover_config);

-- Update existing tournament_players
UPDATE tournament_players 
SET 
    carryover_wins = 0,
    carryover_spread = 0,
    current_wins = COALESCE(wins, 0),
    current_losses = COALESCE(losses, 0),
    current_ties = COALESCE(ties, 0),
    current_spread = COALESCE(spread, 0),
    total_wins = COALESCE(wins, 0),
    total_spread = COALESCE(spread, 0)
WHERE carryover_wins IS NULL;
```

## Troubleshooting

### Common Issues

1. **Carry-over not showing in standings**
   - Check if `show_carryover_in_standings` is enabled
   - Verify policy configuration
   - Ensure player has carry-over values

2. **Incorrect carry-over calculations**
   - Verify policy parameters (percentage, spread cap)
   - Check player stats before movement
   - Review audit trail for applied policy

3. **Database errors**
   - Ensure migration is applied
   - Check RLS policies
   - Verify foreign key constraints

### Debug Mode
Enable debug logging to trace carry-over calculations:
```javascript
console.log('Carry-over calculation:', {
    policy: config.policy,
    player: playerStats,
    result: carryoverResult
});
```

## Future Enhancements

### Planned Features
- [ ] Bulk player movement operations
- [ ] Advanced policy combinations
- [ ] Carry-over templates for different tournament types
- [ ] Integration with external rating systems
- [ ] Automated promotion/demotion suggestions

### API Extensions
- [ ] RESTful API for external integrations
- [ ] Webhook notifications for player movements
- [ ] Batch operations for multiple players
- [ ] Policy validation endpoints

## Support

For questions or issues with the Carry-Over System:
1. Check the troubleshooting section
2. Review audit logs for policy applications
3. Verify database migration status
4. Contact tournament support

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Compatibility**: Requires Supabase and React 18+
