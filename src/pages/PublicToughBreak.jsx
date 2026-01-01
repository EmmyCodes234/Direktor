import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import Icon from 'components/AppIcon';

const PublicToughBreak = () => {
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
                const winnerScore = Math.max(m.score1 || 0, m.score2 || 0);
                const loserScore = Math.min(m.score1 || 0, m.score2 || 0);
                const winnerName = m.score1 > m.score2 ? m.player1_name : m.player2_name;
                const loserName = m.score1 > m.score2 ? m.player2_name : m.player1_name;

                return {
                    id: m.id,
                    round: m.round,
                    winnerScore,
                    loserScore,
                    winnerName: winnerName || 'Unknown',
                    loserName: loserName || 'Unknown'
                };
            })
            .sort((a, b) => b.loserScore - a.loserScore) // Sort by Losing Score DESC
            .slice(0, 100);

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
                        <h2 className="text-xl md:text-2xl font-bold font-serif">Tough Break</h2>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 font-sans">Highest scores that still resulted in a loss.</p>
                    </div>
                </div>

                <div className="overflow-x-auto shadow-sm border border-gray-100 rounded-lg">
                    <table className="w-full text-xs md:text-sm border-collapse font-sans min-w-[350px] md:min-w-[600px]">
                        <thead>
                            <tr className="text-center font-bold text-xs md:text-base border-b border-gray-200 bg-gray-50">
                                <th className="p-1 md:p-2 pb-2 md:pb-3 w-8 md:w-16">Round</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-3 leading-tight">Losing<br className="md:hidden" /> Score</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-3 leading-tight">Winning<br className="md:hidden" /> Score</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-3 text-left pl-2 md:pl-4">Loser</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-3 text-left pl-2 md:pl-4">Winner</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statsData.map((match, idx) => (
                                <tr key={match.id || idx} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                    <td className="p-1 md:p-2 text-center font-bold">{match.round}</td>
                                    <td className="p-1 md:p-2 text-center font-mono font-bold text-gray-900 bg-gray-50/50">
                                        {match.loserScore}
                                    </td>
                                    <td className="p-1 md:p-2 text-center font-mono text-gray-500 font-medium">
                                        {match.winnerScore}
                                    </td>
                                    <td className="p-1 md:p-2 text-left pl-2 md:pl-4 font-medium truncate max-w-[90px] md:max-w-[200px]">
                                        {match.loserName}
                                    </td>
                                    <td className="p-1 md:p-2 text-left pl-2 md:pl-4 font-normal text-gray-500 truncate max-w-[80px] md:max-w-[200px]">
                                        {match.winnerName}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PublicToughBreak;
