import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { supabase } from 'supabaseClient';
import PlayerStatsModal from 'components/PlayerStatsModal';
import Button from 'components/ui/Button';
import ShareButton from 'components/ui/ShareButton';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import StandingsTable from '../components/StandingsTable';
import { useMemo } from 'react';

const PublicTournamentStandings = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tournament, setTournament] = useState(null);
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    
    // Extract round from query parameters
    const searchParams = new URLSearchParams(location.search);
    const roundParam = searchParams.get('round');
    const selectedRound = roundParam ? parseInt(roundParam) : null;

    // Recalculate ranks based on results up to the selected round
    const recalculateRanks = useCallback((playerList, tournamentType, resultsList) => {
        if (!playerList) return [];
        
        // Filter results to only include those up to the selected round
        let filteredResults = resultsList;
        if (selectedRound) {
            filteredResults = resultsList.filter(result => result.round <= selectedRound);
        }
        
        let enrichedPlayers = playerList;
        
        if (tournamentType === 'best_of_league') {
            // Calculate match_wins by grouping results by match-up and counting majority wins
            const bestOf = 15; // Default to 15, or get from tournament settings if available
            const majority = Math.floor(bestOf / 2) + 1;
            // Build a map of match-ups: key = sorted player ids, value = array of results
            const matchupMap = {};
            (filteredResults || []).forEach(result => {
                if (!result.player1_id || !result.player2_id) return;
                const ids = [result.player1_id, result.player2_id].sort((a, b) => a - b);
                const key = ids.join('-');
                if (!matchupMap[key]) matchupMap[key] = [];
                matchupMap[key].push(result);
            });
            enrichedPlayers = playerList.map(player => {
                let wins = 0, losses = 0, ties = 0, spread = 0, match_wins = 0;
                // Calculate per-game stats
                (filteredResults || []).forEach(result => {
                    if (result.player1_id === player.player_id || result.player2_id === player.player_id) {
                        let isP1 = result.player1_id === player.player_id;
                        let myScore = isP1 ? result.score1 : result.score2;
                        let oppScore = isP1 ? result.score2 : result.score1;
                        if (myScore > oppScore) wins++;
                        else if (myScore < oppScore) losses++;
                        else ties++;
                        spread += (myScore - oppScore);
                    }
                });
                // Calculate match_wins: for each match-up, if player has majority, count as match win
                Object.entries(matchupMap).forEach(([key, results]) => {
                    // Only consider match-ups where this player participated
                    if (!key.split('-').includes(String(player.player_id))) return;
                    // Count games won by each player in this match-up
                    const [id1, id2] = key.split('-').map(Number);
                    let p1Wins = 0, p2Wins = 0;
                    results.forEach(r => {
                        if (r.score1 > r.score2) {
                            if (r.player1_id === id1) p1Wins++;
                            else p2Wins++;
                        } else if (r.score2 > r.score1) {
                            if (r.player2_id === id1) p1Wins++;
                            else p2Wins++;
                        }
                    });
                    if (id1 === player.player_id && p1Wins >= majority) match_wins++;
                    if (id2 === player.player_id && p2Wins >= majority) match_wins++;
                });
                return {
                    ...player,
                    wins,
                    losses,
                    ties,
                    spread,
                    match_wins
                };
            });
        } else {
            enrichedPlayers = playerList.map(player => {
                let wins = 0, losses = 0, ties = 0, spread = 0;
                (filteredResults || []).forEach(result => {
                    if (result.player1_id === player.player_id || result.player2_id === player.player_id) {
                        let isP1 = result.player1_id === player.player_id;
                        let myScore = isP1 ? result.score1 : result.score2;
                        let oppScore = isP1 ? result.score2 : result.score1;
                        if (myScore > oppScore) wins++;
                        else if (myScore < oppScore) losses++;
                        else ties++;
                        spread += (myScore - oppScore);
                    }
                });
                return {
                    ...player,
                    wins,
                    losses,
                    ties,
                    spread
                };
            });
        }
        
        return [...enrichedPlayers].sort((a, b) => {
            if (tournamentType === 'best_of_league') {
                if ((a.match_wins || 0) !== (b.match_wins || 0)) return (b.match_wins || 0) - (a.match_wins || 0);
            }
            if ((a.wins || 0) !== (b.wins || 0)) return (b.wins || 0) - (a.wins || 0);
            return (b.spread || 0) - (a.spread || 0);
        }).map((player, index) => ({ ...player, rank: index + 1 }));
    }, [selectedRound]);

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

            if (pError) {
                console.error('Players query error:', pError);
                throw pError;
            }
            
            // Debug: Log the raw data to understand the structure
            console.log('Raw players data:', playersData);
            console.log('Tournament ID:', tournamentData.id);
            
            const enrichedPlayers = playersData.map(tp => {
                // Get photo URL from the players table
                const photoUrl = tp.players.photo_url;
                
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
            
            console.log('Enriched players:', enrichedPlayers);
            console.log('Players count:', enrichedPlayers.length);
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
        
        // Filter results to only include those up to the selected round
        let filteredResults = results;
        if (selectedRound) {
            filteredResults = results.filter(result => result.round <= selectedRound);
        }
        
        // Group results by round to identify team matches (same as dashboard)
        const resultsByRound = filteredResults.reduce((acc, result) => {
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
        
        // Calculate individual wins and spread for each team
        teamStats.forEach(team => {
            team.players.forEach(player => {
                filteredResults.forEach(result => {
                    if (result.player1_id === player.player_id || result.player2_id === player.player_id) {
                        let isP1 = result.player1_id === player.player_id;
                        let myScore = isP1 ? result.score1 : result.score2;
                        let oppScore = isP1 ? result.score2 : result.score1;
                        
                        if (myScore > oppScore) {
                            team.individualWins++;
                        }
                        team.totalSpread += (myScore - oppScore);
                    }
                });
            });
        });
        
        // Sort teams by wins, then by total spread
        return [...teamStats].sort((a, b) => {
            if (a.teamWins !== b.teamWins) return b.teamWins - a.teamWins;
            return b.totalSpread - a.totalSpread;
        }).map((team, index) => ({ ...team, rank: index + 1 }));
    }, [tournament, teams, players, results, selectedRound]);

    const sortedPlayers = useMemo(() => {
        if (!players.length || !tournament) return [];
        return recalculateRanks(players, tournament.type, results);
    }, [players, tournament, results, recalculateRanks]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon name="Loader" className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="text-center py-12">
                <Icon name="AlertCircle" size={48} className="mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Tournament Not Found</h2>
                <p className="text-muted-foreground mb-6">The requested tournament could not be found.</p>
                <Button onClick={() => navigate('/tournaments')} variant="default">
                    <Icon name="ArrowLeft" className="mr-2" size={16} />
                    Back to Tournaments
                </Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen bg-background"
        >
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <Button 
                            variant="ghost" 
                            onClick={() => navigate(`/tournament/${tournamentSlug}/public`)}
                            className="mb-2 -ml-2"
                        >
                            <Icon name="ArrowLeft" className="mr-2" size={16} />
                            Back to Tournament
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground">
                            {tournament.name} - Standings
                            {selectedRound && ` (Round ${selectedRound})`}
                        </h1>
                        <p className="text-muted-foreground">
                            {selectedRound 
                                ? `Standings after round ${selectedRound}`
                                : 'Current standings'
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShareButton 
                            title={`${tournament.name} - Standings`}
                            text={`Check out the standings for ${tournament.name}`}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    {tournament.type === 'team' ? (
                        <div className="bg-card rounded-lg border shadow-sm">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Team Standings</h2>
                                <StandingsTable 
                                    players={teamStandings} 
                                    tournamentType="team" 
                                    onPlayerClick={handlePlayerClick}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card rounded-lg border shadow-sm">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Player Standings</h2>
                                <StandingsTable 
                                    players={sortedPlayers} 
                                    tournamentType={tournament.type} 
                                    onPlayerClick={handlePlayerClick}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PlayerStatsModal 
                player={selectedPlayer} 
                onClose={() => setSelectedPlayer(null)} 
            />
        </motion.div>
    );
};

export default PublicTournamentStandings;