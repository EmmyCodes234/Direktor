// File: TournamentCommandCenterDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TournamentStats from './components/TournamentStats';
import TournamentControl from './components/TournamentControl';
import StandingsTable from './components/StandingsTable';
import ScoreEntryModal from './components/ScoreEntryModal';
import PlayerStatsModal from '../../components/PlayerStatsModal';
import PendingResults from './components/PendingResults';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Toaster, toast } from 'sonner';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { supabase } from '../../supabaseClient';
import DashboardSidebar from './components/DashboardSidebar';
import MobileNavBar from './components/MobileNavBar';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import AnnouncementsManager from './components/AnnouncementsManager';

// Memoized Main Content to prevent unnecessary re-renders
const MainContent = React.memo(({ tournamentInfo, players, recentResults, pendingResults, tournamentState, handlers, teamStandings, matches }) => {
  const navigate = useNavigate();
  const { tournamentSlug } = useParams();
  const {
    handleRoundPaired,
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
    <div className="space-y-6">
      <AnnouncementsManager />
      <TournamentStats players={players} recentResults={recentResults} tournamentInfo={tournamentInfo}/>
      {tournamentInfo?.is_remote_submission_enabled && (
        <PendingResults pending={pendingResults} onApprove={handleApproveResult} onReject={handleRejectResult} />
      )}
      <AnimatePresence mode="wait">
        <motion.div key={tournamentState} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>
          {(tournamentState === 'ROSTER_READY' || tournamentState === 'ROUND_IN_PROGRESS') && <TournamentControl tournamentInfo={tournamentInfo} onRoundPaired={handleRoundPaired} players={players} onEnterScore={handleEnterScore} recentResults={recentResults} onUnpairRound={handleUnpairRound} matches={matches} />}
          {tournamentState === 'ROUND_COMPLETE' && ( <div className="glass-card p-8 text-center"> <Icon name="CheckCircle" size={48} className="mx-auto text-success mb-4" /> <h2 className="text-xl font-bold">Round {tournamentInfo.currentRound} Complete!</h2> <Button size="lg" className="shadow-glow mt-4" onClick={handleCompleteRound} loading={isSubmitting}> {tournamentInfo.currentRound >= tournamentInfo.rounds ? 'Finish Tournament' : `Proceed to Round ${tournamentInfo.currentRound + 1}`} </Button> </div> )}
          {tournamentState === 'TOURNAMENT_COMPLETE' && ( <div className="glass-card p-8 text-center"> <Icon name="Trophy" size={48} className="mx-auto text-warning mb-4" /> <h2 className="text-xl font-bold">Tournament Finished!</h2> <p className="text-muted-foreground mb-4">View the final reports on the reports page.</p> <Button size="lg" onClick={() => navigate(`/tournament/${tournamentSlug}/reports`)}>View Final Reports</Button> </div> )}
        </motion.div>
      </AnimatePresence>
      {(tournamentState === 'ROUND_IN_PROGRESS' || tournamentState === 'ROUND_COMPLETE' || tournamentState === 'TOURNAMENT_COMPLETE') &&
        <StandingsTable players={players} recentResults={recentResults} onSelectPlayer={setSelectedPlayerModal} tournamentType={tournamentInfo?.type} teamStandings={teamStandings} isLoading={isLoading}/>}
    </div>
  );
});

