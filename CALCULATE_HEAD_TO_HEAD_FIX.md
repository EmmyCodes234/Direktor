# Calculate Head-to-Head Function Fix

## Issue
```
ReferenceError: Cannot access 'calculateHeadToHead' before initialization
```

This error occurred in the Tournament Command Center Dashboard because the `calculateHeadToHead` function was being called before it was defined, creating a "temporal dead zone" error.

## Root Cause
The function was defined as a `const` after the `useMemo` hook where it was being used:

**Problem Structure:**
```javascript
const rankedPlayers = useMemo(() => {
  // ... sorting logic ...
  const headToHeadResult = calculateHeadToHead(a, b, recentResults); // ❌ Called here
  // ... more logic ...
}, [dependencies]);

// Helper function defined AFTER useMemo
const calculateHeadToHead = (playerA, playerB, results) => { // ❌ Defined here
  // ... function logic ...
};
```

## Solution Applied
Moved the helper functions before the `useMemo` and wrapped them in `useCallback` for better performance:

**Fixed Structure:**
```javascript
// Helper functions defined BEFORE useMemo
const calculateHeadToHead = useCallback((playerA, playerB, results) => {
  const headToHeadGames = results.filter(r => 
    (r.player1_id === playerA.player_id && r.player2_id === playerB.player_id) ||
    (r.player1_id === playerB.player_id && r.player2_id === playerA.player_id)
  );
  
  if (headToHeadGames.length === 0) return 0;
  
  let aWins = 0, bWins = 0;
  headToHeadGames.forEach(game => {
    if (game.player1_id === playerA.player_id) {
      if (game.score1 > game.score2) aWins++;
      else if (game.score2 > game.score1) bWins++;
    } else {
      if (game.score2 > game.score1) aWins++;
      else if (game.score1 > game.score2) bWins++;
    }
  });
  
  return aWins - bWins;
}, []);

const calculateOpponentWinPercentage = useCallback((player, results, allPlayers) => {
  // ... function logic ...
}, []);

const rankedPlayers = useMemo(() => {
  // ... sorting logic ...
  const headToHeadResult = calculateHeadToHead(a, b, recentResults); // ✅ Now works
  // ... more logic ...
}, [dependencies]);
```

## Changes Made

### 1. Moved Helper Functions
- Moved `calculateHeadToHead` and `calculateOpponentWinPercentage` functions before the `useMemo`
- Wrapped them in `useCallback` for performance optimization
- Removed duplicate function definitions that were after the `useMemo`

### 2. Function Definitions
Both helper functions are now properly defined before they're used:

- **calculateHeadToHead**: Compares two players' head-to-head record
- **calculateOpponentWinPercentage**: Calculates the win percentage of a player's opponents

### 3. Performance Benefits
Using `useCallback` ensures these functions are only recreated when their dependencies change, improving performance.

## Files Modified
- `src/pages/tournament-command-center-dashboard/index.jsx`

## Testing
- ✅ Build completes successfully
- ✅ No more "temporal dead zone" errors
- ✅ Tournament dashboard should load without JavaScript errors

## Technical Notes
This is a common JavaScript issue where:
- `function` declarations are hoisted and can be called before they're defined
- `const` and `let` declarations are not hoisted and create a temporal dead zone
- `useCallback` is used to memoize functions in React for performance

The fix ensures proper function availability and follows React best practices for function definitions within components.