/**
 * Gibson Rule Implementation for Tournament Pairings
 * 
 * The Gibson rule is used in later rounds of a tournament to pair a player who has 
 * clinched first place against the highest-ranked non-prizewinner.
 * 
 * For best of league tournaments, the Gibson rule is applied differently as players
 * compete in matches rather than individual games.
 */

/**
 * Determines if a player has clinched first place based on points and rounds remaining
 * @param {Object} player - The player to check
 * @param {Array} players - All players in the tournament
 * @param {number} roundsRemaining - Number of rounds remaining in the tournament
 * @param {number} prizeCount - Number of prize positions
 * @returns {boolean} - True if the player has clinched first place
 */
export const hasClinchedFirstPlace = (player, players, roundsRemaining, prizeCount, tournamentType = 'individual') => {
  if (!player || !players || players.length === 0) return false;
  
  // Sort players by rank (best first)
  const sortedPlayers = [...players].sort((a, b) => (a.rank || 999) - (b.rank || 999));
  
  // If this isn't the current first place player, they haven't clinched
  if (sortedPlayers[0]?.player_id !== player.player_id) return false;
  
  // If there's no second place player, assume clinched
  if (sortedPlayers.length < 2) return true;
  
  const firstPlacePlayer = sortedPlayers[0];
  const secondPlacePlayer = sortedPlayers[1];
  
  // For best of league tournaments, use match wins instead of game wins
  if (tournamentType === 'best_of_league') {
    // Calculate scores based on match wins
    const firstScore = firstPlacePlayer.match_wins || 0;
    const secondScore = secondPlacePlayer.match_wins || 0;
    
    // Gibson rule applies in late stages
    const isLateStage = roundsRemaining <= 3;
    
    if (isLateStage) {
      // If first place has insurmountable lead based on possible matches
      const maxPossibleSecondScore = secondScore + roundsRemaining;
      if (firstScore > maxPossibleSecondScore) {
        return true;
      }
      
      // If first place has significant lead
      if (firstScore - secondScore > 1 && roundsRemaining <= 2) {
        return true;
      }
    }
  } else {
    // For individual tournaments, use game wins + 0.5 * ties
    const firstScore = (firstPlacePlayer.wins || 0) + (firstPlacePlayer.ties || 0) * 0.5;
    const secondScore = (secondPlacePlayer.wins || 0) + (secondPlacePlayer.ties || 0) * 0.5;
    
    // Gibson rule applies in late stages (typically last 2-3 rounds)
    const isLateStage = roundsRemaining <= 3;
    
    // Simple check: if first place has enough points that second place can't catch up
    // This is a simplified version - in practice this would be more complex
    if (isLateStage) {
      // If first place has more than 2 points lead with 2 rounds left or less
      if (firstScore - secondScore > 2 && roundsRemaining <= 2) {
        return true;
      }
      
      // If first place has insurmountable lead based on possible points
      const maxPossibleSecondScore = secondScore + roundsRemaining;
      if (firstScore > maxPossibleSecondScore) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Gets the highest-ranked non-prize winner
 * @param {Array} players - All players in the tournament
 * @param {number} prizeCount - Number of prize positions
 * @returns {Object|null} - The highest-ranked non-prize winner or null
 */
export const getHighestRankedNonPrizeWinner = (players, prizeCount = 3) => {
  if (!players || players.length === 0) return null;
  
  // Sort players by rank (best first)
  const sortedPlayers = [...players].sort((a, b) => (a.rank || 999) - (b.rank || 999));
  
  // Find the first player whose rank is outside the prize positions
  const nonPrizeWinners = sortedPlayers.filter(p => (p.rank || 999) > prizeCount);
  
  return nonPrizeWinners.length > 0 ? nonPrizeWinners[0] : null;
};

/**
 * Creates Gibson pairings for players who have clinched first place
 * @param {Array} players - All players in the tournament
 * @param {number} roundsRemaining - Number of rounds remaining
 * @param {number} prizeCount - Number of prize positions
 * @param {string} tournamentType - Type of tournament (individual, best_of_league, etc.)
 * @returns {Array} - Array of Gibson pairings
 */
export const createGibsonPairings = (players, roundsRemaining, prizeCount = 3, tournamentType = 'individual') => {
  if (!players || players.length === 0) return [];
  
  const gibsonPairings = [];
  const playersToExclude = new Set();
  
  // Check each player to see if they've clinched first place
  players.forEach(player => {
    if (hasClinchedFirstPlace(player, players, roundsRemaining, prizeCount, tournamentType)) {
      const nonPrizeWinner = getHighestRankedNonPrizeWinner(players, prizeCount);
      
      if (nonPrizeWinner && !playersToExclude.has(player.player_id) && !playersToExclude.has(nonPrizeWinner.player_id)) {
        // Create Gibson pairing
        gibsonPairings.push({
          table: 'GIBSON',
          player1: {
            player_id: player.player_id,
            name: player.name,
            rating: player.rating,
            division: player.division
          },
          player2: {
            player_id: nonPrizeWinner.player_id,
            name: nonPrizeWinner.name,
            rating: nonPrizeWinner.rating,
            division: nonPrizeWinner.division
          },
          isGibsonPairing: true
        });
        
        // Mark these players as paired to avoid double pairing
        playersToExclude.add(player.player_id);
        playersToExclude.add(nonPrizeWinner.player_id);
      }
    }
  });
  
  return gibsonPairings;
};

/**
 * Applies Gibson rule to existing pairings
 * @param {Array} existingPairings - Existing pairings to potentially modify
 * @param {Array} players - All players in the tournament
 * @param {number} currentRound - Current round number
 * @param {number} totalRounds - Total number of rounds
 * @param {number} prizeCount - Number of prize positions
 * @param {string} tournamentType - Type of tournament (individual, best_of_league, etc.)
 * @returns {Array} - Modified pairings with Gibson rule applied if applicable
 */
export const applyGibsonRuleToPairings = (existingPairings, players, currentRound, totalRounds, prizeCount = 3, tournamentType = 'individual') => {
  const roundsRemaining = totalRounds - currentRound;
  
  // Only apply Gibson rule in late stages
  if (roundsRemaining > 3) {
    return existingPairings;
  }
  
  // Create Gibson pairings
  const gibsonPairings = createGibsonPairings(players, roundsRemaining, prizeCount, tournamentType);
  
  // If we have Gibson pairings, we need to modify the existing pairings
  if (gibsonPairings.length > 0) {
    // For simplicity in this public view, we'll just add the Gibson pairings
    // In a real pairing system, we would need to remove the affected players from other pairings
    return [...gibsonPairings, ...existingPairings];
  }
  
  return existingPairings;
};

export default {
  hasClinchedFirstPlace,
  getHighestRankedNonPrizeWinner,
  createGibsonPairings,
  applyGibsonRuleToPairings
};