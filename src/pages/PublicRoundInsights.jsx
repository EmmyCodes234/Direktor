import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import Icon from 'components/AppIcon';
import ThemeToggle from 'components/ui/ThemeToggle';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import CerebrasService from 'services/cerebrasInsightService';
import { motion } from 'framer-motion';

const PublicRoundInsights = () => {
    const { tournamentSlug } = useParams();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [tournament, setTournament] = useState(null);
    const [currentRound, setCurrentRound] = useState(0);
    const [report, setReport] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Fetch and Initialize
    const fetchData = useCallback(async () => {
        try {
            const { data: tourney } = await supabase.from('tournaments')
                .select('*').eq('slug', tournamentSlug).single();
            setTournament(tourney);

            const { data: results } = await supabase.from('results')
                .select('*').eq('tournament_id', tourney.id);

            if (results && results.length > 0) {
                const maxRound = Math.max(...results.map(r => r.round));
                setCurrentRound(maxRound);
                // Trigger generation if not present (simple in-memory cache for demo)
                generateReport(tourney.id, maxRound, results);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }, [tournamentSlug]);

    const generateReport = async (tourneyId, round, allResults) => {
        setGenerating(true);
        try {
            // 1. Calculate Standings
            const { data: players } = await supabase.from('tournament_players')
                .select('*, players(*)').eq('tournament_id', tourneyId);

            const playerMap = new Map();
            players.forEach(p => playerMap.set(p.player_id, { ...p, ...p.players, wins: 0, spread: 0 }));

            // Only up to current round
            const relevantResults = allResults.filter(r => r.round <= round);

            relevantResults.forEach(r => {
                const p1 = playerMap.get(r.player1_id);
                const p2 = playerMap.get(r.player2_id);
                if (r.is_bye && p1) { p1.wins++; p1.spread += r.score1; return; }
                if (!p1 || !p2) return;

                const s1 = r.score1 || 0, s2 = r.score2 || 0;
                if (s1 > s2) p1.wins++; else if (s1 === s2) p1.wins += 0.5;
                if (s2 > s1) p2.wins++; else if (s2 === s1) p2.wins += 0.5;
                p1.spread += (s1 - s2);
                p2.spread += (s2 - s1);
            });

            const standings = Array.from(playerMap.values()).sort((a, b) => b.wins - a.wins || b.spread - a.spread);
            standings.forEach((p, i) => p.rank = i + 1);

            // 2. Extract Top Table Results for this round specifically
            const thisRoundResults = allResults.filter(r => r.round === round);
            // Simple heuristic for "Top Table": Matches involving top 4 players
            const top4Ids = new Set(standings.slice(0, 4).map(p => p.player_id));
            const topMatches = thisRoundResults.filter(r => top4Ids.has(r.player1_id) || top4Ids.has(r.player2_id)).map(r => {
                const p1 = playerMap.get(r.player1_id)?.name;
                const p2 = playerMap.get(r.player2_id)?.name;
                const winner = r.score1 > r.score2 ? p1 : p2;
                return { p1, p2, winner, score: `${r.score1}-${r.score2}` };
            });

            // 3. Call AI
            const analysis = await CerebrasService.generateDetailedRoundReport(standings, round, topMatches);
            setReport(analysis);
            setLastUpdated(new Date());

        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <PublicLoadingScreen />;
    if (!tournament) return <div className="p-10 text-center text-white">Tournament not found.</div>;

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-indigo-500 selection:text-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Link to={`/tournament/${tournamentSlug}`} className="text-gray-400 hover:text-white text-sm mb-2 block flex items-center gap-1 transition-colors">
                            <Icon name="ArrowLeft" className="w-4 h-4" /> Back to Tournament
                        </Link>
                        <h1 className="text-3xl font-black tracking-tight">{tournament.name}</h1>
                        <p className="text-gray-400 font-medium mt-1 uppercase tracking-widest text-xs flex items-center gap-2">
                            Tournament Intelligence
                            {generating ? <span className="text-yellow-400">● ANALYZING...</span> : <span className="text-green-400">● LIVE</span>}
                        </p>
                    </div>
                </div>

                {/* Round Selector (Static Display for now) */}
                <div className="mb-8 flex items-center gap-4">
                    <span className="text-xl font-bold text-white/50">ROUND {currentRound} REPORT</span>
                    <div className="h-px bg-white/10 flex-grow" />
                    <span className="text-xs text-white/30">{lastUpdated?.toLocaleTimeString()}</span>
                </div>

                {/* Main Content Grid */}
                {report ? (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-950/30 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Icon name="Zap" className="w-32 h-32" />
                            </div>
                            <h2 className="text-indigo-300 font-bold mb-3 uppercase tracking-wider text-sm">Round Summary</h2>
                            <p className="text-xl leading-relaxed font-medium text-indigo-50 shadow-black drop-shadow-sm">
                                {report.summary}
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Key Matchups */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                                className="bg-gray-900 border border-white/10 p-6 rounded-xl"
                            >
                                <div className="flex items-center gap-2 mb-4 text-green-400">
                                    <Icon name="Star" className="w-5 h-5 fill-current" />
                                    <h3 className="font-bold uppercase tracking-wide text-sm">Key Developments</h3>
                                </div>
                                <ul className="space-y-3">
                                    {report.key_matchups?.map((m, i) => (
                                        <li key={i} className="flex gap-3 items-start p-3 bg-white/5 rounded-lg">
                                            <span className="font-mono text-green-500 font-bold text-lg">{i + 1}</span>
                                            <span className="text-gray-200 text-sm leading-snug">{m}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Surprises/Analysis */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                                className="bg-gray-900 border border-white/10 p-6 rounded-xl"
                            >
                                <div className="flex items-center gap-2 mb-4 text-orange-400">
                                    <Icon name="TrendingUp" className="w-5 h-5" />
                                    <h3 className="font-bold uppercase tracking-wide text-sm">Storylines & Surprises</h3>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                    {report.surprises}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-white/30">
                        <div className="animate-spin mb-4"><Icon name="Loader" className="w-8 h-8" /></div>
                        <p>Curating insights...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicRoundInsights;