const TournamentCommandCenterDashboard = () => {
  const { tournamentSlug } = useParams();
  const [players, setPlayers] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [tournamentInfo, setTournamentInfo] = useState(null);
  const [pendingResults, setPendingResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState({ isOpen: false, existingResult: null });
  const [activeMatchup, setActiveMatchup] = useState(null);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showUnpairModal, setShowUnpairModal] = useState(false);
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [playerStatsMap, setPlayerStatsMap] = useState(new Map());

  const fetchTournamentData = useCallback(async () => {
    if (!tournamentSlug) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    try {
      const { data: tournamentData, error: tErr } = await supabase
        .from('tournaments')
        .select(`*, tournament_players(*, players(id, name, rating, photo_url, slug))`)
        .eq('slug', tournamentSlug)
        .single();

      if (tErr || !tournamentData) throw tErr || new Error("Tournament not found");

      const combinedPlayers = tournamentData.tournament_players.map(tp => ({
        ...tp.players,
        ...tp
      }));
      
      setPlayers(combinedPlayers);
      setTournamentInfo(tournamentData);

      const promises = [
        supabase.from('results').select('*').eq('tournament_id', tournamentData.id).order('created_at', { ascending: false }),
        supabase.from('pending_results').select('*').eq('tournament_id', tournamentData.id).eq('status', 'pending').order('created_at', { ascending: true }),
        supabase.from('teams').select('*').eq('tournament_id', tournamentData.id),
        supabase.from('matches').select('*').eq('tournament_id', tournamentData.id)
      ];

      const [{ data: resultsData }, { data: pendingData }, { data: teamsData }, { data: matchesData }] = await Promise.all(promises);
      
      setRecentResults(resultsData || []);
      setPendingResults(pendingData || []);
      setTeams(teamsData || []);
      setMatches(matchesData || []);

    } catch (error) {
      console.error("Error fetching tournament:", error);
      toast.error(`A critical error occurred: ${error.message}`);
      setTournamentInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentSlug]);

  useEffect(() => {
    const channel = supabase.channel(`dashboard-updates-for-tournament-${tournamentInfo?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const { table, eventType, new: newRecord, old: oldRecord } = payload;
        
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
              setPlayers(prev => prev.map(p => p.player_id === newRecord.player_id ? { ...p, ...newRecord } : p));
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
    const resultsByRound = recentResults.reduce((acc, result) => {
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
  }, [players, recentResults, teams, tournamentInfo]);

  const rankedPlayers = useMemo(() => {
    return players.sort((a, b) => {
      if (tournamentInfo?.type === 'best_of_league') {
        if ((a.match_wins || 0) !== (b.match_wins || 0)) return (b.match_wins || 0) - (a.match_wins || 0);
      }
      
      const aGameScore = (a.wins || 0) + (a.ties || 0) * 0.5;
      const bGameScore = (b.wins || 0) + (b.ties || 0) * 0.5;
      if (aGameScore !== bGameScore) return bGameScore - aGameScore;

      return (b.spread || 0) - (a.spread || 0);
    }).map((player, index) => ({ ...player, rank: index + 1 }));
  }, [players, tournamentInfo]);

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
    if (!resultData.match_id) return;
    const { data: allMatchResults, error: resultsError } = await supabase
      .from('results')
      .select('score1, score2, player1_id, player2_id')
      .eq('match_id', resultData.match_id);

    if (resultsError) throw resultsError;

    const p1GameWins = allMatchResults.filter(r => r.score1 > r.score2 && r.player1_id === player1.player_id).length;
    const p2GameWins = allMatchResults.filter(r => r.score2 > r.score1 && r.player2_id === player2.player_id).length;
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
      await supabase.from('matches').update({ winner_id: winnerId, status: 'complete' }).eq('id', resultData.match_id);
      
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

      p1NewStats.match_wins = (p1NewStats.player_id === winnerId ? (winnerCurrent.match_wins || 0) + 1 : (p1NewStats.match_wins || 0));
      p1NewStats.match_losses = (p1NewStats.player_id === loserId ? (loserCurrent.match_losses || 0) + 1 : (p1NewStats.match_losses || 0));
      p2NewStats.match_wins = (p2NewStats.player_id === winnerId ? (winnerCurrent.match_wins || 0) + 1 : (p2NewStats.match_wins || 0));
      p2NewStats.match_losses = (p2NewStats.player_id === loserId ? (loserCurrent.match_losses || 0) + 1 : (p2NewStats.match_losses || 0));
      
      toast.success(`${player1.name} vs ${player2.name} match is complete. Winner: ${winnerId === player1.player_id ? player1.name : player2.name}.`);
    }
  }, [tournamentInfo, players]);


  const handleResultSubmit = useCallback(async (result, isEditing = false) => {
    setIsSubmitting(true);
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

      if (!isEditing) {
        const { data: existingResult, error: fetchError } = await supabase
          .from('results')
          .select('id, score1, score2, player1_id, player2_id')
          .eq('tournament_id', tournamentInfo.id)
          .eq('round', resultData.round)
          .or(`and(player1_id.eq.${player1.player_id},player2_id.eq.${player2.player_id}),and(player1_id.eq.${player2.player_id},player2_id.eq.${player1.player_id})`)
          .single();
          
        if (existingResult) {
          isEditing = true;
          originalResult = existingResult;
          resultData.id = existingResult.id;
        }
      }

      // Fetch current stats for both players in one go
      const playerIdsToFetch = isEditing ? [originalResult.player1_id, originalResult.player2_id] : [player1.player_id, player2.player_id];
      const { data: currentStats, error: statsError } = await supabase
          .from('tournament_players')
          .select('player_id, wins, losses, ties, spread, match_wins, match_losses')
          .in('player_id', playerIdsToFetch)
          .eq('tournament_id', tournamentInfo.id);

      if (statsError) throw statsError;

      const player1Stats = currentStats.find(s => s.player_id === player1.player_id) || {};
      const player2Stats = currentStats.find(s => s.player_id === player2.player_id) || {};

      // Initialize with current stats or default to 0
      let p1NewStats = { ...player1Stats };
      let p2NewStats = { ...player2Stats };

      if (isEditing) {
        if (!originalResult?.id || isNaN(originalResult.id)) {
          throw new Error("Invalid result ID for editing.");
        }
        // Revert old stats
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

        const { error: updateError } = await supabase.from('results').update(resultData).eq('id', originalResult.id);
        if (updateError) throw updateError;
        toast.success("Result updated successfully!");
      } else {
        const { error: insertError } = await supabase.from('results').insert(resultData);
        if (insertError) throw insertError;
        toast.success("Result submitted successfully!");
      }

      // Update with new result
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
        await updateBestOfLeagueMatch(resultData, p1NewStats, p2NewStats, player1, player2);
      }
      
      const { error: updateError } = await supabase
        .from('tournament_players')
        .upsert([
          { player_id: player1.player_id, tournament_id: tournamentInfo.id, wins: p1NewStats.wins, losses: p1NewStats.losses, ties: p1NewStats.ties, spread: p1NewStats.spread, match_wins: p1NewStats.match_wins, match_losses: p1NewStats.match_losses },
          { player_id: player2.player_id, tournament_id: tournamentInfo.id, wins: p2NewStats.wins, losses: p2NewStats.losses, ties: p2NewStats.ties, spread: p2NewStats.spread, match_wins: p2NewStats.match_wins, match_losses: p2NewStats.match_losses },
        ], { onConflict: ['player_id', 'tournament_id'] });

      if (updateError) throw updateError;

      // Update local state directly with the new stats to force a re-render
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
      // Removed the fetchTournamentData call here to avoid redundancy and potential race conditions
    }
  }, [players, tournamentInfo, updateBestOfLeagueMatch]);

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
    
    if (tournamentInfo.type === 'best_of_league') {
      finalMatchup.player1_name = finalMatchup.player1.name;
      finalMatchup.player2_name = finalMatchup.player2.name;
    }

    if (!finalMatchup.player1 || !finalMatchup.player2) {
      toast.error("Could not find player details for this match.");
      return;
    }

    setActiveMatchup(finalMatchup);
    setShowScoreModal({ isOpen: true, existingResult: existingResult });
  }, [players, tournamentInfo]);
  
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
          const resultsForCurrentRound = recentResults.filter(r => r.round === currentRound);
          const expectedResults = (pairingsForCurrentRound || []).filter(p => p.player2.name !== 'BYE').length;

          if (tournamentInfo.type === 'best_of_league') {
              const matchesForRound = players.length / 2;
              const completedMatches = matches.filter(m => m.round === currentRound && m.status === 'complete').length;
              if (completedMatches >= matchesForRound) return 'ROUND_COMPLETE';
          } else {
              if (resultsForCurrentRound.length >= expectedResults) return 'ROUND_IN_PROGRESS';
              if (resultsForCurrentRound.length >= expectedResults) return 'ROUND_COMPLETE';
          }
          return 'ROUND_IN_PROGRESS';
      }
      return (players || []).length >= 2 ? 'ROSTER_READY' : 'EMPTY_ROSTER';
  };

  const tournamentState = getTournamentState();
  const handlers = useMemo(() => ({
    handleRoundPaired,
    handleEnterScore,
    handleCompleteRound,
    handleApproveResult,
    handleRejectResult,
    setSelectedPlayerModal,
    isSubmitting,
    handleUnpairRound,
    isLoading
  }), [handleRoundPaired, handleEnterScore, handleCompleteRound, handleApproveResult, handleRejectResult, isSubmitting, handleUnpairRound, isLoading]);
  const currentRoundMatches = useMemo(() => 
      matches.filter(m => m.round === tournamentInfo?.currentRound), 
      [matches, tournamentInfo?.currentRound]
  );

  if (isLoading) { return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading Dashboard...</p></div>; }
  if (!tournamentInfo) { return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Tournament not found.</p></div>; }

  return (
    <div className="min-h-screen bg-background">
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
      <main className="pt-20 pb-24 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {isDesktop ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1"><DashboardSidebar tournamentSlug={tournamentSlug} /></div>
                    <div className="md:col-span-3"><MainContent {...{ tournamentInfo, players: rankedPlayers, recentResults, pendingResults, tournamentState, handlers, teamStandings, matches: currentRoundMatches }} /></div>
                </div>
            ) : ( 
                <MainContent {...{ tournamentInfo, players: rankedPlayers, recentResults, pendingResults, tournamentState, handlers, teamStandings, matches: currentRoundMatches }} />
            )}
        </div>
      </main>
      {!isDesktop && <MobileNavBar tournamentSlug={tournamentSlug} />}
    </div>
  );
};

export default TournamentCommandCenterDashboard;