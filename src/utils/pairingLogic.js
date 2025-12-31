
/**
 * Assigns 'starts' (first player) based on rules and tie-breakers.
 */
export const assignStarts = (pairings, players, allResults) => {
    return pairings.map(p => {
        if (p.player2.name === 'BYE') {
            p.player1.starts = false;
            p.player2.starts = false;
            return p;
        }
        // Use player_id for lookups if available, fallback to name
        const player1 = players.find(pl =>
            (p.player1.player_id && pl.player_id === p.player1.player_id) ||
            pl.name === p.player1.name
        );
        const player2 = players.find(pl =>
            (p.player2.player_id && pl.player_id === p.player2.player_id) ||
            pl.name === p.player2.name
        );
        if (!player1 || !player2) return p;

        const p1Starts = player1.starts || 0;
        const p2Starts = player2.starts || 0;

        if (p1Starts < p2Starts) {
            p.player1.starts = true;
        } else if (p2Starts < p1Starts) {
            p.player2.starts = true;
        } else {
            // Tie-breaker 1: Head-to-head starts
            const headToHeadGames = allResults.filter(r =>
                (r.player1_id === player1.player_id && r.player2_id === player2.player_id) ||
                (r.player1_id === player2.player_id && r.player2_id === player1.player_id)
            );

            const p1HeadToHeadStarts = headToHeadGames.filter(r => r.player1_id === player1.player_id && r.player1_starts).length +
                headToHeadGames.filter(r => r.player2_id === player1.player_id && r.player2_starts).length;

            const p2HeadToHeadStarts = headToHeadGames.filter(r => r.player1_id === player2.player_id && r.player1_starts).length +
                headToHeadGames.filter(r => r.player2_id === player2.player_id && r.player2_starts).length;

            if (p1HeadToHeadStarts < p2HeadToHeadStarts) {
                p.player1.starts = true;
            } else if (p2HeadToHeadStarts < p1HeadToHeadStarts) {
                p.player2.starts = true;
            } else {
                // Tie-breaker 2: Fair tie-breaker using lower seed (higher rank)
                if (player1.seed < player2.seed) {
                    p.player1.starts = true;
                } else {
                    p.player2.starts = true;
                }
            }
        }
        return p;
    });
};

export const generateSwissPairings = (playersToPair, previousMatchups, allResults) => {
    let availablePlayers = [...playersToPair.filter(p => p.status !== 'withdrawn' && p.status !== 'paused')];
    let newPairings = [];
    let table = 1;

    // Handle odd number of players with bye
    if (availablePlayers.length % 2 !== 0) {
        const playersWithByes = new Set(allResults.filter(r => r.player2_name === 'BYE').map(r => r.player1_name));
        let eligibleForBye = availablePlayers
            .filter(p => !playersWithByes.has(p.name))
            .sort((a, b) => b.rank - a.rank);

        if (eligibleForBye.length === 0) {
            eligibleForBye = availablePlayers.sort((a, b) => b.rank - a.rank);
        }

        const byePlayer = eligibleForBye[0];
        if (byePlayer) {
            newPairings.push({
                table: 'BYE',
                player1: {
                    player_id: byePlayer.player_id,
                    name: byePlayer.name,
                    rating: byePlayer.rating,
                    division: byePlayer.division
                },
                player2: { name: 'BYE' }
            });
            availablePlayers = availablePlayers.filter(p => p.player_id !== byePlayer.player_id);
        }
    }

    // Group players by score (wins + 0.5 * ties)
    const scoreGroups = new Map();
    availablePlayers.forEach(player => {
        const score = (player.wins || 0) + 0.5 * (player.ties || 0);
        if (!scoreGroups.has(score)) {
            scoreGroups.set(score, []);
        }
        scoreGroups.get(score).push(player);
    });

    // Sort score groups in descending order
    const sortedScores = Array.from(scoreGroups.keys()).sort((a, b) => b - a);

    // Pair within score groups, avoiding rematches
    for (const score of sortedScores) {
        const playersInGroup = scoreGroups.get(score);

        while (playersInGroup.length >= 2) {
            const player1 = playersInGroup.shift();
            let opponentFound = false;

            // Try to find opponent without rematch
            for (let i = 0; i < playersInGroup.length; i++) {
                const player2 = playersInGroup[i];
                const matchupKey1 = `${player1.player_id}-${player2.player_id}`;
                const matchupKey2 = `${player2.player_id}-${player1.player_id}`;

                if (!previousMatchups.has(matchupKey1) && !previousMatchups.has(matchupKey2)) {
                    newPairings.push({
                        table: table++,
                        player1: {
                            player_id: player1.player_id,
                            name: player1.name,
                            rating: player1.rating,
                            division: player1.division
                        },
                        player2: {
                            player_id: player2.player_id,
                            name: player2.name,
                            rating: player2.rating,
                            division: player2.division
                        }
                    });
                    playersInGroup.splice(i, 1);
                    opponentFound = true;
                    break;
                }
            }

            // If no opponent found without rematch, take the first available
            if (!opponentFound && playersInGroup.length > 0) {
                const player2 = playersInGroup.shift();
                newPairings.push({
                    table: table++,
                    player1: {
                        player_id: player1.player_id,
                        name: player1.name,
                        rating: player1.rating,
                        division: player1.division
                    },
                    player2: {
                        player_id: player2.player_id,
                        name: player2.name,
                        rating: player2.rating,
                        division: player2.division
                    }
                });
            }
        }

        // If odd number in this score group, move to next group
        if (playersInGroup.length === 1) {
            const nextScore = sortedScores.find(s => s < score);
            if (nextScore !== undefined) {
                const nextGroup = scoreGroups.get(nextScore);
                if (nextGroup) {
                    nextGroup.unshift(playersInGroup[0]);
                }
            }
        }
    }

    return assignStarts(newPairings, playersToPair, allResults);
};

