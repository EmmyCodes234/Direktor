import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { supabase } from 'supabaseClient';
import Button from 'components/ui/Button';
import ShareButton from 'components/ui/ShareButton';
import PrizeDisplay from '../components/PrizeDisplay';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

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
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-12 h-12 mx-auto mb-4">
                        <Icon name="Loader" className="animate-spin text-primary" size={48} />
                    </div>
                    <p className="text-base text-muted-foreground font-medium">Loading prizes...</p>
                </motion.div>
            </div>
        );
    }

    if (error || !tournament) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-12 h-12 mx-auto mb-4">
                        <Icon name="AlertCircle" className="text-destructive" size={48} />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Tournament Not Found</h2>
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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground">
            {/* Header */}
            <motion.header 
                className="sticky top-0 z-50 border-b border-border/10 bg-background/95 backdrop-blur-xl py-4"
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
                                className="touch-target hover:bg-muted/20"
                            >
                                <Icon name="ArrowLeft" size={20} />
                            </Button>
                            <div>
                                <motion.h1 
                                    className="text-xl font-bold text-foreground truncate max-w-[180px] sm:max-w-xs"
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
                                className="touch-target"
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    {/* Page Header */}
                    <div className="text-center space-y-3">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Icon name="Gift" size={20} className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Prizes</h2>
                        </div>
                        <p className="text-base text-muted-foreground max-w-xl mx-auto">
                            Prize distribution and award details
                        </p>
                    </div>

                    {/* Tournament Info Card */}
                    <motion.div 
                        className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/10 rounded-xl p-5 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-xl font-bold text-foreground">{players.length}</div>
                                <div className="text-xs text-muted-foreground">Total Players</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-foreground">{prizes.length}</div>
                                <div className="text-xs text-muted-foreground">Prize Categories</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-foreground">{tournament.type}</div>
                                <div className="text-xs text-muted-foreground">Tournament Type</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Prizes Display */}
                    <motion.div 
                        className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/10 rounded-xl shadow-lg overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                    >
                        <div className="p-5 border-b border-border/10">
                            <h3 className="text-lg font-semibold text-foreground">Prize Distribution</h3>
                        </div>
                        <div className="p-5">
                            <PrizeDisplay prizes={prizes} players={players} tournament={tournament} />
                        </div>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
};

export default PublicTournamentPrizes;