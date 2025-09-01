import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { supabase } from 'supabaseClient';
import PlayerStatsModal from 'components/PlayerStatsModal';
import ResultSubmissionModal from 'components/ResultSubmissionModal';
import Button from 'components/ui/Button';
import { cn } from 'utils/cn';
import 'styles/ticker.css';
import { Toaster, toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import useMediaQuery from '../hooks/useMediaQuery.js';
import TournamentTicker from '../components/TournamentTicker';
import AnnouncementsDisplay from 'components/AnnouncementsDisplay';
import StandingsTable from 'components/StandingsTable';
import PrizeDisplay from 'components/PrizeDisplay';
import AdvancedStatsDisplay from 'components/AdvancedStatsDisplay';
import ShareButton from 'components/ui/ShareButton';
import { tournamentSharing } from 'utils/socialSharing';

const PublicTournamentPageNew = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [teams, setTeams] = useState([]);
    const [prizes, setPrizes] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [showPairingsDropdown, setShowPairingsDropdown] = useState(true);
    const [selectedPlayerForStats, setSelectedPlayerForStats] = useState(null);
    const isMobile = !useMediaQuery('(min-width: 1024px)');

    // Simple recalculate ranks function
    const recalculateRanks = useCallback((playerList, tournamentType, resultsList, matchesList) => {
        if (!playerList) return [];
        let enrichedPlayers = playerList;
        
        console.log('🔍 DEBUG: Recalculating ranks with:', {
            playerCount: playerList?.length,
            tournamentType,
            resultsCount: resultsList?.length,
            matchesCount: matchesList?.length
        });
        
        if (tournamentType === 'best_of_league') {
            // Calculate match_wins by grouping results by match-up and counting majority wins
            const bestOf = 15; // Default to 15, or get from tournament settings if available
            const majority = Math.floor(bestOf / 2) + 1;
            // Build a map of match-ups: key = sorted player ids, value = array of results
            const matchupMap = {};
            (resultsList || []).forEach(result => {
                if (!result.player1_id || !result.player2_id) return;
                const ids = [result.player1_id, result.player2_id].sort((a, b) => a - b);
                const key = ids.join('-');
                if (!matchupMap[key]) matchupMap[key] = [];
                matchupMap[key].push(result);
            });
            enrichedPlayers = playerList.map(player => {
                let wins = 0, losses = 0, ties = 0, spread = 0, match_wins = 0;
                // Calculate per-game stats
                (resultsList || []).forEach(result => {
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
            // For individual tournaments, calculate stats directly from results
            // This ensures consistency with the dashboard and real-time accuracy
            enrichedPlayers = playerList.map(player => {
                let wins = 0, losses = 0, ties = 0, spread = 0;
                
                (resultsList || []).forEach(result => {
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
        
        const finalStandings = [...enrichedPlayers].sort((a, b) => {
            if (tournamentType === 'best_of_league') {
                if ((a.match_wins || 0) !== (b.match_wins || 0)) return (b.match_wins || 0) - (a.match_wins || 0);
            }
            
            // Primary sort: Game wins + 0.5 * ties
            const aGameScore = (a.wins || 0) + (a.ties || 0) * 0.5;
            const bGameScore = (b.wins || 0) + (b.ties || 0) * 0.5;
            if (aGameScore !== bGameScore) return bGameScore - aGameScore;
            
            // Secondary sort: Spread
            if ((a.spread || 0) !== (b.spread || 0)) return (b.spread || 0) - (a.spread || 0);
            
            // Tertiary sort: Head-to-head (if they've played)
            const headToHeadGames = resultsList.filter(r => 
                (r.player1_id === a.player_id && r.player2_id === b.player_id) ||
                (r.player1_id === b.player_id && r.player2_id === a.player_id)
            );
            
            if (headToHeadGames.length > 0) {
                let aWins = 0, bWins = 0;
                headToHeadGames.forEach(game => {
                    if (game.player1_id === a.player_id) {
                        if (game.score1 > game.score2) aWins++;
                        else if (game.score2 > game.score1) bWins++;
                    } else {
                        if (game.score2 > game.score1) aWins++;
                        else if (game.score1 > game.score2) bWins++;
                    }
                });
                if (aWins !== bWins) return bWins - aWins;
            }
            
            // Quaternary sort: Higher seed (lower number)
            return (a.seed || 999) - (b.seed || 999);
        }).map((player, index) => ({ ...player, rank: index + 1 }));
        
        console.log('🏆 DEBUG: Final standings:', finalStandings.map(p => ({
            name: p.name,
            rank: p.rank,
            wins: p.wins,
            losses: p.losses,
            ties: p.ties,
            spread: p.spread,
            gameScore: (p.wins || 0) + (p.ties || 0) * 0.5
        })));
        
        return finalStandings;
    }, []);

    // Fetch tournament data - FRESH APPROACH
    const fetchTournamentData = useCallback(async () => {
        if (!tournamentSlug) { setLoading(false); return; }
        setLoading(true);
        
        console.log('🆕 FRESH APPROACH - Loading tournament:', tournamentSlug);
        console.log('🌍 Environment:', import.meta.env.MODE);
        console.log('🔧 Supabase URL available:', !!import.meta.env.VITE_SUPABASE_URL);
        console.log('🔧 Supabase Key available:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
        
        try {
            // Step 1: Get basic tournament info
            console.log('📋 Step 1: Getting basic tournament info...');
            const { data: tournamentData, error: tournamentError } = await supabase
                .from('tournaments')
                .select('id, name, slug, status, venue, date, type, rounds, playerCount, is_remote_submission_enabled, start_date, end_date, pairing_schedule')
                .eq('slug', tournamentSlug)
                .single();
            
            console.log('📊 Tournament query result:', { data: tournamentData, error: tournamentError });
            console.log('🔧 Remote submission enabled:', tournamentData?.is_remote_submission_enabled);
            
            if (tournamentError) {
                console.error('❌ Tournament query failed:', tournamentError);
                throw tournamentError;
            }
            
            if (!tournamentData) {
                throw new Error("Tournament not found");
            }
            
            if (tournamentData.status === 'draft') {
                throw new Error("Tournament not found");
            }
            
            console.log('✅ Tournament found:', tournamentData.name);
            console.log('📋 Pairing schedule:', tournamentData.pairing_schedule);
            setTournament(tournamentData);
            
            // Step 2: Get players
            console.log('👥 Step 2: Getting players...');
            const { data: playersData, error: playersError } = await supabase
                .from('tournament_players')
                .select('*, players(id, name, rating, slug, photo_url)')
                .eq('tournament_id', tournamentData.id);
            
            if (playersError) throw playersError;
            
            const combinedPlayers = playersData.map(tp => ({
                ...tp.players,
                ...tp
            }));
            
            // Step 3: Get other data
            console.log('📊 Step 3: Getting other data...');
            const [resultsResponse, teamsResponse, prizesResponse, matchesResponse] = await Promise.all([
                supabase.from('results').select('*').eq('tournament_id', tournamentData.id),
                supabase.from('teams').select('id, name').eq('tournament_id', tournamentData.id),
                supabase.from('prizes').select('*').eq('tournament_id', tournamentData.id),
                supabase.from('matches').select('*').eq('tournament_id', tournamentData.id)
            ]);
            
            setPlayers(recalculateRanks(combinedPlayers, tournamentData.type, resultsResponse.data || [], matchesResponse.data || []));
            setResults(resultsResponse.data || []);
            setTeams(teamsResponse.data || []);
            setPrizes(prizesResponse.data || []);
            setMatches(matchesResponse.data || []);
            
            console.log('✅ All data loaded successfully!');
            console.log('🏆 Tournament type:', tournamentData.type);
            console.log('📊 Results count:', resultsResponse.data?.length || 0);
            console.log('🎯 Matches count:', matchesResponse.data?.length || 0);
            console.log('🎯 Matches data:', matchesResponse.data);
            console.log('👥 Players with stats:', recalculateRanks(combinedPlayers, tournamentData.type, resultsResponse.data || [], matchesResponse.data || []).map(p => ({
                name: p.name,
                wins: p.wins,
                match_wins: p.match_wins,
                rank: p.rank,
                photo_url: p.photo_url
            })));
            
            // Debug photo URLs
            console.log('📸 Photo URL Debug:', combinedPlayers.map(p => ({
                name: p.name,
                photo_url: p.photo_url,
                has_photo: !!p.photo_url
            })));
            
        } catch (error) {
            console.error("Error loading tournament data:", error);
            console.error("Full error details:", JSON.stringify(error, null, 2));
            toast.error("Failed to load tournament data. The link may be incorrect or the tournament was not found.");
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug, recalculateRanks]);

    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData]);

    const handlePlayerClick = (e, player) => {
        e.preventDefault();
        if (player) {
            setSelectedPlayerForStats(player);
        }
    };

    const teamMap = useMemo(() => new Map(teams.map(team => [team.id, team.name])), [teams]);
    
    const sortedRoster = useMemo(() => {
        return [...players].sort((a, b) => (a.rank || 0) - (b.rank || 0));
    }, [players]);

    const pairingsByRound = useMemo(() => {
        if (tournament?.type !== 'best_of_league') {
            // For individual tournaments, try to get pairings from tournament pairing_schedule first
            if (tournament?.pairing_schedule && Object.keys(tournament.pairing_schedule).length > 0) {
                return tournament.pairing_schedule;
            }
            // Fallback to matches if pairing_schedule is not available
            if (matches && matches.length > 0) {
                return matches.reduce((acc, match) => {
                    if (!acc[match.round]) {
                        acc[match.round] = [];
                    }
                    acc[match.round].push(match);
                    return acc;
                }, {});
            }
            return {};
        }
        // For best_of_league tournaments, use matches table
        return matches.reduce((acc, match) => {
            if (!acc[match.round]) {
                acc[match.round] = [];
            }
            acc[match.round].push(match);
            return acc;
        }, {});
    }, [tournament, matches]);

    const tickerMessages = useMemo(() => {
        return results.slice(0, 5).map(result => {
            const player1 = players.find(p => p.player_id === result.player1_id);
            const player2 = players.find(p => p.player_id === result.player2_id);
            return `LATEST: ${player1?.name || 'Unknown'} defeated ${player2?.name || 'Unknown'} ${result.score1} - ${result.score2}`;
        });
    }, [results, players]);

    const scrollToRef = (ref) => {
        if (ref?.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                {/* Skeleton Header */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border/20 shadow-lg">
                    <div className="p-4">
                        <div className="h-8 bg-muted rounded animate-pulse w-1/3 mx-auto"></div>
                    </div>
                </div>
                
                {/* Skeleton Ticker */}
                <div className="fixed top-20 left-0 right-0 z-[90] bg-card border-b border-border/20 shadow-md">
                    <div className="p-3">
                        <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
                    </div>
                </div>
                
                {/* Skeleton Content */}
                <main className="pt-28 pb-20 lg:pt-24 lg:pb-10">
                    <div className="w-full px-4 lg:px-6 lg:max-w-7xl lg:mx-auto">
                        <div className="space-y-6">
                            {/* Skeleton Announcements */}
                            <div className="bg-card border border-border/20 rounded-lg p-6">
                                <div className="space-y-3">
                                    <div className="h-6 bg-muted rounded animate-pulse w-1/4"></div>
                                    <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
                                    <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                                </div>
                            </div>
                            
                            {/* Skeleton Standings */}
                            <div className="bg-card border border-border/20 rounded-lg p-6">
                                <div className="space-y-4">
                                    <div className="h-6 bg-muted rounded animate-pulse w-1/3 mx-auto"></div>
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center space-x-4 p-4 border border-border/20 rounded-lg">
                                            <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                                                <div className="h-3 bg-muted rounded animate-pulse w-1/4"></div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                                                <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Skeleton Pairings */}
                            <div className="bg-card border border-border/20 rounded-lg p-6">
                                <div className="space-y-4">
                                    <div className="h-6 bg-muted rounded animate-pulse w-1/4 mx-auto"></div>
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="bg-muted/10 border border-border/20 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                                                <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                                            </div>
                                            <div className="flex items-center justify-center space-x-4">
                                                <div className="flex-1 text-center space-y-2">
                                                    <div className="h-4 bg-muted rounded animate-pulse w-3/4 mx-auto"></div>
                                                    <div className="h-3 bg-muted rounded animate-pulse w-1/2 mx-auto"></div>
                                                </div>
                                                <div className="mx-4">
                                                    <div className="h-6 bg-muted rounded animate-pulse w-8"></div>
                                                </div>
                                                <div className="flex-1 text-center space-y-2">
                                                    <div className="h-4 bg-muted rounded animate-pulse w-3/4 mx-auto"></div>
                                                    <div className="h-3 bg-muted rounded animate-pulse w-1/2 mx-auto"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Skeleton Roster */}
                            <div className="bg-card border border-border/20 rounded-lg p-6">
                                <div className="space-y-4">
                                    <div className="h-6 bg-muted rounded animate-pulse w-1/4 mx-auto"></div>
                                    <div className="space-y-2">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center space-x-4 p-4 border border-border/20 rounded-lg">
                                                <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                                                    <div className="h-3 bg-muted rounded animate-pulse w-1/4"></div>
                                                </div>
                                                <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                
                {/* Skeleton Mobile Navigation */}
                <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border/20 shadow-lg">
                    <div className="flex justify-around p-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center space-y-2">
                                <div className="w-6 h-6 bg-muted rounded animate-pulse"></div>
                                <div className="h-3 bg-muted rounded animate-pulse w-12"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    if (!tournament) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
            <Icon name="SearchX" size={48} className="text-destructive opacity-50 mb-4" />
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">Tournament Not Found</h1>
            <p className="text-muted-foreground text-sm">The tournament you're looking for doesn't exist or has been removed.</p>
        </div>
    );
    
    const formattedDate = tournament.type === 'best_of_league' 
        ? `${format(new Date(tournament.start_date), "MMM do")} - ${format(new Date(tournament.end_date), "MMM do, yyyy")}`
        : tournament.date ? format(new Date(tournament.date), "MMMM do, yyyy") : "Date not set";

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Toaster position="top-center" richColors />
            <PlayerStatsModal player={selectedPlayer} results={results} onClose={() => setSelectedPlayer(null)} onSelectPlayer={(name) => setSelectedPlayer(players.find(p => p.name === name))} players={players} />
            <PlayerStatsModal 
                player={selectedPlayerForStats} 
                results={results} 
                onClose={() => setSelectedPlayerForStats(null)} 
                onSelectPlayer={(name) => setSelectedPlayerForStats(players.find(p => p.name === name))} 
                players={players}
                tournamentType={tournament?.type}
                tournamentId={tournament?.id}
                matches={matches}
            />
            <AnimatePresence>
                {showSubmissionModal && <ResultSubmissionModal tournament={tournament} players={players} onClose={() => setShowSubmissionModal(false)} />}
            </AnimatePresence>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-[9999] bg-card border-b border-border/20 shadow-lg">
                <div className="w-full px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Tournament Info */}
                        <div className="flex-1 text-center lg:text-left">
                            <h1 className="text-xl font-bold text-primary leading-tight truncate">{tournament.name}</h1>
                            <p className="text-sm text-muted-foreground leading-relaxed truncate mt-1">{tournament.venue} • {formattedDate}</p>
                        </div>
                        
                        {/* Desktop Submit Button */}
                        {tournament.is_remote_submission_enabled && (
                            <div className="hidden lg:block">
                                <Button
                                    onClick={() => setShowSubmissionModal(true)}
                                    className="bg-accent hover:bg-accent/90 text-white font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                                >
                                    <Icon name="Send" size={18} />
                                    Submit Score
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9998] bg-card border-t border-border/20 pb-safe shadow-lg">
                <div className="px-4 py-3">
                    <div className={`grid gap-2 ${tournament.is_remote_submission_enabled ? 'grid-cols-5' : 'grid-cols-4'}`}>
                        <button 
                            onClick={() => scrollToRef({ current: document.getElementById('standings') })}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-primary/10 active:bg-primary/20 transition-colors touch-manipulation"
                        >
                            <Icon name="Trophy" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Standings</span>
                        </button>
                        <button 
                            onClick={() => scrollToRef({ current: document.getElementById('pairings') })}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-primary/10 active:bg-primary/20 transition-colors touch-manipulation"
                        >
                            <Icon name="Swords" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Pairings</span>
                        </button>
                        <button 
                            onClick={() => scrollToRef({ current: document.getElementById('roster') })}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-primary/10 active:bg-primary/20 transition-colors touch-manipulation"
                        >
                            <Icon name="Users" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Roster</span>
                        </button>
                        <button 
                            onClick={() => scrollToRef({ current: document.getElementById('stats') })}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-primary/10 active:bg-primary/20 transition-colors touch-manipulation"
                        >
                            <Icon name="BarChart2" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Stats</span>
                        </button>
                        {tournament.is_remote_submission_enabled && (
                            <button 
                                onClick={() => setShowSubmissionModal(true)}
                                className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-accent/20 hover:bg-accent/30 active:bg-accent/40 transition-colors touch-manipulation"
                            >
                                <Icon name="Send" size={20} className="text-accent mb-1"/>
                                <span className="text-xs font-medium text-foreground">Submit</span>
                            </button>
                        )}
                    </div>
                </div>
            </nav>
            
            {/* Ticker */}
            <div className="fixed top-20 left-0 right-0 z-[90] bg-card border-b border-border/20 shadow-md">
                <TournamentTicker messages={tickerMessages} />
            </div>
            
            {/* Floating Submit Button (visible on all screens when enabled) */}
            {tournament.is_remote_submission_enabled && (
                <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[9997]">
                    <Button
                        onClick={() => setShowSubmissionModal(true)}
                        className="bg-accent hover:bg-accent/90 text-white font-medium px-4 py-3 lg:px-6 lg:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 lg:gap-3"
                    >
                        <Icon name="Send" size={20} />
                        <span className="hidden lg:inline">Submit Score</span>
                    </Button>
                </div>
            )}

            {/* Main Content */}
            <main className="pt-28 pb-20 lg:pt-24 lg:pb-10">
                <div className="w-full px-4 lg:px-6 lg:max-w-7xl lg:mx-auto">
                    <div className="space-y-6">
                        <AnnouncementsDisplay />
                        
                        <section id="standings">
                            <div className="flex flex-col items-center mb-4">
                                <h2 className="text-xl font-bold flex items-center mb-2">
                                    <Icon name="Trophy" className="mr-2 text-primary" size={20} />
                                    Live Standings
                                </h2>
                            </div>
                            <StandingsTable 
                                players={players} 
                                tournamentType={tournament?.type} 
                                isLoading={loading}
                                onPlayerClick={(player) => setSelectedPlayerForStats(player)}
                            />
                        </section>

                        <section id="pairings">
                            <h2 className="text-xl font-bold mb-4 flex items-center justify-center">
                                <Icon name="Swords" className="mr-2 text-primary" size={20}/>Pairings
                            </h2>
                            <div className="space-y-4">
                                {(() => {
                                    console.log('🔍 Pairings Debug:', {
                                        tournamentPairingSchedule: tournament?.pairing_schedule,
                                        pairingsByRound,
                                        pairingsByRoundKeys: Object.keys(pairingsByRound),
                                        pairingsByRoundLength: Object.keys(pairingsByRound).length
                                    });
                                    return null;
                                })()}
                                {Object.keys(pairingsByRound).length > 0 ? (
                                    Object.entries(pairingsByRound).map(([roundNum, roundPairings]) => (
                                        <div key={roundNum} className="bg-card border border-border/20 rounded-lg p-4">
                                            <h3 className="text-lg font-semibold text-foreground mb-3">Round {roundNum}</h3>
                                            <div className="space-y-3">
                                                {roundPairings.map((pairing, index) => {
                                                    // Handle different data structures
                                                    let player1, player2, player1Name, player2Name, tableNum, division;
                                                    
                                                    if (tournament?.type === 'best_of_league' && pairing.player1_id) {
                                                        // From matches table
                                                        player1 = players.find(p => p.player_id === pairing.player1_id);
                                                        player2 = players.find(p => p.player_id === pairing.player2_id);
                                                        player1Name = player1?.name || 'TBD';
                                                        player2Name = player2?.name || 'TBD';
                                                        tableNum = pairing.table || index + 1;
                                                        division = pairing.division || 'Open';
                                                    } else {
                                                        // From pairing_schedule
                                                        player1 = players.find(p => p.name === pairing.player1?.name);
                                                        player2 = players.find(p => p.name === pairing.player2?.name);
                                                        player1Name = pairing.player1?.name || 'TBD';
                                                        player2Name = pairing.player2?.name || 'TBD';
                                                        tableNum = pairing.table || index + 1;
                                                        division = pairing.division || 'Open';
                                                    }
                                                    
                                                    return (
                                                        <div key={index} className="bg-muted/10 border border-border/20 rounded-lg p-4">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-mono text-muted-foreground bg-muted/20 px-2 py-1 rounded">Table {tableNum}</span>
                                                                <span className="text-sm text-muted-foreground">{division}</span>
                                                            </div>
                                                            <div className="flex items-center justify-center space-x-4 mt-3">
                                                                <div className="flex-1 text-center">
                                                                    <div className="font-medium text-base">{player1Name}</div>
                                                                    <div className="text-sm text-muted-foreground">Seed #{player1?.seed || 'TBD'}</div>
                                                                </div>
                                                                <div className="mx-4">
                                                                    <span className="text-lg font-bold text-muted-foreground bg-muted/20 px-3 py-1 rounded">VS</span>
                                                                </div>
                                                                <div className="flex-1 text-center">
                                                                    <div className="font-medium text-base">{player2Name}</div>
                                                                    <div className="text-sm text-muted-foreground">Seed #{player2?.seed || 'TBD'}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-card border border-border/20 rounded-lg p-8 text-center">
                                        <Icon name="Swords" size={48} className="mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold text-foreground mb-2">No Pairings Available</h3>
                                        <p className="text-muted-foreground">
                                            {tournament?.type === 'best_of_league' 
                                                ? 'Pairings will be displayed here once the tournament begins.'
                                                : 'Pairings will be displayed here once they are generated by the tournament director.'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section id="roster">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center">
                                    <Icon name="Users" className="mr-3 text-primary" size={24}/>
                                    Player Roster
                                </h2>
                                <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
                                    Meet the talented players competing in this tournament.
                                </p>
                            </div>
                            
                            {/* Simple Table Layout */}
                            <div className="bg-card border border-border/20 rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/20">
                                            <th className="text-left p-6 font-semibold text-foreground">Seed</th>
                                            <th className="text-left p-6 font-semibold text-foreground">Player</th>
                                            <th className="text-right p-6 font-semibold text-foreground">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const sortedPlayers = sortedRoster.sort((a, b) => (a.seed || 999) - (b.seed || 999));
                                            console.log('🎯 Roster Debug - First 3 players:', sortedPlayers.slice(0, 3).map(p => ({
                                                name: p.name,
                                                photo_url: p.photo_url,
                                                has_photo: !!p.photo_url
                                            })));
                                            return sortedPlayers.map((p, index) => (
                                            <tr key={p.id} className="border-b border-border/20 hover:bg-muted/5 transition-colors duration-200">
                                                <td className="p-6">
                                                    <span className="text-lg font-mono text-muted-foreground bg-muted/20 px-4 py-2 rounded-lg font-semibold">
                                                        {p.seed || index + 1}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center space-x-4">
                                                        {/* Player Avatar */}
                                                        {p.photo_url ? (
                                                            <img 
                                                                src={p.photo_url} 
                                                                alt={p.name} 
                                                                className="w-12 h-12 rounded-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg ${p.photo_url ? 'hidden' : ''}`}>
                                                            {p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                        </div>
                                                        {/* Player Name */}
                                                        <a 
                                                            href={`/players/${p.slug}`} 
                                                            onClick={(e) => handlePlayerClick(e, p)} 
                                                            className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer"
                                                        >
                                                            {p.name}
                                                        </a>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <span className="text-lg font-mono text-primary font-bold">
                                                        {p.rating}
                                                    </span>
                                                </td>
                                                                                         </tr>
                                         ));
                                         })()}
                                     </tbody>
                                </table>
                            </div>
                            
                            {/* Empty State */}
                            {sortedRoster.length === 0 && (
                                <div className="text-center py-16">
                                    <Icon name="Users" size={64} className="mx-auto text-muted-foreground/50 mb-4" />
                                    <h3 className="text-xl font-semibold text-foreground mb-2">No Players Found</h3>
                                    <p className="text-muted-foreground">The tournament roster is currently empty.</p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>


        </div>
    );
};

export default PublicTournamentPageNew;
