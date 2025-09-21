# PairingsTable Component Fix

## Problem Identified
The issue was in the `PairingsTable` component (`src/components/PairingsTable.jsx`), not in the main tournament page components. This component was falling back to "Player 1" and "Player 2" when it couldn't resolve actual player names.

## Root Cause
The PairingsTable component's player name resolution logic was too simplistic:
```javascript
const player1Name = pairing.player1_name || 
                  (pairing.player1 && pairing.player1.name) || 
                  'Player 1';  // This was the fallback causing the issue
```

## Solution Applied
Enhanced the player name resolution in `PairingsTable.jsx` (lines ~217-240) to:

1. **Try player ID lookup first**: Attempt to find players by their IDs within the pairings data
2. **Fallback to existing name fields**: Use `player1_name` or `player1.name` if available
3. **Handle placeholder names**: Convert "Player X" format to "Seed X" for better clarity
4. **Use 'TBD' instead of generic names**: More appropriate fallback than "Player 1"

## Key Changes
- Added intelligent player lookup by ID
- Improved handling of placeholder names
- Better fallback naming convention
- More robust name resolution logic

## Expected Result
Pairings should now show actual player names or more appropriate placeholders like "Seed 1" instead of "Player 1".

## Files Modified
- `src/components/PairingsTable.jsx`

## Note
This component is used by `PublicTournamentPairings.jsx` which is accessed via the route `/tournament/:tournamentSlug/public-pairings`.