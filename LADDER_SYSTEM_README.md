# 🏆 Ladder System Mode

## Overview

The **Ladder System Mode** is a specialized tournament type designed for ongoing competitive structures where players move between divisions/leagues over time. It provides a complete promotion/relegation system with configurable carry-over policies, automatic rating-based placement, and season management.

## 🎯 Key Features

### **Multi-Division Structure**
- **Flexible Division Configuration**: Create unlimited divisions with custom rating ranges
- **Color-Coded Divisions**: Each division has a unique color for easy identification
- **Rating-Based Placement**: Players are automatically placed in appropriate divisions based on their rating
- **Dynamic Division Management**: Add, remove, or modify divisions at any time

### **Promotion & Relegation System**
- **Performance-Based Movement**: Top performers promote, bottom performers relegate
- **Configurable Rules**: Set how many players promote/relegate per season
- **Rating Thresholds**: Automatic promotion/relegation based on rating milestones
- **Manual Override**: Directors can manually promote/demote players when needed

### **Carry-Over System**
- **Multiple Policies**: None, Full, Partial, Capped, or Seeding-Only carry-over
- **Configurable Percentages**: Set exact carry-over percentages for partial policies
- **Spread Caps**: Limit carry-over spread to prevent overwhelming advantages
- **Transparent Display**: Show carry-over values in standings for complete transparency

### **Season Management**
- **Flexible Season Length**: Configure seasons from 4 to 20 rounds
- **Season Transitions**: Choose how to handle data between seasons
- **Automatic Season Tracking**: System tracks current season and progress
- **Historical Data**: Complete audit trail of all season transitions

### **Rating System Integration**
- **Elo Rating System**: Standard chess-style rating calculations
- **Configurable K-Factor**: Adjust rating volatility (10-100)
- **Rating Bounds**: Set minimum and maximum rating limits
- **Automatic Updates**: Ratings update automatically after each game

## 🚀 Getting Started

### **1. Create a Ladder Tournament**

1. **Start Tournament Setup**: Go to tournament creation wizard
2. **Select Ladder System**: Choose "Ladder System" as tournament type
3. **Configure Basic Details**: Set name, venue, dates, etc.
4. **Add Players**: Import or add players to the tournament
5. **Configure Divisions**: Set up your division structure

### **2. Configure Ladder Settings**

Navigate to **Tournament Settings** → **Ladder System Configuration**:

#### **Enable Ladder Mode**
- Toggle "Enable Ladder System Mode" to activate

#### **Division Configuration**
```json
{
  "divisions": [
    {
      "name": "Premier",
      "minRating": 1800,
      "maxRating": 9999,
      "color": "#FFD700"
    },
    {
      "name": "Division 1", 
      "minRating": 1600,
      "maxRating": 1799,
      "color": "#C0C0C0"
    },
    {
      "name": "Division 2",
      "minRating": 1400, 
      "maxRating": 1599,
      "color": "#CD7F32"
    },
    {
      "name": "Division 3",
      "minRating": 0,
      "maxRating": 1399,
      "color": "#4A90E2"
    }
  ]
}
```

#### **Promotion Rules**
- **Top Players to Promote**: Number of top performers who promote (default: 2)
- **Bottom Players to Relegate**: Number of bottom performers who relegate (default: 2)
- **Auto-Promote Rating**: Rating threshold for automatic promotion (default: 1800)
- **Auto-Relegate Rating**: Rating threshold for automatic relegation (default: 1600)

#### **Carry-Over Policy**
- **Policy Type**: Choose from None, Full, Partial, Capped, or Seeding-Only
- **Percentage**: For partial policies, set carry-over percentage (default: 75%)
- **Spread Cap**: For capped policies, set maximum spread per game (default: 100)
- **Display Options**: Toggle whether to show carry-over values in standings

