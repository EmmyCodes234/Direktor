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
    const isMobile = !useMediaQuery('(min-width: 1024px)');

    // Simple recalculate ranks function
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
                .select('*, players(id, name, rating, slug)')
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
                rank: p.rank
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
        if (player?.slug) {
            navigate(`/players/${player.slug}`);
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

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
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

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Toaster position="top-center" richColors />
            <PlayerStatsModal player={selectedPlayer} results={results} onClose={() => setSelectedPlayer(null)} onSelectPlayer={(name) => setSelectedPlayer(players.find(p => p.name === name))} players={players} />
            <AnimatePresence>
                {showSubmissionModal && <ResultSubmissionModal tournament={tournament} players={players} onClose={() => setShowSubmissionModal(false)} />}
            </AnimatePresence>

            {/* Mobile Header */}
            <header className="fixed top-0 left-0 right-0 z-[9999] bg-background border-b border-border/20">
                <div className="w-full px-4 py-4">
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-blue-400 leading-tight truncate">{tournament.name}</h1>
                        <p className="text-sm text-muted-foreground leading-relaxed truncate mt-1">{tournament.venue} • {formattedDate}</p>
                    </div>
                </div>
            </header>
            
            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9998] bg-background border-t border-border/20 pb-safe">
                <div className="px-4 py-3">
                    <div className={`grid gap-2 ${tournament.is_remote_submission_enabled ? 'grid-cols-5' : 'grid-cols-4'}`}>
                        <button 
                            onClick={() => scrollToRef({ current: document.getElementById('standings') })}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-muted/20 active:bg-muted/30 transition-colors touch-manipulation"
                        >
                            <Icon name="Trophy" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Standings</span>
                        </button>
                        <button 
                            onClick={() => scrollToRef({ current: document.getElementById('pairings') })}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-muted/20 active:bg-muted/30 transition-colors touch-manipulation"
                        >
                            <Icon name="Swords" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Pairings</span>
                        </button>
                        <button 
                            onClick={() => scrollToRef({ current: document.getElementById('roster') })}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-muted/20 active:bg-muted/30 transition-colors touch-manipulation"
                        >
                            <Icon name="Users" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Roster</span>
                        </button>
                        <button 
                            onClick={() => scrollToRef({ current: document.getElementById('stats') })}
                            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-muted/20 active:bg-muted/30 transition-colors touch-manipulation"
                        >
                            <Icon name="BarChart2" size={20} className="text-primary mb-1"/>
                            <span className="text-xs font-medium text-foreground">Stats</span>
                        </button>
                        {tournament.is_remote_submission_enabled && (
                            <button 
                                onClick={() => setShowSubmissionModal(true)}
                                className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors touch-manipulation"
                            >
                                <Icon name="Send" size={20} className="text-primary mb-1"/>
                                <span className="text-xs font-medium text-foreground">Submit</span>
                            </button>
                        )}
                    </div>
                </div>
            </nav>
            
            {/* Ticker */}
            <div className="fixed top-20 left-0 right-0 z-[90] bg-background border-b border-border/20">
                <TournamentTicker messages={tickerMessages} />
            </div>
            
            {/* Main Content */}
            <main className="pt-32 pb-20 lg:pt-28 lg:pb-10">
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
                                                                <a href={`/players/${player1?.slug}`} onClick={(e) => handlePlayerClick(e, player1)} className="flex-1 text-center hover:underline">
                                                                    <div className="font-medium text-base">{player1Name}</div>
                                                                    <div className="text-sm text-muted-foreground">Seed #{player1?.seed || 'TBD'}</div>
                                                                </a>
                                                                <div className="mx-4">
                                                                    <span className="text-lg font-bold text-muted-foreground bg-muted/20 px-3 py-1 rounded">VS</span>
                                                                </div>
                                                                <a href={`/players/${player2?.slug}`} onClick={(e) => handlePlayerClick(e, player2)} className="flex-1 text-center hover:underline">
                                                                    <div className="font-medium text-base">{player2Name}</div>
                                                                    <div className="text-sm text-muted-foreground">Seed #{player2?.seed || 'TBD'}</div>
                                                                </a>
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
                            <h2 className="text-xl font-bold mb-4 flex items-center justify-center">
                                <Icon name="Users" className="mr-2 text-primary" size={20}/>Player Roster
                            </h2>
                            <div className="bg-card border border-border/20 rounded-lg overflow-hidden">
                                <div className="divide-y divide-border/20">
                                    {sortedRoster.map((p, index) => (
                                        <div key={p.id} className="p-4">
                                            <div className="flex items-center justify-center space-x-4">
                                                <span className="text-sm font-mono text-muted-foreground bg-muted/20 px-2 py-1 rounded">{index + 1}</span>
                                                <div className="text-center">
                                                    <a href={`/players/${p.slug}`} onClick={(e) => handlePlayerClick(e, p)} className="font-medium hover:underline text-base">{p.name}</a>
                                                    {tournament.type === 'team' && p.team_id && (
                                                        <div className="text-sm text-accent">{teamMap.get(p.team_id) || 'Unknown Team'}</div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-mono text-muted-foreground bg-primary/10 px-2 py-1 rounded">{p.rating}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
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

export default PublicTournamentPageNew;
