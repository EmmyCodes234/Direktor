import { supabase } from '../supabaseClient';

// Glicko-2 Constants
const TAU = 0.5; // System constant, constraints the change in volatility
const SCALE_FACTOR = 173.7178;
const EPSILON = 0.000001;

/**
 * Glicko-2 Implementation
 * References: http://www.glicko.net/glicko/glicko2.pdf
 */

// Helper: Convert to Glicko-2 scale
const toGlicko2Scale = (rating, rd) => {
    return {
        mu: (rating - 1500) / SCALE_FACTOR,
        phi: rd / SCALE_FACTOR
    };
};

// Helper: Convert back to original scale
const fromGlicko2Scale = (mu, phi) => {
    return {
        rating: (mu * SCALE_FACTOR) + 1500,
        rd: phi * SCALE_FACTOR
    };
};

// Helper: g(phi)
const g = (phi) => {
    return 1 / Math.sqrt(1 + 3 * Math.pow(phi, 2) / Math.pow(Math.PI, 2));
};

// Helper: E(mu, mu_j, phi_j)
const E = (mu, mu_j, phi_j) => {
    return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)));
};

// Main Calculation Function for a single player
// player: { rating, rating_deviation, volatility }
// results: array of { opponentRating, opponentRD, score (0, 0.5, 1) }
export const calculateNewRating = (player, results) => {
    // 1. Convert to Glicko-2 scale
    let { mu, phi } = toGlicko2Scale(player.rating || 1500, player.rating_deviation || 350);
    let sigma = player.volatility || 0.06;

    // If no games played, only Phi increases
    if (results.length === 0) {
        const phi_star = Math.sqrt(Math.pow(phi, 2) + Math.pow(sigma, 2));
        const finalObj = fromGlicko2Scale(mu, phi_star);
        return {
            rating: finalObj.rating,
            rating_deviation: finalObj.rd,
            volatility: sigma
        };
    }

    // 2. Compute v (estimated variance) and Delta
    let v_inv = 0;
    let delta_sum = 0;

    results.forEach(match => {
        const { mu: mu_j, phi: phi_j } = toGlicko2Scale(match.opponentRating, match.opponentRD);
        const g_phi_j = g(phi_j);
        const E_val = E(mu, mu_j, phi_j);

        v_inv += Math.pow(g_phi_j, 2) * E_val * (1 - E_val);
        delta_sum += g_phi_j * (match.score - E_val);
    });

    const v = 1 / v_inv;
    const delta = v * delta_sum;

    // 3. Determine new volatility (sigma_prime) iteratively
    const a = Math.log(Math.pow(sigma, 2));

    const f = (x) => {
        const ex = Math.exp(x);
        const num1 = ex * (Math.pow(delta, 2) - Math.pow(phi, 2) - v - ex);
        const den1 = 2 * Math.pow(Math.pow(phi, 2) + v + ex, 2);
        const term2 = (x - a) / Math.pow(TAU, 2);
        return (num1 / den1) - term2;
    };

    let A = a;
    let B;
    if (Math.pow(delta, 2) > Math.pow(phi, 2) + v) {
        B = Math.log(Math.pow(delta, 2) - Math.pow(phi, 2) - v);
    } else {
        let k = 1;
        while (f(a - k * TAU) < 0) {
            k++;
        }
        B = a - k * TAU;
    }

    let fA = f(A);
    let fB = f(B);

    while (Math.abs(B - A) > EPSILON) {
        const C = A + (A - B) * fA / (fB - fA);
        const fC = f(C);
        if (fC * fB < 0) {
            A = B;
            fA = fB;
        } else {
            fA = fA / 2;
        }
        B = C;
        fB = fC;
    }

    const sigma_prime = Math.exp(A / 2);

    // 4. Update Rating and RD
    const phi_star = Math.sqrt(Math.pow(phi, 2) + Math.pow(sigma_prime, 2));
    const phi_prime = 1 / Math.sqrt(1 / Math.pow(phi_star, 2) + 1 / v);

    let mu_prime_sum = 0;
    results.forEach(match => {
        const { mu: mu_j, phi: phi_j } = toGlicko2Scale(match.opponentRating, match.opponentRD);
        mu_prime_sum += g(phi_j) * (match.score - E(mu, mu_j, phi_j));
    });

    const mu_prime = mu + Math.pow(phi_prime, 2) * mu_prime_sum;

    // 5. Convert back
    const finalObj = fromGlicko2Scale(mu_prime, phi_prime);

    return {
        rating: finalObj.rating,
        rating_deviation: finalObj.rd,
        volatility: sigma_prime
    };
};

