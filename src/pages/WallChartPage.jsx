import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Toaster, toast } from 'sonner';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import ReportFooter from 'components/public/ReportFooter';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';

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
                .select('id, name, rounds, current_round, status, start_date, end_date, divisions, type') // Added type to selection
                .eq('slug', tournamentSlug)
                .single();

            if (tError) throw tError;

            // Check if wallchart is accessible for this tournament mode
            if (tournamentData.type && tournamentData.type !== 'individual' && tournamentData.type !== 'team') {
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
                    // console.log('Results table not available or no results found'); // Silent fallback
                    setResults([]);
                } else {
                    setResults(resultsData || []);
                }
            } catch (resultsError) {
                // console.log('Results table not available, using matches only'); // Silent fallback
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
                // console.log('Matches table not available'); // Silent fallback
                setMatches([]);
            }

        } catch (error) {
            console.error('Error fetching tournament data:', error);
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
                const result = results.find(r => {
                    if (r.round === round) {
                        return (r.player1_name === player.name || r.player2_name === player.name);
                    }
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

            return {
                ...player,
                results: playerResults,
                total_matches: playerResults.filter(r => r !== null).length,
                // These might need real calculation if not fully available in player record
                wins: player.wins || 0,
                losses: player.losses || 0,
                ties: player.ties || 0,
                spread: player.spread || 0
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

    if (loading) {
        return <PublicLoadingScreen />;
    }

    if (accessDenied) {
        return (
            <DashboardLayout tournamentSlug={tournamentSlug}>
                <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground bg-card rounded-lg border border-border">
                    <Icon name="XCircle" className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
                    <p>Wall Chart is only available for Individual and Team tournament modes.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout tournamentInfo={tournament}>
            <Toaster position="top-center" richColors />

            <div className="max-w-full mx-auto space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Wall Chart</h1>
                        <p className="text-muted-foreground mt-1">
                            Complete tournament overview - {tournament?.current_round ? `Round ${tournament.current_round}` : 'Pre-tournament'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="flex border border-border rounded-md overflow-hidden bg-background">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'grid'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-secondary/50'
                                    }`}
                            >
                                <Icon name="Grid" className="w-4 h-4 inline mr-1" /> Grid
                            </button>
                            <div className="w-[1px] bg-border my-1"></div>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'list'
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-secondary/50'
                                    }`}
                            >
                                <Icon name="List" className="w-4 h-4 inline mr-1" /> List
                            </button>
                        </div>

                        <select
                            value={selectedRound}
                            onChange={(e) => setSelectedRound(e.target.value)}
                            className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                        >
                            <option value="all">All Rounds</option>
                            {Array.from({ length: tournament?.rounds || tournament?.total_rounds || 8 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>Round {i + 1}</option>
                            ))}
                        </select>

                        <Button
                            variant="secondary"
                            onClick={() => exportWallChart('csv')}
                            disabled={exporting}
                            iconName="Download"
                            className="h-9"
                        >
                            Export
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card border border-border p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Players</p>
                            <p className="text-2xl font-bold text-foreground">{players.length}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <Icon name="Users" size={20} />
                        </div>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Matches Data</p>
                            <p className="text-2xl font-bold text-foreground">{results.length}</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                            <Icon name="Swords" size={20} />
                        </div>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Leaders</p>
                            <p className="text-2xl font-bold text-foreground truncate max-w-[120px]">
                                {players.length > 0 ? players[0].name.split(' ')[0] : '-'}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-500">
                            <Icon name="Trophy" size={20} />
                        </div>
                    </div>
                </div>

                {/* Wall Chart Table (Grid View) */}
                {viewMode === 'grid' && (
                    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-secondary/30 border-b border-border text-left">
                                        <th className="p-4 pl-6 font-semibold text-foreground min-w-[200px] sticky left-0 bg-background/95 backdrop-blur z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Player</th>
                                        <th className="p-4 text-center font-semibold text-muted-foreground w-16">Rtg</th>
                                        <th className="p-4 text-center font-semibold text-green-600 dark:text-green-500 w-12">W</th>
                                        <th className="p-4 text-center font-semibold text-red-600 dark:text-red-500 w-12">L</th>
                                        <th className="p-4 text-center font-semibold text-blue-600 dark:text-blue-500 w-12">T</th>
                                        <th className="p-4 text-center font-semibold text-purple-600 dark:text-purple-500 w-16">spr</th>
                                        {Array.from({ length: tournament?.rounds || tournament?.total_rounds || 8 }, (_, i) => (
                                            <th key={i} className="p-4 text-center font-semibold text-foreground min-w-[140px] border-l border-border/50">
                                                Rd {i + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredData.map((player, idx) => (
                                        <tr key={player.id} className="hover:bg-secondary/10 transition-colors group">
                                            <td className="p-4 pl-6 sticky left-0 bg-card z-10 group-hover:bg-background/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono text-muted-foreground w-5 text-right">{player.rank || idx + 1}.</span>
                                                    <div>
                                                        <p className="font-medium text-foreground">{player.name}</p>
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{player.group || 'OPEN'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2 text-center text-muted-foreground font-mono">{player.rating || '-'}</td>
                                            <td className="p-2 text-center font-bold text-green-600 dark:text-green-500">{player.wins}</td>
                                            <td className="p-2 text-center font-bold text-red-600 dark:text-red-500">{player.losses}</td>
                                            <td className="p-2 text-center font-bold text-blue-600 dark:text-blue-500">{player.ties}</td>
                                            <td className="p-2 text-center font-mono text-purple-600 dark:text-purple-500 text-xs">{player.spread > 0 ? `+${player.spread}` : player.spread}</td>

                                            {player.results.map((res, index) => (
                                                <td key={index} className="p-2 text-center border-l border-border/50 align-top h-full">
                                                    {res ? (
                                                        <div className="flex flex-col items-center justify-center gap-1 min-h-[50px]">
                                                            <div className="font-bold text-base font-mono leading-none">{res.score}</div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded-full">
                                                                <span>#{res.player_rank}</span>
                                                                <span className="text-muted-foreground/50">vs</span>
                                                                <span>#{res.opponent_rank}</span>
                                                            </div>
                                                            <div className={`text-[10px] font-medium px-1 rounded ${res.round_spread.startsWith('+') ? 'text-green-600 bg-green-50 dark:bg-green-900/10' :
                                                                res.round_spread.startsWith('-') ? 'text-red-600 bg-red-50 dark:bg-red-900/10' :
                                                                    'text-muted-foreground'
                                                                }`}>
                                                                {res.round_spread}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full w-full min-h-[50px] flex items-center justify-center">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                                                        </div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredData.map((player) => (
                            <div key={player.id} className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-foreground text-lg">{player.name}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">Rank {player.rank || '-'} • Rating {player.rating || '-'}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-sm font-bold text-foreground">
                                            <span className="text-green-600">{player.wins}W</span> - <span className="text-red-600">{player.losses}L</span> - <span className="text-blue-600">{player.ties}T</span>
                                        </div>
                                        <span className="text-xs text-purple-600 font-mono mt-0.5">{player.spread > 0 ? `+${player.spread}` : player.spread} spr</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {player.results.map((res, i) => res && (
                                        <div key={i} className="flex justify-between items-center text-sm p-2 bg-secondary/10 rounded border border-transparent hover:border-border transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-muted-foreground w-4">R{res.round}</span>
                                                <span className="font-medium text-foreground">{res.score}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">vs #{res.opponent_rank}</div>
                                                <div className={`text-[10px] font-mono ${res.round_spread.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{res.round_spread}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <ReportFooter />
            </div>
        </DashboardLayout>
    );
};

export default WallChartPage;