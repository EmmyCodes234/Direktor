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

            // Fetch matches, results, and commentaries
            const [matchesRes, resultsRes, commentariesRes, ratingsRes] = await Promise.all([
                supabase.from('matches').select('id, round, status').eq('tournament_id', tData.id),
                supabase.from('results').select('id, round').eq('tournament_id', tData.id),
                supabase.from('round_commentaries').select('round').eq('tournament_id', tData.id),
                supabase.from('round_ratings').select('round').eq('tournament_id', tData.id)
            ]);

            const matches = matchesRes.data || [];
            const rData = resultsRes.data || [];
            const commentaries = new Set(commentariesRes.data?.map(c => c.round) || []);
            const ratings = new Set(ratingsRes.data?.map(r => r.round) || []);

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
                const hasCommentary = commentaries.has(r);
                const hasRatings = ratings.has(r);

                roundsStatus.push({
                    round: r,
                    isPaired,
                    hasResults,
                    hasCommentary,
                    hasRatings
                });
            }

            // Reverse so round 1 is at bottom? Or top? Usually top is better on mobile. Let's keep 1 at top.
            // Actually usually for rounds list, 1..N is standard.
            setRoundsData(roundsStatus);
            setLoading(false);

        } catch (err) {
            console.error("Error fetching tournament:", err);
            setLoading(false);
        }
    }, [tournamentSlug]);

    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData]);

    const LinkItem = ({ href, children }) => (
        <a
            href={href}
            className="text-blue-700 hover:text-red-700 hover:underline text-lg decoration-1 underline-offset-2 block"
        >
            {children}
        </a>
    );

    if (loading) {
        return <PublicLoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-white text-black font-serif">
            {/* Banner Section */}
            <PublicTournamentBanner tournament={tournament} />

            <div className="py-6 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-1 text-center">Event Coverage Index</h2>
                <p className="text-center text-xs md:text-sm text-gray-500 mb-6 font-sans">Directory of all tournament reports and live coverage.</p>

                {/* Global Links - TSH Style Column */}
                <div className="flex flex-col items-center space-y-1 mb-12">
                    <LinkItem href={`/tournament/${tournamentSlug}/field`}>Field</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/live-streamboard`}>Live Streamboard</LinkItem>

                    <LinkItem href={`/tournament/${tournamentSlug}/submit-result`}>Submit Result</LinkItem>

                    <div className="h-4"></div> {/* Spacing as requested */}

                    <LinkItem href={`/tournament/${tournamentSlug}/avg-scores`}>Opponent Strength</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/player-avg-scores`}>Scoring Pace</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/high-combined`}>Shootouts</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/tough-break`}>Tough Break</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/blowouts`}>Blowouts</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/peak-scores`}>Peak Score</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/low-losses`}>Cold Spells</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/low-spreads`}>Nailbiters</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/low-scores`}>Grind Wins</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/prize-report`}>Prize Report</LinkItem>
                    {/* Ratings removed from here, moved to round specific */}
                    <LinkItem href={`/tournament/${tournamentSlug}/leaderboard`}>Leaderboard</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/insights`}>Smart Insights</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/match-log`}>Match Log</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/giant-killers`}>Giant Killers</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/cross-table`}>Cross-Table</LinkItem>
                    <LinkItem href={`/tournament/${tournamentSlug}/scores`}>Round Scores</LinkItem>

                </div>

                {/* Round Reports */}
                {/* Round Reports */}
                <div className="w-full flex flex-col items-center space-y-8">
                    {roundsData.map((roundData) => (
                        <div key={roundData.round} className="flex flex-col items-center space-y-1">
                            <h3 className="text-gray-900 font-bold uppercase tracking-widest text-sm mb-1">
                                Round {roundData.round}
                            </h3>

                            {roundData.isPaired ? (
                                <LinkItem href={`/tournament/${tournamentSlug}/matchups?round=${roundData.round}&sort=rank`}>Matchups</LinkItem>
                            ) : (
                                <span className="text-gray-400 italic text-lg">Matchups Pending</span>
                            )}

                            {roundData.hasResults ? (
                                <>
                                    <LinkItem href={`/tournament/${tournamentSlug}/stats?round=${roundData.round}`}>Scores</LinkItem>
                                    <LinkItem href={`/tournament/${tournamentSlug}/leaderboard?round=${roundData.round}`}>Leaderboard</LinkItem>
                                </>
                            ) : (
                                <span className="text-gray-400 italic text-lg">Results Pending</span>
                            )}

                            {/* Ratings Link */}
                            {roundData.hasRatings && (
                                <LinkItem href={`/tournament/${tournamentSlug}/ratings/${roundData.round}`}>Ratings</LinkItem>
                            )}

                            {roundData.hasCommentary && (
                                <LinkItem href={`/tournament/${tournamentSlug}/commentary/${roundData.round}`}>Commentary</LinkItem>
                            )}
                        </div>
                    ))}
                </div>
            </div>


            {/* Theme Toggle Removed - Always Light Mode */}
            {/* <div className="absolute top-4 right-4 print:hidden">
                <ThemeToggle variant="simple" />
            </div> */}
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