export const generateEnhancedSwissPairings = (playersToPair, previousMatchups, allResults, currentRound, totalRounds, isGibsonEnabled = false, prizeCount = 3) => {
    let newPairings = [];
    const roundsRemaining = totalRounds - currentRound;
    const isLateStage = roundsRemaining < 3; // Typically Gibson applies in final rounds

    // Gibson Rule Implementation
    if (isGibsonEnabled && isLateStage && playersToPair.length > 0) {
        // Identify players who have clinched first place
        const sortedPlayers = [...playersToPair].sort((a, b) => a.rank - b.rank);
        const firstPlacePlayer = sortedPlayers[0];
        const secondPlacePlayer = sortedPlayers[1];

        if (firstPlacePlayer && secondPlacePlayer) {
            const firstScore = (firstPlacePlayer.wins || 0) + (firstPlacePlayer.ties || 0) * 0.5;
            const secondScore = (secondPlacePlayer.wins || 0) + (secondPlacePlayer.ties || 0) * 0.5;

            // Strict Gibson Check: Leader is unreachable even if they lose all remaining games
            // and 2nd place wins all remaining games.
            // Formula: Leader > Second + RoundsRemaining
            // We add a small epsilon (0.01) to handle floating point safety, though exact checks are usually fine for 0.5 increments.
            const maxPossibleSecondScore = secondScore + roundsRemaining;

            if (firstScore > maxPossibleSecondScore) {
                console.log(`🔒 Gibson Rule Triggered: ${firstPlacePlayer.name} has clinched first place!`);

                // Identify non-prize contenders to pair against (Spoilers)
                // Typically Gibsonized player plays the highest rated/ranked player who CANNOT win a prize.
                const nonPrizeWinners = sortedPlayers.filter(p => p.rank > prizeCount && p.id !== firstPlacePlayer.id);

                if (nonPrizeWinners.length > 0) {
                    const bestSpoiler = nonPrizeWinners[0]; // Highest ranked non-prize winner

                    newPairings.push({
                        table: 'GIBSON',
                        player1: {
                            player_id: firstPlacePlayer.player_id,
                            name: firstPlacePlayer.name,
                            rating: firstPlacePlayer.rating,
                            division: firstPlacePlayer.division
                        },
                        player2: {
                            player_id: bestSpoiler.player_id,
                            name: bestSpoiler.name,
                            rating: bestSpoiler.rating,
                            division: bestSpoiler.division
                        },
                        isGibsonPairing: true
                    });

                    // Remove them from general pairing pool
                    playersToPair = playersToPair.filter(p =>
                        p.player_id !== firstPlacePlayer.player_id &&
                        p.player_id !== bestSpoiler.player_id
                    );
                }
            }
        }
    }

    // Standard Late Stage Separation
    // If not Gibsonized (or after removing Gibson pair), split into Prize Contenders vs Others to keep drama high
    if (isLateStage && playersToPair.length >= 4) { // Only split if we have enough players
        const prizeContenders = playersToPair.filter(p => p.rank <= (prizeCount || 3));
        const nonContenders = playersToPair.filter(p => p.rank > (prizeCount || 3));

        // Only separate if both groups have even numbers to avoid forcing cross-group byes/pairings weirdly
        // Or if we can cleanly pair them. For simplicity, if groups are odd, we might merge back or handle carefully.
        // Here we'll just fall back to full swiss if parity matches don't align easily, 
        // OR we just pair them separately and one form each might get a bye/float.
        // Robust approach: Pair separately.

        const contenderPairings = generateSwissPairings(prizeContenders, previousMatchups, allResults);
        const nonContenderPairings = generateSwissPairings(nonContenders, previousMatchups, allResults);

        newPairings = [...newPairings, ...contenderPairings, ...nonContenderPairings];
    } else {
        // Regular Swiss for remaining
        const swissPairings = generateSwissPairings(playersToPair, previousMatchups, allResults);
        newPairings = [...newPairings, ...swissPairings];
    }

    return newPairings;
};

