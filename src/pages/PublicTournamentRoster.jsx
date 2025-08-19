import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { supabase } from 'supabaseClient';
import Button from 'components/ui/Button';
import ShareButton from 'components/ui/ShareButton';
import PlayerCard from '../components/PlayerCard';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';



const PublicTournamentRoster = () => {
    const { tournamentSlug } = useParams();
    const [tournament, setTournament] = useState(null);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('seed'); // 'seed', 'name', 'rating'

    const fetchPublicData = useCallback(async () => {
        if (!tournamentSlug) return;

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
                .select(`
                    *,
                    players (*)
                `)
                .eq('tournament_id', tournamentData.id)
                .order('seed', { ascending: true });

            if (pError) throw pError;
            const enrichedPlayers = playersData.map(tp => ({
                ...tp.players,
                player_id: tp.players.id,
                seed: tp.seed,
                team_id: tp.team_id,
                status: tp.status
            }));
            setPlayers(enrichedPlayers);

            // Fetch teams if team tournament
            if (tournamentData.type === 'team') {
                const { data: teamsData, error: teamsError } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('tournament_id', tournamentData.id);

                if (!teamsError) {
                    setTeams(teamsData);
                }
            }

        } catch (error) {
            console.error('Error fetching public data:', error);
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug]);

    useEffect(() => {
        fetchPublicData();
    }, [fetchPublicData]);

    const handlePlayerClick = (e, player) => {
        e.preventDefault();
        if (player?.slug) {
            window.open(`/players/${player.slug}`, '_blank');
        }
    };

    const teamMap = React.useMemo(() => new Map(teams.map(team => [team.id, team.name])), [teams]);
    
    const filteredAndSortedPlayers = React.useMemo(() => {
        let filtered = players;
        
        // Filter by search term
        if (searchTerm) {
            filtered = players.filter(player => 
                player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (player.team_id && teamMap.get(player.team_id)?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        // Sort by selected criteria
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'seed':
                default:
                    return (a.seed || 999) - (b.seed || 999);
            }
        });
    }, [players, searchTerm, sortBy, teamMap]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-16 h-16 mx-auto mb-6">
                        <Icon name="Loader" className="animate-spin text-primary" size={64} />
                    </div>
                    <p className="text-lg text-foreground/80 font-medium">Loading roster...</p>
                </motion.div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-16 h-16 mx-auto mb-6">
                        <Icon name="AlertCircle" className="text-destructive" size={64} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Tournament Not Found</h2>
                    <p className="text-foreground/60">The tournament you're looking for doesn't exist or has been removed.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground">
            {/* Header */}
            <motion.header 
                className="sticky top-0 z-50 border-b border-border/10 bg-background/95 backdrop-blur-xl py-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => window.close()}
                                className="touch-target hover:bg-muted/20"
                            >
                                <Icon name="X" size={20} />
                            </Button>
                            <div>
                                <motion.h1 
                                    className="text-2xl sm:text-3xl font-bold text-foreground"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                >
                                    {tournament.name}
                                </motion.h1>
                                <motion.p 
                                    className="text-sm text-muted-foreground"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                >
                                    Player Roster • {format(new Date(tournament.date || tournament.start_date), "MMMM do, yyyy")}
                                </motion.p>
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
                                    type: 'roster',
                                    data: { tournament: tournament.name, players: players.length },
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div 
                    className="space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    {/* Page Header */}
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Icon name="Users" size={24} className="text-primary" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Player Roster</h2>
                        </div>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Complete list of tournament participants. Click on any player to view their detailed profile.
                        </p>
                    </div>

                    {/* Tournament Info Card */}
                    <motion.div 
                        className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/20 rounded-2xl p-6 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{players.length}</div>
                                <div className="text-sm text-muted-foreground">Total Players</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{tournament.type}</div>
                                <div className="text-sm text-muted-foreground">Tournament Type</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{teams.length}</div>
                                <div className="text-sm text-muted-foreground">Teams</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Search and Filter Controls */}
                    <motion.div 
                        className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/10 rounded-2xl p-6 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                    >
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search players or teams..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                                    />
                                </div>
                            </div>
                            
                            {/* Sort Dropdown */}
                            <div className="sm:w-48">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-4 py-3 bg-background/50 border border-border/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                                >
                                    <option value="seed">Sort by Seed</option>
                                    <option value="name">Sort by Name</option>
                                    <option value="rating">Sort by Rating</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>

                    {/* Players Grid */}
                    <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        {filteredAndSortedPlayers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredAndSortedPlayers.map((player, index) => (
                                    <div 
                                        key={player.id}
                                        onClick={(e) => handlePlayerClick(e, player)}
                                        className="cursor-pointer"
                                    >
                                        <PlayerCard
                                            player={player}
                                            index={index}
                                            tournamentType={tournament.type}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <motion.div 
                                className="text-center py-12"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9, duration: 0.6 }}
                            >
                                <Icon name="SearchX" className="mx-auto mb-4 text-muted-foreground" size={48} />
                                <h3 className="text-lg font-semibold text-foreground mb-2">No players found</h3>
                                <p className="text-muted-foreground">Try adjusting your search criteria</p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Footer Info */}
                    <motion.div 
                        className="text-center space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.6 }}
                    >
                        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                            <Icon name="Info" size={16} />
                            <span>Click on any player to view their detailed profile</span>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => window.open(`/tournament/${tournamentSlug}/live`, '_blank')}
                            className="mt-4"
                        >
                            <Icon name="ArrowLeft" className="mr-2" />
                            Back to Tournament
                        </Button>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
};

export default PublicTournamentRoster; 