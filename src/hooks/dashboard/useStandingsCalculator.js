import { useMemo } from 'react';

/**
 * Hook to calculate tournament standings purely from results and matches.
 * Removes the need for manual state updates for wins/losses.
 */
// Counter helper to force recalculation if needed (though pure dependency array is preferred)
// We can rely on 'results' changing to trigger updates.

/**
 * Pure function to calculate tournament standings.
 */
export const calculateStandings = (players, results, matches, tournamentInfo) => {
    if (!players || !results) return [];

    let enrichedPlayers = players.map(p => ({ ...p })); // Shallow copy to avoid mutation

    if (tournamentInfo?.type === 'best_of_league') {
        const bestOf = tournamentInfo?.best_of_value ? parseInt(tournamentInfo.best_of_value, 10) : 15;
        const majority = Math.floor(bestOf / 2) + 1;

        const playerMatchStats = new Map(); // player_id -> stats

        // Build a map of match-ups and cumulative game stats
        const matchupMap = {};
        results.forEach(result => {
            if (!result.player1_id || !result.player2_id) return;

            const ids = [result.player1_id, result.player2_id].sort();
            const key = ids.join('-');
            if (!matchupMap[key]) matchupMap[key] = [];
            matchupMap[key].push(result);

            // Initialize stats if not exist
            const pid1 = String(result.player1_id);
            const pid2 = String(result.player2_id);

            if (!playerMatchStats.has(pid1)) playerMatchStats.set(pid1, { match_wins: 0, match_losses: 0, wins: 0, losses: 0, ties: 0, spread: 0 });
            if (!playerMatchStats.has(pid2)) playerMatchStats.set(pid2, { match_wins: 0, match_losses: 0, wins: 0, losses: 0, ties: 0, spread: 0 });

            const s1 = playerMatchStats.get(pid1);
            const s2 = playerMatchStats.get(pid2);

            if (result.score1 > result.score2) {
                s1.wins++;
                s2.losses++;
            } else if (result.score2 > result.score1) {
                s2.wins++;
                s1.losses++;
            } else {
                s1.ties++;
                s2.ties++;
            }
            s1.spread += (result.score1 - result.score2);
            s2.spread += (result.score2 - result.score1);
        });

        // Calculate match wins from matchupMap
        Object.entries(matchupMap).forEach(([key, matchResults]) => {
            const [id1, id2] = key.split('-');
            let p1Wins = 0, p2Wins = 0;

            matchResults.forEach(r => {
                const isP1 = String(r.player1_id) === String(id1);
                if (r.score1 > r.score2) {
                    if (isP1) p1Wins++; else p2Wins++;
                } else if (r.score2 > r.score1) {
                    if (!isP1) p1Wins++; else p2Wins++;
                }
            });

            const s1 = playerMatchStats.get(String(id1));
            const s2 = playerMatchStats.get(String(id2));

            if (s1 && s2) {
                if (p1Wins >= majority) {
                    s1.match_wins++;
                    s2.match_losses++;
                } else if (p2Wins >= majority) {
                    s2.match_wins++;
                    s1.match_losses++;
                }
            }
        });

        enrichedPlayers = enrichedPlayers.map(player => {
            const s = playerMatchStats.get(String(player.player_id)) || { match_wins: 0, match_losses: 0, wins: 0, losses: 0, ties: 0, spread: 0 };
            return { ...player, ...s };
        });

    } else {
        // Standard Individual / Team logic - Optimized to O(R + P)
        const statsMap = new Map();
        results.forEach(result => {
            if (!result.player1_id || !result.player2_id) return;

            const pid1 = String(result.player1_id);
            const pid2 = String(result.player2_id);

            if (!statsMap.has(pid1)) statsMap.set(pid1, { wins: 0, losses: 0, ties: 0, spread: 0 });
            if (!statsMap.has(pid2)) statsMap.set(pid2, { wins: 0, losses: 0, ties: 0, spread: 0 });

            const s1 = statsMap.get(pid1);
            const s2 = statsMap.get(pid2);

            if (result.score1 > result.score2) {
                s1.wins++;
                s2.losses++;
            } else if (result.score2 > result.score1) {
                s2.wins++;
                s1.losses++;
            } else {
                s1.ties++;
                s2.ties++;
            }

            s1.spread += (result.score1 - result.score2);
            s2.spread += (result.score2 - result.score1);
        });

        enrichedPlayers = enrichedPlayers.map(player => {
            const s = statsMap.get(String(player.player_id)) || { wins: 0, losses: 0, ties: 0, spread: 0 };
            return { ...player, ...s };
        });
    }

    // Sorting Logic
    return enrichedPlayers.sort((a, b) => {
        if (tournamentInfo?.type === 'best_of_league') {
            const aMatchWins = typeof a.match_wins === 'string' ? parseInt(a.match_wins || 0, 10) : (a.match_wins || 0);
            const bMatchWins = typeof b.match_wins === 'string' ? parseInt(b.match_wins || 0, 10) : (b.match_wins || 0);
            if (aMatchWins !== bMatchWins) return bMatchWins - aMatchWins;
        }

        const aGameScore = (a.wins || 0) + (a.ties || 0) * 0.5;
        const bGameScore = (b.wins || 0) + (b.ties || 0) * 0.5;
        if (aGameScore !== bGameScore) return bGameScore - aGameScore;

        if ((a.spread || 0) !== (b.spread || 0)) return (b.spread || 0) - (a.spread || 0);

        // Head-to-head (Basic implementation)
        const headToHeadGames = results.filter(r =>
            (String(r.player1_id) === String(a.player_id) && String(r.player2_id) === String(b.player_id)) ||
            (String(r.player1_id) === String(b.player_id) && String(r.player2_id) === String(a.player_id))
        );

        if (headToHeadGames.length > 0) {
            let aWins = 0, bWins = 0;
            headToHeadGames.forEach(game => {
                if (String(game.player1_id) === String(a.player_id)) {
                    if (game.score1 > game.score2) aWins++;
                    else if (game.score2 > game.score1) bWins++;
                } else {
                    if (game.score2 > game.score1) aWins++;
                    else if (game.score1 > game.score2) bWins++;
                }
            });
            if (aWins !== bWins) return bWins - aWins;
        }

        return (a.seed || 999) - (b.seed || 999);
    }).map((player, index) => ({ ...player, rank: index + 1 }));
};

const useStandingsCalculator = (players, results, matches, tournamentInfo) => {
    return useMemo(() => calculateStandings(players, results, matches, tournamentInfo), [players, results, tournamentInfo, matches]);
};

export default useStandingsCalculator;