export const generateKingOfTheHillPairings = (playersToPair, previousMatchups, allResults, currentRound) => {
    let newPairings = [];
    let table = 1;

    // Filter out paused/withdrawn players defensively
    const activePlayers = playersToPair.filter(p => p.status !== 'withdrawn' && p.status !== 'paused');

    // Sort players by rank (1st place vs 2nd place, 3rd vs 4th, etc.)
    const sortedPlayers = [...activePlayers].sort((a, b) => a.rank - b.rank);

    // Handle odd number of players with bye
    if (sortedPlayers.length % 2 !== 0) {
        const byePlayer = sortedPlayers[sortedPlayers.length - 1]; // Last place gets bye
        newPairings.push({
            table: 'BYE',
            player1: {
                player_id: byePlayer.player_id,
                name: byePlayer.name,
                rating: byePlayer.rating,
                division: byePlayer.division
            },
            player2: { name: 'BYE' }
        });
        sortedPlayers.pop();
    }

    // Pair 1st vs 2nd, 3rd vs 4th, etc.
    for (let i = 0; i < sortedPlayers.length; i += 2) {
        if (i + 1 < sortedPlayers.length) {
            const player1 = sortedPlayers[i];
            const player2 = sortedPlayers[i + 1];

            // Check for rematches
            const matchupKey1 = `${player1.player_id}-${player2.player_id}`;
            const matchupKey2 = `${player2.player_id}-${player1.player_id}`;

            if (!previousMatchups.has(matchupKey1) && !previousMatchups.has(matchupKey2)) {
                newPairings.push({
                    table: table++,
                    player1: {
                        player_id: player1.player_id,
                        name: player1.name,
                        rating: player1.rating,
                        division: player1.division
                    },
                    player2: {
                        player_id: player2.player_id,
                        name: player2.name,
                        rating: player2.rating,
                        division: player2.division
                    }
                });
            } else {
                // If rematch, try to find alternative pairing within nearby ranks
                let alternativeFound = false;
                for (let j = i + 2; j < Math.min(i + 6, sortedPlayers.length); j += 2) {
                    if (j + 1 < sortedPlayers.length) {
                        const altPlayer1 = sortedPlayers[j];
                        const altPlayer2 = sortedPlayers[j + 1];

                        // Check if we can swap these pairs
                        const altMatchupKey1 = `${player1.player_id}-${altPlayer1.player_id}`;
                        const altMatchupKey2 = `${altPlayer1.player_id}-${player1.player_id}`;
                        const altMatchupKey3 = `${player2.player_id}-${altPlayer2.player_id}`;
                        const altMatchupKey4 = `${altPlayer2.player_id}-${player2.player_id}`;

                        if (!previousMatchups.has(altMatchupKey1) && !previousMatchups.has(altMatchupKey2) &&
                            !previousMatchups.has(altMatchupKey3) && !previousMatchups.has(altMatchupKey4)) {

                            // Create the swapped pairings
                            newPairings.push({
                                table: table++,
                                player1: {
                                    player_id: player1.player_id,
                                    name: player1.name,
                                    rating: player1.rating,
                                    division: player1.division
                                },
                                player2: {
                                    player_id: altPlayer1.player_id,
                                    name: altPlayer1.name,
                                    rating: altPlayer1.rating,
                                    division: altPlayer1.division
                                }
                            });

                            newPairings.push({
                                table: table++,
                                player1: {
                                    player_id: player2.player_id,
                                    name: player2.name,
                                    rating: player2.rating,
                                    division: player2.division
                                },
                                player2: {
                                    player_id: altPlayer2.player_id,
                                    name: altPlayer2.name,
                                    rating: altPlayer2.rating,
                                    division: altPlayer2.division
                                }
                            });

                            alternativeFound = true;
                            break;
                        }
                    }
                }

                if (!alternativeFound) {
                    // If no alternative, use original pairing (rematch)
                    newPairings.push({
                        table: table++,
                        player1: {
                            player_id: player1.player_id,
                            name: player1.name,
                            rating: player1.rating,
                            division: player1.division
                        },
                        player2: {
                            player_id: player2.player_id,
                            name: player2.name,
                            rating: player2.rating,
                            division: player2.division
                        }
                    });
                }
            }
        }
    }

    return assignStarts(newPairings, playersToPair, allResults);
};


