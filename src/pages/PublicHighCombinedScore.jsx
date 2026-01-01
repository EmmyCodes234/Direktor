import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import Icon from 'components/AppIcon';

const PublicHighCombinedScore = () => {
    const { tournamentSlug } = useParams();
    const [matches, setMatches] = useState([]);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTournamentData = useCallback(async () => {
        if (!tournamentSlug) return;
        setLoading(true);

        try {
            const { data: tournamentData, error: tError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('slug', tournamentSlug)
                .single();

            if (tError) throw tError;
            setTournament(tournamentData);

            // Fetch results
            const { data: resultsData, error: rError } = await supabase
                .from('results')
                .select('*')
                .eq('tournament_id', tournamentData.id);

            if (!rError) {
                setMatches(resultsData || []);
            }

        } catch (error) {
            console.error('Error fetching tournament data:', error);
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug]);

    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData]);

    const statsData = useMemo(() => {
        if (!matches.length) return [];

        return matches
            .map(m => {
                const combined = (m.score1 || 0) + (m.score2 || 0);
                const winnerScore = Math.max(m.score1 || 0, m.score2 || 0);
                const loserScore = Math.min(m.score1 || 0, m.score2 || 0);
                const winnerName = m.score1 > m.score2 ? m.player1_name : m.player2_name;
                const loserName = m.score1 > m.score2 ? m.player2_name : m.player1_name;

                return {
                    id: m.id,
                    round: m.round,
                    combined,
                    winnerScore,
                    loserScore,
                    winnerName: winnerName || 'Unknown',
                    loserName: loserName || 'Unknown'
                };
            })
            .sort((a, b) => b.combined - a.combined)
            .slice(0, 100); // Limit to top 100 to avoid performance issues

    }, [matches]);

    if (loading) return <PublicLoadingScreen />;

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <PublicTournamentBanner tournament={tournament} />

            <div className="py-4 md:py-8 max-w-5xl mx-auto px-2 md:px-4">
                <div className="relative flex flex-col md:flex-row items-center justify-center mb-6 md:mb-8 gap-2">
                    <Link to={`/tournament/${tournamentSlug}`} className="static md:absolute md:left-0 text-blue-700 hover:underline flex items-center gap-1 text-xs md:text-sm font-serif">
                        <Icon name="ArrowLeft" className="w-3 h-3 md:w-4 md:h-4" /> Back to Tournament
                    </Link>
                    <div className="text-center">
                        <h2 className="text-xl md:text-2xl font-bold font-serif">Shootouts</h2>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 font-sans">Highest total combined scores in a single game.</p>
                    </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto shadow-sm border border-gray-100 rounded-lg">
                    <table className="w-full text-sm border-collapse font-sans">
                        <thead>
                            <tr className="text-center font-bold text-base border-b border-gray-200 bg-gray-50">
                                <th className="p-2 pb-3 w-16">Round</th>
                                <th className="p-2 pb-3">Combined<br />Score</th>
                                <th className="p-2 pb-3">Winning<br />Score</th>
                                <th className="p-2 pb-3">Losing<br />Score</th>
                                <th className="p-2 pb-3 text-left pl-4">Winner</th>
                                <th className="p-2 pb-3 text-left pl-4">Loser</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statsData.map((match, idx) => (
                                <tr key={match.id || idx} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                    <td className="p-2 text-center font-bold">{match.round}</td>
                                    <td className="p-2 text-center font-mono font-bold text-gray-900 bg-gray-50/50">
                                        {match.combined}
                                    </td>
                                    <td className="p-2 text-center font-mono text-green-700 font-medium">
                                        {match.winnerScore}
                                    </td>
                                    <td className="p-2 text-center font-mono text-red-600 font-medium">
                                        {match.loserScore}
                                    </td>
                                    <td className="p-2 text-left pl-4 font-medium truncate max-w-[150px]">
                                        {match.winnerName}
                                    </td>
                                    <td className="p-2 text-left pl-4 font-normal text-gray-600 truncate max-w-[150px]">
                                        {match.loserName}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                    {statsData.map((match, idx) => (
                        <div key={match.id || idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Round {match.round}</span>
                                <span className="text-lg font-mono font-bold text-slate-900">{match.combined} <span className="text-xs text-gray-400 font-sans font-normal ml-1">pts</span></span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-900 truncate pr-2">{match.winnerName}</span>
                                    <span className="font-mono font-bold text-green-700">{match.winnerScore}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 truncate pr-2">{match.loserName}</span>
                                    <span className="font-mono font-medium text-red-600">{match.loserScore}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PublicHighCombinedScore;
