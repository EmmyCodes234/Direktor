# Scrabble Tournament System Updates

## 1. Score Entry Values
- Changed default bye/forfeit spread values from 400 to 100 points in ScoreEntryModal.jsx and tournament-command-center-dashboard/index.jsx

## 2. Public Tournament Index
- Added announcements section under the ticker in PublicTournamentIndex.jsx using the existing AnnouncementsDisplay component
- Fixed positioning issue where ticker was covering the announcements section by adjusting the top positions and main content padding

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