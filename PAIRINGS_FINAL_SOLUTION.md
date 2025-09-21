# Pairings Display - Final Solution

## Problem
The PairingsTable component was showing "TBD" instead of actual player names because it didn't have access to the player data to resolve player IDs to names.

## Root Cause
The `generatePairings()` function in `PublicTournamentPairings.jsx` returns pairings with `player1_id` and `player2_id`, but the `PairingsTable` component wasn't receiving the `players` array to resolve these IDs to actual names.

## Solution Applied

### 1. Updated PublicTournamentPairings.jsx
- Added `players` and `teams` props to the PairingsTable component call
- This passes the actual player and team data to the component

### 2. Updated PairingsTable.jsx
- Added `players` and `teams` parameters to the component props
- Enhanced player name resolution logic to:
  - Find players by ID using the players array
  - Handle team tournaments using the teams array
  - Provide proper fallbacks for unknown players/teams

## Key Changes

**PublicTournamentPairings.jsx:**
```jsx
<PairingsTable 
  pairings={generatePairings()}
  tournamentType={tournament?.type}
  isLoading={loading}
  selectedRound={selectedRound}
  players={players}
  teams={teams}
/>
```

**PairingsTable.jsx:**
- Added players/teams props
- Enhanced name resolution to use actual player data
- Better handling of team tournaments

## Expected Result
Pairings should now display actual player names instead of "TBD" or placeholder names.

## Files Modified
- `src/pages/PublicTournamentPairings.jsx`
- `src/components/PairingsTable.jsx`