#### **Season Configuration**
- **Season Length**: Number of rounds per season (default: 8)
- **Season Transition**: How to handle data between seasons
  - **Carry-over**: Keep all data between seasons
  - **Reset**: Start fresh each season
  - **Partial Reset**: Keep 50% of data between seasons

#### **Rating System**
- **Rating System**: Choose Elo, Glicko, or Custom
- **K-Factor**: Rating volatility (default: 32)
- **Rating Floor**: Minimum rating (default: 1000)
- **Rating Ceiling**: Maximum rating (default: 2500)

## 📊 Dashboard Features

### **Enhanced Standings View**
- **Division Navigation**: Switch between divisions with color-coded tabs
- **Promotion Indicators**: Visual indicators for players who will promote/relegate
- **Carry-Over Display**: Separate columns for carry-over, current, and total values
- **Rating Information**: Player ratings displayed alongside standings
- **Mobile Responsive**: Optimized view for all device sizes

### **Real-Time Updates**
- **Automatic Calculations**: Standings update immediately after results
- **Promotion Alerts**: System highlights players eligible for movement
- **Rating Changes**: Automatic rating updates with visual feedback
- **Season Progress**: Track current season and round progress

## 🔧 Advanced Features

### **Manual Player Management**
- **Promote/Demote Players**: Manual control over player movements
- **Real-Time Preview**: See carry-over calculations before applying changes
- **Audit Trail**: Complete history of all player movements
- **Bulk Operations**: Move multiple players simultaneously

### **Season Management**
- **Start New Season**: Automatically transition to new season
- **Season History**: View complete history of all seasons
- **Data Preservation**: Choose how to handle historical data
- **Season Statistics**: Track performance across seasons

### **Rating System**
- **Automatic Updates**: Ratings update after each game
- **Performance Tracking**: Monitor rating changes over time
- **Division Placement**: Automatic placement based on current rating
- **Rating History**: Complete history of rating changes

## 📈 Use Cases

### **Chess Clubs**
- **Multiple Divisions**: Premier, A, B, C divisions based on rating
- **Monthly Seasons**: 8-round seasons with promotion/relegation
- **Rating-Based Placement**: Automatic division assignment
- **Carry-Over System**: Maintain competitive continuity

### **Gaming Communities**
- **Skill-Based Ladders**: Bronze, Silver, Gold, Platinum divisions
- **Weekly Seasons**: Short seasons for frequent competition
- **Performance Tracking**: Monitor improvement over time
- **Community Building**: Encourage regular participation

### **Academic Competitions**
- **Difficulty Levels**: Beginner, Intermediate, Advanced divisions
- **Semester Seasons**: Align with academic calendar
- **Progress Tracking**: Monitor student improvement
- **Fair Competition**: Ensure appropriate skill matching

### **Sports Organizations**
- **League Structure**: Premier, Championship, League One divisions
- **Seasonal Play**: Traditional season-based competition
- **Promotion/Relegation**: Classic sports ladder system
- **Historical Data**: Maintain long-term competitive records

## 🔒 Security & Permissions

### **Row-Level Security**
- **Tournament Directors**: Full access to ladder configuration
- **Player Data**: Protected by tournament ownership
- **Audit Trail**: Complete history of all changes
- **Data Integrity**: Automatic validation and constraints

### **Data Protection**
- **Encrypted Storage**: All sensitive data encrypted at rest
- **Access Control**: Role-based permissions system
- **Audit Logging**: Complete trail of all system actions
- **Backup Systems**: Automatic data backup and recovery

## 🛠️ Technical Implementation

### **Database Schema**
```sql
-- Core ladder configuration
ladder_system_config (
  tournament_id, is_ladder_mode, divisions, promotion_rules,
  carryover_policy, season_length, rating_system
)

-- Ladder events tracking
ladder_events (
  tournament_id, player_id, event_type, from_division, to_division,
  reason, previous_rating, new_rating, season_number
)

-- Season management
ladder_seasons (
  tournament_id, season_number, start_date, end_date,
  status, total_rounds, completed_rounds
)
```

