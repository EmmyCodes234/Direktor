
/**
 * Assigns 'starts' (first player) based on rules and tie-breakers.
 */
// ... (imports or top)

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
            // Tie-breaker 1: Last game starts
            // If p1 went first last, p2 should go first now.
            const p1Results = allResults.filter(r => r.player1_id === player1.player_id || r.player2_id === player1.player_id);
            const p2Results = allResults.filter(r => r.player1_id === player2.player_id || r.player2_id === player2.player_id);

            const lastR1 = p1Results.length > 0 ? p1Results[p1Results.length - 1] : null;
            const lastR2 = p2Results.length > 0 ? p2Results[p2Results.length - 1] : null;

            const p1LastStarted = lastR1 ? (lastR1.player1_id === player1.player_id ? lastR1.player1_starts : lastR1.player2_starts) : false;
            const p2LastStarted = lastR2 ? (lastR2.player1_id === player2.player_id ? lastR2.player1_starts : lastR2.player2_starts) : false;

            if (p1LastStarted && !p2LastStarted) {
                p.player2.starts = true;
            } else if (!p1LastStarted && p2LastStarted) {
                p.player1.starts = true;
            } else {
                // Tie-breaker 2: Head-to-head starts
                const headToHeadGames = allResults.filter(r =>
                    (r.player1_id === player1.player_id && r.player2_id === player2.player_id) ||
                    (r.player1_id === player2.player_id && r.player2_id === player1.player_id)
                );

                const p1HeadToHeadStarts = headToHeadGames.reduce((acc, r) => {
                    if (r.player1_id === player1.player_id && r.player1_starts) return acc + 1;
                    if (r.player2_id === player1.player_id && r.player2_starts) return acc + 1;
                    return acc;
                }, 0);

                const p2HeadToHeadStarts = headToHeadGames.reduce((acc, r) => {
                    if (r.player1_id === player2.player_id && r.player1_starts) return acc + 1;
                    if (r.player2_id === player2.player_id && r.player2_starts) return acc + 1;
                    return acc;
                }, 0);

                if (p1HeadToHeadStarts < p2HeadToHeadStarts) {
                    p.player1.starts = true;
                } else if (p2HeadToHeadStarts < p1HeadToHeadStarts) {
                    p.player2.starts = true;
                } else {
                    // Tie-breaker 3: Fair tie-breaker using lower seed (higher rank)
                    if ((player1.initial_seed || player1.seed || 999) < (player2.initial_seed || player2.seed || 999)) {
                        p.player1.starts = true;
                    } else {
                        p.player2.starts = true;
                    }
                }
            }
        }
        return p;
    });
};


/**
 * Generate Swiss Pairings based on TSH standards.
 * 
 * Features:
 * - Win Groups: Players are paired within groups of same wins.
 * - Optimized Search: Pairs from top and bottom win-groups alternately to reduce backtracking.
 * - TSH Priority: Minimize repeats > Not previous opponent > Color balance > Proximity (half-group distance).
 */
