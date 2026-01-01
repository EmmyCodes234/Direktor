import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from '../components/AppIcon';
import PublicLoadingScreen from '../components/public/PublicLoadingScreen';
import PublicTournamentBanner from '../components/public/PublicTournamentBanner';
import { cn } from '../utils/cn';

const PublicRoundRatings = () => {
    const { tournamentSlug, round } = useParams();
    const [ratings, setRatings] = useState([]);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Tournament
                const { data: tourney, error: tError } = await supabase
                    .from('tournaments')
                    .select('*')
                    .eq('slug', tournamentSlug)
                    .single();

                if (tError) throw tError;
                setTournament(tourney);

                // 2. Fetch Ratings for Round
                const { data: ratingData, error: rError } = await supabase
                    .from('round_ratings')
                    .select(`
                        *,
                        player:players (id, name, slug)
                    `)
                    .eq('tournament_id', tourney.id)
                    .eq('round', round)
                    .order('new_rating', { ascending: false });

                if (rError) throw rError;

                // Add Rank
                const ranked = ratingData.map((item, index) => ({
                    ...item,
                    rank: index + 1
                }));

                setRatings(ranked);
            } catch (err) {
                console.error("Error fetching ratings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tournamentSlug, round]);

    if (loading) return <PublicLoadingScreen />;
    if (!tournament) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono">Tournament Not Found</div>;

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
            <PublicTournamentBanner tournament={tournament} />

            <div className="py-4 md:py-8 max-w-4xl mx-auto px-2 md:px-4">
                {/* Navigation & Header - Centered Layout */}
                <div className="relative flex flex-col md:flex-row items-center justify-center mb-6 md:mb-8 gap-2">
                    <Link to={`/tournament/${tournamentSlug}`} className="static md:absolute md:left-0 text-blue-700 hover:underline flex items-center gap-1 text-xs md:text-sm font-serif">
                        <Icon name="ArrowLeft" className="w-3 h-3 md:w-4 h-4" /> Back to Tournament
                    </Link>
                    <div className="text-center">
                        <h2 className="text-xl md:text-2xl font-bold font-serif text-slate-900">Round {round} Ratings</h2>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 font-sans">Player rating updates following this round.</p>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px] md:min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] md:text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                    <th className="p-2 md:p-4 w-10 md:w-16 text-center">Rank</th>
                                    <th className="p-2 md:p-4">Player</th>
                                    <th className="p-2 md:p-4 text-center">Rating</th>
                                    <th className="p-2 md:p-4 text-center">Change</th>
                                    <th className="p-2 md:p-4 text-center w-16 md:w-24">Games</th>
                                    <th className="p-2 md:p-4 text-center w-16 md:w-24">Wins</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {ratings.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 md:p-12 text-center text-slate-400 italic text-sm">
                                            No rating data available for this round yet.
                                        </td>
                                    </tr>
                                ) : (
                                    ratings.map((r) => (
                                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-2 md:p-4 text-center font-mono text-slate-400 font-bold text-sm md:text-base">{r.rank}</td>
                                            <td className="p-2 md:p-4">
                                                <div className="font-bold text-slate-800 text-sm md:text-lg">
                                                    {r.player?.name || 'Unknown Player'}
                                                </div>
                                                <div className="text-[10px] md:text-xs text-slate-400 font-mono mt-0.5">
                                                    PREV: {Math.round(r.old_rating)}
                                                </div>
                                            </td>
                                            <td className="p-2 md:p-4 text-center">
                                                <span className="font-mono font-bold text-slate-900 text-base md:text-xl tracking-tight">
                                                    {Math.round(r.new_rating)}
                                                </span>
                                            </td>
                                            <td className="p-2 md:p-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold font-mono",
                                                    r.rating_change > 0 ? "bg-emerald-100 text-emerald-700" :
                                                        r.rating_change < 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {r.rating_change > 0 ? '+' : ''}{Math.round(r.rating_change)}
                                                </span>
                                            </td>
                                            <td className="p-2 md:p-4 text-center font-mono text-slate-500 text-xs md:text-sm">
                                                {r.matches_played}
                                            </td>
                                            <td className="p-2 md:p-4 text-center font-mono text-slate-500 text-xs md:text-sm">
                                                {r.wins}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicRoundRatings;
