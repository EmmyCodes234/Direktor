import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { supabase } from 'supabaseClient';
import Button from 'components/ui/Button';
import ThemeToggle from 'components/ui/ThemeToggle';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import ReportFooter from 'components/public/ReportFooter';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import PublicAverageOpponentScores from "pages/PublicAverageOpponentScores";
import PublicAverageScores from "pages/PublicAverageScores";
import PublicHighCombinedScore from "pages/PublicHighCombinedScore";
import PublicToughBreak from "pages/PublicToughBreak";
import PublicBlowouts from "pages/PublicBlowouts";
import PublicPeakScores from "pages/PublicPeakScores";
import PublicLowScores from "pages/PublicLowScores";
import PublicLowLosses from "pages/PublicLowLosses";
import PublicLowSpreads from "pages/PublicLowSpreads";
import PublicGiantKillers from "pages/PublicGiantKillers";

const PublicTournamentStats = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState(null);
    const [statsData, setStatsData] = useState({ players: [], matches: [] });

    // 1. Determine Report Type
    const searchParams = new URLSearchParams(location.search);
    const view = searchParams.get('view') || 'general'; // Default to 'general'

    // SHIM: Redirect old view to new page component
    useEffect(() => {
        if (view === 'avg_opp_score') {
            navigate(`/tournament/${tournamentSlug}/avg-scores`, { replace: true });
        }
        if (view === 'avg_score') {
            navigate(`/tournament/${tournamentSlug}/player-avg-scores`, { replace: true });
        }
        if (view === 'shootouts') {
            navigate(`/tournament/${tournamentSlug}/high-combined`, { replace: true });
        }
        if (view === 'tough_break') {
            navigate(`/tournament/${tournamentSlug}/tough-break`, { replace: true });
        }
        if (view === 'high_spread') {
            navigate(`/tournament/${tournamentSlug}/blowouts`, { replace: true });
        }
        if (view === 'peak_score') {
            navigate(`/tournament/${tournamentSlug}/peak-scores`, { replace: true });
        }
        if (view === 'low_wins') {
            navigate(`/tournament/${tournamentSlug}/low-scores`, { replace: true });
        }
        if (view === 'low_losses') {
            navigate(`/tournament/${tournamentSlug}/low-losses`, { replace: true });
        }
        if (view === 'low_spread') {
            navigate(`/tournament/${tournamentSlug}/low-spreads`, { replace: true });
        }
        if (view === 'giant_killers') {
            navigate(`/tournament/${tournamentSlug}/giant-killers`, { replace: true });
        }

        // Redirect legacy/manual round stats to new scores page
        const roundParam = searchParams.get('round');
        if (roundParam) {
            navigate(`/tournament/${tournamentSlug}/scores?round=${roundParam}`, { replace: true });
        }
    }, [view, tournamentSlug, navigate]);

    // 2. Fetch Data
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const { data: tourney } = await supabase.from('tournaments')
                    .select('*').eq('slug', tournamentSlug).single();

                if (!tourney) throw new Error("Tournament not found");
                setTournament(tourney);

                // Fetch Players
                const { data: players } = await supabase.from('tournament_players')
                    .select('*, players(id, name, rating, photo_url)').eq('tournament_id', tourney.id);

                // Fetch Results (The definitive scores)
                const { data: resultsData } = await supabase.from('results')
                    .select('*')
                    .eq('tournament_id', tourney.id);

                setStatsData({ players: players || [], matches: resultsData || [] });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [tournamentSlug]);

    // 3. Compute Report Data
    const report = useMemo(() => {
        if (!statsData.players.length) return null;

        const { players, matches } = statsData;

        // Helper: Calculate aggregates per player
        const playerStats = players.map(p => {
            const myMatches = matches.filter(m => String(m.player1_id) === String(p.player_id) || String(m.player2_id) === String(p.player_id));
            const games = myMatches.length;
            let wins = 0;
            let losses = 0;
            let ties = 0;
            let totalScore = 0;
            let totalSpread = 0;
            let totalOppScore = 0;

            myMatches.forEach(m => {
                const isP1 = String(m.player1_id) === String(p.player_id);
                const myScore = isP1 ? m.score1 : m.score2;
                const oppScore = isP1 ? m.score2 : m.score1;

                totalScore += myScore;
                totalOppScore += oppScore;

                if (myScore > oppScore) wins++;
                else if (myScore < oppScore) losses++;
                else ties++;

                totalSpread += (myScore - oppScore);
            });

            return {
                name: p.players?.name || 'Unknown',
                rating: p.players?.rating || 0,
                games,
                wins,
                losses,
                ties,
                totalScore,
                totalOppScore,
                totalSpread,
                avgScore: games ? (totalScore / games).toFixed(1) : 0,
                avgOppScore: games ? (totalOppScore / games).toFixed(1) : 0
            };
        });

        const generalStats = () => {
            const registeredPlayers = players.length;
            const scoredPlayers = playerStats.filter(p => p.games > 0).length; // Players who have played
            const activePlayers = players.filter(p => p.status === 'active').length; // Or logic based on recent games if status not reliable

            // Ratings
            const ratedPlayers = players.filter(p => p.players?.rating > 0);
            const ratings = ratedPlayers.map(p => p.players.rating);
            const minRating = ratings.length ? Math.min(...ratings) : 0;
            const maxRating = ratings.length ? Math.max(...ratings) : 0;
            const meanRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'NaN';
            const sortedRatings = [...ratings].sort((a, b) => a - b);
            const medianRating = sortedRatings.length ? (
                sortedRatings.length % 2 !== 0 ? sortedRatings[Math.floor(sortedRatings.length / 2)] :
                    ((sortedRatings[sortedRatings.length / 2 - 1] + sortedRatings[sortedRatings.length / 2]) / 2).toFixed(1)
            ) : 0;
            const unratedPlayers = players.length - ratedPlayers.length;

            // Games
            const totalGames = matches.length;
            const gamesTied = matches.filter(m => m.score1 === m.score2).length;

            // Scoring
            const totalPoints = matches.reduce((acc, m) => acc + (m.score1 || 0) + (m.score2 || 0), 0);
            const meanPointsScored = totalGames ? (totalPoints / totalGames).toFixed(1) : 0; // Combined score per game
            const meanSpread = totalGames ? (matches.reduce((acc, m) => acc + Math.abs((m.score1 || 0) - (m.score2 || 0)), 0) / totalGames).toFixed(1) : 0;

            // Win Rates
            let higherRatedWins = 0;
            let ratedMatches = 0;
            let p1Wins = 0;
            let p1TotalScore = 0;
            let p2TotalScore = 0;

            matches.forEach(m => {
                const p1 = players.find(p => String(p.player_id) === String(m.player1_id))?.players;
                const p2 = players.find(p => String(p.player_id) === String(m.player2_id))?.players;

                // Higher Rated Win %
                if (p1?.rating && p2?.rating && p1.rating !== p2.rating && m.score1 !== m.score2) {
                    ratedMatches++;
                    const winnerId = m.score1 > m.score2 ? m.player1_id : m.player2_id;
                    const higherRatedId = p1.rating > p2.rating ? m.player1_id : m.player2_id;
                    if (String(winnerId) === String(higherRatedId)) higherRatedWins++;
                }

                // First Player Stats (Assuming Player 1 is "First" / Starting)
                if (m.score1 > m.score2) p1Wins++;
                p1TotalScore += (m.score1 || 0);
                p2TotalScore += (m.score2 || 0);
            });

            const higherRatedWinPct = ratedMatches ? ((higherRatedWins / ratedMatches) * 100).toFixed(1) : 'NaN';
            const firstPlayerWinPct = totalGames ? ((p1Wins / totalGames) * 100).toFixed(1) : 0; // Excludes ties?
            const firstPlayerAvgScore = totalGames ? (p1TotalScore / totalGames).toFixed(1) : 0;
            const secondPlayerAvgScore = totalGames ? (p2TotalScore / totalGames).toFixed(1) : 0;
            const firstPlayerAdvantage = (firstPlayerAvgScore - secondPlayerAvgScore).toFixed(1);

            return {
                title: 'Tournament Data',
                isGeneral: true,
                data: [
                    { label: 'Registered Players', value: registeredPlayers },
                    { label: 'Scored Players', value: scoredPlayers },
                    { label: 'Active Players', value: activePlayers },
                    { label: 'Minimum Rating', value: minRating },
                    { label: 'Mean Rating', value: meanRating },
                    { label: 'Median Rating', value: medianRating },
                    { label: 'Maximum Rating', value: maxRating },
                    { label: 'Unrated Players', value: unratedPlayers },
                    { type: 'spacer' },
                    { label: 'Total Games Played', value: totalGames },
                    { label: 'Games Tied', value: gamesTied },
                    { label: 'Total Points Scored', value: totalPoints },
                    { label: 'Mean Points Scored', value: meanPointsScored },
                    { label: 'Mean Spread', value: meanSpread },
                    { label: 'Higher Rated Win %', value: `${higherRatedWinPct}%` },
                    { type: 'spacer' },
                    { label: 'First Player Win %', value: `${firstPlayerWinPct}%` },
                    { label: 'First Player Score', value: firstPlayerAvgScore },
                    { label: 'Second Player Score', value: secondPlayerAvgScore },
                    { label: 'First Player Advantage', value: firstPlayerAdvantage },
                ]
            };
        };


        switch (view) {
            case 'general':
                return generalStats();
            // --- Player Aggregates ---
            case 'peak_score':
                return {
                    title: 'Peak Score',
                    headers: ['Rank', 'Player', 'Wins', 'Record'],
                    data: playerStats.sort((a, b) => b.wins - a.wins).map((p, i) => ({
                        rank: i + 1, name: p.name, value: p.wins, extra: `${p.wins}-${p.losses}-${p.ties}`
                    }))
                };

            case 'high_spread':
                return {
                    title: 'High Spreads',
                    headers: ['Rank', 'Player', 'Spread', 'Avg Spread'],
                    data: playerStats.sort((a, b) => b.totalSpread - a.totalSpread).map((p, i) => ({
                        rank: i + 1, name: p.name, value: p.totalSpread > 0 ? `+${p.totalSpread}` : p.totalSpread,
                        extra: p.games ? (p.totalSpread / p.games).toFixed(1) : '0'
                    }))
                };

            case 'tough_break':
                return {
                    title: 'Tough Break',
                    headers: ['Rank', 'Player', 'Losses', 'Record'],
                    data: playerStats.sort((a, b) => b.losses - a.losses).map((p, i) => ({
                        rank: i + 1, name: p.name, value: p.losses, extra: `${p.wins}-${p.losses}-${p.ties}`
                    }))
                };

            case 'low_wins':
                return {
                    title: 'Low Wins',
                    headers: ['Rank', 'Player', 'Wins', 'Record'],
                    data: playerStats.sort((a, b) => a.wins - b.wins).map((p, i) => ({
                        rank: i + 1, name: p.name, value: p.wins, extra: `${p.wins}-${p.losses}-${p.ties}`
                    }))
                };
            case 'low_losses':
                return {
                    title: 'Low Losses',
                    headers: ['Rank', 'Player', 'Losses', 'Record'],
                    data: playerStats.sort((a, b) => a.losses - b.losses).map((p, i) => ({
                        rank: i + 1, name: p.name, value: p.losses, extra: `${p.wins}-${p.losses}-${p.ties}`
                    }))
                };
            case 'avg_score':
                return {
                    title: 'Average Scores',
                    headers: ['Rank', 'Player', 'Avg Score', 'Total Score'],
                    data: playerStats.sort((a, b) => b.avgScore - a.avgScore).map((p, i) => ({
                        rank: i + 1, name: p.name, value: p.avgScore, extra: p.totalScore
                    }))
                };
            case 'avg_opp_score':
                return {
                    title: 'Average Opponent Scores',
                    headers: ['Rank', 'Player', 'Avg Opp Score', 'Total Opp Score'],
                    data: playerStats.sort((a, b) => b.avgOppScore - a.avgOppScore).map((p, i) => ({
                        rank: i + 1, name: p.name, value: p.avgOppScore, extra: p.totalOppScore
                    }))
                };
            case 'high_total_score':
                return {
                    title: 'High Total Scores',
                    headers: ['Rank', 'Player', 'Total Score', 'Avg Score'],
                    data: playerStats.sort((a, b) => b.totalScore - a.totalScore).map((p, i) => ({
                        rank: i + 1, name: p.name, value: p.totalScore, extra: p.avgScore
                    }))
                };

            // --- Match Records ---
            case 'shootouts':
                return {
                    title: 'Shootouts',
                    headers: ['Rank', 'Match', 'Combined', 'Round'],
                    data: matches
                        .map(m => ({ ...m, combined: m.player1_score + m.player2_score }))
                        .sort((a, b) => b.combined - a.combined)
                        .slice(0, 50)
                        .map((m, i) => ({
                            rank: i + 1,
                            name: `${m.player1_name} (${m.player1_score}) vs ${m.player2_name} (${m.player2_score})`,
                            value: m.combined,
                            extra: `Rd ${m.round}`
                        }))
                };

            case 'giant_killers':
                return {
                    title: 'Giant Killers',
                    headers: ['Rank', 'Winner', 'Rating Diff', 'Matchup'],
                    data: matches
                        .filter(m => {
                            const p1 = players.find(p => String(p.player_id) === String(m.player1_id))?.players;
                            const p2 = players.find(p => String(p.player_id) === String(m.player2_id))?.players;
                            if (!p1?.rating || !p2?.rating || m.score1 === m.score2) return false;

                            const winner = m.score1 > m.score2 ? p1 : p2;
                            const loser = m.score1 > m.score2 ? p2 : p1;
                            return winner.rating < loser.rating;
                        })
                        .map(m => {
                            const p1 = players.find(p => String(p.player_id) === String(m.player1_id))?.players;
                            const p2 = players.find(p => String(p.player_id) === String(m.player2_id))?.players;
                            const winner = m.score1 > m.score2 ? p1 : p2;
                            const loser = m.score1 > m.score2 ? p2 : p1;
                            return {
                                ...m,
                                winnerName: winner.name,
                                diff: loser.rating - winner.rating,
                                scores: `${m.score1}-${m.score2} vs ${loser.name}`
                            };
                        })
                        .sort((a, b) => b.diff - a.diff)
                        .slice(0, 50)
                        .map((m, i) => ({
                            rank: i + 1,
                            name: m.winnerName,
                            value: `+${m.diff}`,
                            extra: m.scores
                        }))
                };

            case 'clutch_win':
                return {
                    title: 'Clutch Win',
                    headers: ['Rank', 'Winner', 'Margin', 'Opponent'],
                    data: matches
                        .filter(m => Math.abs(m.score1 - m.score2) <= 5 && m.score1 !== m.score2)
                        .map(m => {
                            const p1 = players.find(p => String(p.player_id) === String(m.player1_id))?.players;
                            const p2 = players.find(p => String(p.player_id) === String(m.player2_id))?.players;
                            const winner = m.score1 > m.score2 ? p1 : p2;
                            const loser = m.score1 > m.score2 ? p2 : p1;
                            const margin = Math.abs(m.score1 - m.score2);
                            return {
                                ...m,
                                winnerName: winner?.name || 'Unknown',
                                margin: margin,
                                extra: `vs ${loser?.name || 'Unknown'} (${m.score1}-${m.score2})`
                            };
                        })
                        .sort((a, b) => a.margin - b.margin) // Smallest margin is "more clutch"? Or just list them. "Games won by 5 points or fewer".
                        .slice(0, 50)
                        .map((m, i) => ({
                            rank: i + 1,
                            name: m.winnerName,
                            value: m.margin,
                            extra: m.extra
                        }))
                };

            case 'close_defeats':
                return {
                    title: 'Close Defeats',
                    headers: ['Rank', 'Loser', 'Margin', 'Opponent'],
                    data: matches
                        .filter(m => Math.abs(m.score1 - m.score2) <= 5 && m.score1 !== m.score2)
                        .map(m => {
                            const p1 = players.find(p => String(p.player_id) === String(m.player1_id))?.players;
                            const p2 = players.find(p => String(p.player_id) === String(m.player2_id))?.players;
                            const loser = m.score1 > m.score2 ? p2 : p1;
                            const winner = m.score1 > m.score2 ? p1 : p2;
                            const margin = Math.abs(m.score1 - m.score2);
                            return {
                                ...m,
                                loserName: loser?.name || 'Unknown',
                                margin: margin,
                                extra: `vs ${winner?.name || 'Unknown'} (${m.score1}-${m.score2})`
                            };
                        })
                        .sort((a, b) => a.margin - b.margin)
                        .slice(0, 50)
                        .map((m, i) => ({
                            rank: i + 1,
                            name: m.loserName,
                            value: m.margin,
                            extra: m.extra
                        }))
                };

            default:
                return { title: 'Stats Menu', isMenu: true };
        }
    }, [statsData, view]);

    if (loading) {
        return <PublicLoadingScreen />;
    }

    const renderMenu = () => (
        <div className="flex flex-wrap justify-center gap-4 mt-8">
            <StatMenuLink slug={tournamentSlug} view="peak_score" label="Peak Score" active={view === 'peak_score'} />
            <StatMenuLink slug={tournamentSlug} view="tough_break" label="Tough Break" active={view === 'tough_break'} />
            <StatMenuLink slug={tournamentSlug} view="shootouts" label="Shootouts" active={view === 'shootouts'} />
            <StatMenuLink slug={tournamentSlug} view="giant_killers" label="Giant Killers" active={view === 'giant_killers'} />
            <StatMenuLink slug={tournamentSlug} view="clutch_win" label="Clutch Win" active={view === 'clutch_win'} />
            <StatMenuLink slug={tournamentSlug} view="close_defeats" label="Close Defeats" active={view === 'close_defeats'} />
            <StatMenuLink slug={tournamentSlug} view="high_spread" label="High Spreads" active={view === 'high_spread'} />
            <StatMenuLink slug={tournamentSlug} view="low_wins" label="Low Wins" active={view === 'low_wins'} />
            <StatMenuLink slug={tournamentSlug} view="avg_score" label="Average Scores" active={view === 'avg_score'} />

            {/* Add more links as needed or a dropdown for less common stats */}
        </div>

    );

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <PublicTournamentBanner tournament={tournament} />
            <div className="py-4 md:py-8 max-w-4xl mx-auto px-2 md:px-4 text-center">

                <div className="relative flex flex-col md:flex-row items-center justify-center mb-6 md:mb-8 gap-2">
                    {/* Header Navigation */}
                    {!report?.isMenu && (
                        <Button variant="ghost" className="static md:absolute md:left-0 text-blue-700 hover:underline flex items-center gap-1 text-xs md:text-sm font-serif p-0 h-auto hover:bg-transparent" onClick={() => navigate(`/tournament/${tournamentSlug}`)}>
                            <Icon name="ArrowLeft" className="w-3 h-3 md:w-4 md:h-4" /> Back to Tournament
                        </Button>
                    )}

                    <h1 className="text-xl md:text-2xl font-bold font-serif">{report?.title || 'Tournament Data'}</h1>
                </div>

                {report?.isGeneral && (
                    <div className="inline-block text-left mb-8 w-full md:w-auto">
                        <div className="font-bold mb-2 text-center text-lg">Division A</div>
                        <div className="overflow-x-auto shadow-sm border border-gray-100 rounded-lg">
                            <table className="border-collapse text-left w-full min-w-[300px] text-sm">
                                <tbody>
                                    {report.data.map((item, idx) => {
                                        if (item.type === 'spacer') {
                                            return <tr key={idx}><td className="h-4 bg-gray-50 border-t border-b border-gray-100" colSpan={2}></td></tr>;
                                        }
                                        return (
                                            <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                                <td className="pr-4 md:pr-8 pl-3 py-2 text-gray-600 font-medium">{item.label}</td>
                                                <td className="pl-4 pr-3 py-2 font-mono text-gray-900 font-bold text-right">{item.value}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                {!report?.isGeneral && !report?.isMenu && (
                    <div className="overflow-x-auto shadow-sm border border-gray-100 rounded-lg">
                        <table className="w-full text-xs md:text-sm border-collapse font-sans min-w-[320px]">
                            <thead>
                                <tr className="text-center font-bold text-xs md:text-base border-b border-gray-200 bg-gray-50">
                                    {report.headers.map((h, i) => (
                                        <th key={i} className={`p-1 md:p-2 pb-2 md:pb-4 whitespace-nowrap ${i === 1 ? 'text-left pl-4' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {report.data.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                        <td className="p-1 md:p-2 font-bold text-center w-8 md:w-12">{row.rank}</td>
                                        <td className="p-1 md:p-2 font-medium text-left pl-4 truncate max-w-[140px] md:max-w-none">{row.name}</td>
                                        <td className="p-1 md:p-2 font-mono font-bold text-center text-gray-900">{row.value}</td>
                                        <td className="p-1 md:p-2 text-gray-600 text-[10px] md:text-sm text-center font-mono">{row.extra}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Always show menu at bottom */}
                <div className="border-t border-gray-100 mt-8 pt-8">
                    <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4 font-bold">More Reports</h3>
                    {renderMenu()}
                </div>

                <div className="mt-8 flex justify-center">
                    <LinkItem href={`/tournament/${tournamentSlug}`} className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-2">
                        <Icon name="Home" size={14} /> Tournament Index
                    </LinkItem>
                </div>

                <ReportFooter />
            </div>
        </div>
    );
};

const StatMenuLink = ({ slug, view, label, active }) => (
    <a
        href={`/tournament/${slug}/stats?view=${view}`}
        className={`px-3 py-1.5 text-sm border rounded transition-colors ${active ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
    >
        {label}
    </a>
)

const LinkItem = ({ href, className, children }) => (
    <a href={href} className={className}>
        {children}
    </a>
);

export default PublicTournamentStats;
