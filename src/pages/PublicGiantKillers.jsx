import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import Icon from 'components/AppIcon';

const PublicGiantKillers = () => {
    const { tournamentSlug } = useParams();
    const [matches, setMatches] = useState([]);
    const [playerRatings, setPlayerRatings] = useState({});
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

            if (rError) throw rError;

            // Fetch players to get ratings
            // We go through tournament_players to ensure we get players relevant to this tournament context if needed,
            // but getting raw players is fine since ratings are likely on the players table.
            const { data: playersData, error: pError } = await supabase
                .from('tournament_players')
                .select('player_id, players(id, rating)')
                .eq('tournament_id', tournamentData.id);

            if (pError) throw pError;

            // Create a lookup map: { player_id: rating }
            const ratings = {};
            playersData.forEach(item => {
                if (item.players) {
                    ratings[item.player_id] = item.players.rating || 0;
                }
            });
            setPlayerRatings(ratings);
            setMatches(resultsData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug]);

    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData]);

    const statsData = useMemo(() => {
        if (!matches.length || Object.keys(playerRatings).length === 0) return [];

        return matches
            .map(m => {
                const p1Rating = playerRatings[m.player1_id] || 0;
                const p2Rating = playerRatings[m.player2_id] || 0;

                let winnerId, loserId, winnerRating, loserRating, winnerScore, loserScore;

                if (m.score1 > m.score2) {
                    winnerId = m.player1_id;
                    loserId = m.player2_id;
                    winnerRating = p1Rating;
                    loserRating = p2Rating;
                    winnerScore = m.score1;
                    loserScore = m.score2;
                } else if (m.score2 > m.score1) {
                    winnerId = m.player2_id;
                    loserId = m.player1_id;
                    winnerRating = p2Rating;
                    loserRating = p1Rating;
                    winnerScore = m.score2;
                    loserScore = m.score1;
                } else {
                    // Draw or incomplete, skip
                    return null;
                }

                // A giant killing is when the winner's rating is LOWER than the loser's rating
                // Upsets only.
                if (winnerRating >= loserRating) return null;

                const ratingDiff = loserRating - winnerRating;
                const spread = winnerScore - loserScore;

                // Player Names
                const winnerName = m.score1 > m.score2 ? m.player1_name : m.player2_name;
                const loserName = m.score1 > m.score2 ? m.player2_name : m.player1_name;

                return {
                    id: m.id,
                    round: m.round,
                    winnerName,
                    loserName,
                    winnerRating,
                    loserRating,
                    score: `${winnerScore}-${loserScore}`,
                    spread,
                    ratingDiff
                };
            })
            .filter(item => item !== null) // Remove nulls
            .sort((a, b) => b.ratingDiff - a.ratingDiff) // Sort by biggest upset first
            .slice(0, 100);

    }, [matches, playerRatings]);

    if (loading) return <PublicLoadingScreen />;

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <PublicTournamentBanner tournament={tournament} />

            <div className="py-4 md:py-8 max-w-5xl mx-auto px-2 md:px-4">
                <div className="relative flex flex-col md:flex-row items-center justify-center mb-6 md:mb-8 gap-2">
                    <Link to={`/tournament/${tournamentSlug}`} className="static md:absolute md:left-0 text-blue-700 hover:underline flex items-center gap-1 text-xs md:text-sm font-serif">
                        <Icon name="ArrowLeft" className="w-3 h-3 md:w-4 md:h-4" /> Back to Tournament
                    </Link>
                    <h2 className="text-xl md:text-2xl font-bold font-serif text-center">Giant Killers</h2>
                </div>

                <div className="overflow-x-auto shadow-sm border border-gray-100 rounded-lg">
                    <table className="w-full text-xs md:text-sm border-collapse font-sans min-w-[350px] md:min-w-[600px]">
                        <thead>
                            <tr className="text-center font-bold text-xs md:text-base border-b border-gray-200 bg-gray-50">
                                <th className="p-1 md:p-2 pb-2 md:pb-3 w-8 md:w-16">Round</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-3 leading-tight">Rating<br className="md:hidden" /> Diff</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-3 text-left pl-2 md:pl-4">Winner (Rating)</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-3 text-left pl-2 md:pl-4">Loser (Rating)</th>
                                <th className="p-1 md:p-2 pb-2 md:pb-3">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statsData.length > 0 ? (
                                statsData.map((match, idx) => (
                                    <tr key={match.id || idx} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                        <td className="p-1 md:p-2 text-center font-bold">{match.round}</td>
                                        <td className="p-1 md:p-2 text-center font-mono font-bold text-gray-900 bg-gray-50/50">
                                            +{match.ratingDiff}
                                        </td>
                                        <td className="p-1 md:p-2 text-left pl-2 md:pl-4 font-medium truncate max-w-[110px] md:max-w-[200px]">
                                            {match.winnerName} <span className="text-gray-500 text-xs">({match.winnerRating})</span>
                                        </td>
                                        <td className="p-1 md:p-2 text-left pl-2 md:pl-4 font-normal text-gray-500 truncate max-w-[110px] md:max-w-[200px]">
                                            {match.loserName} <span className="text-gray-400 text-xs">({match.loserRating})</span>
                                        </td>
                                        <td className="p-1 md:p-2 text-center font-mono text-gray-900 font-medium">
                                            {match.score}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                                        No upsets found based on current player ratings.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PublicGiantKillers;
