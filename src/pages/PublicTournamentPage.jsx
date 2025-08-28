import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import ThemeToggle from 'components/ui/ThemeToggle';
import PublicTournamentActions from '../components/public/PublicTournamentActions';
import PlayerAvatar from 'components/ui/PlayerAvatar';

const StatCard = ({ icon, label, value, subtext, color = 'text-primary' }) => (
    <div className="glass-card p-4 lg:p-6">
        <div className="flex items-center space-x-3 lg:space-x-4">
            <Icon name={icon} size={22} className={cn(color, "lg:w-6 lg:h-6")} />
            <div className="min-w-0 flex-1">
                <p className="text-lg lg:text-xl font-bold font-mono">{value}</p>
                <p className="text-sm lg:text-base text-foreground font-medium truncate">{label}</p>
                {subtext && <p className="text-xs lg:text-sm text-muted-foreground truncate">{subtext}</p>}
            </div>
        </div>
    </div>
);

const formatPlayerName = (name, players) => {
    if (!name) return { formattedName: '', seedInfo: '' };
    const player = players.find(p => p.name === name);
    const seed = player?.seed;
    const parts = name.split(' ');
    const lastName = parts.pop() || '';
    const firstName = parts.join(' ');
    return { formattedName: `${lastName}, ${firstName}`, seedInfo: seed ? `(A${seed})` : '' };
};

