# Pairings Display Fix

## Problem
The public tournament page was showing generic "Player 1" vs "Player 2" instead of actual player names in the pairings section.

## Root Cause
The tournament's `pairing_schedule` field contained placeholder names like "Player 1", "Player 2" instead of actual player names or IDs. The rendering logic was trying to find players by matching these placeholder names, which failed.

## Solution
Updated the pairings rendering logic in `PublicTournamentPageNew.jsx` to:

1. **Check for player IDs first**: If the pairing data contains `player1_id` and `player2_id`, use those to find actual players
2. **Handle placeholder names**: If the pairing contains generic names like "Player 1", map them by position/seed to actual players
3. **Fallback to name matching**: For actual player names, continue using name-based lookup
4. **Added debug logging**: To help troubleshoot pairing data issues

## Code Changes
- Enhanced the pairing mapping logic to handle multiple data structures
- Added proper player lookup by seed/position for placeholder names
- Improved debugging with console logs for pairing data

## Testing
The fix should now display actual player names in the pairings section instead of generic placeholders.

## Files Modified
- `src/pages/PublicTournamentPageNew.jsx`