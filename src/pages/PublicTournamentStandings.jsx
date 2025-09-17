import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { supabase } from 'supabaseClient';
import PlayerStatsModal from 'components/PlayerStatsModal';
import Button from 'components/ui/Button';
import ShareButton from 'components/ui/ShareButton';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import StandingsTable from '../components/StandingsTable';

const PublicTournamentStandings = () => {
    const { tournamentSlug } = useParams();
    const [tournament, setTournament] = useState(null);
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

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

            // Fetch players with photos
            const { data: playersData, error: pError } = await supabase
                .from('tournament_players')
                .select(`
                    *,
                    players (*)
                `)
                .eq('tournament_id', tournamentData.id)
                .order('seed', { ascending: true });

            if (pError) throw pError;
            
            // Debug: Log the raw data to understand the structure
            console.log('Raw players data:', playersData);
            
            const enrichedPlayers = playersData.map(tp => {
                const photoUrl = tp.players.photo_url;
                console.log(`Player ${tp.players.name}: photo_url = ${photoUrl}`);
                
                return {
                    ...tp.players,
                    player_id: tp.players.id,
                    seed: tp.seed,
                    team_id: tp.team_id,
                    status: tp.status,
                    // Photo URL is directly in the players table
                    photo_url: photoUrl
                };
            });
            setPlayers(enrichedPlayers);

            // Fetch results
            const { data: resultsData, error: rError } = await supabase
                .from('results')
                .select('*')
                .eq('tournament_id', tournamentData.id)
                .order('created_at', { ascending: false });

            if (rError) throw rError;
            setResults(resultsData);

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

    // Real-time updates
    useEffect(() => {
        if (!tournament) return;
        const channel = supabase.channel(`public-tournament-standings-${tournament.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'results', filter: `tournament_id=eq.${tournament.id}` }, fetchPublicData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_players', filter: `tournament_id=eq.${tournament.id}` }, fetchPublicData)
            .subscribe();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [tournament, fetchPublicData]);

    const handlePlayerClick = (e, player) => {
        e.preventDefault();
        if (player?.slug) {
            window.open(`/players/${player.slug}`, '_blank');
        }
    };

    const teamStandings = React.useMemo(() => {
        if (tournament?.type !== 'team' || !teams.length || !players.length) return [];
        
        // Group results by round to identify team matches (same as dashboard)
        const resultsByRound = results.reduce((acc, result) => {
            (acc[result.round] = acc[result.round] || []).push(result);
            return acc;
        }, {});
        
        // Initialize team stats with all necessary fields
        const teamStats = teams.map(team => ({
            id: team.id,
            name: team.name,
            teamWins: 0,
            teamLosses: 0,
            teamTies: 0, // Added missing field
            individualWins: 0,
            totalSpread: 0,
            players: players.filter(p => p.team_id === team.id),
            perRound: []
        }));
        
        // Process each round to identify team vs team matches (improved logic)
        Object.entries(resultsByRound).forEach(([round, roundResults]) => {
            // Group results by team matchups
            const teamMatchups = new Map();
            
            roundResults.forEach(result => {
                const p1 = players.find(p => p.player_id === result.player1_id);
                const p2 = players.find(p => p.player_id === result.player2_id);
                
                if (!p1 || !p2 || !p1.team_id || !p2.team_id || p1.team_id === p2.team_id) return;
                
                // Create team matchup key
                const teamKey = [p1.team_id, p2.team_id].sort().join('-');
                
                if (!teamMatchups.has(teamKey)) {
                    teamMatchups.set(teamKey, {
                        team1: p1.team_id,
                        team2: p2.team_id,
                        team1Wins: 0,
                        team2Wins: 0,
                        games: []
                    });
                }
                
                const matchup = teamMatchups.get(teamKey);
                matchup.games.push(result);
                
                // Count individual wins for each team
                if (result.score1 > result.score2) {
                    if (p1.team_id === matchup.team1) {
                        matchup.team1Wins++;
                    } else {
                        matchup.team2Wins++;
                    }
                } else if (result.score2 > result.score1) {
                    if (p2.team_id === matchup.team1) {
                        matchup.team1Wins++;
                    } else {
                        matchup.team2Wins++;
                    }
                }
            });
            
            // Process team matchups to determine team wins/losses/ties
            teamMatchups.forEach((matchup, key) => {
                const team1 = teamStats.find(t => t.id === matchup.team1);
                const team2 = teamStats.find(t => t.id === matchup.team2);
                
                if (!team1 || !team2) return;
                
                if (matchup.team1Wins > matchup.team2Wins) {
                    team1.teamWins++;
                    team2.teamLosses++;
                    team1.perRound.push({ round: parseInt(round), result: 'Win', score: `${matchup.team1Wins}-${matchup.team2Wins}` });
                    team2.perRound.push({ round: parseInt(round), result: 'Loss', score: `${matchup.team2Wins}-${matchup.team1Wins}` });
                } else if (matchup.team2Wins > matchup.team1Wins) {
                    team2.teamWins++;
                    team1.teamLosses++;
                    team2.perRound.push({ round: parseInt(round), result: 'Win', score: `${matchup.team2Wins}-${matchup.team1Wins}` });
                    team1.perRound.push({ round: parseInt(round), result: 'Loss', score: `${matchup.team1Wins}-${matchup.team2Wins}` });
                } else {
                    // Handle ties properly
                    team1.teamTies++;
                    team2.teamTies++;
                    team1.perRound.push({ round: parseInt(round), result: 'Tie', score: `${matchup.team1Wins}-${matchup.team2Wins}` });
                    team2.perRound.push({ round: parseInt(round), result: 'Tie', score: `${matchup.team2Wins}-${matchup.team1Wins}` });
                }
            });
        });
        
        // Calculate individual wins and total spread for each team
        teamStats.forEach(team => {
            team.individualWins = team.players.reduce((sum, p) => sum + (p.wins || 0), 0);
            team.totalSpread = team.players.reduce((sum, p) => sum + (p.spread || 0), 0);
        });
        
        // Sort teams by NASPA-compliant tie-breakers (same as dashboard)
        return teamStats.sort((a, b) => {
            // 1. Team wins
            if (a.teamWins !== b.teamWins) return b.teamWins - a.teamWins;
            // 2. Team ties
            if (a.teamTies !== b.teamTies) return b.teamTies - a.teamTies;
            // 3. Individual wins
            if (a.individualWins !== b.individualWins) return b.individualWins - a.individualWins;
            // 4. Total spread
            return b.totalSpread - a.totalSpread;
        }).map((team, index) => ({ ...team, rank: index + 1 }));
    }, [players, results, teams, tournament]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <motion.div 
                    className="text-center space-y-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-16 h-16 bg-muted rounded animate-pulse mx-auto"></div>
                    <p className="text-lg text-foreground/80 font-medium">Loading standings...</p>
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
            <PlayerStatsModal 
                player={selectedPlayer} 
                results={results} 
                onClose={() => setSelectedPlayer(null)} 
                onSelectPlayer={(name) => setSelectedPlayer(players.find(p => p.name === name))} 
                players={players} 
            />
            
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
                                    Live Standings • {format(new Date(tournament.date || tournament.start_date), "MMMM do, yyyy")}
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
                                    type: 'standings',
                                    data: {
                                        title: `${tournament?.name} - Standings`,
                                        text: `Check out the current standings for ${tournament?.name}!`,
                                        url: window.location.href
                                    },
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
                                <Icon name="Trophy" size={24} className="text-primary" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Live Standings</h2>
                        </div>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Real-time tournament rankings and player statistics. Updates automatically as games are played.
                        </p>
                    </div>

                    {/* Tournament Info Card */}
                    <motion.div 
                        className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/10 rounded-2xl p-6 shadow-lg"
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
                                <div className="text-2xl font-bold text-foreground">{results.length}</div>
                                <div className="text-sm text-muted-foreground">Games Played</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{tournament.type}</div>
                                <div className="text-sm text-muted-foreground">Tournament Type</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Standings Table */}
                    <motion.div 
                        className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/10 rounded-2xl shadow-lg overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                    >
                                                    <div className="p-6 border-b border-border/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-foreground">Current Rankings</h3>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <Icon name="RefreshCw" size={16} />
                                    <span>Live Updates</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {players.length > 0 && (
                                <div className="mb-4 text-sm text-muted-foreground">
                                    <div className="flex items-center justify-between">
                                        <span>Live standings for {players.length} players</span>
                                        <span className="flex items-center gap-1">
                                            <Icon name="Clock" size={14} />
                                            Last updated: {new Date().toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <StandingsTable 
                                players={players} 
                                tournamentType={tournament?.type} 
                                isLoading={loading}
                                tournament={tournament}
                                results={results}
                                onPlayerClick={setSelectedPlayer}
                            />
                        </div>
                    </motion.div>

                    {/* Footer Info */}
                    <motion.div 
                        className="text-center space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                            <Icon name="Info" size={16} />
                            <span>Click on any player to view detailed statistics</span>
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

export default PublicTournamentStandings; 