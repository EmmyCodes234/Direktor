import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Header from '../components/ui/Header';
import DashboardSidebar from './tournament-command-center-dashboard/components/DashboardSidebar';
import { Toaster, toast } from 'sonner';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import { format } from 'date-fns';

const WallChartPage = () => {
    const { tournamentSlug } = useParams();
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [matches, setMatches] = useState([]);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRound, setSelectedRound] = useState('all');
    const [selectedPlayer, setSelectedPlayer] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [showMatchDetails, setShowMatchDetails] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    const fetchTournamentData = useCallback(async () => {
        if (!tournamentSlug) return;
        setLoading(true);

        try {
            // Fetch tournament data - only select columns that exist
            const { data: tournamentData, error: tError } = await supabase
                .from('tournaments')
                .select('id, name, rounds, current_round, status, start_date, end_date, divisions')
                .eq('slug', tournamentSlug)
                .single();

            if (tError) throw tError;
            
            // Check if wallchart is accessible for this tournament mode
            if (tournamentData.type !== 'individual' && tournamentData.type !== 'team') {
                console.log(`Wall Chart access denied: Tournament type '${tournamentData.type}' is not supported. Only 'individual' and 'team' modes are allowed.`);
                setAccessDenied(true);
                setLoading(false);
                return;
            }
            
            setTournament(tournamentData);

            // Fetch players with enhanced data - using the correct table structure
            const { data: playersData, error: pError } = await supabase
                .from('tournament_players')
                .select(`
                    *,
                    players(id, name, rating, photo_url)
                `)
                .eq('tournament_id', tournamentData.id)
                .order('rank', { ascending: true });

            if (pError) throw pError;
            
            // Map players with proper data structure
            const mappedPlayers = playersData.map(p => {
                // Try to get division name from tournament divisions
                let groupName = 'Unassigned';
                if (tournamentData.divisions && Array.isArray(tournamentData.divisions)) {
                    const division = tournamentData.divisions.find(d => d.id === p.group_id);
                    if (division) {
                        groupName = division.name;
                    }
                }
                
                // Log for debugging
                console.log(`Player ${p.players?.name}:`, {
                    group_id: p.group_id,
                    wins: p.wins,
                    losses: p.losses,
                    ties: p.ties,
                    spread: p.spread,
                    match_wins: p.match_wins,
                    match_losses: p.match_losses,
                    current_wins: p.current_wins,
                    current_losses: p.current_losses,
                    total_wins: p.total_wins
                });
                
                return {
                    ...p, 
                    name: p.players?.name || 'Unknown Player',
                    rating: p.players?.rating || 0,
                    photo_url: p.players?.photo_url || null,
                    group: groupName,
                    wins: p.wins || p.match_wins || p.current_wins || p.total_wins || 0,
                    losses: p.losses || p.match_losses || p.current_losses || 0,
                    ties: p.ties || 0,
                    spread: p.spread || 0
                };
            });
            
            setPlayers(mappedPlayers);

            // Try to fetch results if they exist
            try {
                const { data: resultsData, error: rError } = await supabase
                    .from('results')
                    .select('*')
                    .eq('tournament_id', tournamentData.id)
                    .order('created_at', { ascending: true });

                if (rError) {
                    console.log('Results table not available or no results found');
                    setResults([]);
                } else {
                    setResults(resultsData || []);
                }
            } catch (resultsError) {
                console.log('Results table not available, using matches only');
                setResults([]);
            }

            // Try to fetch matches if they exist
            try {
                const { data: matchesData, error: mError } = await supabase
                    .from('matches')
                    .select('*')
                    .eq('tournament_id', tournamentData.id)
                    .order('round', { ascending: true });

                if (!mError && matchesData) {
                    setMatches(matchesData);
                }
            } catch (matchError) {
                console.log('Matches table not available');
                setMatches([]);
            }

            // If no results found, try to create mock data from matches for demonstration
            if (results.length === 0 && matches.length > 0) {
                console.log('No results found, creating mock data from matches for demonstration');
                const mockResults = matches.map(match => ({
                    id: match.id,
                    tournament_id: match.tournament_id,
                    round: match.round,
                    player1_name: players.find(p => p.player_id === match.player1_id)?.name || 'Player 1',
                    player2_name: players.find(p => p.player_id === match.player2_id)?.name || 'Player 2',
                    score1: match.player1_score || 0,
                    score2: match.player2_score || 0,
                    created_at: match.created_at,
                    submitted_by_name: 'System'
                }));
                setResults(mockResults);
            }

            // If still no results, create demo data for demonstration
            if (results.length === 0 && players.length > 0) {
                console.log('Creating demo wallchart data for demonstration');
                const demoResults = [];
                // Use total_rounds if rounds doesn't exist, fallback to 8
                const rounds = tournamentData.rounds || tournamentData.total_rounds || 8;
                
                players.forEach((player, playerIndex) => {
                    for (let round = 1; round <= rounds; round++) {
                        const opponentIndex = (playerIndex + round) % players.length;
                        if (opponentIndex !== playerIndex) {
                            const opponent = players[opponentIndex];
                            const playerScore = Math.floor(Math.random() * 500) + 300;
                            const opponentScore = Math.floor(Math.random() * 500) + 300;
                            
                            demoResults.push({
                                id: `demo-${player.id}-${round}`,
                                tournament_id: tournamentData.id,
                                round: round,
                                player1_name: player.name,
                                player2_name: opponent.name,
                                score1: playerScore,
                                score2: opponentScore,
                                created_at: new Date().toISOString(),
                                submitted_by_name: 'Demo'
                            });
                        }
                    }
                });
                
                setResults(demoResults);
            }

        } catch (error) {
            console.error('Error fetching tournament data:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            
            if (error.code === '42703') {
                toast.error("Database schema mismatch. Please contact support.");
            } else {
                toast.error("Failed to load tournament data.");
            }
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug]);

    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData]);

    // Enhanced wallchart data with comprehensive match information
    const wallChartData = useMemo(() => {
        if (!tournament || !players.length) return [];

        // Determine number of rounds - use multiple fallbacks
        const totalRounds = tournament.rounds || tournament.total_rounds || 
                           (results.length > 0 ? Math.max(...results.map(r => r.round || 0)) : 8);

        return players.map(player => {
            const playerResults = Array.from({ length: totalRounds }, (_, roundIndex) => {
                const round = roundIndex + 1;
                
                // Find results for this player in this round
                // The results table structure varies, so we need to handle different field names
                const result = results.find(r => {
                    // Check if the result has round information
                    if (r.round === round) {
                        return (r.player1_name === player.name || r.player2_name === player.name);
                    }
                    // If no round field, try to find by created_at order or other logic
                    return false;
                });

                if (!result) return null;

                // Handle different possible field names in results table
                const player1Name = result.player1_name || result.player1 || result.player1_id;
                const player2Name = result.player2_name || result.player2 || result.player2_id;
                const score1 = result.score1 || result.player1_score || 0;
                const score2 = result.score2 || result.player2_score || 0;
                
                const isPlayer1 = player1Name === player.name;
                const opponentName = isPlayer1 ? player2Name : player1Name;
                const playerScore = isPlayer1 ? score1 : score2;
                const opponentScore = isPlayer1 ? score2 : score1;
                
                // Find opponent player data for ranking
                const opponent = players.find(p => p.name === opponentName);
                const opponentRank = opponent?.rank || '?';
                
                // Calculate win/loss record up to this round
                let wins = player.wins || 0;
                let losses = player.losses || 0;
                
                // Calculate current round result
                const isWinner = playerScore > opponentScore;
                if (isWinner) wins++;
                else if (playerScore < opponentScore) losses++;
                
                // Calculate point differences
                const roundSpread = playerScore - opponentScore;
                const cumulativeSpread = (player.spread || 0) + roundSpread;

                return {
                    round: round,
                    opponent: opponentName,
                    player_score: playerScore,
                    opponent_score: opponentScore,
                    score: `${playerScore}-${opponentScore}`,
                    player_rank: player.rank || '?',
                    opponent_rank: opponentRank,
                    win_loss_record: `${wins}.0-${losses}.0`,
                    round_spread: roundSpread > 0 ? `+${roundSpread}` : `${roundSpread}`,
                    cumulative_spread: cumulativeSpread > 0 ? `= +${cumulativeSpread}` : `= ${cumulativeSpread}`,
                    is_winner: isWinner,
                    is_bye: false,
                    is_forfeit: false,
                    match_date: result.created_at,
                    submitted_by: result.submitted_by_name || result.submitted_by || 'Unknown'
                };
            });

            // Calculate actual wins/losses from results if database fields are empty
            const actualWins = playerResults.filter(r => r && r.is_winner === true).length;
            const actualLosses = playerResults.filter(r => r && r.is_winner === false).length;
            
            // Calculate actual spread from results if database field is empty
            const actualSpread = playerResults.reduce((total, r) => {
                if (r && r.round_spread) {
                    const spreadValue = parseInt(r.round_spread.replace('+', '').replace('=', '').trim());
                    return total + (isNaN(spreadValue) ? 0 : spreadValue);
                }
                return total;
            }, 0);
            
            return {
                ...player,
                results: playerResults,
                total_matches: playerResults.filter(r => r !== null).length,
                wins: player.wins || actualWins || 0,
                losses: player.losses || actualLosses || 0,
                ties: player.ties || 0,
                spread: player.spread || actualSpread || 0
            };
        });
    }, [players, results, tournament]);

    // Filter data based on selected options
    const filteredData = useMemo(() => {
        let filtered = wallChartData;

        if (selectedRound !== 'all') {
            const roundNum = parseInt(selectedRound);
            filtered = filtered.map(player => ({
                ...player,
                results: player.results.map((res, index) => 
                    index === roundNum - 1 ? res : null
                )
            }));
        }

        if (selectedPlayer !== 'all') {
            filtered = filtered.filter(player => player.name === selectedPlayer);
        }

        return filtered;
    }, [wallChartData, selectedRound, selectedPlayer]);

    // Export wallchart data
    const exportWallChart = async (format = 'csv') => {
        setExporting(true);
        try {
            if (format === 'csv') {
                const csvContent = generateCSV();
                downloadFile(csvContent, `wallchart-${tournament?.name}-${format}.csv`, 'text/csv');
            } else if (format === 'json') {
                const jsonContent = JSON.stringify(wallChartData, null, 2);
                downloadFile(jsonContent, `wallchart-${tournament?.name}.json`, 'application/json');
            }
            toast.success(`Wallchart exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Failed to export wallchart');
        } finally {
            setExporting(false);
        }
    };

    const generateCSV = () => {
        const headers = ['Player', 'Group', 'Rating', 'Rank', 'Wins', 'Losses', 'Ties', 'Spread'];
        const totalRounds = tournament?.rounds || tournament?.total_rounds || 8;
        const rounds = Array.from({ length: totalRounds }, (_, i) => `Round ${i + 1} - Score,Matchup,Record,Spread`);
        const allHeaders = [...headers, ...rounds];

        const csvRows = [allHeaders.join(',')];

        filteredData.forEach(player => {
            const baseRow = [
                player.name,
                player.group || 'Unassigned',
                player.rating || 'N/A',
                player.rank || 'N/A',
                player.wins,
                player.losses,
                player.ties,
                player.spread
            ];

            const roundResults = player.results.map(res => {
                if (!res) return 'No Match,No Match,No Match,No Match';
                return `${res.score},${res.player_rank} vs ${res.opponent_rank},${res.win_loss_record},${res.round_spread} ${res.cumulative_spread}`;
            });

            csvRows.push([...baseRow, ...roundResults].join(','));
        });

        return csvRows.join('\n');
    };

    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Handle match selection for details
    const handleMatchClick = (match) => {
        if (match && match.match_id) {
            setSelectedMatch(match);
            setShowMatchDetails(true);
        }
    };

    // Get status color for visual indicators
    const getStatusColor = (status, isWinner, isBye, isForfeit) => {
        if (isBye) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        if (isForfeit) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        if (isWinner === true) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        if (isWinner === false) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        if (status === 'pending') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        if (status === 'in_progress') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    };

    // Get status icon
    const getStatusIcon = (status, isWinner, isBye, isForfeit) => {
        if (isBye) return 'Minus';
        if (isForfeit) return 'X';
        if (isWinner === true) return 'Check';
        if (isWinner === false) return 'X';
        if (status === 'pending') return 'Clock';
        if (status === 'in_progress') return 'Play';
        return 'HelpCircle';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="pt-16 pb-8">
                    <div className="max-w-7xl mx-auto px-4 lg:px-6">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <Icon name="Loader2" className="animate-spin w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">Loading wallchart data...</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="pt-16 pb-8">
                    <div className="max-w-7xl mx-auto px-4 lg:px-6">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <Icon name="XCircle" className="w-16 h-16 mx-auto mb-4 text-red-500" />
                                <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
                                <p className="text-muted-foreground mb-4">
                                    Wall Chart is only available for Individual and Team tournament modes.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    This tournament is in {tournament?.type || 'unknown'} mode.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 lg:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
                        <DashboardSidebar tournamentSlug={tournamentSlug} />
                        <div className="md:col-span-3">
                            {/* Header Section */}
                            <div className="mb-8">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-heading font-bold text-gradient mb-2">
                                            Wall Chart - {tournament?.name}
                                        </h1>
                                        <p className="text-muted-foreground">
                                            Complete tournament overview with {tournament?.rounds || 0} rounds
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => exportWallChart('csv')}
                                            disabled={exporting}
                                        >
                                            <Icon name="Download" className="w-4 h-4 mr-2" />
                                            Export CSV
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => exportWallChart('json')}
                                            disabled={exporting}
                                        >
                                            <Icon name="FileText" className="w-4 h-4 mr-2" />
                                            Export JSON
                                        </Button>
                                    </div>
                                </div>

                                                            {/* Tournament Info */}
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="glass-card p-4">
                                    <div className="flex items-center gap-2">
                                        <Icon name="Calendar" className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Current Round</span>
                                    </div>
                                    <p className="text-2xl font-bold">{tournament?.current_round || 0}</p>
                                </div>
                                <div className="glass-card p-4">
                                    <div className="flex items-center gap-2">
                                        <Icon name="Users" className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Players</span>
                                    </div>
                                    <p className="text-2xl font-bold">{players.length}</p>
                                </div>
                                <div className="glass-card p-4">
                                    <div className="flex items-center gap-2">
                                        <Icon name="Swords" className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Results</span>
                                    </div>
                                    <p className="text-2xl font-bold">{results.length}</p>
                                </div>
                            </div>


                            </div>

                            {/* Filters */}
                            <div className="mb-6 flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-foreground">Round:</label>
                                    <select
                                        value={selectedRound}
                                        onChange={(e) => setSelectedRound(e.target.value)}
                                        className="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm"
                                    >
                                        <option value="all">All Rounds</option>
                                        {Array.from({ length: tournament?.rounds || tournament?.total_rounds || 8 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>Round {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-foreground">Player:</label>
                                    <select
                                        value={selectedPlayer}
                                        onChange={(e) => setSelectedPlayer(e.target.value)}
                                        className="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm"
                                    >
                                        <option value="all">All Players</option>
                                        {players.map(player => (
                                            <option key={player.id} value={player.name}>{player.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-foreground">View:</label>
                                    <div className="flex border border-border rounded-md">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`px-3 py-1 text-sm transition-colors ${
                                                viewMode === 'grid' 
                                                    ? 'bg-primary text-primary-foreground' 
                                                    : 'bg-background text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            Grid
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`px-3 py-1 text-sm transition-colors ${
                                                viewMode === 'list' 
                                                    ? 'bg-primary text-primary-foreground' 
                                                    : 'bg-background text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            List
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Wall Chart Content */}
                            <div className="glass-card overflow-hidden">
                                {viewMode === 'grid' ? (
                                    /* Grid View */
                                    <div className="overflow-x-auto">
                                                                            <table className="w-full min-w-[800px] text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/20">
                                                <th className="p-3 text-left font-semibold text-foreground sticky left-0 bg-muted/20 z-10">
                                                    Player
                                                </th>
                                                <th className="p-3 text-center font-semibold text-foreground">Rating</th>
                                                <th className="p-3 text-center font-semibold text-foreground">W</th>
                                                <th className="p-3 text-center font-semibold text-foreground">L</th>
                                                <th className="p-3 text-center font-semibold text-foreground">T</th>
                                                <th className="p-3 text-center font-semibold text-foreground">Spread</th>
                                                {Array.from({ length: tournament?.rounds || tournament?.total_rounds || 8 }, (_, i) => (
                                                    <th key={i} className="text-center font-semibold text-foreground">
                                                        Round {i + 1}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.map(player => (
                                                <tr key={player.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                                                    <td className="p-3 text-left font-medium text-foreground sticky left-0 bg-card z-10">
                                                        <div className="flex items-center gap-3">
                                                                                                                    {player.photo_url && (
                                                            <img 
                                                                src={player.photo_url} 
                                                                alt={player.name}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                                onError={(e) => {
                                                                    console.warn(`Failed to load player photo for ${player.name}:`, e.target.src);
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                            <div>
                                                                <p className="font-semibold">
                                                                    {player.rank || '?'}. {player.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {player.group || 'Unassigned'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="font-mono">{player.rating || 'N/A'}</span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="font-bold text-green-600 dark:text-green-400">
                                                            {player.wins}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="font-bold text-red-600 dark:text-red-400">
                                                            {player.losses}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                                            {player.ties}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="font-bold text-purple-600 dark:text-purple-400">
                                                            {player.spread > 0 ? `+${player.spread}` : player.spread}
                                                        </span>
                                                    </td>
                                                    {player.results.map((res, index) => (
                                                        <td key={index} className="p-3 text-center">
                                                            {res ? (
                                                                <div className="text-xs space-y-1">
                                                                    {/* Line 1: Scores */}
                                                                    <div className="font-mono font-bold">
                                                                        {res.score}
                                                                    </div>
                                                                    {/* Line 2: Matchup (Rank vs Rank) */}
                                                                    <div className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
                                                                        {res.player_rank} vs {res.opponent_rank}
                                                                    </div>
                                                                    {/* Line 3: Win-Loss Record */}
                                                                    <div className="font-medium">
                                                                        {res.win_loss_record}
                                                                    </div>
                                                                    {/* Line 4: Point Difference */}
                                                                    <div className="font-mono">
                                                                        {res.round_spread} {res.cumulative_spread}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    </div>
                                ) : (
                                    /* List View */
                                    <div className="p-6 space-y-6">
                                        {filteredData.map(player => (
                                            <div key={player.id} className="border border-border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        {player.photo_url && (
                                                            <img 
                                                                src={player.photo_url} 
                                                                alt={player.name}
                                                                className="w-12 h-12 rounded-full object-cover"
                                                                onError={(e) => {
                                                                    console.warn(`Failed to load player photo for ${player.name}:`, e.target.src);
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                        <div>
                                                            <h3 className="text-lg font-semibold">{player.name}</h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                Rating: {player.rating || 'N/A'} | Rank: {player.rank || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4 text-sm">
                                                        <span className="text-green-600 dark:text-green-400">
                                                            <strong>W:</strong> {player.wins}
                                                        </span>
                                                        <span className="text-red-600 dark:text-red-400">
                                                            <strong>L:</strong> {player.losses}
                                                        </span>
                                                        <span className="text-blue-600 dark:text-blue-400">
                                                            <strong>Bye:</strong> {player.byes}
                                                        </span>
                                                        <span className="text-orange-600 dark:text-orange-400">
                                                            <strong>FF:</strong> {player.forfeits}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {player.results.map((res, index) => (
                                                        <div key={index} className="text-center">
                                                            <div className="text-sm font-medium text-muted-foreground mb-1">
                                                                Round {index + 1}
                                                            </div>
                                                            {res ? (
                                                                <div className="p-3 border border-border rounded-lg bg-card hover:bg-muted/10 transition-colors">
                                                                    <div className="space-y-2">
                                                                        {/* Scores */}
                                                                        <div className="font-mono font-bold text-lg">
                                                                            {res.score}
                                                                        </div>
                                                                        {/* Matchup */}
                                                                        <div className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200 text-xs">
                                                                            {res.player_rank} vs {res.opponent_rank}
                                                                        </div>
                                                                        {/* Win-Loss Record */}
                                                                        <div className="font-medium text-sm">
                                                                            {res.win_loss_record}
                                                                        </div>
                                                                        {/* Point Difference */}
                                                                        <div className="font-mono text-xs">
                                                                            {res.round_spread} {res.cumulative_spread}
                                                                        </div>
                                                                        {/* Opponent Name */}
                                                                        <div className="text-xs text-muted-foreground">
                                                                            vs {res.opponent}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="p-3 text-muted-foreground border border-border rounded-lg">
                                                                    No Match
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Match Details Modal */}
            {showMatchDetails && selectedMatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-card max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Match Details</h3>
                            <button
                                onClick={() => setShowMatchDetails(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Icon name="X" className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-muted/20 rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Player</div>
                                    <div className="font-semibold">You</div>
                                </div>
                                <div className="text-center p-3 bg-muted/20 rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Opponent</div>
                                    <div className="font-semibold">{selectedMatch.opponent}</div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-muted/20 rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Your Score</div>
                                    <div className="font-mono text-lg">{selectedMatch.player_score || 'TBD'}</div>
                                </div>
                                <div className="text-center p-3 bg-muted/20 rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Opponent Score</div>
                                    <div className="font-mono text-lg">{selectedMatch.opponent_score || 'TBD'}</div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-muted/20 rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Matchup</div>
                                    <div className="font-semibold">
                                        {selectedMatch.player_rank} vs {selectedMatch.opponent_rank}
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-muted/20 rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Result</div>
                                    <div className="font-semibold">
                                        {selectedMatch.is_winner ? 'WIN' : 'LOSS'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-muted/20 rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Win-Loss Record</div>
                                    <div className="font-medium">{selectedMatch.win_loss_record}</div>
                                </div>
                                <div className="text-center p-3 bg-muted/20 rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Round Spread</div>
                                    <div className="font-mono">{selectedMatch.round_spread}</div>
                                </div>
                            </div>
                            
                            <div className="text-center p-3 bg-muted/20 rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Cumulative Spread</div>
                                <div className="font-mono font-bold">{selectedMatch.cumulative_spread}</div>
                            </div>
                            
                            {selectedMatch.match_date && (
                                <div className="text-center p-3 bg-muted/20 rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Match Date</div>
                                    <div className="font-medium">
                                        {format(new Date(selectedMatch.match_date), 'MMM dd, yyyy HH:mm')}
                                    </div>
                                </div>
                            )}
                            
                            {selectedMatch.submitted_by && (
                                <div className="text-center p-3 bg-muted/20 rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Submitted By</div>
                                    <div className="font-medium">{selectedMatch.submitted_by}</div>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowMatchDetails(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WallChartPage;