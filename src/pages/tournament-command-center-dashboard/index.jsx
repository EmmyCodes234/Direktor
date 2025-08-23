import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import TeamManagerModal from './components/TeamManagerModal';
import TournamentTicker from '../../components/TournamentTicker';
import Header from '../../components/ui/Header';
import TournamentStats from './components/TournamentStats';
import TournamentControl from './components/TournamentControl';
import StandingsTable from './components/StandingsTable';
import ScoreEntryModal from './components/ScoreEntryModal';
import PlayerStatsModal from '../../components/PlayerStatsModal.jsx';
import PendingResults from './components/PendingResults';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';
import { Toaster, toast } from 'sonner';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { supabase } from '../../supabaseClient';
import DashboardSidebar from './components/DashboardSidebar';
import MobileNavBar from './components/MobileNavBar';
import useMediaQuery from '../../hooks/useMediaQuery';
import AnnouncementsManager from './components/AnnouncementsManager';




// Memoized Main Content with custom comparison to ensure updates when players change
const MainContent = React.memo(({ tournamentInfo, players, recentResults, pendingResults, tournamentState, handlers, teamStandings, matches }) => {
  const navigate = useNavigate();
  const { tournamentSlug } = useParams();
  
  if (import.meta.env.DEV) {
    // MainContent rendering with players
  }
  
  const {
    handleRoundPaired,
    handleManualPairingsSaved,
    handleEnterScore,
    handleCompleteRound,
    handleApproveResult,
    handleRejectResult,
    setSelectedPlayerModal,
    isSubmitting,
    handleUnpairRound,
    isLoading
  } = handlers;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="space-y-4 sm:space-y-5 lg:space-y-6">
        <AnnouncementsManager />
        <TournamentStats players={players} recentResults={recentResults} tournamentInfo={tournamentInfo}/>
      </div>
      
      {/* Pending Results Section */}
      {tournamentInfo?.is_remote_submission_enabled && (
        <div className="mb-6">
          <PendingResults pending={pendingResults} onApprove={handleApproveResult} onReject={handleRejectResult} />
        </div>
      )}
      {/* Tournament Control Section */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={tournamentState} 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -20 }} 
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-6"
        >
          {(tournamentState === 'ROSTER_READY' || tournamentState === 'ROUND_IN_PROGRESS') && (
            <TournamentControl 
              tournamentInfo={tournamentInfo} 
              onRoundPaired={handleRoundPaired} 
              onManualPairingsSaved={handleManualPairingsSaved}
              players={players} 
              onEnterScore={handleEnterScore} 
              recentResults={recentResults} 
              onUnpairRound={handleUnpairRound} 
              matches={matches} 
            />
          )}
          
          {tournamentState === 'ROUND_COMPLETE' && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-card/90 backdrop-blur-sm p-12 text-center border border-success/20 bg-success/5 rounded-lg"
            >
              <Icon name="CheckCircle" size={64} className="mx-auto text-success mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Round {tournamentInfo.currentRound} Complete!</h2>
              <p className="text-muted-foreground mb-6">All matches have been played and results recorded.</p>
              <Button 
                size="lg" 
                className="shadow-glow hover:shadow-glow-hover transition-all duration-200" 
                onClick={handleCompleteRound} 
                loading={isSubmitting}
              >
                {tournamentInfo.currentRound >= tournamentInfo.rounds ? 'Finish Tournament' : `Proceed to Round ${tournamentInfo.currentRound + 1}`}
              </Button>
            </motion.div>
          )}
          
          {tournamentState === 'TOURNAMENT_COMPLETE' && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-card/90 backdrop-blur-sm p-12 text-center border border-warning/20 bg-warning/5 rounded-lg"
            >
              <Icon name="Trophy" size={64} className="mx-auto text-warning mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Tournament Finished!</h2>
              <p className="text-muted-foreground mb-6">Congratulations! The tournament has been completed successfully.</p>
              <Button 
                size="lg" 
                className="shadow-glow hover:shadow-glow-hover transition-all duration-200"
                onClick={() => navigate(`/tournament/${tournamentSlug}/reports`)}
              >
                View Final Reports
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
            {/* Standings Section */}
      {(tournamentState === 'ROUND_IN_PROGRESS' || tournamentState === 'ROUND_COMPLETE' || tournamentState === 'TOURNAMENT_COMPLETE') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              {tournamentInfo?.type === 'team' ? 'Team Standings' : 'Player Standings'}
            </h2>
            {tournamentInfo?.type === 'team' && (
              <Button 
                variant="outline" 
                onClick={() => setShowTeamManager(true)}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Icon name="Users" className="mr-2" />
                Manage Teams
              </Button>
            )}
          </div>
          
          {tournamentInfo?.type === 'team' ? (
            <div className="bg-card/90 backdrop-blur-sm p-6 rounded-lg border border-border/20">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Rank</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Team</th>
                      <th className="px-4 py-3 text-center font-semibold text-foreground">W</th>
                      <th className="px-4 py-3 text-center font-semibold text-foreground">L</th>
                      <th className="px-4 py-3 text-center font-semibold text-foreground">T</th>
                      <th className="px-4 py-3 text-center font-semibold text-foreground">Ind. Wins</th>
                      <th className="px-4 py-3 text-center font-semibold text-foreground">Spread</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Players</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Per Round</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {teamStandings.map(team => (
                      <tr key={team.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3 font-bold text-center text-primary">{team.rank}</td>
                        <td className="px-4 py-3 font-semibold flex items-center gap-3">
                          {team.branding ? (
                            <img src={team.branding.logo} alt="logo" className="w-8 h-8 rounded-full" style={{ background: team.branding.color || '#eee' }} />
                          ) : (
                            <span className="inline-block w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center">
                              <Icon name="Users" size={16} className="text-muted-foreground" />
                            </span>
                          )}
                          <span className="text-foreground">{team.name}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-semibold">{team.teamWins}</td>
                        <td className="px-4 py-3 text-center font-mono font-semibold">{team.teamLosses}</td>
                        <td className="px-4 py-3 text-center font-mono font-semibold">{team.teamTies}</td>
                        <td className="px-4 py-3 text-center font-mono font-semibold">{team.individualWins}</td>
                        <td className="px-4 py-3 text-center font-mono font-semibold">{team.totalSpread > 0 ? `+${team.totalSpread}` : team.totalSpread}</td>
                        <td className="px-4 py-3">
                          <ul className="space-y-1">
                            {team.players.map(p => (
                              <li key={p.player_id} className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-foreground">{p.name}</span>
                                <span className="text-muted-foreground text-xs">({p.wins || 0}-{p.losses || 0}-{p.ties || 0}, {p.spread > 0 ? '+' : ''}{p.spread || 0})</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-3">
                          <ul className="flex flex-wrap gap-1">
                            {team.perRound.map((r, i) => (
                              <li key={i} className={`px-2 py-1 rounded text-xs font-medium ${
                                r.result === 'Win' ? 'bg-success/20 text-success' : 
                                r.result === 'Loss' ? 'bg-destructive/20 text-destructive' : 
                                'bg-warning/20 text-warning'
                              }`}>
                                R{r.round}: {r.result} ({r.score})
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <StandingsTable 
              players={players} 
              recentResults={recentResults} 
              onSelectPlayer={setSelectedPlayerModal} 
              tournamentType={tournamentInfo?.type} 
              teamStandings={teamStandings} 
              isLoading={isLoading}
            />
          )}
          
          {tournamentInfo?.type === 'team' && (
            <TeamManagerModal
              isOpen={showTeamManager}
              onClose={() => setShowTeamManager(false)}
              teams={teams}
              players={players}
              onSave={handleSaveTeams}
            />
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to ensure re-renders when rankedPlayers changes in best_of_league mode
  if (prevProps.tournamentInfo?.type === 'best_of_league') {
    // Compare players deeply for best_of_league
    return (
      prevProps.tournamentInfo === nextProps.tournamentInfo &&
      JSON.stringify(prevProps.players) === JSON.stringify(nextProps.players) &&
      prevProps.recentResults === nextProps.recentResults &&
      prevProps.pendingResults === nextProps.pendingResults &&
      prevProps.tournamentState === nextProps.tournamentState &&
      prevProps.teamStandings === nextProps.teamStandings &&
      prevProps.matches === nextProps.matches
    );
  } else {
    // Default shallow compare for other tournament types
    return (
      prevProps.tournamentInfo === nextProps.tournamentInfo &&
      prevProps.players === nextProps.players &&
      prevProps.recentResults === nextProps.recentResults &&
      prevProps.pendingResults === nextProps.pendingResults &&
      prevProps.tournamentState === nextProps.tournamentState &&
      prevProps.teamStandings === nextProps.teamStandings &&
      prevProps.matches === nextProps.matches
    );
  }
});


const TournamentCommandCenterDashboard = () => {
  // Always get tournamentSlug first so it is available for all logic below
  const { tournamentSlug } = useParams();

  // --- Move all useState declarations above useEffect to avoid TDZ ---
  const [players, setPlayers] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [tournamentInfo, setTournamentInfo] = useState(null);
  const [pendingResults, setPendingResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState({ isOpen: false, existingResult: null });
  const [pendingScoreAction, setPendingScoreAction] = useState(null); // For confirmation dialog
  const [activeMatchup, setActiveMatchup] = useState(null);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showUnpairModal, setShowUnpairModal] = useState(false);
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [playerStatsMap, setPlayerStatsMap] = useState(new Map());
  // Announcements for ticker
  const [tickerAnnouncements, setTickerAnnouncements] = useState([]);

  // Fetch latest announcements for ticker
  useEffect(() => {
    if (!tournamentInfo?.id) return;
    let isMounted = true;
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('tournament_id', tournamentInfo.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error && isMounted) setTickerAnnouncements(data || []);
    };
    fetchAnnouncements();
    // Listen for real-time updates
    const channel = supabase
      .channel(`ticker-announcements-${tournamentInfo.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements', filter: `tournament_id=eq.${tournamentInfo.id}` }, fetchAnnouncements)
      .subscribe();
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [tournamentInfo?.id]);

  // Interleave announcements and results for ticker
  const tickerMessages = useMemo(() => {
    const ann = (tickerAnnouncements || []).map(a => ({ type: 'announcement', text: a.message }));
    const res = (recentResults || []).slice(0, 10).map(r => {
      if (r.score1 > r.score2) {
        return { type: 'result', text: `LATEST: ${r.player1_name} defeated ${r.player2_name} ${r.score1} - ${r.score2}` };
      } else if (r.score2 > r.score1) {
        return { type: 'result', text: `LATEST: ${r.player2_name} defeated ${r.player1_name} ${r.score2} - ${r.score1}` };
      } else {
        return { type: 'result', text: `LATEST: ${r.player1_name} and ${r.player2_name} drew ${r.score1} - ${r.score2}` };
      }
    });
    // Interleave: announcement, result, announcement, result, ...
    const out = [];
    const maxLen = Math.max(ann.length, res.length);
    for (let i = 0; i < maxLen; i++) {
      if (ann[i]) out.push(ann[i]);
      if (res[i]) out.push(res[i]);
    }
    return out;
  }, [tickerAnnouncements, recentResults]);

  // Render ticker at the top of the dashboard
  // Place just below header, similar to public page
  const TickerBar = () => (
    <div className="sticky top-0 z-[90] w-full">
      <TournamentTicker messages={tickerMessages} />
    </div>
  );

  const fetchTournamentData = useCallback(async () => {
    if (!tournamentSlug) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    try {
      // Fetching tournament data for slug
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      };
              // GET request prepared

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to access this page.");
      }

      const { data: tournamentData, error: tErr } = await supabase
        .from('tournaments')
        .select(`*, tournament_players(*, players(id, name, rating, photo_url, slug))`)
        .eq('slug', tournamentSlug)
        .single();

      if (tErr || !tournamentData) {
        console.error("Error fetching tournament data:", tErr);
        throw tErr || new Error("Tournament not found");
      }

      // Security check: Ensure user owns this tournament
      if (tournamentData.user_id !== user.id) {
        throw new Error("You don't have permission to access this tournament's admin dashboard.");
      }

              // Tournament data fetched successfully

      const combinedPlayers = tournamentData.tournament_players.map(tp => ({
        ...tp.players,
        ...tp
      }));
      
      setTournamentInfo(tournamentData);

      const promises = [
        supabase.from('results').select('*').eq('tournament_id', tournamentData.id).order('created_at', { ascending: false }),
        supabase.from('pending_results').select('*').eq('tournament_id', tournamentData.id).eq('status', 'pending').order('created_at', { ascending: true }),
        supabase.from('teams').select('*').eq('tournament_id', tournamentData.id),
        supabase.from('matches').select('*').eq('tournament_id', tournamentData.id),
        supabase.from('player_photos').select('*').eq('tournament_id', tournamentData.id)
      ];

      const [{ data: resultsData, error: resultsError }, { data: pendingData, error: pendingError }, { data: teamsData, error: teamsError }, { data: matchesData, error: matchesError }, { data: photosData, error: photosError }] = await Promise.all(promises);

      if (resultsError) console.error("Error fetching results:", resultsError);
      if (pendingError) console.error("Error fetching pending results:", pendingError);
      if (teamsError) console.error("Error fetching teams:", teamsError);
      if (matchesError) console.error("Error fetching matches:", matchesError);
      if (photosError) console.error("Error fetching player photos:", photosError);

      // Combine players with their photos
      const playersWithPhotos = combinedPlayers.map(player => {
        const photo = photosData?.find(p => p.player_id === player.player_id);
        return {
          ...player,
          photo_url: photo?.photo_url || null
        };
      });

      setRecentResults(resultsData || []);
      setPendingResults(pendingData || []);
      setTeams(teamsData || []);
      setMatches(matchesData || []);
      setPlayers(playersWithPhotos);

    } catch (error) {
      console.error("Error fetching tournament:", error);
      toast.error(`A critical error occurred: ${error.message}`);
      setTournamentInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentSlug]);

  useEffect(() => {
    if (import.meta.env.DEV) {
              // Setting up real-time channel for tournament
    }
    const channel = supabase.channel(`dashboard-updates-for-tournament-${tournamentInfo?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const { table, eventType, new: newRecord, old: oldRecord } = payload;
        // Real-time update received
        
        switch (table) {
          case 'results':
            if (eventType === 'INSERT') {
              setRecentResults(prev => [newRecord, ...prev]);
            } else if (eventType === 'UPDATE') {
              setRecentResults(prev => prev.map(r => r.id === newRecord.id ? newRecord : r));
            } else if (eventType === 'DELETE') {
              setRecentResults(prev => prev.filter(r => r.id !== oldRecord.id));
            }
            break;
          case 'pending_results':
            if (eventType === 'INSERT') {
              setPendingResults(prev => [...prev, newRecord]);
            } else if (eventType === 'DELETE') {
              setPendingResults(prev => prev.filter(r => r.id !== oldRecord.id));
            }
            break;
          case 'tournaments':
            if (eventType === 'UPDATE' && newRecord.id === tournamentInfo?.id) {
              setTournamentInfo(prev => ({ ...prev, ...newRecord }));
            }
            break;
          case 'tournament_players':
            if (eventType === 'UPDATE') {
              // Real-time update received for tournament_players
              // Force a re-render by creating a new array reference
              // Update players state
              setPlayers(prev => {
                // Current players state before update
                // Create a completely new array to ensure React detects the change
                const updatedPlayers = [...prev.map(p => {
                  if (p.player_id === newRecord.player_id) {
                    const updatedPlayer = { ...p, ...newRecord };
                    // Updating player in state
                    return updatedPlayer;
                  }
                  return { ...p }; // Create a new object for each player to ensure reference changes
                })];
                // Updated players state
                return updatedPlayers;
              });
              // Force re-ranking after updating players
              forceReranking();
            }
            break;
          case 'matches':
            if (eventType === 'INSERT') {
              setMatches(prev => [...prev, newRecord]);
            } else if (eventType === 'UPDATE') {
              setMatches(prev => prev.map(m => m.id === newRecord.id ? newRecord : m));
            }
            break;
          default:
            // For any other event, or if the update is complex, we just refetch everything.
            // This is our safety net.
            fetchTournamentData();
            break;
        }
      })
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [tournamentInfo?.id, fetchTournamentData]);

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentSlug, fetchTournamentData]);
  

  const teamMap = useMemo(() => new Map(teams.map(team => [team.id, team.name])), [teams]);

  const teamStandings = useMemo(() => {
    if (tournamentInfo?.type !== 'team' || !teams.length || !players.length) return [];
    
    // Group results by round to identify team matches
    const resultsByRound = recentResults.reduce((acc, result) => {
      (acc[result.round] = acc[result.round] || []).push(result);
      return acc;
    }, {});
    
    // Initialize team stats
    const teamStats = teams.map(team => ({
      id: team.id,
      name: team.name,
      teamWins: 0,
      teamLosses: 0,
      teamTies: 0,
      individualWins: 0,
      totalSpread: 0,
      players: players.filter(p => p.team_id === team.id),
      perRound: []
    }));
    
    // Process each round to identify team vs team matches
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
          if (result.player1_id === p1.player_id) {
            matchup.team1Wins++;
          } else {
            matchup.team2Wins++;
          }
        } else if (result.score2 > result.score1) {
          if (result.player2_id === p1.player_id) {
            matchup.team1Wins++;
          } else {
            matchup.team2Wins++;
          }
        }
      });
      
      // Process team matchups to determine team wins/losses
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
          // Tie
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
    
    // Sort teams by NASPA-compliant tie-breakers
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
  }, [players, recentResults, teams, tournamentInfo]);

  // Add a counter to force re-calculation of rankedPlayers when needed
  const [rankingUpdateCounter, setRankingUpdateCounter] = useState(0);
  
  // Force re-ranking when tournament_players are updated
  const forceReranking = useCallback(() => {
    // Forcing re-ranking of players
    setRankingUpdateCounter(prev => prev + 1);
  }, []);
  
  const rankedPlayers = useMemo(() => {
    // Always recalculate match_wins for best_of_league using results only (majority wins per match-up)
    let enrichedPlayers = players;
    if (tournamentInfo?.type === 'best_of_league') {
      // Use best_of_value from tournamentInfo if available, else default to 15
      const bestOf = tournamentInfo?.best_of_value ? parseInt(tournamentInfo.best_of_value, 10) : 15;
      const majority = Math.floor(bestOf / 2) + 1;
      // Build a map of match-ups: key = sorted player ids, value = array of results
      const matchupMap = {};
      (recentResults || []).forEach(result => {
        if (!result.player1_id || !result.player2_id) return;
        const ids = [result.player1_id, result.player2_id].sort((a, b) => a - b);
        const key = ids.join('-');
        if (!matchupMap[key]) matchupMap[key] = [];
        matchupMap[key].push(result);
      });
      enrichedPlayers = players.map(player => {
        let wins = 0, losses = 0, ties = 0, spread = 0, match_wins = 0;
        // Per-game stats
        (recentResults || []).forEach(result => {
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
          if (!key.split('-').includes(String(player.player_id))) return;
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
    }

    const ranked = [...enrichedPlayers].sort((a, b) => {
      if (tournamentInfo?.type === 'best_of_league') {
        const aMatchWins = typeof a.match_wins === 'string' ? parseInt(a.match_wins || 0, 10) : (a.match_wins || 0);
        const bMatchWins = typeof b.match_wins === 'string' ? parseInt(b.match_wins || 0, 10) : (b.match_wins || 0);
        if (aMatchWins !== bMatchWins) return bMatchWins - aMatchWins;
      }
      
      // Primary sort: Game wins + 0.5 * ties
      const aGameScore = parseInt(a.wins || 0, 10) + parseInt(a.ties || 0, 10) * 0.5;
      const bGameScore = parseInt(b.wins || 0, 10) + parseInt(b.ties || 0, 10) * 0.5;
      if (aGameScore !== bGameScore) return bGameScore - aGameScore;
      
      // Secondary sort: Spread
      const aSpread = parseInt(a.spread || 0, 10);
      const bSpread = parseInt(b.spread || 0, 10);
      if (aSpread !== bSpread) return bSpread - aSpread;
      
      // Tertiary sort: Head-to-head (if they've played)
      const headToHeadResult = calculateHeadToHead(a, b, recentResults);
      if (headToHeadResult !== 0) return headToHeadResult;
      
      // Quaternary sort: Opponent's win percentage
      const aOppWinPct = calculateOpponentWinPercentage(a, recentResults, enrichedPlayers);
      const bOppWinPct = calculateOpponentWinPercentage(b, recentResults, enrichedPlayers);
      if (aOppWinPct !== bOppWinPct) return bOppWinPct - aOppWinPct;
      
      // Final sort: Higher seed (lower number)
      return (a.seed || 999) - (b.seed || 999);
    }).map((player, index) => ({ ...player, rank: index + 1 }));

    return ranked;
  }, [players, tournamentInfo, rankingUpdateCounter, recentResults, matches]);

  // Helper function to calculate head-to-head result
  const calculateHeadToHead = (playerA, playerB, results) => {
    const headToHeadGames = results.filter(r => 
      (r.player1_id === playerA.player_id && r.player2_id === playerB.player_id) ||
      (r.player1_id === playerB.player_id && r.player2_id === playerA.player_id)
    );
    
    if (headToHeadGames.length === 0) return 0;
    
    let aWins = 0, bWins = 0;
    headToHeadGames.forEach(game => {
      if (game.player1_id === playerA.player_id) {
        if (game.score1 > game.score2) aWins++;
        else if (game.score2 > game.score1) bWins++;
      } else {
        if (game.score2 > game.score1) aWins++;
        else if (game.score1 > game.score2) bWins++;
      }
    });
    
    return aWins - bWins;
  };

  // Helper function to calculate opponent's win percentage
  const calculateOpponentWinPercentage = (player, results, allPlayers) => {
    const opponents = new Set();
    results.forEach(r => {
      if (r.player1_id === player.player_id) {
        opponents.add(r.player2_id);
      } else if (r.player2_id === player.player_id) {
        opponents.add(r.player1_id);
      }
    });
    
    if (opponents.size === 0) return 0;
    
    let totalOpponentWins = 0;
    let totalOpponentGames = 0;
    
    opponents.forEach(opponentId => {
      const opponent = allPlayers.find(p => p.player_id === opponentId);
      if (opponent) {
        totalOpponentWins += (opponent.wins || 0);
        totalOpponentGames += (opponent.wins || 0) + (opponent.losses || 0) + (opponent.ties || 0);
      }
    });
    
    return totalOpponentGames > 0 ? totalOpponentWins / totalOpponentGames : 0;
  };

  const lastPairedRound = useMemo(() => {
    const schedule = tournamentInfo?.pairing_schedule || {};
    const pairedRounds = Object.keys(schedule).map(Number);
    if (pairedRounds.length === 0) return null;
    return Math.max(...pairedRounds);
  }, [tournamentInfo]);

  const hasResultsForLastPairedRound = useMemo(() => {
    if (!lastPairedRound) return false;
    return recentResults.some(r => r.round === lastPairedRound);
  }, [recentResults, lastPairedRound]);

  const handleRoundPaired = useCallback((updatedTournamentInfo) => {
    setTournamentInfo(updatedTournamentInfo);
    const newRound = updatedTournamentInfo.currentRound;
    const pairingsCount = updatedTournamentInfo.pairing_schedule?.[newRound]?.length || 0;

  }, []);

  const handleManualPairingsSaved = useCallback((updatedTournamentInfo) => {
    setTournamentInfo(updatedTournamentInfo);
    const newRound = updatedTournamentInfo.currentRound;
    const pairingsCount = updatedTournamentInfo.pairing_schedule?.[newRound]?.length || 0;

  }, []);

  const handleUnpairRound = useCallback(() => {
    setShowUnpairModal(true);
  }, []);

  const confirmUnpairRound = useCallback(async () => {
    const schedule = tournamentInfo.pairing_schedule || {};
    const pairedRounds = Object.keys(schedule).map(Number);
    if (pairedRounds.length === 0) {
      toast.error("No rounds are currently paired.");
      setShowUnpairModal(false);
      return;
    }
    const roundToUnpair = Math.max(...pairedRounds);

    toast.info(`Unpairing Round ${roundToUnpair}...`);

    try {
      const { data: resultsToRevert, error: fetchError } = await supabase
        .from('results')
        .select('*')
        .eq('tournament_id', tournamentInfo.id)
        .eq('round', roundToUnpair);

      if (fetchError) throw fetchError;

      for (const result of resultsToRevert) {
        const { score1, score2, player1_id, player2_id } = result;
        const { data: currentStats, error: statsError } = await supabase
          .from('tournament_players')
          .select('wins, losses, ties, spread')
          .in('player_id', [player1_id, player2_id])
          .eq('tournament_id', tournamentInfo.id);

        if (statsError) throw statsError;

        const player1Stats = currentStats.find(s => s.player_id === player1_id);
        const player2Stats = currentStats.find(s => s.player_id === player2_id);

        let p1NewStats = { ...player1Stats };
        let p2NewStats = { ...player2Stats };

        if (score1 > score2) {
          p1NewStats.wins = Math.max(0, (p1NewStats.wins || 0) - 1);
          p2NewStats.losses = Math.max(0, (p2NewStats.losses || 0) - 1);
        } else if (score2 > score1) {
          p2NewStats.wins = Math.max(0, (p2NewStats.wins || 0) - 1);
          p1NewStats.losses = Math.max(0, (p1NewStats.losses || 0) - 1);
        } else {
          p1NewStats.ties = Math.max(0, (p1NewStats.ties || 0) - 1);
          p2NewStats.ties = Math.max(0, (p2NewStats.ties || 0) - 1);
        }

        p1NewStats.spread = (p1NewStats.spread || 0) - (score1 - score2);
        p2NewStats.spread = (p2NewStats.spread || 0) - (score2 - score1);

        await Promise.all([
          supabase.from('tournament_players').update(p1NewStats).eq('player_id', player1_id).eq('tournament_id', tournamentInfo.id),
          supabase.from('tournament_players').update(p2NewStats).eq('player_id', player2_id).eq('tournament_id', tournamentInfo.id),
        ]);
      }

      const { error: deleteError } = await supabase.from('results').delete().eq('tournament_id', tournamentInfo.id).eq('round', roundToUnpair);
      if (deleteError) throw deleteError;

      const newSchedule = { ...schedule };
      delete newSchedule[roundToUnpair];
      const { data, error: updateError } = await supabase.from('tournaments').update({ pairing_schedule: newSchedule }).eq('id', tournamentInfo.id).select().single();
      if (updateError) throw updateError;

      toast.success(`Round ${roundToUnpair} has been successfully unpaired.`);

      setTournamentInfo(data);
    } catch (error) {
      toast.error(`Failed to unpair round: ${error.message}`);
    } finally {
      setShowUnpairModal(false);
      fetchTournamentData();
    }
  }, [tournamentInfo, fetchTournamentData]);

  const updateBestOfLeagueMatch = useCallback(async (resultData, p1NewStats, p2NewStats, player1, player2) => {
    if (!resultData.match_id) return null;
    const { data: allMatchResults, error: resultsError } = await supabase
      .from('results')
      .select('score1, score2, player1_id, player2_id, id')
      .eq('match_id', resultData.match_id);

    if (resultsError) throw resultsError;

    // Optimistically include the just-submitted result if not present
    let matchResults = allMatchResults || [];
    if (!matchResults.some(r => r.id === resultData.id || (
      r.player1_id === resultData.player1_id && r.player2_id === resultData.player2_id && r.score1 === resultData.score1 && r.score2 === resultData.score2
    ))) {
      matchResults = [...matchResults, {
        player1_id: resultData.player1_id,
        player2_id: resultData.player2_id,
        score1: resultData.score1,
        score2: resultData.score2
      }];
    }

    const p1GameWins = matchResults.filter(r =>
      (r.player1_id === player1.player_id && r.score1 > r.score2) ||
      (r.player2_id === player1.player_id && r.score2 > r.score1)
    ).length;
    const p2GameWins = matchResults.filter(r =>
      (r.player1_id === player2.player_id && r.score1 > r.score2) ||
      (r.player2_id === player2.player_id && r.score2 > r.score1)
    ).length;
    const bestOfValue = Math.ceil(tournamentInfo.best_of_value / 2);

    let winnerId = null;
    let loserId = null;

    if (p1GameWins >= bestOfValue) {
      winnerId = player1.player_id;
      loserId = player2.player_id;
    } else if (p2GameWins >= bestOfValue) {
      winnerId = player2.player_id;
      loserId = player1.player_id;
    }

    if (winnerId) {
      // Mark match as complete and set winner
      await supabase.from('matches').update({ winner_id: winnerId, status: 'complete' }).eq('id', resultData.match_id);
      // Immediately update local matches state for this match
      setMatches(prevMatches => prevMatches.map(m =>
        m.id === resultData.match_id
          ? { ...m, winner_id: winnerId, status: 'complete' }
          : m
      ));

      // Increment match_wins for winner, match_losses for loser
      const { data: winnerCurrent, error: wError } = await supabase
        .from('tournament_players')
        .select('match_wins')
        .eq('player_id', winnerId)
        .eq('tournament_id', tournamentInfo.id)
        .single();
      if (wError) throw wError;

      const { data: loserCurrent, error: lError } = await supabase
        .from('tournament_players')
        .select('match_losses')
        .eq('player_id', loserId)
        .eq('tournament_id', tournamentInfo.id)
        .single();
      if (lError) throw lError;

      const parseMatchStat = (stat) => typeof stat === 'string' ? parseInt(stat || 0, 10) : (stat || 0);

      // Update match_wins/losses in DB
      await supabase.from('tournament_players').update({ match_wins: parseMatchStat(winnerCurrent.match_wins) + 1 }).eq('player_id', winnerId).eq('tournament_id', tournamentInfo.id);
      await supabase.from('tournament_players').update({ match_losses: parseMatchStat(loserCurrent.match_losses) + 1 }).eq('player_id', loserId).eq('tournament_id', tournamentInfo.id);

      // Immediately update local players state for winner and loser
      setPlayers(prevPlayers => {
        const updated = prevPlayers.map(p => {
          if (p.player_id === winnerId) {
            const newWins = parseMatchStat(winnerCurrent.match_wins) + 1;
            return { ...p, match_wins: newWins };
          }
          if (p.player_id === loserId) {
            const newLosses = parseMatchStat(loserCurrent.match_losses) + 1;
            return { ...p, match_losses: newLosses };
          }
          return { ...p };
        });
        setRankingUpdateCounter(c => c + 1);
        return updated;
      });

      // Check if all matches in this round are complete
      const { data: allMatches, error: matchesError } = await supabase
        .from('matches')
        .select('id, status, round')
        .eq('tournament_id', tournamentInfo.id)
        .eq('round', resultData.round || tournamentInfo.currentRound);
      if (matchesError) throw matchesError;

      const allComplete = allMatches && allMatches.length > 0 && allMatches.every(m => m.status === 'complete');
      if (allComplete) {
        // Optionally, update tournament state or pairing_schedule to mark round as complete
        await supabase.from('tournaments').update({ status: 'ROUND_COMPLETE' }).eq('id', tournamentInfo.id);
        toast.success(`All matches for round ${resultData.round || tournamentInfo.currentRound} are complete!`);
      }

      // Updating match stats

      toast.success(`${player1.name} vs ${player2.name} match is complete. Winner: ${winnerId === player1.player_id ? player1.name : player2.name}.`);
      return { winnerId, loserId };
    }
    return null;
  }, [tournamentInfo, players]);


  // Confirmation dialog for score submission/edit
  const handleResultSubmit = useCallback(async (result, isEditing = false) => {
    setPendingScoreAction({ result, isEditing });
  }, []);

  // Actually perform the score action after confirmation
  const doScoreAction = useCallback(async () => {
    if (!pendingScoreAction) return;
    setIsSubmitting(true);
    let { result, isEditing } = pendingScoreAction;
    let originalResult = result.existingResult || null;
    try {
      const player1 = players.find(p => p.name === result.player1);
      const player2 = players.find(p => p.name === result.player2);
      if (!player1 || !player2) throw new Error("Could not find players.");
      let score1 = parseInt(result.score1, 10);
      let score2 = parseInt(result.score2, 10);
      const maxSpread = tournamentInfo.max_spread;
      if (maxSpread && Math.abs(score1 - score2) > maxSpread) {
        toast.info(`Spread has been automatically capped at ${maxSpread}.`);
        if (score1 > score2) {
          score2 = score1 - maxSpread;
        } else {
          score1 = score2 - maxSpread;
        }
      }
      const resultData = {
        tournament_id: tournamentInfo.id,
        round: result.round || tournamentInfo.currentRound,
        player1_id: player1.player_id,
        player2_id: player2.player_id,
        score1,
        score2,
        match_id: result.match_id || null,
        player1_name: player1.name,
        player2_name: player2.name,
      };
      // For best-of-league, always insert a new result (never edit)
      let shouldEdit = false;
      let insertedResult = null;
      if (tournamentInfo?.type !== 'best_of_league') {
        if (!isEditing) {
          const { data: existingResult, error: fetchError } = await supabase
            .from('results')
            .select('id, score1, score2, player1_id, player2_id')
            .eq('tournament_id', tournamentInfo.id)
            .eq('round', resultData.round)
            .or(`and(player1_id.eq.${player1.player_id},player2_id.eq.${player2.player_id}),and(player1_id.eq.${player2.player_id},player2_id.eq.${player1.player_id})`)
            .single();
          if (existingResult) {
            shouldEdit = true;
            originalResult = existingResult;
            resultData.id = typeof existingResult.id === 'string' ? parseInt(existingResult.id, 10) : existingResult.id;
          }
        } else {
          shouldEdit = true;
        }
      }
      const playerIdsToFetch = shouldEdit ? [originalResult.player1_id, originalResult.player2_id] : [player1.player_id, player2.player_id];
      const { data: currentStats, error: statsError } = await supabase
        .from('tournament_players')
        .select('player_id, wins, losses, ties, spread, match_wins, match_losses')
        .in('player_id', playerIdsToFetch)
        .eq('tournament_id', tournamentInfo.id);
      if (statsError) throw statsError;
      const player1Stats = currentStats.find(s => s.player_id === player1.player_id) || {};
      const player2Stats = currentStats.find(s => s.player_id === player2.player_id) || {};
      let p1NewStats = { ...player1Stats };
      let p2NewStats = { ...player2Stats };
      if (shouldEdit) {
        const resultId = typeof originalResult?.id === 'string' ? parseInt(originalResult.id, 10) : originalResult?.id;
        if (!resultId || isNaN(resultId)) {
          throw new Error("Invalid result ID for editing.");
        }
        if (originalResult.score1 > originalResult.score2) {
          p1NewStats.wins = Math.max(0, (p1NewStats.wins || 0) - 1);
          p2NewStats.losses = Math.max(0, (p2NewStats.losses || 0) - 1);
        } else if (originalResult.score2 > originalResult.score1) {
          p2NewStats.wins = Math.max(0, (p2NewStats.wins || 0) - 1);
          p1NewStats.losses = Math.max(0, (p1NewStats.losses || 0) - 1);
        } else {
          p1NewStats.ties = Math.max(0, (p1NewStats.ties || 0) - 1);
          p2NewStats.ties = Math.max(0, (p2NewStats.ties || 0) - 1);
        }
        p1NewStats.spread = (p1NewStats.spread || 0) - (originalResult.score1 - originalResult.score2);
        p2NewStats.spread = (p2NewStats.spread || 0) - (originalResult.score2 - originalResult.score1);
        const updateFields = { ...resultData };
        delete updateFields.id;
        delete updateFields.existingResult;
        const { error: updateError, data: updateData } = await supabase.from('results').update(updateFields).eq('id', resultId);
        if (updateError) {
          console.error('Supabase update error:', updateError);
          throw updateError;
        }
        toast.success("Result updated successfully!");

        // Optimistically update recentResults for edit
        setRecentResults(prev => [{ ...resultData, id: resultId }, ...prev.filter(r => r.id !== resultId)]);
      } else {
        const { data: inserted, error: insertError } = await supabase.from('results').insert(resultData).select().single();
        if (insertError) throw insertError;
        insertedResult = inserted || { ...resultData };
        toast.success("Result submitted successfully!");

        // Optimistically update recentResults for insert
        setRecentResults(prev => [insertedResult, ...prev]);
      }
      if (score1 > score2) {
        p1NewStats.wins = (p1NewStats.wins || 0) + 1;
        p2NewStats.losses = (p2NewStats.losses || 0) + 1;
      } else if (score2 > score1) {
        p2NewStats.wins = (p2NewStats.wins || 0) + 1;
        p1NewStats.losses = (p1NewStats.losses || 0) + 1;
      } else {
        p1NewStats.ties = (p1NewStats.ties || 0) + 1;
        p2NewStats.ties = (p2NewStats.ties || 0) + 1;
      }
      p1NewStats.spread = (p1NewStats.spread || 0) + (score1 - score2);
      p2NewStats.spread = (p2NewStats.spread || 0) + (score2 - score1);
      if (tournamentInfo?.type === 'best_of_league') {
        const matchResult = await updateBestOfLeagueMatch(resultData, p1NewStats, p2NewStats, player1, player2);
        // Always show a toast and increment match_wins if a player just won the match
        if (matchResult && matchResult.winnerId && matchResult.loserId) {
          setPlayers(prevPlayers => {
            const updated = prevPlayers.map(p => {
              if (p.player_id === matchResult.winnerId) {
                const mw = typeof p.match_wins === 'string' ? parseInt(p.match_wins || 0, 10) : (p.match_wins || 0);
                return { ...p, match_wins: mw + 1 };
              }
              if (p.player_id === matchResult.loserId) {
                const ml = typeof p.match_losses === 'string' ? parseInt(p.match_losses || 0, 10) : (p.match_losses || 0);
                return { ...p, match_losses: ml + 1 };
              }
              return { ...p };
            });
            setRankingUpdateCounter(c => c + 1);
            return updated;
          });
          const winner = [player1, player2].find(p => p.player_id === matchResult.winnerId);
          if (winner) {
            toast.success(`${winner.name} has won the match!`);
          }
        }
      }
      setPlayers(prevPlayers => {
        const updatedPlayers = prevPlayers.map(p => {
          if (p.player_id === player1.player_id) {
            return { ...p, ...p1NewStats };
          }
          if (p.player_id === player2.player_id) {
            return { ...p, ...p2NewStats };
          }
          return p;
        });
        return updatedPlayers;
      });
    } catch (error) {
      toast.error(`Operation failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setShowScoreModal({ isOpen: false, existingResult: null });
      setPendingScoreAction(null);
      // For best_of_league, skip fetchTournamentData to avoid overwriting local state; rely on real-time updates
      if (tournamentInfo?.type !== 'best_of_league') {
        fetchTournamentData();
      }
    }
  }, [pendingScoreAction, players, tournamentInfo, updateBestOfLeagueMatch, fetchTournamentData, matches]);

  const handleCompleteRound = useCallback(async () => {
    setIsSubmitting(true);
    const originalTournamentInfo = tournamentInfo;
    const currentRound = originalTournamentInfo.currentRound || 1;
    const totalRounds = originalTournamentInfo.rounds;
    const isFinalRound = currentRound >= totalRounds;
    setTournamentInfo(prev => ({ ...prev, status: isFinalRound ? 'completed' : prev.status, currentRound: isFinalRound ? currentRound : currentRound + 1 }));
    const updatePayload = isFinalRound ? { status: 'completed' } : { currentRound: currentRound + 1 };
    try {
      const { error } = await supabase.from('tournaments').update(updatePayload).eq('id', tournamentInfo.id);
      if (error) {
        toast.error(`Failed to proceed: ${error.message}`);
        setTournamentInfo(originalTournamentInfo);
      } else {

        toast.success(isFinalRound ? 'Tournament Complete!' : `Proceeding to Round ${currentRound + 1}`);
      }
    } catch (error) {
      toast.error(`An unexpected error occurred: ${error.message}`);
      setTournamentInfo(originalTournamentInfo);
    } finally {
      setIsSubmitting(false);
    }
  }, [tournamentInfo]);

  const handleEnterScore = useCallback((matchup, existingResult = null) => {
    let finalMatchup = { ...matchup };

    if (!finalMatchup.player1 && finalMatchup.player1_id) {
      finalMatchup.player1 = players.find(p => p.player_id === finalMatchup.player1_id);
    }
    if (!finalMatchup.player2 && finalMatchup.player2_id) {
      finalMatchup.player2 = players.find(p => p.player_id === finalMatchup.player2_id);
    }

    // Safeguard: Prevent score entry for completed matches
    if (finalMatchup.status === 'complete') {
      toast.error('This match is already complete. No further scores can be entered.');
      return;
    }

    if (tournamentInfo.type === 'best_of_league') {
      finalMatchup.player1_name = finalMatchup.player1.name;
      finalMatchup.player2_name = finalMatchup.player2.name;

      // Calculate current match score for both players (number of games won in this match)
      const matchId = finalMatchup.id || finalMatchup.match_id;
      let p1Wins = 0, p2Wins = 0;
      if (matchId) {
        recentResults.filter(r => r.match_id === matchId).forEach(r => {
          if (r.score1 > r.score2 && r.player1_id === finalMatchup.player1.player_id) p1Wins++;
          else if (r.score2 > r.score1 && r.player2_id === finalMatchup.player2.player_id) p2Wins++;
          else if (r.score1 > r.score2 && r.player2_id === finalMatchup.player1.player_id) p1Wins++;
          else if (r.score2 > r.score1 && r.player1_id === finalMatchup.player2.player_id) p2Wins++;
        });
      }
      finalMatchup.currentMatchScore = {
        [finalMatchup.player1.name]: p1Wins,
        [finalMatchup.player2.name]: p2Wins
      };
    }

    if (!finalMatchup.player1 || !finalMatchup.player2) {
      toast.error("Could not find player details for this match.");
      return;
    }

    setActiveMatchup(finalMatchup);
    setShowScoreModal({ isOpen: true, existingResult: existingResult });
  }, [players, tournamentInfo, recentResults]);
  
  const handleEditResultFromModal = useCallback(async (resultToEdit) => {
    if (tournamentInfo.type === 'best_of_league') {
      const { data: matchData, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', resultToEdit.match_id)
        .single();

      if (error || !matchData) {
        toast.error("Could not find the original match for this result.");
        return;
      }
      
      handleEnterScore(matchData, resultToEdit);

    } else {
      const player1 = players.find(p => p.name === resultToEdit.player1_name);
      const player2 = players.find(p => p.name === resultToEdit.player2_name);
      if (!player1 || !player2) {
        toast.error("Could not find players for this result.");
        return;
      }

      // Check if resultToEdit.id is a valid number, and pass a clean object
      const cleanResultToEdit = { ...resultToEdit };
      if (cleanResultToEdit.id && !isNaN(parseInt(cleanResultToEdit.id, 10))) {
        cleanResultToEdit.id = parseInt(cleanResultToEdit.id, 10);
      } else {
        toast.error("Invalid result ID for editing.");
        return;
      }

      const roundPairings = tournamentInfo.pairing_schedule?.[resultToEdit.round];
      const pairing = roundPairings?.find(p => (p.player1.name === player1.name && p.player2.name === player2.name) || (p.player1.name === player2.name && p.player2.name === player1.name));
      const matchup = { player1, player2, table: pairing?.table || 'N/A', round: resultToEdit.round };
      
      handleEnterScore(matchup, cleanResultToEdit);
    }
    setSelectedPlayerModal(null);
  }, [players, tournamentInfo, handleEnterScore]);

  const handleApproveResult = useCallback(async (pendingResult) => {
    setIsSubmitting(true);
    try {
      await handleResultSubmit({
        player1: pendingResult.player1_name,
        player2: pendingResult.player2_name,
        score1: pendingResult.score1,
        score2: pendingResult.score2,
        round: pendingResult.round,
      });
      await supabase.from('pending_results').delete().eq('id', pendingResult.id);

      toast.success("Result has been approved and standings are updated.");
    } catch (error) {
      toast.error(`Failed to approve result: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [handleResultSubmit]);

  const handleRejectResult = useCallback(async (id) => {
    const { error } = await supabase.from('pending_results').delete().eq('id', id);
    if (error) {
      toast.error(`Failed to reject result: ${error.message}`);
    } else {

      toast.success("Result has been rejected.");
    }
  }, []);

  const getTournamentState = () => {
      if (!tournamentInfo) return 'NO_TOURNAMENT';
      if (tournamentInfo.status === 'completed') return 'TOURNAMENT_COMPLETE';
      const currentRound = tournamentInfo.currentRound || 1;
      const pairingsForCurrentRound = tournamentInfo.pairing_schedule?.[currentRound];
      if (pairingsForCurrentRound || tournamentInfo.type === 'best_of_league') {
        const resultsForCurrentRound = recentResults.filter((r) => r.round === currentRound);
        const expectedResults = (pairingsForCurrentRound || []).filter(p => p.player2.name !== 'BYE').length;

        if (tournamentInfo.type === 'best_of_league') {
          const matchesForRound = players.length / 2;
          const completedMatches = matches.filter(m => m.round === currentRound && m.status === 'complete').length;
          if (completedMatches >= matchesForRound) return 'ROUND_COMPLETE';
          return 'ROUND_IN_PROGRESS';
        } else {
          if (resultsForCurrentRound.length >= expectedResults) return 'ROUND_COMPLETE';
          return 'ROUND_IN_PROGRESS';
        }
      }
      const state = (players || []).length >= 2 ? 'ROSTER_READY' : 'EMPTY_ROSTER';
      return state;
  };

  const tournamentState = getTournamentState();
  const handlers = useMemo(() => ({
    handleRoundPaired,
    handleManualPairingsSaved,
    handleEnterScore,
    handleCompleteRound,
    handleApproveResult,
    handleRejectResult,
    setSelectedPlayerModal,
    isSubmitting,
    handleUnpairRound,
    isLoading
  }), [handleRoundPaired, handleManualPairingsSaved, handleEnterScore, handleCompleteRound, handleApproveResult, handleRejectResult, isSubmitting, handleUnpairRound, isLoading]);
  const currentRoundMatches = useMemo(() => 
      matches.filter(m => m.round === tournamentInfo?.currentRound), 
      [matches, tournamentInfo?.currentRound]
  );

  // Filter players by status (active, withdrawn, disqualified)
  const activePlayers = useMemo(() => {
    return players.filter(p => p.status === 'active' || !p.status);
  }, [players]);

  // Filter matches by status
  const pendingMatches = useMemo(() => {
    return matches.filter(m => m.status === 'pending');
  }, [matches]);

  const completedMatches = useMemo(() => {
    return matches.filter(m => m.status === 'complete');
  }, [matches]);

  const inProgressMatches = useMemo(() => {
    return matches.filter(m => m.status === 'in_progress');
  }, [matches]);

  // Get tournament round status
  const roundStatus = useMemo(() => {
    return tournamentInfo?.round_status || {};
  }, [tournamentInfo]);

  // Check if current round is complete
  const isCurrentRoundComplete = useMemo(() => {
    const currentRound = tournamentInfo?.current_round || 1;
    const roundMatches = matches.filter(m => m.round === currentRound);
    return roundMatches.length > 0 && roundMatches.every(m => m.status === 'complete');
  }, [matches, tournamentInfo]);

  // Get tournament configuration
  const tournamentConfig = useMemo(() => {
    return {
      bestOfValue: tournamentInfo?.best_of_value || 15,
      maxSpread: tournamentInfo?.max_spread,
      currentRound: tournamentInfo?.current_round || 1,
      totalRounds: tournamentInfo?.rounds || 1
    };
  }, [tournamentInfo]);

  const handleError = (error, context = 'Operation') => {
    console.error(`${context} error:`, error);
    
    let userMessage = 'An unexpected error occurred.';
    
    if (error?.message?.includes('network')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error?.message?.includes('permission')) {
      userMessage = 'You don\'t have permission to perform this action.';
    } else if (error?.message?.includes('not found')) {
      userMessage = 'The requested resource was not found.';
    } else if (error?.message?.includes('validation')) {
      userMessage = 'Invalid data provided. Please check your input.';
    }
    
    toast.error(`${context} failed: ${userMessage}`);
  };

  const handleSuccess = (message) => {
    toast.success(message);
  };

  if (isLoading) { 
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading Tournament Dashboard...</p>
        </div>
      </div>
    ); 
  }

  if (!tournamentInfo) { 
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Icon name="AlertCircle" size={48} className="text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Tournament not found or access denied.</p>
        </div>
      </div>
    ); 
  }

  // Tournament state calculated successfully
  return (
    <div className="layout-mobile">
      <TickerBar />
      <Toaster position="top-right" richColors />
      <ConfirmationModal
          isOpen={showUnpairModal}
          title="Unpair Last Round"
          message={`Are you sure you want to unpair the last paired round (Round ${lastPairedRound})? ${hasResultsForLastPairedRound ? 'All results entered for this round will be permanently deleted.' : 'This will remove the pairings for that round.'}`}
          onConfirm={confirmUnpairRound}
          onCancel={() => setShowUnpairModal(false)}
          confirmText="Yes, Unpair Last Round"
      />
      <ScoreEntryModal 
          isOpen={showScoreModal.isOpen} 
          onClose={() => setShowScoreModal({ isOpen: false, existingResult: null })} 
          matchup={activeMatchup} 
          onResultSubmit={handleResultSubmit} 
          existingResult={showScoreModal.existingResult}
          tournamentType={tournamentInfo?.type}
          currentMatchScore={activeMatchup?.currentMatchScore}
      />
      <ConfirmationModal
        isOpen={!!pendingScoreAction}
        title={pendingScoreAction?.isEditing ? 'Confirm Edit Result' : 'Confirm Submit Result'}
        message={pendingScoreAction ? `Are you sure you want to ${pendingScoreAction.isEditing ? 'edit' : 'submit'} this result? This action cannot be undone.` : ''}
        onConfirm={doScoreAction}
        onCancel={() => setPendingScoreAction(null)}
        confirmText={pendingScoreAction?.isEditing ? 'Yes, Edit Result' : 'Yes, Submit Result'}
        aria-label="Score confirmation dialog"
      />
      <PlayerStatsModal 
          player={selectedPlayerModal} 
          results={recentResults} 
          onClose={() => setSelectedPlayerModal(null)} 
          onSelectPlayer={(name) => setSelectedPlayerModal(players.find(p => p.name === name))} 
          onEditResult={handleEditResultFromModal}
          teamName={selectedPlayerModal?.team_id ? teamMap.get(selectedPlayerModal.team_id) : null}
          players={players}
          tournamentType={tournamentInfo?.type}
          tournamentId={tournamentInfo?.id}
          matches={matches}
      />
      <main className="layout-mobile-content">
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-20 sm:pb-6">
            {isDesktop ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                    <div className="hidden lg:block">
                      <DashboardSidebar tournamentSlug={tournamentSlug} />
                    </div>
                    <div className="lg:col-span-3">
                      <MainContent {...{ tournamentInfo, players: [...rankedPlayers], recentResults, pendingResults, tournamentState, handlers, teamStandings, matches }} />
                    </div>
                </div>
            ) : ( 
                <div className="space-y-4 sm:space-y-6 w-full">
                    <MainContent {...{ tournamentInfo, players: [...rankedPlayers], recentResults, pendingResults, tournamentState, handlers, teamStandings, matches }} />
                </div>
            )}
        </div>
      </main>
      {!isDesktop && <MobileNavBar tournamentSlug={tournamentSlug} />}
    </div>
  );
};

export default TournamentCommandCenterDashboard;