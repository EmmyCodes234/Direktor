import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import Icon from 'components/AppIcon';
import ThemeToggle from 'components/ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';

const PublicEnhancedScoreboard = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState(null);
    const [standings, setStandings] = useState([]);

    // Fetch Data Function
    const fetchData = useCallback(async (isInitialLoad = true) => {
        if (isInitialLoad) setLoading(true);
        try {
            // 1. Get Tournament
            const { data: tourney } = await supabase.from('tournaments')
                .select('*').eq('slug', tournamentSlug).single();

            if (!tourney) throw new Error("Tournament not found");
            setTournament(tourney);

            // 2. Get Players with Photos
            const { data: players } = await supabase.from('tournament_players')
                .select('*, players(*)').eq('tournament_id', tourney.id);

            // 3. Get All Results (This is the source of truth for scores)
            const { data: results } = await supabase.from('results')
                .select('*')
                .eq('tournament_id', tourney.id)
                .order('round', { ascending: true }); // Ordered by round for streak calc

            // 4. Calculate Standings & Enriched Data
            const playerMap = new Map();
            players.forEach(p => {
                playerMap.set(p.player_id, {
                    ...p,
                    ...p.players, // Flatten player details
                    wins: 0,
                    spread: 0,
                    games: 0,
                    history: [], // For streak boxes
                    lastGame: null // For "Last:" section
                });
            });

            // Process Results
            results.forEach(r => {
                // Ensure both players exist in our map (might be missing if player deleted?)
                const p1 = playerMap.get(r.player1_id);
                const p2 = playerMap.get(r.player2_id);

                // Handle Byes (only P1 usually exists/matters for wins)
                if (r.is_bye) {
                    if (p1) {
                        p1.wins += 1;
                        p1.spread += (r.score1 || 0); // Usually spread is score for bye
                        p1.games += 1;
                        p1.history.push('W');
                        // Last game for Bye? Maybe not useful to show vs Bye.
                    }
                    return;
                }

                if (!p1 || !p2) return;

                const score1 = r.score1 || 0;
                const score2 = r.score2 || 0;

                // Update P1
                const p1Win = score1 > score2;
                const p1Tie = score1 === score2;
                const spread = score1 - score2;

                if (p1Win) p1.wins += 1;
                if (p1Tie) p1.wins += 0.5;
                p1.spread += spread;
                p1.games += 1;
                p1.history.push(p1Win ? 'W' : p1Tie ? 'T' : 'L');

                // Track "Last Game" - logic: overwrite as we iterate chronologically
                p1.lastGame = {
                    opponentName: p2.name,
                    opponentPhoto: p2.photo_url,
                    opponentRank: p2.rank || p2.seed,
                    myScore: score1,
                    oppScore: score2,
                    spread: spread
                };

                // Update P2
                const p2Win = score2 > score1;
                const p2Tie = score2 === score1;

                if (p2Win) p2.wins += 1;
                if (p2Tie) p2.wins += 0.5;
                p2.spread -= spread; // Inverse spread
                p2.games += 1;
                p2.history.push(p2Win ? 'W' : p2Tie ? 'T' : 'L');

                p2.lastGame = {
                    opponentName: p1.name,
                    opponentPhoto: p1.photo_url,
                    opponentRank: p1.rank || p1.seed,
                    myScore: score2,
                    oppScore: score1,
                    spread: -spread
                };
            });

            const computedStandings = Array.from(playerMap.values()).sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins;
                return b.spread - a.spread;
            });

            // Assign Rank
            computedStandings.forEach((p, i) => p.rank = i + 1);

            setStandings(computedStandings);

        } catch (err) {
            console.error(err);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [tournamentSlug]);

    // Initial Fetch
    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    // Realtime Subscription (Listen for RESULTS changes now)
    useEffect(() => {
        if (!tournament) return;

        console.log('Setting up realtime subscription for tournament:', tournament.id);

        const subscription = supabase
            .channel(`public:results:${tournament.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'results', // Changed to results
                filter: `tournament_id=eq.${tournament.id}`
            }, (payload) => {
                console.log('Realtime result update received:', payload);
                fetchData(false);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to result updates');
                }
            });

        return () => {
            console.log('Cleaning up subscription');
            supabase.removeChannel(subscription);
        };
    }, [tournament, fetchData]);

    if (loading) return <PublicLoadingScreen />;

    const topHalfCount = Math.ceil(standings.length / 2);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <h1 className="text-2xl font-bold">{tournament.name}</h1>
                        <p className="text-gray-400">Enhanced Scoreboard <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded textxs font-medium bg-green-900 text-green-200 animate-pulse">● LIVE</span></p>
                    </div>
                    <ThemeToggle variant="simple" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {standings.map((player, index) => {
                    const isTopHalf = index < topHalfCount;
                    const bgColor = isTopHalf ? 'bg-green-900 border-green-700' : 'bg-red-950 border-red-900';
                    const lastGame = player.lastGame;

                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            layout
                            key={player.player_id}
                            className={`relative border-2 rounded-lg p-3 overflow-hidden shadow-lg ${bgColor}`}
                        >
                            {/* Header: Rank, Record */}
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div className="flex items-baseline">
                                    <span className="text-4xl font-black text-white leading-none shadow-black drop-shadow-md">
                                        {player.rank}<span className="text-lg align-top opacity-70 font-medium">
                                            {getOrdinal(player.rank)}
                                        </span>
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold font-mono">
                                        {player.wins}-{player.games ? player.games - player.wins : 0}
                                        <span className={`ml-1 ${player.spread >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                            {player.spread > 0 ? '+' : ''}{player.spread}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Player Info */}
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="w-14 h-14 rounded-md bg-black/30 overflow-hidden border border-white/20 flex-shrink-0">
                                    {player.photo_url ? (
                                        <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Icon name="User" className="w-full h-full p-2 text-white/50" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-lg leading-tight truncate">{player.name.split(' ')[0]}</div>
                                    <div className="text-sm opacity-80 truncate">{player.name.split(' ').slice(1).join(' ')}</div>
                                    <div className="text-xs opacity-60 font-mono">#{player.seed}</div>
                                </div>
                            </div>

                            {/* Last Game Info */}
                            <div className="bg-black/20 -mx-3 -mb-3 p-3 mt-2 border-t border-white/10">
                                <div className="flex justify-between items-center text-xs mb-1 opacity-70">
                                    <span className="font-bold uppercase tracking-wider">Last Game</span>
                                    <span>vs #{lastGame?.opponentRank}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {/* Opp Photo Small */}
                                        <div className="w-8 h-8 rounded bg-black/40 overflow-hidden">
                                            {lastGame?.opponentPhoto ?
                                                <img src={lastGame.opponentPhoto} className="w-full h-full object-cover" alt="" /> :
                                                <div className="w-full h-full bg-white/10" />}
                                        </div>
                                        <div className="text-sm font-medium truncate max-w-[80px]">
                                            {lastGame ? lastGame.opponentName.split(' ')[0] : '-'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {lastGame ? (
                                            <>
                                                <div className="font-mono font-bold">
                                                    {lastGame.myScore}-{lastGame.oppScore}
                                                </div>
                                                <div className={`text-xs font-bold ${lastGame.spread > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {lastGame.spread > 0 ? '+' : ''}{lastGame.spread}
                                                </div>
                                            </>
                                        ) : <span className="text-xs opacity-50">Pending</span>}
                                    </div>
                                </div>
                                {/* History Boxes */}
                                <div className="flex gap-1 mt-2 justify-end">
                                    {player.history.slice(-5).map((result, i) => (
                                        <div key={i} className={`w-4 h-4 text-[10px] flex items-center justify-center font-bold rounded-sm ${result === 'W' ? 'bg-green-500 text-black' : result === 'T' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'}`}>
                                            {result}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

export default PublicEnhancedScoreboard;
