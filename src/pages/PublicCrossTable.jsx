import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import ReportFooter from 'components/public/ReportFooter';
import Icon from 'components/AppIcon';

const PublicCrossTable = () => {
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
                .eq('tournament_id', tournamentData.id)
                .order('rank', { ascending: true });

            if (pError) throw pError;

            // Map players
            const mappedPlayers = playersData.map(p => ({
                ...p,
                name: p.players?.name || 'Unknown Player',
                rating: p.players?.rating || 0,
                photo_url: p.players?.photo_url || null,
                wins: p.wins || 0,
                losses: p.losses || 0,
                ties: p.ties || 0,
                spread: p.spread || 0
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

    // Enhanced wallchart data matching TSH style
    const wallChartData = useMemo(() => {
        if (!tournament || !players.length) return [];

        const totalRounds = tournament.rounds || tournament.total_rounds ||
            (results.length > 0 ? Math.max(...results.map(r => r.round || 0)) : 8);

        return players.map(player => {
            let runningWins = 0;
            let runningLosses = 0;
            let runningTies = 0; // Keeping as raw count
            // let runningSpread = 0; // Wait, spread in DB is cumulative? Recalculating from scratch is safer for the chart flow.
            // Actually, if we use DB results, we need to be careful.
            // Let's recalculate purely from the results array for consistency.
            let runningSpread = 0;

            const playerResults = Array.from({ length: totalRounds }, (_, roundIndex) => {
                const round = roundIndex + 1;
                const result = results.find(r =>
                    r.round === round && (r.player1_name === player.name || r.player2_name === player.name ||
                        r.player1_id === player.player_id || r.player2_id === player.player_id)
                );

                if (!result) return null;

                // Handle different field names & determine perspective
                const isPlayer1 = (result.player1_name === player.name) || (result.player1_id === player.player_id);

                const myScore = isPlayer1 ? (result.score1 || result.player1_score) : (result.score2 || result.player2_score);
                const oppScore = isPlayer1 ? (result.score2 || result.player2_score) : (result.score1 || result.player1_score);
                const oppName = isPlayer1 ? (result.player2_name || result.player2) : (result.player1_name || result.player1);

                const opponent = players.find(p => p.name === oppName);

                // Rank formatting: "1st", "2nd", "3rd", "4th", "19th"
                const formatRank = (r) => {
                    if (!r) return '?';
                    const j = r % 10, k = r % 100;
                    if (j === 1 && k !== 11) return r + "st";
                    if (j === 2 && k !== 12) return r + "nd";
                    if (j === 3 && k !== 13) return r + "rd";
                    return r + "th";
                };

                const oppRank = opponent?.rank ? formatRank(opponent.rank) : '?';
                const myRank = player.rank ? formatRank(player.rank) : '?';

                // Update running stats
                let isWin = false;
                if (myScore > oppScore) {
                    runningWins += 1;
                    isWin = true;
                } else if (myScore < oppScore) {
                    runningLosses += 1;
                } else {
                    runningTies += 1; // Count ties as 1 tie
                }

                const roundSpread = myScore - oppScore;
                runningSpread += roundSpread;

                // Determine Display Record: Wins.Ties - Losses
                // TSH style often is just cumulative points (Wins + 0.5*ties)
                // e.g. "3.5" or "4.0".
                // Based on image "1.0-0.0", it looks like Points-Losses (or maybe Wins-Losses?)
                // Let's use Cumulative Points (standard chess/scrabble notation)
                const params = { W: 1, T: 0.5, L: 0 };
                const points = (runningWins * 1) + (runningTies * 0.5);
                // But image shows "2.0-0.0". Let's assume (Points)-(Something).
                // Actually, let's just stick to Points (e.g. 3.0) and maybe Losses if needed.
                // Or maybe the image is "High Wins"-"Low Wins"? No.
                // Let's replicate "3.5-1.5" format as "Points-Losses" (roughly).
                // Actually, looking closely at the image provided in prompt:
                // Saporu: Round 1 "1.0-0.0", Round 5 "3.5-1.5".
                // This seems to be "Cumulative Score - Cumulative Losses"? No.
                // 3.5 points usually implies 3 wins 1 tie.
                // If round 5, 3.5 pts. That means 1.5 pts dropped? (1 loss 1 tie? or 3 ties?)
                // Let's stick to strict standard: Cumulative Points.
                // Wait, I'll use "W.T-L" equivalent or just Points.
                // Let's use "Wins-Losses" for simplicity unless ties exist.
                // If ties > 0, use "2.5" format.

                const scoreDisplay = runningTies > 0
                    ? points.toFixed(1)
                    : `${runningWins}.0`; // Matching format "1.0"

                // Second part of that line usually implies opponent's score? Or maybe spread?
                // The image shows a second number. "1.0-0.0".
                // Let's guess it's "Points - Opponent Points"? No.
                // Maybe "Wins - Losses"?
                // Round 1 win: 1.0 - 0.0.
                // Round 2 win: 2.0 - 0.0.
                // Round 3 win: 3.0 - 0.0.
                // Round 4 loss: 3.0 - 1.0. 
                // YES. It is "Wins - Losses".
                const recordDisplay = `${points.toFixed(1)}-${runningLosses.toFixed(1)}`;


                // Color logic
                // Win = Blue background (bg-blue-100/200)
                // Loss = White/Gray background
                // Tie = Green? Or Yellow?
                let bgColor = 'bg-white';
                if (isWin) bgColor = 'bg-blue-200'; // Match the image's distinct blue
                else if (myScore < oppScore) bgColor = 'bg-white';
                // else tie?

                return {
                    round,
                    myScore,
                    oppScore,
                    myRank,
                    oppRank,
                    roundSpread: roundSpread > 0 ? `+${roundSpread}` : `${roundSpread}`,
                    cumulativeSpread: runningSpread > 0 ? `+${runningSpread}` : `${runningSpread}`,
                    recordDisplay,
                    bgColor
                };
            });

            return {
                ...player,
                results: playerResults,
                finalWins: runningWins + (runningTies * 0.5),
                finalSpread: runningSpread
            };
        }).sort((a, b) => {
            if (b.finalWins !== a.finalWins) return b.finalWins - a.finalWins;
            return b.finalSpread - a.finalSpread;
        });
    }, [players, results, tournament]);

    if (loading) return <PublicLoadingScreen />;

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <PublicTournamentBanner tournament={tournament} />

            <div className="w-full px-2 py-4">
                <div className="relative flex items-center justify-center mb-6 px-4">
                    <Link to={`/tournament/${tournamentSlug}`} className="absolute left-4 text-blue-700 hover:underline flex items-center gap-1 text-sm font-serif">
                        <Icon name="ArrowLeft" className="w-4 h-4" /> Back to Tournament
                    </Link>
                    <h2 className="text-2xl font-bold font-serif">Cross Table</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse font-sans min-w-max">
                        <thead>
                            <tr>
                                <th className="p-2 text-left min-w-[150px] sticky left-0 bg-white z-20 font-bold text-xl font-serif">Player</th>
                                {Array.from({ length: tournament?.rounds || 8 }, (_, i) => (
                                    <th key={i} className="p-2 text-center min-w-[100px] font-bold text-xl font-serif">
                                        Round {i + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {wallChartData.map((player, idx) => (
                                <tr key={player.id || idx}>
                                    <td className="p-2 sticky left-0 bg-white z-10 font-normal text-lg truncate max-w-[200px] border-b border-gray-100 font-serif">
                                        {player.rank}. {player.name}
                                    </td>

                                    {player.results.map((res, i) => (
                                        <td key={i} className={`p-0 align-middle ${res ? res.bgColor : 'bg-gray-50'}`}>
                                            {res ? (
                                                <div className="flex flex-col items-center justify-center py-2 h-[85px] w-[100px] leading-snug">
                                                    {/* Line 1: Score */}
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {res.myScore}-{res.oppScore}
                                                    </div>

                                                    {/* Line 2: Rank vs OppRank (Underlined Blue) */}
                                                    <div className="text-sm text-blue-800 underline decoration-blue-800/50 decoration-1">
                                                        {res.myRank} vs. {res.oppRank}
                                                    </div>

                                                    {/* Line 3: Running Record */}
                                                    <div className="text-sm text-gray-800">
                                                        {res.recordDisplay}
                                                    </div>

                                                    {/* Line 4: Spread (Round = Cumulative) */}
                                                    <div className="text-[11px] font-medium text-gray-700">
                                                        {res.roundSpread} = {res.cumulativeSpread}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-[85px] w-[100px] flex items-center justify-center text-gray-300">-</div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <ReportFooter />
            </div>
        </div>
    );
};

export default PublicCrossTable;