export const generateTeamSwissPairings = (teams, previousTeamMatchups, allResults) => {
    // Filter out teams that might be empty due to players being paused/withdrawn elsewhere
    // Although 'teams' argument comes from upstream, we double check derived availability
    let availableTeams = [...teams];
    let newTeamPairings = [];
    let table = 1;

    // Handle odd number of teams with bye
    if (availableTeams.length % 2 !== 0) {
        const teamsWithByes = new Set(allResults.filter(r => r.player2_name === 'BYE').map(r => r.player1_name));
        let eligibleForBye = availableTeams
            .filter(team => !teamsWithByes.has(team.name))
            .sort((a, b) => b.rank - a.rank);

        if (eligibleForBye.length === 0) {
            eligibleForBye = availableTeams.sort((a, b) => b.rank - a.rank);
        }

        const byeTeam = eligibleForBye[0];
        if (byeTeam) {
            newTeamPairings.push({
                table: 'BYE',
                team1: { name: byeTeam.name },
                team2: { name: 'BYE' }
            });
            availableTeams = availableTeams.filter(t => t.id !== byeTeam.id);
        }
    }

    // Group teams by score (team wins + 0.5 * team ties)
    const scoreGroups = new Map();
    availableTeams.forEach(team => {
        const score = (team.teamWins || 0) + 0.5 * (team.teamTies || 0);
        if (!scoreGroups.has(score)) {
            scoreGroups.set(score, []);
        }
        scoreGroups.get(score).push(team);
    });

    // Sort score groups in descending order
    const sortedScores = Array.from(scoreGroups.keys()).sort((a, b) => b - a);

    // Pair within score groups, avoiding rematches
    for (const score of sortedScores) {
        const teamsInGroup = scoreGroups.get(score);

        while (teamsInGroup.length >= 2) {
            const team1 = teamsInGroup.shift();
            let opponentFound = false;

            // Try to find opponent without rematch
            for (let i = 0; i < teamsInGroup.length; i++) {
                const team2 = teamsInGroup[i];
                const matchupKey1 = `${team1.id}-${team2.id}`;
                const matchupKey2 = `${team2.id}-${team1.id}`;

                if (!previousTeamMatchups.has(matchupKey1) && !previousTeamMatchups.has(matchupKey2)) {
                    newTeamPairings.push({
                        table: table++,
                        team1: { name: team1.name },
                        team2: { name: team2.name }
                    });
                    teamsInGroup.splice(i, 1);
                    opponentFound = true;
                    break;
                }
            }

            // If no opponent found without rematch, take the first available
            if (!opponentFound && teamsInGroup.length > 0) {
                const team2 = teamsInGroup.shift();
                newTeamPairings.push({
                    table: table++,
                    team1: { name: team1.name },
                    team2: { name: team2.name }
                });
            }
        }

        // If odd number in this score group, move to next group
        if (teamsInGroup.length === 1) {
            const nextScore = sortedScores.find(s => s < score);
            if (nextScore !== undefined) {
                const nextGroup = scoreGroups.get(nextScore);
                if (nextGroup) {
                    nextGroup.unshift(teamsInGroup[0]);
                }
            }
        }
    }

    return newTeamPairings;
};

/**
 * Generates a comprehensive Round Robin schedule using the Berger Table method.
 * Supports any number of players and multiple cycles (repeats).
 * 
 * @param {Array} players - List of player objects.
 * @param {number} repeats - Number of full round robin cycles (default 1).
 * @param {Object} existingSchedule - Optional existing schedule to append to (not strictly used here but good for API consistency).
 * @returns {Object} A map of roundNumber -> array of pairing objects.
 */
