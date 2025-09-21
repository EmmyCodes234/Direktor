import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { supabase } from 'supabaseClient';
import Button from 'components/ui/Button';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import ThemeToggle from 'components/ui/ThemeToggle';
import TournamentTicker from '../components/TournamentTicker';

const PublicTournamentIndex = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTournamentData = useCallback(async () => {
        if (!tournamentSlug) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch tournament data
            const { data: tournamentData, error: tournamentError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('slug', tournamentSlug)
                .single();

            if (tournamentError) throw tournamentError;
            if (tournamentData.status === 'draft') throw new Error("Tournament not found");
            setTournament(tournamentData);

            // Fetch players
            const { data: playersData, error: playersError } = await supabase
                .from('tournament_players')
                .select('*, players (*)')
                .eq('tournament_id', tournamentData.id);

            if (playersError) throw playersError;

            const enrichedPlayers = playersData.map(tp => ({
                ...tp.players,
                player_id: tp.players.id,
                seed: tp.seed,
                team_id: tp.team_id,
                status: tp.status
            }));
            setPlayers(enrichedPlayers);

            // Fetch results
            const { data: resultsData, error: resultsError } = await supabase
                .from('results')
                .select('*')
                .eq('tournament_id', tournamentData.id)
                .order('created_at', { ascending: false });

            if (resultsError) throw resultsError;
            setResults(resultsData);

            // Fetch matches
            const { data: matchesData, error: matchesError } = await supabase
                .from('matches')
                .select('*')
                .eq('tournament_id', tournamentData.id)
                .order('round', { ascending: true });

            if (matchesError) throw matchesError;
            setMatches(matchesData);

        } catch (err) {
            console.error('Error fetching tournament data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug]);

    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData]);

    // Real-time updates
    useEffect(() => {
        if (!tournament) return;
        const channel = supabase.channel(`public-tournament-index-${tournament.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'results', filter: `tournament_id=eq.${tournament.id}` }, fetchTournamentData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_players', filter: `tournament_id=eq.${tournament.id}` }, fetchTournamentData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournament.id}` }, fetchTournamentData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournament.id}` }, fetchTournamentData)
            .subscribe();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [tournament, fetchTournamentData]);

    const tickerMessages = results.slice(0, 10).map(r => {
        if (r.score1 > r.score2) {
            return `LATEST: ${r.player1_name} defeated ${r.player2_name} ${r.score1} - ${r.score2}`;
        } else if (r.score2 > r.score1) {
            return `LATEST: ${r.player2_name} defeated ${r.player1_name} ${r.score2} - ${r.score1}`;
        } else {
            return `LATEST: ${r.player1_name} and ${r.player2_name} drew ${r.score1} - ${r.score2}`;
        }
    });

    const formattedDate = tournament?.type === 'best_of_league'
        ? `${format(new Date(tournament.start_date), "MMM do")} - ${format(new Date(tournament.end_date), "MMM do, yyyy")}`
        : tournament?.date ? format(new Date(tournament.date), "MMMM do, yyyy") : "Date not set";

    // Group matches by round and determine round status
    const roundsData = useMemo(() => {
        if (!matches.length) return [];

        // Group matches by round
        const rounds = matches.reduce((acc, match) => {
            if (!acc[match.round]) {
                acc[match.round] = [];
            }
            acc[match.round].push(match);
            return acc;
        }, {});

        // Sort rounds by round number
        const sortedRounds = Object.keys(rounds)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(roundNum => ({
                round: parseInt(roundNum),
                matches: rounds[roundNum]
            }));

        // Determine if results exist for each round
        const roundsWithStatus = sortedRounds.map(round => {
            // Check if any results exist for this round
            const roundResults = results.filter(result => result.round === round.round);
            const hasResults = roundResults.length > 0;

            return {
                ...round,
                hasResults
            };
        });

        return roundsWithStatus;
    }, [matches, results]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
                <div className="text-center space-y-3 sm:space-y-4">
                    <div className="h-6 w-6 sm:h-8 sm:w-8 bg-muted rounded animate-pulse mx-auto"></div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Loading Tournament Portal...</p>
                </div>
            </div>
        );
    }

    if (error || !tournament) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-3 sm:p-4">
                <Icon name="SearchX" size={40} className="text-destructive opacity-50 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
                <h1 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-2">Tournament Not Found</h1>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-sm">The tournament you're looking for doesn't exist or has been removed.</p>
            </div>
        );
    }

    const menuItems = [
        {
            id: 'roster',
            title: 'Player Roster',
            description: 'Complete list of tournament participants',
            icon: 'Users',
            path: `/tournament/${tournamentSlug}/roster`,
            color: 'from-green-500/20 to-green-600/20',
            iconColor: 'text-green-500'
        },
        {
            id: 'prizes',
            title: 'Prizes',
            description: 'Prize distribution and award details',
            icon: 'Gift',
            path: `/tournament/${tournamentSlug}/prizes`,
            color: 'from-purple-500/20 to-purple-600/20',
            iconColor: 'text-purple-500'
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/20">
                <div className="w-full px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1"></div>
                        <div className="flex-1 text-center min-w-0 px-2">
                            <h1 className="text-lg sm:text-xl font-bold text-blue-400 leading-tight truncate">{tournament.name}</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed truncate mt-0.5 sm:mt-1">
                                <span className="hidden sm:inline">{tournament.venue} • </span>
                                <span className="sm:hidden">{tournament.venue?.split(' ')[0]} • </span>
                                {formattedDate}
                            </p>
                        </div>
                        <div className="flex-1 flex justify-end">
                            <ThemeToggle variant="simple" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Ticker */}
            <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/20">
                <TournamentTicker messages={tickerMessages} />
            </div>

            {/* Main Content */}
            <main className="pt-28 sm:pt-32 pb-6 sm:pb-8 px-3 sm:px-4">
                <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                    {/* Tournament Info Card */}
                    <motion.div
                        className="bg-card border border-border/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                            <h2 className="text-base sm:text-lg font-semibold text-foreground">Tournament Overview</h2>
                            <div className="px-2 sm:px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full self-start">
                                {tournament.type === 'best_of_league' ? 'Best of League' : 'Single Game'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-muted/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                <p className="text-xs sm:text-sm text-muted-foreground">Players</p>
                                <p className="text-xl sm:text-2xl font-bold text-foreground">{players.length}</p>
                            </div>
                            <div className="bg-muted/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                <p className="text-xs sm:text-sm text-muted-foreground">Games Played</p>
                                <p className="text-xl sm:text-2xl font-bold text-foreground">{results.length}</p>
                            </div>
                        </div>

                        {/* Gibson Rule Indicator */}
                        {tournament.gibson_rule_enabled && (
                            <div className="mt-3 sm:mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <div className="flex items-center">
                                    <Icon name="Settings" size={14} className="text-blue-500 mr-2 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium text-blue-500">Gibson Rule Enabled</span>
                                </div>
                                <p className="text-xs text-blue-500/80 mt-1 leading-relaxed">
                                    In later rounds, first-place players will be paired against the highest-ranked non-prize winners
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Rounds Section */}
                    {roundsData.length > 0 && (
                        <div className="space-y-3 sm:space-y-4">
                            <h2 className="text-base sm:text-lg font-semibold text-foreground px-1 sm:px-2">Rounds</h2>

                            <div className="space-y-3 sm:space-y-4">
                                {roundsData.map((round, index) => (
                                    <motion.div
                                        key={round.round}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1, duration: 0.3 }}
                                        className="bg-card border border-border/20 rounded-xl sm:rounded-2xl p-4 sm:p-5"
                                    >
                                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                                            <h3 className="text-base sm:text-lg font-semibold text-foreground">Round {round.round}</h3>
                                        </div>

                                        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
                                            <Button
                                                variant="outline"
                                                className="h-auto p-2 sm:p-3 flex flex-col items-center justify-center space-y-1 text-xs sm:text-sm"
                                                onClick={() => navigate(`/tournament/${tournamentSlug}/public-pairings?round=${round.round}`)}
                                            >
                                                <Icon name="Swords" size={16} className="text-primary sm:w-5 sm:h-5" />
                                                <span className="font-medium text-foreground">Pairings</span>
                                            </Button>

                                            {round.hasResults ? (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        className="h-auto p-2 sm:p-3 flex flex-col items-center justify-center space-y-1 text-xs sm:text-sm"
                                                        onClick={() => navigate(`/tournament/${tournamentSlug}/standings?round=${round.round}`)}
                                                    >
                                                        <Icon name="Trophy" size={16} className="text-primary sm:w-5 sm:h-5" />
                                                        <span className="font-medium text-foreground">Standings</span>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="h-auto p-2 sm:p-3 flex flex-col items-center justify-center space-y-1 text-xs sm:text-sm"
                                                        onClick={() => navigate(`/tournament/${tournamentSlug}/stats?round=${round.round}`)}
                                                    >
                                                        <Icon name="BarChart2" size={16} className="text-primary sm:w-5 sm:h-5" />
                                                        <span className="font-medium text-foreground">Stats</span>
                                                    </Button>
                                                </>
                                            ) : (
                                                <div className="col-span-2 flex items-center justify-center">
                                                    <p className="text-muted-foreground text-xs sm:text-sm">Waiting for results...</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation Menu */}
                    <div className="space-y-3 sm:space-y-4">
                        <h2 className="text-base sm:text-lg font-semibold text-foreground px-1 sm:px-2">Tournament Sections</h2>

                        <div className="grid grid-cols-1 gap-2 sm:gap-3">
                            {menuItems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                >
                                    <Button
                                        variant="ghost"
                                        className="w-full h-auto p-0 hover:bg-transparent"
                                        onClick={() => navigate(item.path)}
                                    >
                                        <div className={`w-full bg-gradient-to-br ${item.color} border border-border/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 hover:shadow-lg hover:border-primary/30 active:scale-[0.98]`}>
                                            <div className="flex items-start space-x-3 sm:space-x-4">
                                                <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-background/50 flex items-center justify-center ${item.iconColor}`}>
                                                    <Icon name={item.icon} size={20} className="sm:w-6 sm:h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-foreground text-base sm:text-lg mb-0.5 sm:mb-1">{item.title}</h3>
                                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                                                </div>
                                                <div className="flex-shrink-0 flex items-center text-muted-foreground">
                                                    <Icon name="ChevronRight" size={18} className="sm:w-5 sm:h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Remote Results Submission */}
                    {tournament.remote_results_enabled && (
                        <div className="space-y-3 sm:space-y-4">
                            <h2 className="text-base sm:text-lg font-semibold text-foreground px-1 sm:px-2">Submit Results</h2>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.3 }}
                            >
                                <Button
                                    variant="ghost"
                                    className="w-full h-auto p-0 hover:bg-transparent"
                                    onClick={() => navigate(`/tournament/${tournamentSlug}/submit-results`)}
                                >
                                    <div className="w-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-border/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 hover:shadow-lg hover:border-primary/30 active:scale-[0.98]">
                                        <div className="flex items-start space-x-3 sm:space-x-4">
                                            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-background/50 flex items-center justify-center text-blue-500">
                                                <Icon name="Upload" size={20} className="sm:w-6 sm:h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground text-base sm:text-lg mb-0.5 sm:mb-1">Submit Match Results</h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Players can submit their match results remotely</p>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center text-muted-foreground">
                                                <Icon name="ChevronRight" size={18} className="sm:w-5 sm:h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </Button>
                            </motion.div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PublicTournamentIndex;