/**
 * Update Tournament Ratings for a specific round
 * This usually runs on valid matches for that round.
 */
export const processRoundRatings = async (tournamentId, roundNumber) => {
    const logs = [];
    logs.push(`[System] Starting Rating Process for Round ${roundNumber}...`);

    // 1. Fetch Players (Used for IDs and names, but NOT for current rating state if possible)
    const { data: players, error: pError } = await supabase
        .from('players')
        .select('*');

    if (pError) throw pError;
    logs.push(`[System] Loaded ${players.length} players.`);

    // 2. Fetch Results for this round
    const { data: resultsData, error: rError } = await supabase
        .from('results')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('round', roundNumber);

    if (rError) throw rError;

    if (resultsData.length === 0) {
        logs.push(`[Error] No results found for Round ${roundNumber}.`);
        return { success: false, message: `No results found.`, logs };
    }
    logs.push(`[System] Found ${resultsData.length} match results.`);

    // 3. Fetch History
    /* 
       CRITICAL FIX: 
       Instead of using `players` table (which holds CURRENT/LATEST rating),
       we must fetch the rating state AT THE END OF THE PREVIOUS ROUND.
       This ensures that if we re-run Round 1, we start from 1500, even if the player is currently 1800.
    */
    const { data: historyData, error: hError } = await supabase
        .from('round_ratings')
        .select('player_id, new_rating, new_rating_deviation, volatility, matches_played, wins')
        .eq('tournament_id', tournamentId)
        .lt('round', roundNumber) // Less than current round
        .order('round', { ascending: false }); // Get latest first

    if (hError) {
        console.error("History fetch error:", hError);
        logs.push(`[Error] History Fetch Failed: ${hError.message}`);
    } else {
        logs.push(`[System] Found ${historyData?.length || 0} historical rating records (Pre-Round ${roundNumber}).`);
    }

    // Build map of Previous Stats: player_id -> { rating, rd, vol, matches, wins }
    // Since we ordered by round DESC, the first entry found for a player is their most recent state.
    const previousStatsMap = new Map();
    if (historyData) {
        historyData.forEach(h => {
            if (!previousStatsMap.has(h.player_id)) {
                previousStatsMap.set(h.player_id, {
                    rating: h.new_rating,
                    rd: h.new_rating_deviation,
                    vol: h.volatility || 0.06,
                    matches: h.matches_played || 0,
                    wins: h.wins || 0
                });
            }
        });
    }

    // 3b. Cleanup current round
    await supabase.from('round_ratings')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('round', roundNumber);


    // 4. Build Result Maps per player
    // player_id -> [ { opponentRating, opponentRD, score } ]
    const playerResultsMap = {};
    players.forEach(p => playerResultsMap[p.id] = []);

    // Create a map for quick player lookup
    const playerMap = new Map(players.map(p => [p.id, p]));

    resultsData.forEach(m => {
        // Skip invalid records
        if (m.score1 === null || m.score2 === null || m.score1 === undefined || m.score2 === undefined) return;

        const p1 = playerMap.get(m.player1_id);
        const p2 = playerMap.get(m.player2_id);

        if (!p1 || !p2) return;

        // Get Opponent Stats (PREVIOUS STATE)
        const p1Stats = previousStatsMap.get(p1.id) || { rating: 1500, rd: 350, vol: 0.06 };
        const p2Stats = previousStatsMap.get(p2.id) || { rating: 1500, rd: 350, vol: 0.06 };

        let s1, s2;
        if (parseFloat(m.score1) > parseFloat(m.score2)) { s1 = 1; s2 = 0; }
        else if (parseFloat(m.score1) < parseFloat(m.score2)) { s1 = 0; s2 = 1; }
        else { s1 = 0.5; s2 = 0.5; }

        if (playerResultsMap[p1.id]) {
            playerResultsMap[p1.id].push({
                opponentRating: p2Stats.rating,
                opponentRD: p2Stats.rd,
                score: s1
            });
        }
        if (playerResultsMap[p2.id]) {
            playerResultsMap[p2.id].push({
                opponentRating: p1Stats.rating,
                opponentRD: p1Stats.rd,
                score: s2
            });
        }
    });

    // 5. Calculate Updates
    const ratingUpdates = [];
    const historyInserts = [];

    const { data: tournamentPlayers } = await supabase
        .from('tournament_players')
        .select('player_id')
        .eq('tournament_id', tournamentId);

    const activePlayerIds = new Set(tournamentPlayers?.map(tp => tp.player_id) || []);

    let sampleUserLog = "";

    for (const p of players) {
        if (!activePlayerIds.has(p.id)) continue;

        const pResults = playerResultsMap[p.id] || [];

        // Critical: Use PREVIOUS stats, not current global stats
        const prevStats = previousStatsMap.get(p.id) || { rating: 1500, rd: 350, vol: 0.06, matches: 0, wins: 0 };

        // Log one specific user for debugging (e.g. first one found)
        if (!sampleUserLog && pResults.length > 0) {
            sampleUserLog = `[Debug] Sample Player: ${p.name} | Old: ${Math.round(prevStats.rating)} | Matches Prev: ${prevStats.matches} | Opponents This Round: ${pResults.length}`;
            logs.push(sampleUserLog);
        }

        // Construct a tempoary player object for the calculation function
        const tempPlayerObj = {
            rating: prevStats.rating,
            rating_deviation: prevStats.rd,
            volatility: prevStats.vol
        };

        const newStats = calculateNewRating(tempPlayerObj, pResults);
        const safeRating = Math.max(100, newStats.rating);

        ratingUpdates.push({
            id: p.id,
            rating: safeRating,
            rating_deviation: newStats.rating_deviation,
            volatility: newStats.volatility
        });

        const currentRoundWins = pResults.filter(r => r.score === 1).length;
        const currentRoundMatches = pResults.length;

        // Add to history 
        historyInserts.push({
            tournament_id: tournamentId,
            round: roundNumber,
            player_id: p.id,
            old_rating: prevStats.rating,
            new_rating: safeRating,
            rating_change: safeRating - prevStats.rating,
            old_rating_deviation: prevStats.rd,
            new_rating_deviation: newStats.rating_deviation,
            volatility: newStats.volatility,
            matches_played: (prevStats.matches || 0) + currentRoundMatches,
            wins: (prevStats.wins || 0) + currentRoundWins
        });
    }

    logs.push(`[System] Calculated updates for ${historyInserts.length} players.`);

    // 5. Perform Database Updates

    // Bulk insert history
    if (historyInserts.length > 0) {
        const { error: hError } = await supabase.from('round_ratings').insert(historyInserts);
        if (hError) {
            logs.push(`[Error] History Insert Failed: ${hError.message}`);
            return { success: false, logs };
        } else {
            // Verify Insert
            const { count } = await supabase
                .from('round_ratings')
                .select('*', { count: 'exact', head: true })
                .eq('tournament_id', tournamentId)
                .eq('round', roundNumber);
            logs.push(`[Debug] Verified Insert: Found ${count} records for Round ${roundNumber} in DB.`);
        }
    }

    // Update profiles
    // Limit concurrency
    const updatePromises = ratingUpdates.map(u =>
        supabase.from('players').update({
            rating: u.rating,
            rating_deviation: u.rating_deviation,
            volatility: u.volatility
        }).eq('id', u.id)
    );

    await Promise.all(updatePromises);
    logs.push(`[Success] Ratings processed successfully for Round ${roundNumber}.`);

    return { success: true, updated: ratingUpdates.length, logs };
};