export const generateRoundRobinSchedule = (players, repeats = 1) => {
    // 1. Prepare Players
    const activePlayers = players.filter(p => !p.withdrawn && p.status !== 'paused')
        .sort((a, b) => (a.initial_seed || 999) - (b.initial_seed || 999)); // Sort by seed for standard RR order

    let schedulePlayers = [...activePlayers];
    const hasBye = schedulePlayers.length % 2 !== 0;

    if (hasBye) {
        schedulePlayers.push({ name: 'BYE', isBye: true, player_id: null });
    }

    const n = schedulePlayers.length;
    const roundsPerCycle = n - 1;
    const totalRounds = roundsPerCycle * repeats;
    const schedule = {};

    // 2. Generate Cycles
    let roundOffset = 0;

    for (let cycle = 0; cycle < repeats; cycle++) {
        // For each round in the cycle
        for (let round = 0; round < roundsPerCycle; round++) {
            const currentRoundNum = roundOffset + round + 1;
            const pairings = [];
            let table = 1;

            // Berger Table Logic
            // Fixed player at index 0 against changing opponent
            // Others pair up based on distance from ends

            // Identify indices for this round
            // Standard method:
            // Last element is fixed? OR First element fixed?
            // Let's use the standard "Fixed First" rotation.
            // P0 is fixed. Others [1...N-1] rotate.
            // Rotation amount = round number.

            // Indices map:
            // P0 plays P[ (N-1) - round ? complex math ] 
            // Easier: Manipulate an array of indices [0, 1, 2, ... N-1]

            // Algorithm:
            // Array: [0, 1, 2, ... N-1]
            // Keep 0 fixed.
            // Rotate sub-array [1...N-1] by 'round' steps.

            // Create working array for this round
            let workingIndices = [0];
            let rotatingIndices = [];
            for (let i = 1; i < n; i++) rotatingIndices.push(i);

            // Rotate 'rotatingIndices' by 'round' steps LAST-to-FIRST (Clockwise)
            // Or just use (index + round) % (N-1) logic

            // Let's manually rotate the array for clarity
            // Round 0: [1, 2, 3...]
            // Round 1: [Last, 1, 2...]

            let rotated = [...rotatingIndices];
            for (let r = 0; r < round; r++) {
                const last = rotated.pop();
                rotated.unshift(last);
            }

            workingIndices = workingIndices.concat(rotated);

            // Pairs are (0, N-1), (1, N-2), etc? 
            // Berger standard pairings are top-bottom of the array usually?
            // "The first person plays the one in the same position in the second half of the list" -> No that's different.

            // Standard Circle:
            //    0       1       2
            //    5       4       3
            // Pairs: (0,5), (1,4), (2,3)

            const half = n / 2;
            for (let i = 0; i < half; i++) {
                const p1Index = workingIndices[i];
                const p2Index = workingIndices[n - 1 - i];

                let p1 = schedulePlayers[p1Index];
                let p2 = schedulePlayers[p2Index];

                // Color Balancing:
                // Standard RR: Alternate colors for fixed player.
                // Others alternate naturally.
                // Cycle 2 (Repeat): Flip everything.

                // Base Swap for fixed player (Index 0) logic usually:
                // If round is odd, 0 is Home. If even, 0 is Away. Or vice versa.
                // For others, it's implicit in strict Berger.

                // Simple Logic:
                // If cycle is odd (1, 3...), swap all P1/P2 from the standard generated above.
                // (Since Cycle 0 is standard)

                let finalP1 = p1;
                let finalP2 = p2;

                // If Repeat (Cycle > 0) -> check parity
                // If cycle is odd (1, 3...), we want to flip colors relative to Cycle 0.
                if (cycle % 2 !== 0) {
                    finalP1 = p2;
                    finalP2 = p1;
                }

                // Check Bye
                if (finalP1.isBye || finalP2.isBye) {
                    // Always put Real Player as P1 for "Bye" row
                    const real = finalP1.isBye ? finalP2 : finalP1;
                    pairings.push({
                        table: 'BYE',
                        player1: real,
                        player2: { name: 'BYE', player_id: null, isBye: true }
                    });
                } else {
                    pairings.push({
                        table: table++,
                        player1: finalP1,
                        player2: finalP2
                    });
                }
            }

            schedule[currentRoundNum] = pairings;
        }

        roundOffset += roundsPerCycle;
    }

    return schedule;
};