### **Key Functions**
- `get_player_division()`: Determine player's current division
- `check_promotion_relegation()`: Check if player should move
- `process_ladder_movements()`: Apply automatic movements
- `get_ladder_standings()`: Get enhanced standings with division info
- `start_new_ladder_season()`: Begin new season with proper transitions

### **Frontend Components**
- `LadderSystemConfigSection`: Configuration interface
- `LadderStandingsTable`: Enhanced standings display
- `PlayerPromotionManager`: Manual player movement
- `PromotionEventsHistory`: Audit trail viewer

## 📱 Mobile Experience

### **Responsive Design**
- **Touch-Optimized**: Large touch targets for mobile interaction
- **Swipe Navigation**: Easy division switching on mobile
- **Card-Based Layout**: Optimized standings display for small screens
- **Quick Actions**: Streamlined mobile interface for common tasks

### **Mobile Features**
- **Division Tabs**: Easy switching between divisions
- **Player Cards**: Compact player information display
- **Promotion Indicators**: Clear visual indicators for movements
- **Quick Stats**: Essential information at a glance

## 🔄 Migration & Setup

### **Database Migration**
```bash
# Apply the ladder system migration
npx supabase db push
```

### **Existing Tournaments**
- **Automatic Setup**: Existing tournaments can enable ladder mode
- **Data Preservation**: All existing data preserved during migration
- **Gradual Rollout**: Enable ladder features incrementally
- **Backward Compatibility**: Works with existing tournament data

### **New Tournaments**
- **Ladder Type Selection**: Choose "Ladder System" during creation
- **Default Configuration**: Pre-configured with sensible defaults
- **Quick Setup**: Minimal configuration required to start
- **Guided Configuration**: Step-by-step setup wizard

## 🎯 Best Practices

### **Division Design**
- **Balanced Sizes**: Aim for 8-16 players per division
- **Rating Ranges**: Overlap slightly to allow for rating changes
- **Clear Names**: Use descriptive division names
- **Color Coding**: Choose distinct colors for easy identification

### **Promotion Rules**
- **Conservative Movement**: Start with 1-2 players per season
- **Performance Thresholds**: Require minimum games for promotion
- **Rating Limits**: Set reasonable auto-promotion thresholds
- **Manual Review**: Always review automatic movements

### **Season Planning**
- **Appropriate Length**: 6-12 rounds per season works well
- **Regular Schedule**: Consistent season timing
- **Transition Planning**: Plan for season transitions
- **Data Retention**: Decide on historical data policies

### **Rating System**
- **Consistent K-Factor**: Use same K-factor across all divisions
- **Rating Bounds**: Set reasonable min/max ratings
- **Regular Updates**: Update ratings after each game
- **Performance Tracking**: Monitor rating trends

## 🚀 Future Enhancements

### **Planned Features**
- **Advanced Rating Systems**: Glicko-2, TrueSkill integration
- **Tournament Templates**: Pre-configured ladder setups
- **API Integration**: External rating system connections
- **Advanced Analytics**: Detailed performance metrics

### **Community Features**
- **Player Profiles**: Enhanced player statistics
- **Achievement System**: Badges and milestones
- **Social Features**: Player communication tools
- **Leaderboards**: Historical performance rankings

## 📞 Support & Documentation

### **Getting Help**
- **Documentation**: Complete API and usage documentation
- **Community Forum**: User community for questions and tips
- **Support Tickets**: Direct support for technical issues
- **Video Tutorials**: Step-by-step setup guides

### **Resources**
- **API Reference**: Complete function documentation
- **Configuration Guide**: Detailed setup instructions
- **Best Practices**: Recommended configurations
- **Troubleshooting**: Common issues and solutions

---

**The Ladder System Mode** provides a complete solution for organizations that need ongoing competitive structures with promotion/relegation systems. Whether you're running a chess club, gaming community, or academic competition, the ladder system offers the flexibility and features needed for successful long-term competitive play.
