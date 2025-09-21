# Pairings Display Fix V2

## Changes Made

1. **Simplified Data Source Priority**: 
   - Always check matches table first (has player IDs)
   - Fallback to pairing_schedule only if no matches data

2. **Improved Player Name Resolution**:
   - For matches table: Use player_id to find actual player objects
   - For pairing_schedule with "Player X" format: Map by position to sorted players
   - For pairing_schedule with real names: Direct name matching

3. **Removed Debug Logs**: Cleaned up console logging for production

## Expected Result
- Pairings should now show actual player names instead of "Player 1" vs "Player 2"
- Works for both matches table data and pairing_schedule data

## Test
Refresh the tournament page and check if player names are now displayed correctly in the pairings section.