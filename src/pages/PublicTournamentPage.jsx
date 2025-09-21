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
    const { tournamentSlug } = useParams();
    console.log('🔍 DEBUG: Tournament slug from useParams:', tournamentSlug);
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
        console.log('🔍 DEBUG: Recalculating ranks with:', {
            playerCount: playerList?.length,
            tournamentType,
            resultsCount: resultsList?.length,
            matchesCount: matchesList?.length,
            playerList: playerList?.map(p => ({ name: p.name, player_id: p.player_id, seed: p.seed })),
            resultsList: resultsList?.slice(0, 5), // First 5 results for debugging
            matchesList: matchesList?.slice(0, 5)  // First 5 matches for debugging
        });
        
        
        if (!playerList) return [];
        let enrichedPlayers = playerList;
        
        if (tournamentType === 'best_of_league') {
            // Use best_of_value from tournament settings if available, else default to 15
            const bestOf = tournament?.best_of_value ? parseInt(tournament.best_of_value, 10) : 15;
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
                let match_wins = 0;
                let match_losses = 0;
                let wins = 0, losses = 0, ties = 0, spread = 0;
                
                // Calculate per-game stats from results (same as dashboard)
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
                
                // Calculate match_wins and match_losses: for each match-up, determine who won the majority
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
                    // Determine match winner and update stats
                    if (id1 === player.player_id) {
                        if (p1Wins >= majority) match_wins++;
                        else if (p2Wins >= majority) match_losses++;
                    }
                    if (id2 === player.player_id) {
                        if (p2Wins >= majority) match_wins++;
                        else if (p1Wins >= majority) match_losses++;
                    }
                });
                
                return {
                    ...player,
                    wins,
                    losses,
                    ties,
                    spread,
                    match_wins,
                    match_losses
                };
            });
        } else {
            // For individual tournaments, calculate stats directly from results (same as dashboard)
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
        
        // Sort players using the same logic as the dashboard
        const ranked = [...enrichedPlayers].sort((a, b) => {
            if (tournamentType === 'best_of_league') {
                const aMatchWins = typeof a.match_wins === 'string' ? parseInt(a.match_wins || 0, 10) : (a.match_wins || 0);
                const bMatchWins = typeof b.match_wins === 'string' ? parseInt(b.match_wins || 0, 10) : (b.match_wins || 0);
                if (aMatchWins !== bMatchWins) return bMatchWins - aMatchWins;
            }
            
            // Primary sort: Game wins + 0.5 * ties (same as dashboard)
            const aGameScore = (a.wins || 0) + (a.ties || 0) * 0.5;
            const bGameScore = (b.wins || 0) + (b.ties || 0) * 0.5;
            if (aGameScore !== bGameScore) return bGameScore - aGameScore;
            
            // Secondary sort: Spread (same as dashboard)
            if ((a.spread || 0) !== (b.spread || 0)) return (b.spread || 0) - (a.spread || 0);
            
            // Tertiary sort: Head-to-head (same as dashboard)
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
            
            // Quaternary sort: Higher seed (lower number) (same as dashboard)
            return (a.seed || 999) - (b.seed || 999);
        }).map((player, index) => ({ ...player, rank: index + 1 }));

        console.log('🏆 DEBUG: Final standings:', ranked.map(p => ({
            name: p.name,
            rank: p.rank,
            wins: p.wins,
            losses: p.losses,
            ties: p.ties,
            spread: p.spread,
            match_wins: tournamentType === 'best_of_league' ? p.match_wins : undefined,
            match_losses: tournamentType === 'best_of_league' ? p.match_losses : undefined,
            gameScore: (p.wins || 0) + (p.ties || 0) * 0.5
        })));

        return ranked;
    }, [tournament]);

    // Fetch and refresh public data - Updated to match dashboard approach
    const fetchPublicData = useCallback(async () => {
        if (!tournamentSlug) { 
            setLoading(false); 
            return; 
        }
        
        setLoading(true);
        
        try {
            console.log('🔍 DEBUG: Fetching public data for tournament:', tournamentSlug);
            
            // Fetch tournament data with players
            const { data: tournamentData, error: tErr } = await supabase
                .from('tournaments')
                .select(`*, tournament_players(*, players(id, name, rating, photo_url, slug))`)
                .eq('slug', tournamentSlug)
                .eq('status', 'published') // Only fetch published tournaments
                .single();

            if (tErr || !tournamentData) {
                console.error("Error fetching tournament data:", tErr);
                throw tErr || new Error("Tournament not found");
            }
            
            console.log('🏆 DEBUG: Tournament data:', {
                name: tournamentData.name,
                type: tournamentData.type,
                pairing_schedule: tournamentData.pairing_schedule,
                id: tournamentData.id
            });

            // Combine players with their tournament data
            const combinedPlayers = tournamentData.tournament_players.map(tp => ({
                ...tp.players,
                ...tp,
                player_id: tp.players.id  // Ensure player_id is set correctly
            }));
            
            console.log('👥 DEBUG: Combined players:', combinedPlayers.map(p => ({
                name: p.name,
                player_id: p.player_id,
                seed: p.seed
            })));

            setTournament(tournamentData);

            // Fetch all related data in parallel
            const [{ data: resultsData }, { data: teamsData }, { data: prizesData }, { data: matchesData }, { data: photosData }] = await Promise.all([
                supabase.from('results').select('*').eq('tournament_id', tournamentData.id).order('created_at', { ascending: false }),
                supabase.from('teams').select('*').eq('tournament_id', tournamentData.id),
                supabase.from('prizes').select('*').eq('tournament_id', tournamentData.id).order('rank', { ascending: true }),
                supabase.from('matches').select('*').eq('tournament_id', tournamentData.id).order('round', { ascending: true }),
                supabase.from('player_photos').select('*').eq('tournament_id', tournamentData.id)
            ]);
            
            console.log('📊 DEBUG: Fetched data:', {
                resultsCount: resultsData?.length,
                teamsCount: teamsData?.length,
                prizesCount: prizesData?.length,
                matchesCount: matchesData?.length,
                photosCount: photosData?.length
            });

            // Combine players with their photos
            const playersWithPhotos = combinedPlayers.map(player => {
                // First check if we have a photo from the player_photos table
                const photoFromTable = photosData?.find(p => p.player_id === player.player_id);
                
                // Use photo from player_photos table, then player.photo_url, then null
                return {
                    ...player,
                    photo_url: photoFromTable?.photo_url || player.photo_url || null
                };
            });

            // For best_of_league tournaments, also check matches for embedded results
            let embeddedResults = [];
            if (tournamentData.type === 'best_of_league' && matchesData && matchesData.length > 0) {
                embeddedResults = matchesData
                    .filter(match => match.is_complete && (match.player1_wins !== null || match.player2_wins !== null))
                    .map(match => ({
                        id: `match-${match.id}`,
                        tournament_id: match.tournament_id,
                        round: match.round,
                        player1_id: match.player1_id,
                        player2_id: match.player2_id,
                        score1: match.player1_wins || 0,
                        score2: match.player2_wins || 0,
                        created_at: match.created_at,
                        updated_at: match.updated_at,
                        is_from_matches: true
                    }));
            }
            
            // Combine results from both sources
            const allResults = [...(resultsData || []), ...embeddedResults];
            
            console.log('🔄 DEBUG: All results:', allResults);

            const rankedPlayers = recalculateRanks(playersWithPhotos, tournamentData.type, allResults, matchesData || []);
            console.log('🏅 DEBUG: Ranked players:', rankedPlayers.map(p => ({
                name: p.name,
                rank: p.rank,
                wins: p.wins,
                match_wins: p.match_wins
            })));

            setPlayers(rankedPlayers);
            setResults(allResults);
            setTeams(teamsData || []);
            setPrizes(prizesData || []);
            setMatches(matchesData || []);

        } catch (error) {
            console.error("Error fetching public data:", error);
            toast.error("Failed to load tournament data.");
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
        console.log('🔍 DEBUG: Calculating pairingsByRound with:', {
            tournamentType: tournament?.type,
            pairingSchedule: tournament?.pairing_schedule,
            matchesCount: matches?.length,
            matchesData: matches
        });
        
        if (tournament?.type !== 'best_of_league') {
            // For individual tournaments, try to get pairings from tournament pairing_schedule first
            if (tournament?.pairing_schedule && Object.keys(tournament.pairing_schedule).length > 0) {
                console.log('📋 Using tournament pairing_schedule:', tournament.pairing_schedule);
                return tournament.pairing_schedule;
            }
            // Fallback to matches if pairing_schedule is not available
            if (matches && matches.length > 0) {
                console.log('🎯 Fallback to matches for pairings');
                return matches.reduce((acc, match) => {
                    if (!acc[match.round]) {
                        acc[match.round] = [];
                    }
                    acc[match.round].push(match);
                    return acc;
                }, {});
            }
            console.log('❌ No pairing data available');
            return {};
        }
        
        // For best_of_league tournaments, use matches table
        console.log('🏆 Using matches for best_of_league pairings');
        if (matches && matches.length > 0) {
            const result = matches.reduce((acc, match) => {
                if (!acc[match.round]) {
                    acc[match.round] = [];
                }
                acc[match.round].push(match);
                return acc;
            }, {});
            console.log('🏆 Pairings by round for best_of_league:', result);
            return result;
        }
        console.log('❌ No matches data available for best_of_league');
        return {};
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
            
            {/* Main Content - Properly spaced for mobile - increased top padding to account for ticker */}
            <main className="pt-48 pb-20 lg:pt-44 lg:pb-10">
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
                                {(() => {
                                    console.log('🔍 DEBUG: StandingsTable props:', {
                                        playersCount: players?.length,
                                        tournamentType: tournament?.type,
                                        isLoading: loading,
                                        players: players?.slice(0, 5) // First 5 players for debugging
                                    });
                                    return null;
                                })()}
                                <StandingsTable 
                                    players={players} 
                                    tournamentType={tournament?.type} 
                                    isLoading={loading}
                                    tournament={tournament}
                                    results={results}
                                    onPlayerClick={setSelectedPlayer}
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
                                    {(() => {
                                        console.log('🔍 DEBUG: Rendering pairings with:', {
                                            pairingsByRoundKeys: Object.keys(pairingsByRound),
                                            pairingsByRound: pairingsByRound
                                        });
                                        return null;
                                    })()}
                                    {Object.keys(pairingsByRound).length > 0 ? (
                                        Object.keys(pairingsByRound).sort((a, b) => parseInt(b) - parseInt(a)).map(roundNum => {
                                            const roundPairings = pairingsByRound[roundNum];
                                            let tableCounter = 1; // Reset counter for each round
                                            
                                            console.log('🔍 DEBUG: Rendering round:', {
                                                roundNum,
                                                pairingsCount: roundPairings?.length,
                                                pairings: roundPairings
                                            });
                                            
                                            return (
                                                <div key={roundNum} id={`round-${roundNum}`} className="bg-card border border-border/20 rounded-lg overflow-hidden">
                                                    <div className="bg-muted/20 px-4 py-3 border-b border-border/20">
                                                        <h3 className="font-semibold text-lg text-center">Round {roundNum}</h3>
                                                    </div>
                                                    <div className="p-4 space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {roundPairings.map(match => {
                                                            const currentTableNumber = tableCounter++; // Use consecutive table numbers
                                                            
                                                            console.log('🔍 DEBUG: Rendering match:', {
                                                                match,
                                                                tournamentType: tournament?.type,
                                                                currentTableNumber
                                                            });
                                                            
                                                            // For best_of_league tournaments, we have match data directly
                                                            if (tournament?.type === 'best_of_league') {
                                                                const player1 = players.find(p => p.player_id === match.player1_id);
                                                                const player2 = players.find(p => p.player_id === match.player2_id);
                                                                
                                                                console.log('🔍 DEBUG: Best of league match players:', {
                                                                    player1: player1?.name,
                                                                    player2: player2?.name,
                                                                    player1Id: match.player1_id,
                                                                    player2Id: match.player2_id
                                                                });
                                                                
                                                                return (
                                                                    <motion.div 
                                                                        key={match.id || `${roundNum}-${currentTableNumber}`} 
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
                                                                                            {player1?.name || 'TBD'}
                                                                                        </div>
                                                                                        <div className="text-sm text-muted-foreground mt-1">
                                                                                            Seed #{player1?.seed || 'TBD'}
                                                                                        </div>
                                                                                        {player1?.rating && (
                                                                                            <div className="text-xs text-primary/70 mt-1 font-mono">
                                                                                                {player1.rating}
                                                                                            </div>
                                                                                        )}
                                                                                        {/* Show match wins for best of league */}
                                                                                        {match.player1_wins !== undefined && (
                                                                                            <div className="text-xs text-green-600 mt-1 font-semibold">
                                                                                                Wins: {match.player1_wins}
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
                                                                                            {player2?.name || 'TBD'}
                                                                                        </div>
                                                                                        <div className="text-sm text-muted-foreground mt-1">
                                                                                            Seed #{player2?.seed || 'TBD'}
                                                                                        </div>
                                                                                        {player2?.rating && (
                                                                                            <div className="text-xs text-primary/70 mt-1 font-mono">
                                                                                                {player2.rating}
                                                                                            </div>
                                                                                        )}
                                                                                        {/* Show match wins for best of league */}
                                                                                        {match.player2_wins !== undefined && (
                                                                                            <div className="text-xs text-green-600 mt-1 font-semibold">
                                                                                                Wins: {match.player2_wins}
                                                                                            </div>
                                                                                        )}
                                                                                    </a>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {/* Show match status for best of league */}
                                                                        {match.status && (
                                                                            <div className="mt-3 text-center">
                                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${match.status === 'complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                                    {match.status === 'complete' ? 'Complete' : 'In Progress'}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </motion.div>
                                                                );
                                                            } else {
                                                                // For other tournament types - handle different data structures
                                                                let player1, player2;
                                                                
                                                                // Check if this is from matches table (has player IDs)
                                                                if (match.player1_id && match.player2_id) {
                                                                    player1 = players.find(p => p.player_id === match.player1_id);
                                                                    player2 = players.find(p => p.player_id === match.player2_id);
                                                                } 
                                                                // Handle pairing_schedule format
                                                                else if (match.player1?.name && match.player2?.name) {
                                                                    // If pairing has generic names like "Player 1", map by position
                                                                    if (match.player1.name.startsWith('Player ')) {
                                                                        const player1Num = parseInt(match.player1.name.split(' ')[1]);
                                                                        const player2Num = parseInt(match.player2.name.split(' ')[1]);
                                                                        
                                                                        // Map by seed/position (assuming players are ordered by seed)
                                                                        const sortedPlayers = [...players].sort((a, b) => (a.seed || 999) - (b.seed || 999));
                                                                        player1 = sortedPlayers[player1Num - 1];
                                                                        player2 = sortedPlayers[player2Num - 1];
                                                                    } else {
                                                                        // Try to find by actual name
                                                                        player1 = players.find(p => p.name === match.player1.name);
                                                                        player2 = players.find(p => p.name === match.player2.name);
                                                                    }
                                                                }
                                                                
                                                                console.log('🔍 DEBUG: Regular tournament match players:', {
                                                                    player1: player1?.name,
                                                                    player2: player2?.name,
                                                                    matchData: match,
                                                                    hasPlayerIds: !!(match.player1_id && match.player2_id),
                                                                    hasPlayerNames: !!(match.player1?.name && match.player2?.name)
                                                                });
                                                                
                                                                // Simple debug alert for first match only
                                                                if (currentTableNumber === 1) {
                                                                    alert(`Debug Info:
Match Data: ${JSON.stringify(match, null, 2)}
Players Count: ${players.length}
First Player: ${players[0]?.name || 'none'}
Player1 Found: ${player1?.name || 'none'}
Player2 Found: ${player2?.name || 'none'}`);
                                                                }
                                                                
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
                                                                                            {player1?.name || 'TBD'}
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
                                                                                            {player2?.name || 'TBD'}
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
                                                            }
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
                                                Pairings for this tournament will be available once the tournament begins.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                            
                            <section id="roster" ref={rosterRef}>
                                <div className="flex flex-col items-center mb-4">
                                    <h2 className="text-xl font-bold flex items-center mb-2">
                                        <Icon name="Users" className="mr-2 text-primary" size={20} />
                                        Player Roster
                                    </h2>
                                    <ShareButton
                                        variant="ghost"
                                        size="sm"
                                        shareData={{
                                            type: 'roster',
                                            data: {
                                                shareRoster: () => tournamentSharing.shareRoster(tournament, players, window.location.href)
                                            }
                                        }}
                                        platforms={['twitter', 'facebook', 'whatsapp', 'copy', 'native']}
                                    >
                                        Share
                                    </ShareButton>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sortedRoster.map((player, index) => (
                                        <motion.div
                                            key={player.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ y: -5 }}
                                            className="bg-card border border-border/20 rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer touch-target"
                                            onClick={(e) => handlePlayerClick(e, player)}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <PlayerAvatar player={player} size="lg" />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-foreground truncate">{player.name}</h3>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        {player.seed && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                                Seed #{player.seed}
                                                            </span>
                                                        )}
                                                        {player.rating && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted/20 text-muted-foreground font-mono">
                                                                {player.rating}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {player.team_id && (
                                                        <p className="text-sm text-muted-foreground mt-2">
                                                            Team: {teamMap.get(player.team_id) || 'Unknown'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-border/20">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Record</span>
                                                    <span className="font-medium text-foreground">{getRecordDisplay(player)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm mt-1">
                                                    <span className="text-muted-foreground">Spread</span>
                                                    <span className="font-medium text-foreground">
                                                        {player.spread > 0 ? `+${player.spread}` : player.spread || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicTournamentPage;
