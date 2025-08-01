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
import { useMediaQuery } from '../hooks/useMediaQuery';
import TournamentTicker from '../components/TournamentTicker';
import AnnouncementsDisplay from 'components/AnnouncementsDisplay';
import StandingsTable from 'pages/tournament-command-center-dashboard/components/StandingsTable';
import PrizeDisplay from 'components/PrizeDisplay';
import AdvancedStatsDisplay from 'components/AdvancedStatsDisplay';

const StatCard = ({ icon, label, value, subtext, color = 'text-primary' }) => (
    <div className="glass-card p-4">
        <div className="flex items-center space-x-3">
            <Icon name={icon} size={24} className={color} />
            <div>
                <p className="text-xl font-bold font-mono">{value}</p>
                <p className="text-sm text-foreground font-medium">{label}</p>
                {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
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

    const recalculateRanks = useCallback((playerList, tournamentType) => {
        if (!playerList) return [];
        return [...playerList].sort((a, b) => {
            if (tournamentType === 'best_of_league') {
                if ((a.match_wins || 0) !== (b.match_wins || 0)) return (b.match_wins || 0) - (a.match_wins || 0);
            }
            if ((a.wins || 0) !== (b.wins || 0)) return (b.wins || 0) - (a.wins || 0);
            return (b.spread || 0) - (a.spread || 0);
        }).map((player, index) => ({ ...player, rank: index + 1 }));
    }, []);

    useEffect(() => {
        const fetchPublicData = async () => {
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

                setPlayers(recalculateRanks(combinedPlayers, tournamentData.type));

                const [{ data: resultsData }, {data: teamsData}, {data: prizesData}, {data: matchesData}] = await Promise.all([
                    supabase.from('results').select('*').eq('tournament_id', tournamentData.id).order('created_at', { ascending: false }),
                    supabase.from('teams').select('id, name').eq('tournament_id', tournamentData.id),
                    supabase.from('prizes').select('*').eq('tournament_id', tournamentData.id).order('rank', { ascending: true }),
                    supabase.from('matches').select('*').eq('tournament_id', tournamentData.id).order('round', { ascending: true })
                ]);

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
        };
        fetchPublicData();
        
    }, [tournamentSlug, recalculateRanks]);

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
        <div className="glass-card p-4 space-y-1">
            <h3 className="font-semibold px-3 pt-2 pb-1 text-muted-foreground text-sm">Live Index</h3>
            <Button variant="ghost" className="w-full justify-start" onClick={() => scrollToRef(standingsRef)}>
                <Icon name="Trophy" size={16} className="mr-3"/>Live Standings
            </Button>
            {prizes.length > 0 && (
                <Button variant="ghost" className="w-full justify-start" onClick={() => scrollToRef(prizesRef)}>
                    <Icon name="Gift" size={16} className="mr-3"/>Prizes
                </Button>
            )}
            <div>
                <button onClick={() => setShowPairingsDropdown(!showPairingsDropdown)} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/10 transition-colors w-full text-left">
                    <div className="flex items-center space-x-3">
                        <Icon name="Swords" size={16} />
                        <span>Pairings</span>
                    </div>
                    <Icon name="ChevronDown" size={16} className={cn('transition-transform', showPairingsDropdown && 'rotate-180')} />
                </button>
                {showPairingsDropdown && (
                    <div className="pl-6 pt-1 pb-2 border-l border-border ml-5">
                        {Object.keys(pairingsByRound).sort((a, b) => parseInt(b) - parseInt(a)).map(roundNum => (
                            <a key={roundNum} href={`#round-${roundNum}`} onClick={(e) => { e.preventDefault(); scrollToRef({ current: document.getElementById(`round-${roundNum}`) }) }} className="flex p-2 rounded-lg hover:bg-muted/10 text-sm">
                                Round {roundNum}
                            </a>
                        ))}
                    </div>
                )}
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={() => scrollToRef(statsRef)}>
                <Icon name="BarChart2" size={16} className="mr-3"/>Stats
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => scrollToRef(rosterRef)}>
                <Icon name="Users" size={16} className="mr-3"/>Roster
            </Button>
            {tournament.is_remote_submission_enabled && (
                <div className="pt-2">
                    <Button onClick={() => setShowSubmissionModal(true)} className="w-full shadow-glow">
                        <Icon name="Send" className="mr-2" size={16}/>Submit Result
                    </Button>
                </div>
            )}
        </div>
    );

    const MobileActionBar = () => (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-2 z-40">
            {tournament.is_remote_submission_enabled && (
                <Button onClick={() => setShowSubmissionModal(true)} className="w-full shadow-glow">
                    <Icon name="Send" className="mr-2" size={16}/>Submit Result
                </Button>
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
            <TournamentTicker messages={tickerMessages} />
            
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gradient">{tournament.name}</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">{tournament.venue} • {formattedDate}</p>
                </div>
            </header>
            
            <main className="pt-32 pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <aside className="hidden lg:block lg:col-span-1 lg:sticky top-32 self-start">
                            <SidebarContent />
                        </aside>
                        <div className="lg:col-span-3 space-y-12">
                            <AnnouncementsDisplay />
                            <section id="standings" ref={standingsRef}>
                                <h2 className="font-heading text-2xl font-semibold mb-4 flex items-center">
                                    <Icon name="Trophy" className="mr-3 text-primary" />
                                    Live Standings
                                </h2>
                                <StandingsTable 
                                    players={players} 
                                    recentResults={results} 
                                    onSelectPlayer={setSelectedPlayer} 
                                    tournamentType={tournament?.type} 
                                    teamStandings={teamStandings}
                                />
                            </section>

                            <section id="prizes" ref={prizesRef}>
                                <PrizeDisplay prizes={prizes} players={players} tournament={tournament} />
                            </section>
                            
                            <section id="stats" ref={statsRef}>
                                <h2 className="font-heading text-2xl font-semibold mb-4 flex items-center"><Icon name="BarChart2" className="mr-3 text-primary"/>Advanced Statistics</h2>
                                <AdvancedStatsDisplay results={results} players={players} />
                            </section>

                            <section id="pairings" ref={pairingsRef}>
                                <h2 className="font-heading text-2xl font-semibold mb-4 flex items-center"><Icon name="Swords" className="mr-3 text-primary"/>Pairings by Round</h2>
                                <div className="space-y-8">
                                    {Object.keys(pairingsByRound).sort((a, b) => parseInt(b) - parseInt(a)).map(roundNum => (
                                        <div key={roundNum} id={`round-${roundNum}`} className="glass-card">
                                            <h3 className="p-4 border-b border-border font-semibold text-lg">Round {roundNum}</h3>
                                            <div className="p-4 space-y-3">
                                                {pairingsByRound[roundNum].map(pairing => {
                                                    const player1 = players.find(p => p.player_id === pairing.player1_id);
                                                    const player2 = players.find(p => p.player_id === pairing.player2_id);
                                                    
                                                    return (
                                                        <div key={pairing.id || pairing.table} className="p-3 bg-muted/20 rounded-lg flex flex-col sm:flex-row items-center justify-between font-mono text-sm sm:text-base">
                                                            <div className="flex items-center space-x-3 w-full sm:w-auto mb-2 sm:mb-0">
                                                                <span className="font-bold text-primary w-4 text-center">{pairing.round || pairing.table}</span>
                                                                <a href={`/players/${player1?.slug}`} onClick={(e) => handlePlayerClick(e, player1)} className="hover:underline text-left truncate">
                                                                    <span>{player1?.name}</span> <span className="text-muted-foreground">(#{player1?.seed})</span>
                                                                </a>
                                                            </div>
                                                            <div className="font-semibold text-muted-foreground mx-2">vs.</div>
                                                            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                                                                <a href={`/players/${player2?.slug}`} onClick={(e) => handlePlayerClick(e, player2)} className="hover:underline text-left truncate">
                                                                    <span>{player2?.name}</span> {player2 && <span className="text-muted-foreground">(#{player2?.seed})</span>}
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
                                <h2 className="font-heading text-2xl font-semibold mb-4 flex items-center"><Icon name="Users" className="mr-3 text-primary"/>Player Roster</h2>
                                <div className="glass-card p-4">
                                    <div className="divide-y divide-border">
                                        {sortedRoster.map((p, index) => (
                                            <div key={p.id} className="p-3 flex justify-between items-center">
                                                <div className="flex items-center space-x-4">
                                                    <span className="font-mono text-muted-foreground w-6 text-right">{index + 1}.</span>
                                                    <div>
                                                        <a href={`/players/${p.slug}`} onClick={(e) => handlePlayerClick(e, p)} className="font-medium hover:underline">{p.name}</a>
                                                        {tournament.type === 'team' && p.team_id && (
                                                            <p className="text-xs text-accent">{teamMap.get(p.team_id) || 'Unknown Team'}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-muted-foreground text-sm font-mono">{p.rating}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            {isMobile && <MobileActionBar />}
        </div>
    );
};

export default PublicTournamentPage;