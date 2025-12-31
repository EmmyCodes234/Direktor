import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import ThemeToggle from 'components/ui/ThemeToggle';

const AllTournamentsPage = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAllTournaments();
    }, []);

    const fetchAllTournaments = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all published tournaments
            const { data: tournamentsData, error: tournamentsError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (tournamentsError) throw tournamentsError;

            // Fetch player counts for each tournament
            const tournamentsWithPlayers = await Promise.all(
                tournamentsData.map(async (tournament) => {
                    const { count: playerCount, error: playerError } = await supabase
                        .from('tournament_players')
                        .select('*', { count: 'exact', head: true })
                        .eq('tournament_id', tournament.id);

                    if (playerError) {
                        console.error('Error fetching player count for tournament:', tournament.id, playerError);
                        return { ...tournament, player_count: 0 };
                    }

                    return { ...tournament, player_count: playerCount };
                })
            );

            setTournaments(tournamentsWithPlayers);
        } catch (err) {
            console.error('Error fetching tournaments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "Date not set";
        return format(new Date(date), "MMMM do, yyyy");
    };

    const formatTournamentType = (type) => {
        switch (type) {
            case 'best_of_league':
                return 'Best of League';
            case 'team':
                return 'Team Tournament';
            case 'round_robin':
                return 'Round Robin';
            default:
                return 'Single Game';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="h-8 w-8 bg-muted rounded animate-pulse mx-auto"></div>
                    <p className="text-muted-foreground text-sm">Loading Tournaments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
                <Icon name="AlertCircle" size={48} className="text-destructive opacity-50 mb-4" />
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">Error Loading Tournaments</h1>
                <p className="text-muted-foreground text-sm mb-6">{error}</p>
                <Button onClick={fetchAllTournaments} variant="default">
                    <Icon name="RefreshCw" className="mr-2" size={16} />
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/20">
                <div className="w-full px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1"></div>
                        <div className="flex-1 text-center">
                            <h1 className="text-xl font-bold text-blue-400 leading-tight">All Tournaments</h1>
                            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                                Browse all available tournaments
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
                        </div>
                    </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-8 px-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-foreground">
                            Available Tournaments
                        </h2>
                        <p className="text-muted-foreground">
                            {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {tournaments.length === 0 ? (
                        <div className="bg-card border border-border/20 rounded-2xl p-8 text-center">
                            <Icon name="Trophy" size={48} className="mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No Tournaments Available</h3>
                            <p className="text-muted-foreground mb-6">
                                There are currently no published tournaments. Check back later!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournaments.map((tournament, index) => (
                                <motion.div
                                    key={tournament.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                    className="bg-card border border-border/20 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 hover:border-primary/30 cursor-pointer"
                                    onClick={() => navigate(`/tournament/${tournament.slug}/public`)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-foreground truncate flex-1 mr-2">
                                            {tournament.name}
                                        </h3>
                                        <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full whitespace-nowrap">
                                            {formatTournamentType(tournament.type)}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Icon name="MapPin" size={16} className="mr-2 flex-shrink-0" />
                                            <span className="truncate">{tournament.venue || 'Location not set'}</span>
                                        </div>

                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Icon name="Calendar" size={16} className="mr-2 flex-shrink-0" />
                                            <span>
                                                {tournament.type === 'best_of_league'
                                                    ? `${formatDate(tournament.start_date)} - ${formatDate(tournament.end_date)}`
                                                    : formatDate(tournament.date)}
                                            </span>
                                        </div>

                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Icon name="Users" size={16} className="mr-2 flex-shrink-0" />
                                            <span>{tournament.player_count} player{tournament.player_count !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            {tournament.gibson_rule_enabled && (
                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full mr-2">
                                                    Gibson Rule
                                                </span>
                                            )}
                                            {tournament.is_remote_submission_enabled && (
                                                <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                                                    Remote Entry
                                                </span>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                                            <Icon name="ArrowRight" size={16} />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AllTournamentsPage;