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

const StatCard = ({ icon, label, value, subtext, color = 'text-primary' }) => (
    <div className="glass-card p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
            <Icon name={icon} size={20} className={cn(color, "sm:w-6 sm:h-6")} />
            <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl font-bold font-mono">{value}</p>
                <p className="text-xs sm:text-sm text-foreground font-medium truncate">{label}</p>
                {subtext && <p className="text-xs text-muted-foreground truncate">{subtext}</p>}
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

    // Fetch and refresh public data
    const fetchPublicData = useCallback(async () => {
        if (!tournamentSlug) { setLoading(false); return; }
        setLoading(true);
        try {
            const { data: tournamentData, error: tErr } = await supabase
                .from('tournaments')
                .select(`*`)
                .eq('slug', tournamentSlug)
                .single();
            if (tErr || !tournamentData) throw tErr || new Error("Tournament not found");
            setTournament(tournamentData);
            const { data: tournamentPlayersData, error: tpError } = await supabase
                .from('tournament_players')
                .select(`*, players(id, name, rating, photo_url, slug)`)
                .eq('tournament_id', tournamentData.id);
            if (tpError) throw tpError;
            const combinedPlayers = tournamentPlayersData.map(tp => ({
                ...tp.players,
                ...tp
            }));
            const [{ data: resultsData }, {data: teamsData}, {data: prizesData}, {data: matchesData}] = await Promise.all([
                supabase.from('results').select('*').eq('tournament_id', tournamentData.id).order('created_at', { ascending: false }),
                supabase.from('teams').select('id, name').eq('tournament_id', tournamentData.id),
                supabase.from('prizes').select('*').eq('tournament_id', tournamentData.id).order('rank', { ascending: true }),
                supabase.from('matches').select('*').eq('tournament_id', tournamentData.id).order('round', { ascending: true })
            ]);
            setPlayers(recalculateRanks(combinedPlayers, tournamentData.type, resultsData || [], matchesData || []));
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

    // Initial fetch
    useEffect(() => {
        fetchPublicData();
    }, [fetchPublicData]);

    // Real-time updates
    useEffect(() => {
        if (!tournament) return;
        const channel = supabase.channel(`public-tournament-updates-${tournament.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'results', filter: `tournament_id=eq.${tournament.id}` }, fetchPublicData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_players', filter: `tournament_id=eq.${tournament.id}` }, fetchPublicData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournament.id}` }, fetchPublicData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournament.id}` }, fetchPublicData)
            .subscribe();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [tournament, fetchPublicData]);

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
            return tournament?.pairing_schedule || {};
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

    const scrollToRef = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth' });
    
    const sortedRoster = useMemo(() => {
        return [...players].sort((a, b) => {
            if (a.team_id < b.team_id) return -1;
            if (a.team_id > b.team_id) return 1;
            return (a.seed || 0) - (b.seed || 0);
        });
    }, [players]);

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading Tournament Portal...</p></div>;
    if (!tournament) return <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4"><Icon name="SearchX" size={64} className="text-destructive opacity-50 mb-4" /><h1 className="text-2xl font-heading font-bold text-foreground">Tournament Not Found</h1></div>;
    
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

            <Toaster position="top-center" richColors />
            <PlayerStatsModal player={selectedPlayer} results={results} onClose={() => setSelectedPlayer(null)} onSelectPlayer={(name) => setSelectedPlayer(players.find(p => p.name === name))} players={players} />
            <AnimatePresence>
                {showSubmissionModal && <ResultSubmissionModal tournament={tournament} players={players} onClose={() => setShowSubmissionModal(false)} />}
            </AnimatePresence>
            <header className="fixed top-0 left-0 right-0 z-[9999] bg-background/95 backdrop-blur-sm shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 text-blue-400 leading-tight">{tournament.name}</h1>
                        <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground leading-relaxed">{tournament.venue} • {formattedDate}</p>
                    </div>
                </div>
            </header>
            
            {/* Mobile Navigation Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-[9998] bg-background/95 backdrop-blur-sm border-b border-border/10" style={{ top: 'calc(4rem + 1px)' }}>
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-9 px-2 text-xs touch-manipulation"
                                onClick={() => scrollToRef(standingsRef)}
                            >
                                <Icon name="Trophy" size={14} className="mr-1"/>Standings
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-9 px-2 text-xs touch-manipulation"
                                onClick={() => scrollToRef(pairingsRef)}
                            >
                                <Icon name="Swords" size={14} className="mr-1"/>Pairings
                            </Button>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-9 px-2 text-xs touch-manipulation"
                                onClick={() => scrollToRef(rosterRef)}
                            >
                                <Icon name="Users" size={14} className="mr-1"/>Roster
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-9 px-2 text-xs touch-manipulation"
                                onClick={() => scrollToRef(statsRef)}
                            >
                                <Icon name="BarChart2" size={14} className="mr-1"/>Stats
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Ticker sits below mobile nav, sticky, always visible */}
            <div className="sticky z-[90] w-full bg-background/95 backdrop-blur-sm border-b border-border/10" style={{ top: 'calc(7rem + 1px)' }}>
                <TournamentTicker messages={tickerMessages} />
            </div>
            
            <main className="pt-24 sm:pt-28 lg:pt-32 pb-20 lg:pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                        <aside className="hidden lg:block lg:col-span-1 lg:sticky top-32 self-start">
                            <SidebarContent />
                        </aside>
                        <div className="lg:col-span-3 space-y-12 lg:space-y-16">
                            <AnnouncementsDisplay />
                            <section id="standings" ref={standingsRef}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                    <h2 className="font-heading text-xl sm:text-2xl font-semibold flex items-center">
                                        <Icon name="Trophy" className="mr-2 sm:mr-3 text-primary" size={20} />
                                        Live Standings
                                    </h2>
                                    <div className="flex justify-end">
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
                                            Share Standings
                                        </ShareButton>
                                    </div>
                                </div>
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
                                <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-4 flex items-center">
                                    <Icon name="BarChart2" className="mr-2 sm:mr-3 text-primary" size={20}/>Advanced Statistics
                                </h2>
                                <AdvancedStatsDisplay results={results} players={players} />
                            </section>

                            <section id="pairings" ref={pairingsRef}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                    <h2 className="font-heading text-xl sm:text-2xl font-semibold flex items-center">
                                        <Icon name="Swords" className="mr-2 sm:mr-3 text-primary" size={20}/>Pairings by Round
                                    </h2>
                                    <div className="flex justify-end">
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
                                            Share Pairings
                                        </ShareButton>
                                    </div>
                                </div>
                                <div className="space-y-6 lg:space-y-8">
                                    {Object.keys(pairingsByRound).sort((a, b) => parseInt(b) - parseInt(a)).map(roundNum => (
                                        <div key={roundNum} id={`round-${roundNum}`} className="glass-card">
                                            <h3 className="p-3 sm:p-4 border-b border-border font-semibold text-base sm:text-lg">Round {roundNum}</h3>
                                            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                                                {pairingsByRound[roundNum].map(pairing => {
                                                    const player1 = players.find(p => p.player_id === pairing.player1_id);
                                                    const player2 = players.find(p => p.player_id === pairing.player2_id);
                                                    
                                                    return (
                                                        <div key={pairing.id || pairing.table} className="p-2 sm:p-3 bg-muted/20 rounded-lg flex flex-col sm:grid sm:grid-cols-12 gap-2 items-center font-mono text-xs sm:text-sm lg:text-base">
                                                            <div className="flex justify-between sm:justify-center sm:col-span-1 mb-1 sm:mb-0">
                                                                <span className="font-bold text-primary">Table {pairing.round || pairing.table}</span>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row sm:justify-end sm:col-span-5 sm:items-center">
                                                                <a href={`/players/${player1?.slug}`} onClick={(e) => handlePlayerClick(e, player1)} className="hover:underline text-right text-sm sm:text-base">
                                                                    <span className="font-medium">{player1?.name}</span>
                                                                    <span className="text-muted-foreground ml-1">(#{player1?.seed})</span>
                                                                </a>
                                                            </div>
                                                            <div className="flex justify-center sm:col-span-2 py-1">
                                                                <span className="font-semibold text-muted-foreground text-sm">vs.</span>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row sm:justify-start sm:col-span-4 sm:items-center">
                                                                <a href={`/players/${player2?.slug}`} onClick={(e) => handlePlayerClick(e, player2)} className="hover:underline text-left text-sm sm:text-base">
                                                                    <span className="font-medium">{player2?.name}</span>
                                                                    {player2 && <span className="text-muted-foreground ml-1">(#{player2?.seed})</span>}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="roster" ref={rosterRef}>
                                <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-4 flex items-center">
                                    <Icon name="Users" className="mr-2 sm:mr-3 text-primary" size={20}/>Player Roster
                                </h2>
                                <div className="glass-card p-3 sm:p-4">
                                    <div className="divide-y divide-border">
                                        {sortedRoster.map((p, index) => (
                                            <div key={p.id} className="p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                                <div className="flex items-center space-x-3 sm:space-x-4">
                                                    <span className="font-mono text-muted-foreground w-6 text-right text-sm">{index + 1}.</span>
                                                    <div className="min-w-0 flex-1">
                                                        <a href={`/players/${p.slug}`} onClick={(e) => handlePlayerClick(e, p)} className="font-medium hover:underline text-sm sm:text-base truncate block">{p.name}</a>
                                                        {tournament.type === 'team' && p.team_id && (
                                                            <p className="text-xs text-accent mt-1">{teamMap.get(p.team_id) || 'Unknown Team'}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-end sm:justify-start">
                                                    <span className="text-muted-foreground text-xs sm:text-sm font-mono bg-muted/20 px-2 py-1 rounded">{p.rating}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            {/* Floating Share Button - Hidden on mobile to avoid conflicts */}
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
            
            {/* Mobile Action Bar with Share Button */}
            {isMobile && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/10 p-4 z-40">
                    <div className="flex items-center justify-between gap-3">
                        {tournament.is_remote_submission_enabled && (
                            <Button 
                                onClick={() => setShowSubmissionModal(true)} 
                                className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                            >
                                <Icon name="Send" className="mr-2" size={18}/>
                                Submit Result
                            </Button>
                        )}
                        <ShareButton
                            variant="outline"
                            size="default"
                            shareData={{
                                type: 'tournament',
                                data: {
                                    shareTournament: () => tournamentSharing.shareTournament(tournament, window.location.href, players)
                                }
                            }}
                            platforms={['twitter', 'facebook', 'whatsapp', 'copy', 'native']}
                            position="top-left"
                            className="h-12 px-4"
                        >
                            <Icon name="Share2" size={18} className="mr-2" />
                            Share
                        </ShareButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicTournamentPage;