import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';

const PublicRoundScores = () => {
    const { tournamentSlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [matches, setMatches] = useState([]);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState({}); // Map player_id -> {id, name, seed}

    // Round Selection
    const [selectedRound, setSelectedRound] = useState(parseInt(searchParams.get('round')) || null);
    const [maxRound, setMaxRound] = useState(0);

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

            const currentR = tournamentData.current_round || 0;
            setMaxRound(currentR);
            if (!selectedRound) setSelectedRound(currentR);

            // Fetch players to get seeds/IDs
            const { data: playersData, error: pError } = await supabase
                .from('tournament_players')
                .select('player_id, seed, players(id, name)')
                .eq('tournament_id', tournamentData.id);

            if (pError) throw pError;

            const playerMap = {};
            playersData.forEach(p => {
                if (p.players) {
                    playerMap[p.player_id] = {
                        seed: p.seed,
                        name: p.players.name,
                        id: p.player_id // Internal ID, but user might want Seed or short ID
                    };
                }
            });
            setPlayers(playerMap);

            if (selectedRound || currentR > 0) {
                const rToFetch = selectedRound || currentR;
                const { data: resultsData, error: rError } = await supabase
                    .from('results')
                    .select('*')
                    .eq('tournament_id', tournamentData.id)
                    .eq('round', rToFetch);

                if (!rError) {
                    setMatches(resultsData || []);
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug, selectedRound]);

    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData]);

    // Handle round change
    const handleRoundChange = async (newRound) => {
        setSearchParams({ round: newRound });
        setSelectedRound(newRound);
        // Data fetch is triggered by useEffect on selectedRound
    };

    const sortedMatches = useMemo(() => {
        return [...matches].sort((a, b) => {
            // Sort by table number if possible, but we don't have table_number in results schema shown.
            // Sort by Player 1 Seed maybe?
            const p1SeedA = players[a.player1_id]?.seed || 999;
            const p1SeedB = players[b.player1_id]?.seed || 999;
            return p1SeedA - p1SeedB;
        });
    }, [matches, players]);

    if (loading) return <PublicLoadingScreen />;

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <PublicTournamentBanner tournament={tournament} />

            <div className="py-4 md:py-8 max-w-5xl mx-auto px-2 md:px-4">
                <div className="relative flex flex-col md:flex-row items-center justify-between mb-6 md:mb-8 gap-4">
                    <Link to={`/tournament/${tournamentSlug}`} className="static md:absolute md:left-0 text-blue-700 hover:underline flex items-center gap-1 text-xs md:text-sm font-serif">
                        <Icon name="ArrowLeft" className="w-3 h-3 md:w-4 md:h-4" /> Back to Round Index
                    </Link>

                    <div className="flex items-center gap-2 mx-auto">
                        <h2 className="text-xl md:text-2xl font-bold font-serif text-center min-w-[140px]">
                            Round {selectedRound} Scores
                        </h2>
                    </div>
                    {/* Spacer for centering */}
                    <div className="hidden md:block w-24"></div>
                </div>

                <div className="overflow-x-auto shadow-sm border border-gray-100 rounded-lg hidden md:block">
                    <table className="w-full text-sm border-collapse font-sans min-w-[600px]">
                        <thead>
                            <tr className="text-center font-bold text-base border-b border-gray-200 bg-gray-50">
                                <th className="p-2 pb-3 text-left pl-4">Player</th>
                                <th className="p-2 pb-3 w-16">ID</th>
                                <th className="p-2 pb-3 w-16">Score</th>
                                <th className="p-2 pb-3 text-left pl-4">Player</th>
                                <th className="p-2 pb-3 w-16">ID</th>
                                <th className="p-2 pb-3 w-16">Score</th>
                                <th className="p-2 pb-3 w-16">Spread</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMatches.map((match, idx) => {
                                const p1 = players[match.player1_id] || { seed: '-', name: match.player1_name };
                                const p2 = players[match.player2_id] || { seed: '-', name: match.player2_name };
                                const spread = Math.abs((match.score1 || 0) - (match.score2 || 0));

                                return (
                                    <tr key={match.id || idx} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 text-sm">
                                        <td className="p-2 text-left pl-4 font-medium truncate max-w-[200px]">
                                            {match.player1_name}
                                        </td>
                                        <td className="p-2 text-center text-gray-500 font-mono">
                                            {p1.seed}
                                        </td>
                                        <td className={`p-2 text-center font-mono font-bold ${match.score1 > match.score2 ? 'text-green-700' : 'text-gray-900'}`}>
                                            {match.score1}
                                        </td>

                                        <td className="p-2 text-left pl-4 font-medium truncate max-w-[200px]">
                                            {match.player2_name}
                                        </td>
                                        <td className="p-2 text-center text-gray-500 font-mono">
                                            {p2.seed}
                                        </td>
                                        <td className={`p-2 text-center font-mono font-bold ${match.score2 > match.score1 ? 'text-green-700' : 'text-gray-900'}`}>
                                            {match.score2}
                                        </td>

                                        <td className="p-2 text-center font-mono text-gray-600">
                                            {spread}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View - Cards */}
                <div className="md:hidden space-y-3">
                    {sortedMatches.map((match, idx) => {
                        const p1 = players[match.player1_id] || { seed: '-', name: match.player1_name };
                        const p2 = players[match.player2_id] || { seed: '-', name: match.player2_name };
                        const spread = Math.abs((match.score1 || 0) - (match.score2 || 0));

                        return (
                            <div key={match.id || idx} className="bg-white border border-gray-100 rounded-lg shadow-sm p-3">
                                <div className="flex flex-col gap-2">
                                    {/* Player 1 Row */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-sm ${match.score1 > match.score2 ? 'text-black' : 'text-gray-600'}`}>
                                                {match.player1_name}
                                            </span>
                                            <span className="text-[10px] text-gray-400">Seed {p1.seed}</span>
                                        </div>
                                        <span className={`font-mono text-lg font-bold ${match.score1 > match.score2 ? 'text-green-700' : 'text-gray-900'}`}>
                                            {match.score1}
                                        </span>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-100"></div>

                                    {/* Player 2 Row */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-sm ${match.score2 > match.score1 ? 'text-black' : 'text-gray-600'}`}>
                                                {match.player2_name}
                                            </span>
                                            <span className="text-[10px] text-gray-400">Seed {p2.seed}</span>
                                        </div>
                                        <span className={`font-mono text-lg font-bold ${match.score2 > match.score1 ? 'text-green-700' : 'text-gray-900'}`}>
                                            {match.score2}
                                        </span>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="flex justify-end pt-1">
                                        <span className="text-[10px] text-gray-400">Spread: {spread}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {sortedMatches.length === 0 && (
                    <div className="p-8 text-center text-gray-400 italic bg-gray-50 rounded-lg border border-gray-100">
                        No scores available for Round {selectedRound}.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicRoundScores;
