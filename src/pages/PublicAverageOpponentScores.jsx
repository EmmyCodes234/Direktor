import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import Icon from 'components/AppIcon';

const PublicAverageOpponentScores = () => {
    const { tournamentSlug } = useParams();
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTournamentData = useCallback(async () => {
        if (!tournamentSlug) return;
        setLoading(true);

        try {
            // Fetch tournament data
            const { data: tournamentData, error: tError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('slug', tournamentSlug)
                .single();

            if (tError) throw tError;
            setTournament(tournamentData);

            // Fetch players
            const { data: playersData, error: pError } = await supabase
                .from('tournament_players')
                .select(`*, players(id, name, rating, photo_url)`)
                .eq('tournament_id', tournamentData.id);

            if (pError) throw pError;

            // Map players
            const mappedPlayers = playersData.map(p => ({
                ...p,
                name: p.players?.name || 'Unknown Player',
                initial_rank: p.rank || 0, // Keep track of seed/rank
            }));
            setPlayers(mappedPlayers);

            // Fetch results
            const { data: resultsData, error: rError } = await supabase
                .from('results')
                .select('*')
                .eq('tournament_id', tournamentData.id)
                .order('created_at', { ascending: true });

            if (!rError) {
                setResults(resultsData || []);
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
        if (!players.length) return [];

        return players.map(player => {
            let totalOpponentScore = 0;
            let gamesPlayed = 0;
            let wins = 0;
            let ties = 0;
            let losses = 0;
            let spread = 0;

            results.forEach(r => {
                const isP1 = r.player1_name === player.name || r.player1_id === player.player_id;
                const isP2 = r.player2_name === player.name || r.player2_id === player.player_id;

                if (!isP1 && !isP2) return;

                const myScore = isP1 ? r.score1 : r.score2;
                const oppScore = isP1 ? r.score2 : r.score1;

                // Ignore unplayed/zero games if necessary, but usually counts 0
                if (myScore !== null && oppScore !== null) {
                    totalOpponentScore += oppScore;
                    gamesPlayed += 1;
                    spread += (myScore - oppScore);

                    if (myScore > oppScore) wins++;
                    else if (myScore < oppScore) losses++;
                    else ties++;
                }
            });

            const avgOppScore = gamesPlayed > 0 ? (totalOpponentScore / gamesPlayed) : 0;
            const points = wins + (ties * 0.5);

            return {
                ...player,
                avgOppScore,
                gamesPlayed,
                record: `${points.toFixed(1)}-${losses.toFixed(1)}`, // "Won-Lost" column format from image: "5.0- 3.0"
                spread,
                spreadDisplay: spread > 0 ? `+${spread}` : `${spread}`
            };
        }).sort((a, b) => {
            // Sort by Avg Opponent Score ASCENDING (Lower is better defense usually, or just how the table is ordered)
            // Image: 1 @ 362, 20 @ 460. So Ascending.
            if (a.avgOppScore === 0) return 1; // Move 0 games to bottom
            if (b.avgOppScore === 0) return -1;
            return a.avgOppScore - b.avgOppScore;
        });

    }, [players, results]);

    if (loading) return <PublicLoadingScreen />;

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <PublicTournamentBanner tournament={tournament} />

            <div className="py-4 md:py-8 max-w-4xl mx-auto px-2 md:px-4">
                <div className="relative flex flex-col md:flex-row items-center justify-center mb-6 md:mb-8 gap-2">
                    <Link to={`/tournament/${tournamentSlug}`} className="static md:absolute md:left-0 text-blue-700 hover:underline flex items-center gap-1 text-xs md:text-sm font-serif">
                        <Icon name="ArrowLeft" className="w-3 h-3 md:w-4 md:h-4" /> Back to Tournament
                    </Link>
                    <h2 className="text-xl md:text-2xl font-bold font-serif text-center">Opponent Strength</h2>
                </div>

                <div className="overflow-x-auto shadow-sm border border-gray-100 rounded-lg">
                    <table className="w-full text-xs md:text-sm border-collapse font-sans min-w-[320px]">
                        <thead>
                            <tr className="text-center font-bold text-xs md:text-base border-b border-gray-200 bg-gray-50">
                                <th className="p-1 md:p-2 pb-2 md:pb-4 w-8 md:w-12">Rank</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-4 leading-tight">Avg<br className="md:hidden" /> Opp<br className="md:hidden" /> Score</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-4 whitespace-nowrap">Won-Lost</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-4">Spread</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-4 text-left pl-2 md:pl-8">Player</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statsData.map((player, idx) => (
                                <tr key={player.id || idx} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                    <td className="p-1 md:p-2 text-center font-bold">{idx + 1}</td>
                                    <td className="p-1 md:p-2 text-center font-mono font-bold text-gray-900">
                                        {player.avgOppScore.toFixed(2)}
                                    </td>
                                    <td className="p-1 md:p-2 text-center font-mono whitespace-nowrap">
                                        {player.record}
                                    </td>
                                    <td className={`p-1 md:p-2 text-center font-mono font-bold ${player.spread > 0 ? 'text-green-700' : 'text-red-600'}`}>
                                        {player.spreadDisplay}
                                    </td>
                                    <td className="p-1 md:p-2 text-left pl-2 md:pl-8 font-medium truncate max-w-[120px] md:max-w-none">
                                        {player.name} <span className="text-gray-400 font-normal md:inline block text-[10px] md:text-sm">#{player.initial_rank}</span>
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

export default PublicAverageOpponentScores;
