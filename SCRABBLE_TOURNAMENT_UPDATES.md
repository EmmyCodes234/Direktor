# Scrabble Tournament System Updates

## 1. Bye and Forfeit Score Updates

Updated the default score values for bye and forfeit/withdrawal matches from 400 to 100 points.

### Files Modified:
- `src/pages/tournament-command-center-dashboard/index.jsx`
- `src/pages/tournament-command-center-dashboard/components/ScoreEntryModal.jsx`
- `PAIRING_FIXES_SUMMARY.md`

### Changes:
- Changed bye scores from 400-0 to 100-0
- Changed forfeit/withdrawal scores from 400-0 to 100-0
- Updated documentation to reflect new score values

## 2. Public Tournament Announcements Section

Added a compact announcements section below the ticker on the public tournament index page.

### Files Modified:
- `src/pages/PublicTournamentIndex.jsx`

### Changes:
- Added state and effect hooks to fetch announcements
- Added real-time subscription for announcements updates
- Added a horizontal scrolling announcements display below the ticker
- Adjusted main content padding to accommodate the new section