const PublicTournamentPage = () => {
    // TEST ELEMENT - This should definitely be visible
    console.log('🚨 PublicTournamentPage component is mounting!');
    
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
    const isMobile = !useMediaQuery('(min-width: 1024px)');

    const standingsRef = useRef(null);
    const pairingsRef = useRef(null);
    const statsRef = useRef(null);
    const rosterRef = useRef(null);
    const prizesRef = useRef(null);

    // Always recalculate player stats from results and matches for live standings
    const recalculateRanks = useCallback((playerList, tournamentType, resultsList, matchesList) => {
        if (!playerList) return [];
        let enrichedPlayers = playerList;
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
        return [...enrichedPlayers].sort((a, b) => {
            if (tournamentType === 'best_of_league') {
                if ((a.match_wins || 0) !== (b.match_wins || 0)) return (b.match_wins || 0) - (a.match_wins || 0);
            }
            if ((a.wins || 0) !== (b.wins || 0)) return (b.wins || 0) - (a.wins || 0);
            return (b.spread || 0) - (a.spread || 0);
        }).map((player, index) => ({ ...player, rank: index + 1 }));
    }, []);

    // Fetch and refresh public data - NEW VERSION
    const fetchPublicDataNew = useCallback(async () => {
        if (!tournamentSlug) { setLoading(false); return; }
        setLoading(true);
        
        // Force cache invalidation
        console.log('🔄 NEW VERSION - Cache invalidation - version 3.0');
        
        // Debug environment variables
        console.log('🔧 Environment check:', {
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
            supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
            isDev: import.meta.env.DEV
        });
        
        // Log the actual Supabase URL (first part only for security)
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseUrl) {
            console.log('🔧 Supabase URL (first 30 chars):', supabaseUrl.substring(0, 30) + '...');
        }
        
        console.log('🔍 Looking for tournament with slug:', tournamentSlug);
        
        // First, let's test if we can access tournaments at all
        const { data: testTournaments, error: testError } = await supabase
            .from('tournaments')
            .select('id, name, slug, status')
            .limit(3);
        
        console.log('🧪 Test query result:', { data: testTournaments, error: testError });
        
        // If the test query fails, there's a fundamental issue
        if (testError) {
            console.error('❌ Test query failed:', testError);
            throw new Error(`Database connection failed: ${testError.message}`);
        }
        
        // Let's also check if we can find the specific tournament with a broader search
        const { data: allTournaments, error: allError } = await supabase
            .from('tournaments')
            .select('id, name, slug, status')
            .ilike('slug', `%${tournamentSlug}%`);
        
        console.log('🔍 All tournaments with similar slug:', { data: allTournaments, error: allError });
        
        try {
            console.log('🔍 Making tournament query for slug:', tournamentSlug);
            
            // BRAND NEW APPROACH - Ultra minimal query
            console.log('🚀 ULTRA MINIMAL QUERY APPROACH');
            
            const ultraMinimalQuery = await supabase
                .from('tournaments')
                .select('id, name, slug, status')
                .eq('slug', tournamentSlug)
                .single();
            
            console.log('📊 Ultra minimal query result:', { 
                data: ultraMinimalQuery.data, 
                error: ultraMinimalQuery.error,
                errorString: JSON.stringify(ultraMinimalQuery.error, null, 2)
            });
            
            if (ultraMinimalQuery.error) {
                console.error('❌ Ultra minimal query failed:', JSON.stringify(ultraMinimalQuery.error, null, 2));
                throw ultraMinimalQuery.error;
            }
            
            if (!ultraMinimalQuery.data) {
                console.error('❌ No tournament found with slug:', tournamentSlug);
                throw new Error("Tournament not found");
            }
            
            console.log('✅ Tournament found:', ultraMinimalQuery.data.name);
            
            // Check if tournament is in a public state
            if (ultraMinimalQuery.data.status === 'draft') {
                console.error('❌ Tournament is in draft status and not publicly accessible');
                throw new Error("Tournament not found");
            }
            
            setTournament(ultraMinimalQuery.data);
            
            // Now fetch additional data with the tournament ID
            const tournamentId = ultraMinimalQuery.data.id;
            
                // EXACTLY like dashboard - fetch tournament players with players (*)
    const { data: tournamentPlayersData, error: tpError } = await supabase
        .from('tournament_players')
        .select(`
            status, wins, losses, ties, spread, seed, rank, team_id, group_id, division,
            players (*)
        `)
        .eq('tournament_id', tournamentId);
    if (tpError) throw tpError;
    
    // VISIBLE DEBUG - Show alert to confirm function is running
    alert('🔍 Function is running! Check console for debug logs.');
    
    // Debug: Log the raw data structure
    console.log('🔍 Raw tournamentPlayersData:', tournamentPlayersData);
    if (tournamentPlayersData && tournamentPlayersData.length > 0) {
        console.log('🔍 Sample player data structure:', tournamentPlayersData[0]);
        console.log('🔍 Sample players sub-object:', tournamentPlayersData[0]?.players);
    }
    
    // EXACTLY like dashboard - combine tournament player data with player details
    const combinedPlayers = tournamentPlayersData
        .map(tp => ({ ...tp.players, ...tp, status: tp.status || 'active' }))
        .filter(p => p.name);
    
    // Debug: Log the combined data
    console.log('🔍 Combined players data:', combinedPlayers);
    if (combinedPlayers && combinedPlayers.length > 0) {
        console.log('🔍 Sample combined player:', combinedPlayers[0]);
        console.log('🔍 Available fields:', Object.keys(combinedPlayers[0]));
        console.log('🔍 Sample player photo_url:', combinedPlayers[0].photo_url);
        
        // VISIBLE DEBUG - Show what fields are available
        alert(`🔍 Sample player fields: ${Object.keys(combinedPlayers[0]).join(', ')}`);
        alert(`🔍 Sample player photo_url: ${combinedPlayers[0].photo_url || 'NULL'}`);
    }
    
    const [{ data: resultsData }, {data: teamsData}, {data: prizesData}, {data: matchesData}] = await Promise.all([
        supabase.from('results').select('*').eq('tournament_id', tournamentId).order('created_at', { ascending: false }),
        supabase.from('teams').select('id, name').eq('tournament_id', tournamentId),
        supabase.from('prizes').select('*').eq('tournament_id', tournamentId).order('rank', { ascending: true }),
        supabase.from('matches').select('*').eq('tournament_id', tournamentId).order('round', { ascending: true })
    ]);
    
    // No need to fetch photos separately - they're already in the players data
    const playersWithPhotos = combinedPlayers.filter(p => p.photo_url);
    console.log('🔍 Players with photo_url (from players table):', playersWithPhotos.length);
    
    // VISIBLE DEBUG - Show count of players with photos
    alert(`🔍 Players with photos: ${playersWithPhotos.length} out of ${combinedPlayers.length}`);
            
            setPlayers(recalculateRanks(combinedPlayers, ultraMinimalQuery.data.type, resultsData || [], matchesData || []));
            setResults(resultsData || []);
            setTeams(teamsData || []);
            setPrizes(prizesData || []);
            setMatches(matchesData || []);
        } catch (error) {
            console.error("Error fetching public data:", error);
            toast.error("Failed to load tournament data. The link may be incorrect or the tournament was not found.");
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug, recalculateRanks]);

    // Initial fetch - USE NEW VERSION
    useEffect(() => {
        fetchPublicDataNew();
    }, [fetchPublicDataNew]);

    // Real-time updates
    useEffect(() => {
        if (!tournament) return;
        const channel = supabase.channel(`public-tournament-updates-${tournament.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'results', filter: `tournament_id=eq.${tournament.id}` }, fetchPublicDataNew)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_players', filter: `tournament_id=eq.${tournament.id}` }, fetchPublicDataNew)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournament.id}` }, fetchPublicDataNew)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournament.id}` }, fetchPublicDataNew)
            .subscribe();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [tournament, fetchPublicDataNew]);

    const handlePlayerClick = (e, player) => {
        e.preventDefault();
        if (player?.slug) {
            navigate(`/players/${player.slug}`);
        }
    };

    const teamMap = useMemo(() => new Map(teams.map(team => [team.id, team.name])), [teams]);
    
    const teamStandings = useMemo(() => {
        if (tournament?.type !== 'team' || !teams.length || !players.length) return [];
        const resultsByRound = results.reduce((acc, result) => {
            (acc[result.round] = acc[result.round] || []).push(result);
            return acc;
        }, {});
        const teamStats = teams.map(team => ({ id: team.id, name: team.name, teamWins: 0, teamLosses: 0, individualWins: 0, totalSpread: 0, players: players.filter(p => p.team_id === team.id) }));
        Object.values(resultsByRound).forEach(roundResults => {
            const teamRoundWins = new Map();
            roundResults.forEach(result => {
                const p1 = players.find(p => p.player_id === result.player1_id);
                const p2 = players.find(p => p.player_id === result.player2_id);
                if (!p1 || !p2 || !p1.team_id || !p2.team_id || p1.team_id === p2.team_id) return;
                if (result.score1 > result.score2) {
                    teamRoundWins.set(p1.team_id, (teamRoundWins.get(p1.team_id) || 0) + 1);
                } else if (result.score2 > result.score1) {
                    teamRoundWins.set(p2.team_id, (teamRoundWins.get(p2.team_id) || 0) + 1);
                }
            });
            if(teamRoundWins.size > 0) {
                const [team1Id, team1Wins] = [...teamRoundWins.entries()][0];
                const [team2Id, team2Wins] = [...teamRoundWins.entries()][1] || [null, 0];
                const team1 = teamStats.find(t => t.id === team1Id);
                const team2 = teamStats.find(t => t.id === team2Id);
                if(team1 && team2) {
                    if (team1Wins > team2Wins) {
                        team1.teamWins++;
                        team2.teamLosses++;
                    } else if (team2Wins > team1Wins) {
                        team2.teamWins++;
                        team1.teamLosses++;
                    }
                }
            }
        });
        teamStats.forEach(team => {
            team.individualWins = team.players.reduce((sum, p) => sum + (p.wins || 0), 0);
            team.totalSpread = team.players.reduce((sum, p) => sum + (p.spread || 0), 0);
        });
        return teamStats.sort((a, b) => {
            if (a.teamWins !== b.teamWins) return b.teamWins - a.teamWins;
            if (a.individualWins !== b.individualWins) return b.individualWins - a.individualWins;
            return b.totalSpread - a.totalSpread;
        }).map((team, index) => ({ ...team, rank: index + 1 }));
    }, [players, results, teams, tournament]);

    const tickerMessages = useMemo(() => {
        return results.slice(0, 10).map(r => {
            if (r.score1 > r.score2) {
                return `LATEST: ${r.player1_name} defeated ${r.player2_name} ${r.score1} - ${r.score2}`;
            } else if (r.score2 > r.score1) {
                return `LATEST: ${r.player2_name} defeated ${r.player1_name} ${r.score2} - ${r.score1}`;
            } else {
                return `LATEST: ${r.player1_name} and ${r.player2_name} drew ${r.score1} - ${r.score2}`;
            }
        });
    }, [results]);

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
        return matches.reduce((acc, match) => {
            if (!acc[match.round]) {
                acc[match.round] = [];
            }
            acc[match.round].push(match);
            return acc;
        }, {});
    }, [tournament, matches]);

    const tournamentStats = useMemo(() => {
        if (!results || results.length === 0) return {};
        const highGame = results.reduce((max, r) => Math.max(max, r.score1, r.score2), 0);
        const largestBlowout = results.reduce((max, r) => {
            const spread = Math.abs(r.score1 - r.score2);
            return spread > max.spread ? { ...r, spread } : max;
        }, { spread: -1 });
        return { highGame, largestBlowout };
    }, [results]);

    const getRecordDisplay = (player) => {
        const wins = player.wins || 0;
        const losses = player.losses || 0;
        const ties = player.ties || 0;
        const winPoints = wins + (ties * 0.5);
        const lossPoints = losses + (ties * 0.5);
        return `${winPoints} - ${lossPoints}`;
    };

    const scrollToRef = (ref) => {
        const element = ref.current || (typeof ref === 'object' && ref.current);
        if (element) {
            const headerHeight = isMobile ? 80 : 120; // Account for header height
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    };
    
    const sortedRoster = useMemo(() => {
        return [...players].sort((a, b) => {
            if (a.team_id < b.team_id) return -1;
            if (a.team_id > b.team_id) return 1;
            return (a.seed || 0) - (b.seed || 0);
        });
    }, [players]);

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center space-y-4">
                <div className="h-8 w-8 bg-muted rounded animate-pulse mx-auto"></div>
                <p className="text-muted-foreground text-sm">Loading Tournament Portal...</p>
            </div>
        </div>
    );
    
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

    const SidebarContent = () => (
        <div className="glass-card p-6 space-y-3">
            <div className="pb-3 border-b border-border/10">
                <h3 className="font-semibold text-foreground text-lg">Live Index</h3>
                <p className="text-xs text-muted-foreground mt-1">Navigate tournament sections</p>
            </div>
            
            <div className="space-y-2">
                <Button 
                    variant="ghost" 
                    className="w-full justify-start h-11 hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                    onClick={() => scrollToRef(standingsRef)}
                >
                    <Icon name="Trophy" size={18} className="mr-3 text-primary"/>Live Standings
                </Button>
                
                {prizes.length > 0 && (
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start h-11 hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                        onClick={() => scrollToRef(prizesRef)}
                    >
                        <Icon name="Gift" size={18} className="mr-3 text-primary"/>Prizes
                    </Button>
                )}
                
                <div className="space-y-1">
                    <button 
                        onClick={() => setShowPairingsDropdown(!showPairingsDropdown)} 
                        className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 text-left h-11"
                    >
                        <div className="flex items-center space-x-3">
                            <Icon name="Swords" size={18} className="text-primary" />
                            <span>Pairings</span>
                        </div>
                        <Icon 
                            name="ChevronDown" 
                            size={16} 
                            className={cn('transition-transform duration-200 text-muted-foreground', showPairingsDropdown && 'rotate-180')} 
                        />
                    </button>
                    {showPairingsDropdown && (
                        <div className="pl-6 pt-1 pb-2 border-l border-border/20 ml-5 space-y-1">
                            {Object.keys(pairingsByRound).sort((a, b) => parseInt(b) - parseInt(a)).map(roundNum => (
                                <a 
                                    key={roundNum} 
                                    href={`#round-${roundNum}`} 
                                    onClick={(e) => { e.preventDefault(); scrollToRef({ current: document.getElementById(`round-${roundNum}`) }) }} 
                                    className="flex p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 text-sm"
                                >
                                    Round {roundNum}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
                
                <Button 
                    variant="ghost" 
                    className="w-full justify-start h-11 hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                    onClick={() => scrollToRef(statsRef)}
                >
                    <Icon name="BarChart2" size={18} className="mr-3 text-primary"/>Stats
                </Button>
                
                <Button 
                    variant="ghost" 
                    className="w-full justify-start h-11 hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                    onClick={() => scrollToRef(rosterRef)}
                >
                    <Icon name="Users" size={18} className="mr-3 text-primary"/>Roster
                </Button>
            </div>
            
            {tournament.is_remote_submission_enabled && (
                <div className="pt-4 border-t border-border/10">
                    <Button 
                        onClick={() => setShowSubmissionModal(true)} 
                        className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        <Icon name="Send" className="mr-2" size={18}/>
                        Submit Result
                    </Button>
                </div>
            )}
        </div>
    );



    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* TEST ELEMENT - This should definitely be visible */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 99999,
                background: 'red',
                color: 'white',
                padding: '20px',
                fontSize: '24px',
                fontWeight: 'bold',
                border: '5px solid yellow'
            }}>
                🚨 TEST ELEMENT - COMPONENT IS WORKING! 🚨
            </div>

            <Toaster position="top-center" richColors />
            <PlayerStatsModal player={selectedPlayer} results={results} onClose={() => setSelectedPlayer(null)} onSelectPlayer={(name) => setSelectedPlayer(players.find(p => p.name === name))} players={players} />
            <AnimatePresence>
                {showSubmissionModal && <ResultSubmissionModal tournament={tournament} players={players} onClose={() => setShowSubmissionModal(false)} />}
            </AnimatePresence>

            {/* Mobile Header - Center-aligned and Always Visible */}
            <header className="fixed top-0 left-0 right-0 z-[9999] bg-background border-b border-border/20">
                <div className="w-full px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1"></div>
                        <div className="flex-1 text-center">
                            <h1 className="text-xl font-bold text-blue-400 leading-tight truncate">{tournament.name}</h1>
                            <p className="text-sm text-muted-foreground leading-relaxed truncate mt-1">{tournament.venue} • {formattedDate}</p>
                        </div>
                        <div className="flex-1 flex justify-end">
                            <ThemeToggle variant="simple" />
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Mobile Bottom Navigation - Always Visible at Bottom */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9998] bg-background border-t border-border/20 pb-safe">
                <div className="px-4 py-3">
                    <div className={`grid gap-2 ${tournament.is_remote_submission_enabled ? 'grid-cols-6' : 'grid-cols-5'}`}>
                        <button 
                            onClick={() => scrollToRef(standingsRef)}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-muted/20 active:bg-muted/30 transition-colors touch-manipulation"
                            aria-label="Navigate to standings section"
                        >
                            <Icon name="Trophy" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Standings</span>
                        </button>
                        <button 
                            onClick={() => scrollToRef(pairingsRef)}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-muted/20 active:bg-muted/30 transition-colors touch-manipulation"
                            aria-label="Navigate to pairings section"
                        >
                            <Icon name="Swords" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Pairings</span>
                        </button>
                        <button 
                            onClick={() => scrollToRef(rosterRef)}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-muted/20 active:bg-muted/30 transition-colors touch-manipulation"
                            aria-label="Navigate to roster section"
                        >
                            <Icon name="Users" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Roster</span>
                        </button>
                        <button 
                            onClick={() => scrollToRef(statsRef)}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-muted/20 active:bg-muted/30 transition-colors touch-manipulation"
                            aria-label="Navigate to statistics section"
                        >
                            <Icon name="BarChart2" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Stats</span>
                        </button>
                        {tournament.is_remote_submission_enabled && (
                            <button 
                                onClick={() => setShowSubmissionModal(true)}
                                className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors touch-manipulation"
                                aria-label="Submit tournament result"
                            >
                                <Icon name="Send" size={20} className="text-primary mb-1"/>
                                <span className="text-xs font-medium text-foreground">Submit</span>
                            </button>
                        )}
                        <button 
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-muted/20 active:bg-muted/30 transition-colors touch-manipulation"
                            aria-label="Toggle theme"
                        >
                            <ThemeToggle variant="simple" className="!w-5 !h-5" />
                            <span className="text-xs font-medium text-foreground">Theme</span>
                        </button>
                    </div>
                </div>
            </nav>
            
            {/* Ticker - Fixed below header */}
            <div className="fixed top-16 left-0 right-0 z-[90] bg-background border-b border-border/20">
                <TournamentTicker messages={tickerMessages} />
            </div>
            
            {/* Main Content - Properly spaced for mobile */}
            <main className="pt-32 pb-20 lg:pt-28 lg:pb-10">
                <div className="w-full px-4 lg:px-6 lg:max-w-7xl lg:mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
                        <aside className="hidden lg:block lg:col-span-1 lg:sticky top-28 self-start">
                            <SidebarContent />
                        </aside>
                        <div className="lg:col-span-3 space-y-6">
                            <AnnouncementsDisplay />
                            
                            {/* Quick Actions Navigation */}
                            <PublicTournamentActions 
                                onAction={(action, title) => {
                                    switch (action) {
                                        case 'overview':
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                            break;
                                        case 'players':
                                            scrollToRef(rosterRef);
                                            break;
                                        case 'standings':
                                            scrollToRef(standingsRef);
                                            break;
                                        case 'pairings':
                                            scrollToRef(pairingsRef);
                                            break;
                                        case 'share':
                                            // Handle share action
                                            break;
                                        case 'export':
                                            // Handle export action
                                            break;
                                        case 'rules':
                                            // Handle rules action
                                            break;
                                        case 'rate':
                                            // Handle rating action
                                            break;
                                        default:
                                            break;
                                    }
                                }}
                                tournamentSlug={tournamentSlug}
                            />
                            
                            <section id="standings" ref={standingsRef}>
                                <div className="flex flex-col items-center mb-4">
                                    <h2 className="text-xl font-bold flex items-center mb-2">
                                        <Icon name="Trophy" className="mr-2 text-primary" size={20} />
                                        Live Standings
                                    </h2>
                                    <ShareButton
                                        variant="ghost"
                                        size="sm"
                                        shareData={{
                                            type: 'standings',
                                            data: {
                                                shareStandings: () => tournamentSharing.shareStandings(tournament, players, window.location.href)
                                            }
                                        }}
                                        platforms={['twitter', 'facebook', 'whatsapp', 'copy', 'native']}
                                    >
                                        Share
                                    </ShareButton>
                                </div>
                                {/* Debug: Show player data structure */}
                                {process.env.NODE_ENV === 'development' && (
                                  <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                                    <h4 className="font-bold mb-2">Debug Info:</h4>
                                    <p>Total players: {players.length}</p>
                                    <p>Players with photos: {players.filter(p => p.photo_url).length}</p>
                                    <p>Players with avatar_url: {players.filter(p => p.avatar_url).length}</p>
                                    <p>Sample player data:</p>
                                    <pre className="text-xs overflow-auto">
                                      {JSON.stringify(players.slice(0, 2).map(p => ({ 
                                        name: p.name, 
                                        photo_url: p.photo_url, 
                                        avatar_url: p.avatar_url,
                                        id: p.id,
                                        player_id: p.player_id
                                      })), null, 2)}
                                    </pre>
                                  </div>
                                )}
                                <StandingsTable 
                                    players={players} 
                                    tournamentType={tournament?.type} 
                                    isLoading={loading}
                                />
                            </section>

                            <section id="prizes" ref={prizesRef}>
                                <PrizeDisplay prizes={prizes} players={players} tournament={tournament} />
                            </section>
                            
                            <section id="stats" ref={statsRef}>
                                <h2 className="text-xl font-bold mb-4 flex items-center justify-center">
                                    <Icon name="BarChart2" className="mr-2 text-primary" size={20}/>Advanced Statistics
                                </h2>
                                <AdvancedStatsDisplay results={results} players={players} />
                            </section>

                            <section id="pairings" ref={pairingsRef}>
                                <div className="flex flex-col items-center mb-4">
                                    <h2 className="text-xl font-bold flex items-center mb-2">
                                        <Icon name="Swords" className="mr-2 text-primary" size={20}/>Pairings by Round
                                    </h2>
                                    <ShareButton
                                        variant="ghost"
                                        size="sm"
                                        shareData={{
                                            type: 'pairings',
                                            data: {
                                                sharePairings: () => {
                                                    const currentRound = Object.keys(pairingsByRound).sort((a, b) => parseInt(b) - parseInt(a))[0];
                                                    const currentPairings = pairingsByRound[currentRound] || [];
                                                    return tournamentSharing.sharePairings(tournament, currentRound, currentPairings, window.location.href);
                                                }
                                            }
                                        }}
                                        platforms={['twitter', 'facebook', 'whatsapp', 'copy', 'native']}
                                    >
                                        Share
                                    </ShareButton>
                                </div>
                                
                                <div className="space-y-4">
                                    {Object.keys(pairingsByRound).length > 0 ? (
                                        Object.keys(pairingsByRound).sort((a, b) => parseInt(b) - parseInt(a)).map(roundNum => {
                                            const roundPairings = pairingsByRound[roundNum];
                                            let tableCounter = 1; // Reset counter for each round
                                            
                                            return (
                                                <div key={roundNum} id={`round-${roundNum}`} className="bg-card border border-border/20 rounded-lg overflow-hidden">
                                                    <div className="bg-muted/20 px-4 py-3 border-b border-border/20">
                                                        <h3 className="font-semibold text-lg text-center">Round {roundNum}</h3>
                                                    </div>
                                                    <div className="p-4 space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {roundPairings.map(match => {
                                                            const player1Data = match.player1_id || match.player1;
                                                            const player2Data = match.player2_id || match.player2;
                                                            const currentTableNumber = tableCounter++; // Use consecutive table numbers
                                                            
                                                            const player1Name = typeof player1Data === 'object' ? player1Data.name : player1Data;
                                                            const player2Name = typeof player2Data === 'object' ? player2Data.name : player2Data;
                                                            
                                                            const player1 = players.find(p => 
                                                                p.player_id === player1Data || 
                                                                p.id === player1Data || 
                                                                p.player_id === parseInt(player1Data) ||
                                                                p.id === parseInt(player1Data) ||
                                                                p.name === player1Data ||
                                                                p.name === player1Name
                                                            );
                                                            const player2 = players.find(p => 
                                                                p.player_id === player2Data || 
                                                                p.id === player2Data || 
                                                                p.player_id === parseInt(player2Data) ||
                                                                p.id === parseInt(player2Data) ||
                                                                p.name === player2Data ||
                                                                p.name === player2Name
                                                            );
                                                            
                                                            return (
                                                                <motion.div 
                                                                    key={match.id || match.table || `${roundNum}-${currentTableNumber}`} 
                                                                    className="bg-card border border-border/20 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-primary/30"
                                                                    initial={{ opacity: 0, y: 20 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ duration: 0.3, delay: currentTableNumber * 0.1 }}
                                                                >
                                                                    <div className="flex items-center justify-center mb-4">
                                                                        <span className="text-sm font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-full font-semibold">
                                                                            Table {currentTableNumber}
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex-1 text-center group">
                                                                                <a 
                                                                                    href={`/players/${player1?.slug}`} 
                                                                                    onClick={(e) => handlePlayerClick(e, player1)} 
                                                                                    className="block p-3 rounded-lg hover:bg-muted/20 transition-colors duration-200"
                                                                                >
                                                                                    {/* Player 1 Avatar */}
                                                                                    <div className="flex justify-center mb-3">
                                                                                        <PlayerAvatar 
                                                                                            player={player1} 
                                                                                            size="lg" 
                                                                                            className="ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                                                                                        {player1?.name || player1Name || 'TBD'}
                                                                                    </div>
                                                                                    <div className="text-sm text-muted-foreground mt-1">
                                                                                        Seed #{player1?.seed || 'TBD'}
                                                                                    </div>
                                                                                    {player1?.rating && (
                                                                                        <div className="text-xs text-primary/70 mt-1 font-mono">
                                                                                            {player1.rating}
                                                                                        </div>
                                                                                    )}
                                                                                </a>
                                                                            </div>
                                                                            <div className="mx-4 flex-shrink-0">
                                                                                <div className="bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-2 rounded-full">
                                                                                    <span className="text-lg font-bold text-primary">VS</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex-1 text-center group">
                                                                                <a 
                                                                                    href={`/players/${player2?.slug}`} 
                                                                                    onClick={(e) => handlePlayerClick(e, player2)} 
                                                                                    className="block p-3 rounded-lg hover:bg-muted/20 transition-colors duration-200"
                                                                                >
                                                                                    {/* Player 2 Avatar */}
                                                                                    <div className="flex justify-center mb-3">
                                                                                        <PlayerAvatar 
                                                                                            player={player2} 
                                                                                            size="lg" 
                                                                                            className="ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                                                                                        {player2?.name || player2Name || 'TBD'}
                                                                                    </div>
                                                                                    <div className="text-sm text-muted-foreground mt-1">
                                                                                        Seed #{player2?.seed || 'TBD'}
                                                                                    </div>
                                                                                    {player2?.rating && (
                                                                                        <div className="text-xs text-primary/70 mt-1 font-mono">
                                                                                            {player2.rating}
                                                                                        </div>
                                                                                    )}
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
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

                            <section id="roster" ref={rosterRef}>
                                <div className="text-center mb-12">
                                    <h2 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center">
                                        <Icon name="Users" className="mr-4 text-primary" size={32}/>
                                        🚨 PLAYER ROSTER - TESTING CHANGES 🚨
                                    </h2>
                                    <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
                                        Meet the talented players competing in this tournament. Each player brings unique skills and strategies to the game.
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                                    {sortedRoster.map((p, index) => (
                                        <motion.div 
                                            key={p.id} 
                                            className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-10 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-primary/50 overflow-hidden"
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: index * 0.15 }}
                                        >
                                            {/* Player Avatar */}
                                            <div className="flex justify-center mb-8">
                                                <div className="relative">
                                                    <PlayerAvatar 
                                                        player={p} 
                                                        size="2xl" 
                                                        className="ring-8 ring-primary/20 group-hover:ring-primary/40 transition-all duration-500 shadow-2xl group-hover:shadow-primary/25"
                                                    />
                                                    {/* Player Number Badge */}
                                                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                                                        #{index + 1}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Player Info */}
                                            <div className="space-y-6 text-center">
                                                <div>
                                                    <a 
                                                        href={`/players/${p.slug}`} 
                                                        onClick={(e) => handlePlayerClick(e, p)} 
                                                        className="font-bold text-2xl text-gray-900 dark:text-white hover:text-primary transition-colors block truncate group-hover:scale-105"
                                                    >
                                                        {p.name}
                                                    </a>
                                                </div>
                                                
                                                {/* Team Info */}
                                                {tournament.type === 'team' && p.team_id && (
                                                    <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-accent/20 to-accent/10 border-2 border-accent/30 rounded-full text-sm font-semibold text-accent">
                                                        <Icon name="Shield" size={16} className="mr-2" />
                                                        {teamMap.get(p.team_id) || 'Unknown Team'}
                                                    </div>
                                                )}
                                                
                                                {/* Seed Info */}
                                                {p.seed && (
                                                    <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        <Icon name="Star" size={14} className="mr-2" />
                                                        Seed #{p.seed}
                                                    </div>
                                                )}
                                                
                                                {/* Rating */}
                                                <div className="pt-4">
                                                    <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary/30 rounded-full shadow-lg">
                                                        <Icon name="TrendingUp" size={18} className="mr-3 text-primary" />
                                                        <span className="text-2xl font-bold text-primary">
                                                            {p.rating}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Stats Summary */}
                                                <div className="grid grid-cols-3 gap-4 pt-4">
                                                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                                        <div className="text-xl font-bold text-green-600 dark:text-green-400">{p.wins || 0}</div>
                                                        <div className="text-sm text-green-700 dark:text-green-300 font-medium">Wins</div>
                                                    </div>
                                                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                                        <div className="text-xl font-bold text-red-600 dark:text-red-400">{p.losses || 0}</div>
                                                        <div className="text-sm text-red-700 dark:text-red-300 font-medium">Losses</div>
                                                    </div>
                                                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{p.ties || 0}</div>
                                                        <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Draws</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                
                                {/* Empty State */}
                                {sortedRoster.length === 0 && (
                                    <div className="text-center py-20">
                                        <Icon name="Users" size={80} className="mx-auto text-gray-400 dark:text-gray-500 mb-6" />
                                        <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-3">No Players Found</h3>
                                        <p className="text-gray-500 dark:text-gray-500 text-lg">The tournament roster is currently empty.</p>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            {/* Desktop Floating Share Button */}
            <div className="hidden lg:block fixed bottom-6 right-6 z-50">
                <ShareButton
                    variant="default"
                    size="default"
                    shareData={{
                        type: 'tournament',
                        data: {
                            shareTournament: () => tournamentSharing.shareTournament(tournament, window.location.href, players)
                        }
                    }}
                    platforms={['twitter', 'facebook', 'whatsapp', 'copy', 'native']}
                    position="top-left"
                    className="shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                    <Icon name="Share2" size={20} />
                </ShareButton>
            </div>
        </div>
    );
};

export default PublicTournamentPage;