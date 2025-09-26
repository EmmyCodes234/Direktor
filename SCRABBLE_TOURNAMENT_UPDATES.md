# Scrabble Tournament System Updates

## 1. Score Entry Values
- Changed default bye/forfeit spread values from 400 to 100 points in ScoreEntryModal.jsx and tournament-command-center-dashboard/index.jsx

## 2. Public Tournament Index
- Added announcements section under the ticker in PublicTournamentIndex.jsx using the existing AnnouncementsDisplay component
- Fixed positioning issue where ticker was covering the announcements section by adjusting the top positions and main content padding
- Improved error handling and data processing in PublicTournamentIndex.jsx to make player count and games played updates more robust
- Added debugging information to real-time updates to help identify any issues with data synchronization

## 3. Currency Column
- Added currency column to tournaments table via migration 20250101000018_add_currency_column_to_tournaments.sql
- Column added with default value '$' and updated existing records

## 4. Prize Table Duplicate Issue
- Added migration 20250101000019_add_unique_constraint_to_prizes.sql to handle existing duplicates and prevent future ones:
  - First removes existing duplicate prizes (keeping only the first one inserted)
  - Adds unique constraint on (tournament_id, rank) combination in prizes table
  - Creates index for better performance
- Fixed PrizeManager.jsx component to properly fetch existing prizes and handle duplicates:
  - Uncommented and fixed data fetching logic
  - Improved duplicate detection with both client-side and database-level checks
  - Enhanced error handling for unique constraint violations
  - Improved rank management to automatically set next available rank

## 5. Player Roster Real-time Updates
- Added real-time subscription to PublicTournamentRoster.jsx to listen for changes to tournament players and tournaments tables
- Fixed issue where player roster was not updating for old and new tournaments by implementing proper real-time updates
- The roster now automatically refreshes when players are added, removed, or modified