export const generateSwissPairings = (playersToPair, previousMatchups, allResults, currentRound = 1, maxRepeats = 0, reservedTables = {}) => {
    let availablePlayers = [...playersToPair.filter(p => !p.withdrawn && p.status !== 'paused')];
    let newPairings = [];

    // Helper: Determine Starts/Seconds balance for a player
    const getStats = (pId) => {
        const pResults = allResults.filter(r => r.player1_id === pId || r.player2_id === pId);
        const starts = pResults.filter(r => (r.player1_id === pId && r.player1_starts) || (r.player2_id === pId && r.player2_starts)).length;
        const total = pResults.length;
        const previousOpponent = pResults.length > 0 ? (pResults[pResults.length - 1].player1_id === pId ? pResults[pResults.length - 1].player2_id : pResults[pResults.length - 1].player1_id) : null;
        return { starts, total, previousOpponent };
    };

    // Helper: Opponent Eligibility & Quality Score
    const getMatchQuality = (p1, p2) => {
        const stats1 = getStats(p1.player_id);
        const stats2 = getStats(p2.player_id);

        const repeatCount = allResults.filter(r =>
            (r.player1_id === p1.player_id && r.player2_id === p2.player_id) ||
            (r.player1_id === p2.player_id && r.player2_id === p1.player_id)
        ).length;

        if (maxRepeats === 0 && repeatCount > 0) return -1;
        if (maxRepeats > 0 && repeatCount > maxRepeats) return -1;

        let score = 0;
        // Priority 1: Minimize repeats
        score += (100 - repeatCount * 10);

        // Priority 2: Not previous opponent
        if (stats1.previousOpponent !== p2.player_id) score += 50;

        // Priority 3: Color balance
        const p1NeedsStart = stats1.starts <= stats1.total / 2;
        const p2NeedsStart = stats2.starts <= stats2.total / 2;
        if (p1NeedsStart !== p2NeedsStart) score += 20;

        // Priority 4: Avoid 3 consecutive starts/seconds
        const checkConsecutive = (pId) => {
            const pResults = allResults.filter(r => r.player1_id === pId || r.player2_id === pId).slice(-2);
            if (pResults.length < 2) return 0;
            const s1 = (pResults[0].player1_id === pId ? pResults[0].player1_starts : pResults[0].player2_starts);
            const s2 = (pResults[1].player1_id === pId ? pResults[1].player1_starts : pResults[1].player2_starts);
            if (s1 && s2) return 1; // 2 starts in a row
            if (!s1 && !s2) return -1; // 2 seconds in a row
            return 0;
        };

        const con1 = checkConsecutive(p1.player_id);
        const con2 = checkConsecutive(p2.player_id);

        // If p1 had 2 starts and p2 had 2 seconds, this is a GREAT match (score +30)
        // If both had 2 starts, this is a BAD match (score -40)
        if (con1 !== 0 && con1 === con2) score -= 40;
        if (con1 !== 0 && con1 === -con2) score += 30;

        return score;
    };

    // 1. Handle Odd Bye (Lowest ranked player with fewest byes)
    if (availablePlayers.length % 2 !== 0) {
        const byeCounts = new Map();
        allResults.forEach(r => {
            if (r.player2_name === 'BYE') {
                byeCounts.set(r.player1_id, (byeCounts.get(r.player1_id) || 0) + 1);
            }
        });

        // Sort by Bye Count (Asc) then Rank (Desc - worst player first)
        availablePlayers.sort((a, b) => {
            const bcA = byeCounts.get(a.player_id) || 0;
            const bcB = byeCounts.get(b.player_id) || 0;
            if (bcA !== bcB) return bcA - bcB;
            return (b.rank || 0) - (a.rank || 0);
        });

        const byePlayer = availablePlayers[0];
        newPairings.push({
            table: 'BYE',
            player1: { ...byePlayer },
            player2: { name: 'BYE' },
            note: 'Bye Assignment'
        });
        availablePlayers = availablePlayers.filter(p => p.player_id !== byePlayer.player_id);
    }

    // 2. Group into Win Groups
    // Rank is important for the "proximity" rule
    availablePlayers.sort((a, b) => (a.rank || 0) - (b.rank || 0));

    const winGroups = new Map();
    availablePlayers.forEach(p => {
        const wins = (p.wins || 0) + (p.ties || 0) * 0.5;
        if (!winGroups.has(wins)) winGroups.set(wins, []);
        winGroups.get(wins).push(p);
    });

    const sortedWins = Array.from(winGroups.keys()).sort((a, b) => b - a);

    // 3. Pairing Loop (Top-Down/Bottom-Up Alternating)
    // TSH Optimization: Pair top win group, then bottom win group, then top...
    let topIdx = 0;
    let bottomIdx = sortedWins.length - 1;
    let turn = 'top';

    const workingGroups = new Map(winGroups);
    let orphans = []; // Players floating down/up

    while (topIdx <= bottomIdx) {
        const currentWin = (turn === 'top') ? sortedWins[topIdx] : sortedWins[bottomIdx];
        let group = workingGroups.get(currentWin) || [];

        // Add orphans from previous group
        if (orphans.length > 0) {
            if (turn === 'top') group = [...orphans, ...group];
            else group = [...group, ...orphans];
            orphans = [];
        }

        // Pair within group
        // TSH: "Top half plays the bottom half, in order" or "Proximity to half-group distance"
        while (group.length >= 2) {
            const p1 = (turn === 'top') ? group.shift() : group.pop();

            // Search for best opponent
            // "Ideally half a win group away"
            const searchRange = [...group];
            const halfWay = Math.floor(searchRange.length / 2);

            // Re-order searchRange to start from "halfway" point for proximity
            const proximityOrdered = [];
            for (let i = 0; i < searchRange.length; i++) {
                const idx = (halfWay + (i % 2 === 0 ? Math.floor(i / 2) : -Math.ceil(i / 2)));
                // Wrap safely
                let safeIdx = idx % searchRange.length;
                if (safeIdx < 0) safeIdx += searchRange.length;
                proximityOrdered.push(searchRange[safeIdx]);
            }

            let bestOpponent = null;
            let bestScore = -1;
            let bestIdx = -1;

            for (let i = 0; i < proximityOrdered.length; i++) {
                const p2 = proximityOrdered[i];
                const q = getMatchQuality(p1, p2);
                if (q > bestScore) {
                    bestScore = q;
                    bestOpponent = p2;
                }
            }

            if (bestOpponent && bestScore >= 0) {
                newPairings.push({
                    player1: { ...p1 },
                    player2: { ...bestOpponent },
                    table: 0 // Will assign later
                });
                const idxInGroup = group.indexOf(bestOpponent);
                group.splice(idxInGroup, 1);
            } else {
                // No quality opponent found? P1 becomes an orphan
                orphans.push(p1);
            }
        }

        // Remaining player becomes an orphan
        if (group.length === 1) {
            orphans.push(group[0]);
        }

        // Flip turn
        if (turn === 'top') {
            topIdx++;
            turn = 'bottom';
        } else {
            bottomIdx--;
            turn = 'top';
        }
    }

    // Handle remaining orphans (desperation)
    // Try a few shuffles to minimize rematches if orphans > 2
    if (orphans.length > 2) orphans.sort(() => Math.random() - 0.5);

    while (orphans.length >= 2) {
        const p1 = orphans.shift();
        const p2 = orphans.shift();
        newPairings.push({
            player1: { ...p1 },
            player2: { ...p2 },
            table: 0,
            note: 'Float/Rematch'
        });
    }

    // Assign Tables (Preserve reserved tables)
    const usedTables = new Set(Object.values(reservedTables));
    let tCounter = 1;
    newPairings.forEach(p => {
        if (p.table === 'BYE') return;

        const reserved = reservedTables[p.player1.player_id] || reservedTables[p.player2.player_id];
        if (reserved) {
            p.table = reserved;
        } else if (p.table === 0 || p.table === 'GIBSON') {
            // Only assign new table if not already assigned (BYE/GIBSON/Reserved)
            while (usedTables.has(tCounter)) tCounter++;
            p.table = (p.isGibsonPairing) ? 'GIBSON' : tCounter;
            if (!p.isGibsonPairing) {
                usedTables.add(tCounter);
            }
        }
    });

    return assignStarts(newPairings, playersToPair, allResults);
};

