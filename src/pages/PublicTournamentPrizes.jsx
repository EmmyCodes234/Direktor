import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { supabase } from 'supabaseClient';
import Button from 'components/ui/Button';
import ShareButton from 'components/ui/ShareButton';
import PrizeDisplay from '../components/PrizeDisplay';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import ReportFooter from 'components/public/ReportFooter';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';

const PublicTournamentPrizes = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [players, setPlayers] = useState([]);
    const [prizes, setPrizes] = useState([]);
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

            // Fetch prizes
            const { data: prizesData, error: prizesError } = await supabase
                .from('prizes')
                .select('*')
                .eq('tournament_id', tournamentData.id)
                .order('rank', { ascending: true });

            if (prizesError) throw prizesError;
            setPrizes(prizesData);

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

    const formattedDate = tournament?.type === 'best_of_league'
        ? `${format(new Date(tournament.start_date), "MMM do")} - ${format(new Date(tournament.end_date), "MMM do, yyyy")}`
        : tournament?.date ? format(new Date(tournament.date), "MMMM do, yyyy") : "Date not set";

    if (loading) {
        return <PublicLoadingScreen />;
    }

    if (error || !tournament) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-12 h-12 mx-auto mb-4">
                        <Icon name="AlertTriangle" className="text-muted-foreground" size={48} />
                    </div>
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2">Tournament Not Found</h2>
                    <p className="text-muted-foreground">The tournament you're looking for doesn't exist or has been removed.</p>
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/tournament/${tournamentSlug}`)}
                        className="mt-4"
                    >
                        <Icon name="ArrowLeft" className="mr-2" size={16} />
                        Back to Tournament
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground tracking-normal">
            {/* Header */}
            <motion.header
                className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md py-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/tournament/${tournamentSlug}`)}
                                className="hover:bg-secondary text-muted-foreground hover:text-foreground"
                            >
                                <Icon name="ArrowLeft" size={20} />
                            </Button>
                            <div>
                                <motion.h1
                                    className="text-lg font-heading font-bold text-foreground truncate max-w-[180px] sm:max-w-xs"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                >
                                    {tournament.name}
                                </motion.h1>
                            </div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                        >
                            <ShareButton
                                variant="ghost"
                                size="sm"
                                shareData={{
                                    type: 'prizes',
                                    data: { tournament: tournament.name },
                                    url: window.location.href
                                }}
                                platforms={['twitter', 'facebook', 'whatsapp', 'copy']}
                                position="bottom-right"
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.header>

            {/* Banner */}
            <PublicTournamentBanner tournament={tournament} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    className="space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    {/* Page Header */}
                    <div className="text-center space-y-3">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border/50">
                                <Icon name="Gift" size={24} className="text-foreground" />
                            </div>
                            <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Prizes</h2>
                        </div>
                        <p className="text-base text-muted-foreground max-w-xl mx-auto">
                            Prize distribution and award details
                        </p>
                    </div>

                    {/* Tournament Info Card */}
                    <motion.div
                        className="bg-card border border-border rounded-xl p-6 shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-2 rounded-lg hover:bg-secondary/20 transition-colors">
                                <div className="text-2xl font-mono font-bold text-foreground tracking-tight">{players.length}</div>
                                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-1">Total Players</div>
                            </div>
                            <div className="text-center p-2 rounded-lg hover:bg-secondary/20 transition-colors">
                                <div className="text-2xl font-mono font-bold text-foreground tracking-tight">{prizes.length}</div>
                                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-1">Prize Categories</div>
                            </div>
                            <div className="text-center p-2 rounded-lg hover:bg-secondary/20 transition-colors">
                                <div className="text-2xl font-mono font-bold text-foreground tracking-tight capitalize">{tournament.type.replace(/_/g, ' ')}</div>
                                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-1">Format</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Prizes Display */}
                    <motion.div
                        className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                    >
                        <div className="p-5 border-b border-border">
                            <h3 className="text-lg font-heading font-semibold text-foreground">Prize Distribution</h3>
                        </div>
                        <div className="p-5">
                            <PrizeDisplay prizes={prizes} players={players} tournament={tournament} />
                        </div>
                    </motion.div>
                </motion.div>

                <ReportFooter />
            </main>
        </div>
    );
};

export default PublicTournamentPrizes;