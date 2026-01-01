import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import Icon from 'components/AppIcon';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import { motion } from 'framer-motion';

const PublicRoundCommentary = () => {
    const { tournamentSlug, round } = useParams();
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState(null);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { data: tourney, error: tError } = await supabase.from('tournaments')
                .select('*').eq('slug', tournamentSlug).single();

            if (tError) throw tError;
            setTournament(tourney);

            const { data: commentary, error: cError } = await supabase
                .from('round_commentaries')
                .select('*')
                .eq('tournament_id', tourney.id)
                .eq('round', round)
                .single();

            if (cError && cError.code !== 'PGRST116') { // Ignore not found error
                throw cError;
            }

            if (commentary) {
                setReport(commentary.content);
            } else {
                setError("Commentary not found for this round.");
            }

        } catch (err) {
            console.error(err);
            setError("Unable to load commentary.");
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug, round]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <PublicLoadingScreen />;
    if (!tournament) return <div className="p-10 text-center">Tournament not found.</div>;

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
                            Round {round} Commentary
                            <span className="text-green-400">● PUBLISHED</span>
                        </p>
                    </div>
                </div>

                {error ? (
                    <div className="text-center py-20 bg-gray-900 rounded-xl border border-white/10">
                        <Icon name="FileText" className="mx-auto text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-400">{error}</h3>
                        <p className="text-gray-500 mt-2">Check back later or contact the director.</p>
                    </div>
                ) : (
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
                                {report?.summary}
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
                                    {report?.key_matchups?.map((m, i) => (
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
                                    {report?.surprises}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicRoundCommentary;