export const generateRoundRobinSchedule = (players, cycles = 1, matchesPerOpponent = 1, reservedTables = {}) => {
    const activePlayers = players.filter(p => !p.withdrawn && p.status !== 'paused')
        .sort((a, b) => (a.initial_seed || 999) - (b.initial_seed || 999));

    let schedulePlayers = [...activePlayers];
    const hasBye = schedulePlayers.length % 2 !== 0;

    if (hasBye) {
        schedulePlayers.push({ name: 'BYE', isBye: true, player_id: null });
    }

    const n = schedulePlayers.length;
    const roundsPerCycle = n - 1;
    const schedule = {};
    let globalRound = 1;

    // Calculate Division Round Offset
    // Hash the division name
    let roundOffsetShift = 0;
    if (players.length > 0 && players[0].division) {
        let hash = 0;
        const div = players[0].division;
        for (let i = 0; i < div.length; i++) hash = (hash + div.charCodeAt(i));
        roundOffsetShift = hash % roundsPerCycle;
    }

    // Table Management
    const usedTables = new Set(Object.values(reservedTables));
    let tableCounter = 1;
    const getNextTable = () => {
        while (usedTables.has(tableCounter)) tableCounter++;
        const t = tableCounter;
        usedTables.add(t);
        return t;
    };

    // Reset table counter is tricky in all-at-once generation.
    // We generate per round.
    // Ideally tables reset per round.

    for (let cycle = 0; cycle < cycles; cycle++) {

        for (let r = 0; r < roundsPerCycle; r++) {

            // Apply Offset to Round Logic
            // Effective Round Index for Berger calc
            const effectiveRoundIndex = (r + roundOffsetShift) % roundsPerCycle;

            const roundPairings = [];
            let workingIndices = [0];
            let rotatingIndices = [];
            for (let i = 1; i < n; i++) rotatingIndices.push(i);

            let rotated = [...rotatingIndices];
            for (let step = 0; step < effectiveRoundIndex; step++) {
                const last = rotated.pop();
                rotated.unshift(last);
            }
            workingIndices = workingIndices.concat(rotated);

            const half = n / 2;
            const baseRoundPairs = [];

            for (let i = 0; i < half; i++) {
                const p1Index = workingIndices[i];
                const p2Index = workingIndices[n - 1 - i];
                baseRoundPairs.push({
                    p1: schedulePlayers[p1Index],
                    p2: schedulePlayers[p2Index]
                });
            }

            // Expand by matches
            for (let m = 0; m < matchesPerOpponent; m++) {
                const finalPairings = [];

                // Reset tables for THIS actual round
                tableCounter = 1;
                usedTables.clear();
                Object.values(reservedTables).forEach(t => usedTables.add(t));

                baseRoundPairs.forEach(pair => {
                    let { p1, p2 } = pair;
                    const shouldFlip = ((cycle % 2) + (m % 2)) % 2 !== 0;

                    if (shouldFlip) {
                        const temp = p1; p1 = p2; p2 = temp;
                    }

                    if (p1.isBye || p2.isBye) {
                        const real = p1.isBye ? p2 : p1;
                        finalPairings.push({
                            table: 'BYE',
                            player1: real,
                            player2: { name: 'BYE', player_id: null, isBye: true }
                        });
                    } else {
                        // Determine Table
                        let assignedTable;
                        if (reservedTables[p1.player_id]) assignedTable = reservedTables[p1.player_id];
                        else if (reservedTables[p2.player_id]) assignedTable = reservedTables[p2.player_id];
                        else assignedTable = getNextTable();

                        finalPairings.push({
                            table: assignedTable,
                            player1: { ...p1, player_id: p1.player_id || p1.id },
                            player2: { ...p2, player_id: p2.player_id || p2.id }
                        });
                    }
                });

                schedule[globalRound++] = finalPairings;
            }
        }
    }

    return schedule;
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
                team1: { name: byeTeam.name, id: byeTeam.id },
                team2: { name: 'BYE', id: null }
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
 * Splits players into 4 balanced quartiles (A, B, C, D).
 */
const getQuartiles = (players) => {
    const sorted = [...players].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const n = sorted.length;
    const base = Math.floor(n / 4);
    const remainder = n % 4;

    let piles = [[], [], [], []];
    let current = 0;
    for (let i = 0; i < 4; i++) {
        const size = base + (i < remainder ? 1 : 0);
        piles[i] = sorted.slice(current, current + size);
        current += size;
    }
    return piles;
};

/**
 * Generate Fontes (Portland Swiss) pairings for a single round.
 * Round 1: A-C, B-D
 * Round 2: A-B, C-D
 * Round 3: A-D, B-C
 */
export const generateQuartilePairings = (players, roundNum = 1, allResults = [], reservedTables = {}) => {
    const activePlayers = players.filter(p => !p.withdrawn && p.status !== 'paused');
    const piles = getQuartiles(activePlayers);

    let pairs = [];
    let orphans = [];

    const pairPiles = (idx1, idx2) => {
        const p1 = piles[idx1];
        const p2 = piles[idx2];
        const max = Math.max(p1.length, p2.length);
        for (let i = 0; i < max; i++) {
            if (p1[i] && p2[i]) {
                pairs.push({ player1: p1[i], player2: p2[i] });
            } else if (p1[i]) {
                orphans.push(p1[i]);
            } else if (p2[i]) {
                orphans.push(p2[i]);
            }
        }
    };

    const pattern = (roundNum - 1) % 3;
    if (pattern === 0) { // Round 1: A-C, B-D
        pairPiles(0, 2);
        pairPiles(1, 3);
    } else if (pattern === 1) { // Round 2: A-B, C-D
        pairPiles(0, 1);
        pairPiles(2, 3);
    } else { // Round 3: A-D, B-C
        pairPiles(0, 3);
        pairPiles(1, 2);
    }

    // Pair remaining orphans
    while (orphans.length >= 2) {
        pairs.push({ player1: orphans.shift(), player2: orphans.shift() });
    }

    // Handle single orphan with Bye
    if (orphans.length === 1) {
        pairs.push({
            table: 'BYE',
            player1: orphans[0],
            player2: { name: 'BYE' }
        });
    }

    // Assign Tables
    const usedTables = new Set(Object.values(reservedTables));
    let tCounter = 1;
    pairs.forEach(p => {
        if (p.table === 'BYE') return;
        const reserved = reservedTables[p.player1.player_id] || reservedTables[p.player2.player_id];
        if (reserved) {
            p.table = reserved;
        } else {
            while (usedTables.has(tCounter)) tCounter++;
            p.table = tCounter;
            usedTables.add(tCounter);
        }
    });

    return assignStarts(pairs, players, allResults);
};

/**
 * InitFontes logic: Generates a multi-round schedule using Fontes patterns.
 */
export const generateInitFontesPairings = (activePlayers, numRounds = 3, allResults = []) => {
    const schedule = {};
    for (let r = 1; r <= numRounds; r++) {
        schedule[r] = generateQuartilePairings(activePlayers, r, allResults);
    }
    return schedule;
};

/**
 * Generate TSH-style Quartile pairings (pq command).
     * Pairs Quartile 1 against targetQuartile, and the other two quartiles against each other.
     * Pairings within the matched groups are randomized.
     */
export const generateTSHQuartilePairings = (players, targetQuartile = 4, maxRepeats = 0, previousMatchups = new Set(), allResults = [], reservedTables = {}) => {
    const activePlayers = players.filter(p => !p.withdrawn && p.status !== 'paused');
    const piles = getQuartiles(activePlayers);

    // matchGroups defines which quartiles play each other
    let matchGroups = [];
    if (targetQuartile === 4) matchGroups = [[0, 3], [1, 2]];
    else if (targetQuartile === 3) matchGroups = [[0, 2], [1, 3]];
    else matchGroups = [[0, 1], [2, 3]];

    let pairings = [];
    let orphans = [];

    matchGroups.forEach(([q1Idx, q2Idx]) => {
        let pile1 = [...piles[q1Idx]];
        let pile2 = [...piles[q2Idx]];

        // Shuffle for randomness
        pile1.sort(() => Math.random() - 0.5);
        pile2.sort(() => Math.random() - 0.5);

        while (pile1.length > 0 && pile2.length > 0) {
            const p1 = pile1.pop();
            let oppIdx = -1;

            if (maxRepeats === 0) {
                // Try to find someone they haven't played
                for (let i = 0; i < pile2.length; i++) {
                    if (!previousMatchups.has(`${p1.player_id}-${pile2[i].player_id}`)) {
                        oppIdx = i;
                        break;
                    }
                }
            } else {
                oppIdx = pile2.length - 1;
            }

            if (oppIdx !== -1) {
                const p2 = pile2.splice(oppIdx, 1)[0];
                pairings.push({ player1: p1, player2: p2 });
            } else {
                orphans.push(p1);
            }
        }
        orphans = [...orphans, ...pile1, ...pile2];
    });

    // Final shuffle for orphans
    orphans.sort(() => Math.random() - 0.5);
    while (orphans.length >= 2) {
        pairings.push({ player1: orphans.shift(), player2: orphans.shift() });
    }

    if (orphans.length === 1) {
        pairings.push({ player1: orphans[0], player2: { name: 'BYE' }, table: 'BYE' });
    }

    // Assign Tables
    const usedTables = new Set(Object.values(reservedTables));
    let tCounter = 1;
    pairings.forEach(p => {
        if (p.table === 'BYE') return;
        const reserved = reservedTables[p.player1.player_id] || reservedTables[p.player2.player_id];
        if (reserved) {
            p.table = reserved;
        } else {
            while (usedTables.has(tCounter)) tCounter++;
            p.table = tCounter;
            usedTables.add(tCounter);
        }
    });

    return assignStarts(pairings, players, allResults);
};





