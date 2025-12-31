import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import { format } from 'date-fns';
import ThemeToggle from 'components/ui/ThemeToggle';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';

const PublicTournamentIndex = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [roundsData, setRoundsData] = useState([]);

    const fetchTournamentData = useCallback(async () => {
        if (!tournamentSlug) return;
        setLoading(true);
        try {
            const { data: tData, error: tError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('slug', tournamentSlug)
                .single();
            if (tError) throw tError;
            setTournament(tData);

            // Fetch matches and results to determine round status
            const [matchesRes, resultsRes] = await Promise.all([
                supabase.from('matches').select('id, round, status').eq('tournament_id', tData.id),
                supabase.from('results').select('id, round').eq('tournament_id', tData.id)
            ]);

            const matches = matchesRes.data || [];
            const rData = resultsRes.data || [];

            // Determine max round from config, matches, or results
            let maxRound = tData.rounds || tData.total_rounds || 0;
            const roundSources = [
                ...(matches?.map(m => m.round) || []),
                ...(rData?.map(res => res.round) || [])
            ];
            if (roundSources.length > 0) {
                const maxFromSources = Math.max(...roundSources);
                if (maxFromSources > maxRound) maxRound = maxFromSources;
            }
            if (maxRound === 0) maxRound = 1;

            // Analyze each round
            const roundsStatus = [];
            for (let r = 1; r <= maxRound; r++) {
                const hasMatches = matches?.some(m => m.round == r);

                // Check pairing_schedule (JSONB)
                const schedule = tData.pairing_schedule || {};
                const hasSchedule = (schedule[r] && schedule[r].length > 0) || (schedule[String(r)] && schedule[String(r)].length > 0);

                const isPaired = hasMatches || hasSchedule;
                const hasResults = rData?.some(res => res.round == r);

                roundsStatus.push({
                    round: r,
                    isPaired,
                    hasResults
                });
            }

            // setRoundsData descending
            setRoundsData(roundsStatus.sort((a, b) => b.round - a.round));

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug]);

    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData]);



    if (loading) {
        return <PublicLoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-white text-black font-serif">
            {/* Banner Section */}
            <PublicTournamentBanner tournament={tournament} />

            <div className="py-6 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center">Event Coverage Index</h2>

                {/* Global Links - TSH Style Column */}
                <div className="flex flex-col items-center space-y-1 mb-12">
                    <LinkItem href={`/tournament/${tournamentSlug}/field`}>Field</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/live-streamboard`}>Live Streamboard</LinkItem>

                    <div className="h-4"></div> {/* Spacing as requested */}

                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=avg_opp_score`}>Average Opponent Scores</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=avg_score`}>Average Scores</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=shootouts`}>Shootouts</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=tough_break`}>Tough Break</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=high_spread`}>High Spreads</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=peak_score`}>Peak Score</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=low_losses`}>Low Losses</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=low_spread`}>Low Spreads</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=low_wins`}>Low Wins</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=clutch_win`}>Clutch Win</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/prize-report`}>Prize Report</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=ranking`}>Ratings</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/live-streamboard`}>Live Streamboard 1-22</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/leaderboard`}>Leaderboard</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/match-log`}>Match Log</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=high_total_score`}>High Total Scores</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=close_defeats`}>Close Defeats</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/stats?view=giant_killers`}>Giant Killers</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/cross-table`}>Cross-Table</LinkItem>

                </div>

                {/* Round Reports */}
                <div className="w-full">
                    <table className="w-full text-left border-collapse">
                        <tbody>
                            {roundsData.map((roundData) => (
                                <tr key={roundData.round} className="align-top">
                                    <td className="py-2 pr-8 text-right font-medium text-gray-700 whitespace-nowrap w-1/3">
                                        Round {roundData.round}
                                    </td>
                                    <td className="py-2 pl-4 border-l border-gray-300">
                                        <div className="flex flex-col items-start space-y-0.5">
                                            {roundData.isPaired ? (
                                                <>
                                                    <LinkItem href={`/tournament/${tournamentSlug}/matchups?round=${roundData.round}&sort=rank`}>Matchups</LinkItem>
                                                </>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">Matchups Pending</span>
                                            )}

                                            {roundData.hasResults ? (
                                                <>
                                                    <LinkItem href={`/tournament/${tournamentSlug}/stats?round=${roundData.round}`}>Scores</LinkItem>
                                                    <LinkItem href={`/tournament/${tournamentSlug}/leaderboard?round=${roundData.round}`}>Leaderboard</LinkItem>

                                                </>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">Results Pending</span>
                                            )}

                                            <span className="text-gray-400 cursor-not-allowed hidden">Score Slips</span>

                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            <div className="absolute top-4 right-4 print:hidden">
                <ThemeToggle variant="simple" />
            </div>
        </div >
    );
};

// TSH Style Link: Blue, Underline on Hover, Simple
const LinkItem = ({ href, children }) => (
    <a
        href={href}
        className="text-blue-700 hover:text-red-700 hover:underline text-lg decoration-1 underline-offset-2 block"
    >
        {children}
    </a>
);

export default PublicTournamentIndex;