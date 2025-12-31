import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { supabase } from 'supabaseClient';
import PlayerStatsModal from 'components/PlayerStatsModal';
import Button from 'components/ui/Button';
import ShareButton from 'components/ui/ShareButton';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import StandingsTable from '../components/StandingsTable';
import ClassicalStandingsTable from '../components/ClassicalStandingsTable';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import ReportFooter from 'components/public/ReportFooter';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import useStandingsCalculator from '../hooks/dashboard/useStandingsCalculator';

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

    // Use centralized standings calculator
    const filteredResults = useMemo(() => {
        if (!selectedRound) return results;
        return results.filter(r => r.round <= selectedRound);
    }, [results, selectedRound]);

    const sortedPlayers = useStandingsCalculator(players, filteredResults, [], tournament);

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

            // If no players found for this tournament ID, try to find the correct tournament ID
            let finalPlayersData = playersData;
            let actualTournamentId = tournamentData.id;

            if (!playersData || playersData.length === 0) {
                console.log('No players found for tournament ID', tournamentData.id, 'searching for correct ID...');

                // Look for tournaments with the same slug that have players
                const { data: allTournaments, error: tournamentsError } = await supabase
                    .from('tournaments')
                    .select('id, name, slug')
                    .eq('slug', tournamentData.slug);

                if (!tournamentsError && allTournaments) {
                    for (const tournament of allTournaments) {
                        if (tournament.id !== tournamentData.id) {
                            const { data: testPlayers, error: testError } = await supabase
                                .from('tournament_players')
                                .select(`*, players (*)`)
                                .eq('tournament_id', tournament.id)
                                .limit(1);

                            if (!testError && testPlayers && testPlayers.length > 0) {
                                console.log('Found players under tournament ID', tournament.id);

                                // Fetch all players for this tournament
                                const { data: correctPlayers, error: correctError } = await supabase
                                    .from('tournament_players')
                                    .select(`*, players (*)`)
                                    .eq('tournament_id', tournament.id)
                                    .order('seed', { ascending: true });

                                if (!correctError) {
                                    finalPlayersData = correctPlayers;
                                    actualTournamentId = tournament.id;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            const enrichedPlayers = finalPlayersData.map(tp => ({
                ...tp.players,
                player_id: tp.players.id,
                seed: tp.seed,
                team_id: tp.team_id,
                status: tp.status,
                photo_url: tp.players.photo_url
            }));

            setPlayers(enrichedPlayers);

            // Fetch results using the correct tournament ID
            const { data: resultsData, error: rError } = await supabase
                .from('results')
                .select('*')
                .eq('tournament_id', actualTournamentId)
                .order('created_at', { ascending: false });

            if (rError) throw rError;
            setResults(resultsData);

            // Fetch teams if team tournament
            if (tournamentData.type === 'team') {
                const { data: teamsData, error: teamsError } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('tournament_id', actualTournamentId);

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

    // sortedPlayers is now provided by useStandingsCalculator above

    if (loading) {
        return <PublicLoadingScreen />;
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
            <PublicTournamentBanner tournament={tournament} />
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8 font-sans">
                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center gap-4 mb-8">
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-10 no-print">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/tournament/${tournamentSlug}`)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Icon name="ArrowLeft" size={20} />
                            </Button>
                            <div className="flex items-center gap-2">
                                <ShareButton
                                    title={`${tournament.name} - Standings`}
                                    text={`Check out the standings for ${tournament.name}`}
                                    variant="ghost"
                                    size="sm"
                                    className="h-9"
                                />
                            </div>
                        </div>

                        <h2 className="text-center text-2xl md:text-3xl font-bold text-black mb-1 font-heading uppercase tracking-tight">
                            {selectedRound ? `Round ${selectedRound} Standings` : 'Tournament Standings'}
                        </h2>
                        <p className="text-muted-foreground text-lg font-medium">
                            {tournament.name}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full">
                    {tournament.type === 'team' ? (
                        <div className="bg-card rounded-lg border shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4 text-center">Team Standings</h2>
                            <StandingsTable
                                players={teamStandings}
                                tournamentType="team"
                                onPlayerClick={handlePlayerClick}
                            />
                        </div>
                    ) : (
                        <ClassicalStandingsTable
                            players={sortedPlayers}
                            results={results}
                            pairingSchedule={tournament.pairing_schedule}
                            currentRound={selectedRound}
                        />
                    )}
                </div>

                <ReportFooter />
            </div>

            <PlayerStatsModal
                player={selectedPlayer}
                onClose={() => setSelectedPlayer(null)}
            />
        </motion.div>
    );
};

export default PublicTournamentStandings;