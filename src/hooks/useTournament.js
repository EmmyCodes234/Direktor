import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchTournamentBySlug, 
  updateTournament,
  deleteTournament 
} from '../store/slices/tournamentsSlice';
import { fetchTournamentPlayers } from '../store/slices/playersSlice';
import { 
  fetchTournamentResults, 
  fetchPendingResults,
  submitResult,
  updateResult,
  deleteResult,
  approvePendingResult,
  rejectPendingResult
} from '../store/slices/resultsSlice';
import { useUser } from '../store/hooks';
import { toast } from 'sonner';

export const useTournament = (tournamentSlug) => {
  const dispatch = useAppDispatch();
  const user = useUser();
  const { current: tournament, loading, error } = useAppSelector(state => state.tournaments);
  const { list: players, loading: playersLoading } = useAppSelector(state => state.players);
  const { list: results, pending: pendingResults, loading: resultsLoading } = useAppSelector(state => state.results);

  // Fetch tournament data
  const fetchTournamentData = useCallback(async () => {
    if (!tournamentSlug) return;
    
    try {
      await dispatch(fetchTournamentBySlug(tournamentSlug)).unwrap();
    } catch (error) {
      toast.error(`Failed to load tournament: ${error.message}`);
    }
  }, [dispatch, tournamentSlug]);

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    if (!tournament?.id) return;
    
    try {
      await dispatch(fetchTournamentPlayers(tournament.id)).unwrap();
    } catch (error) {
      toast.error(`Failed to load players: ${error.message}`);
    }
  }, [dispatch, tournament?.id]);

  // Fetch results
  const fetchResults = useCallback(async () => {
    if (!tournament?.id) return;
    
    try {
      await Promise.all([
        dispatch(fetchTournamentResults(tournament.id)).unwrap(),
        dispatch(fetchPendingResults(tournament.id)).unwrap()
      ]);
    } catch (error) {
      toast.error(`Failed to load results: ${error.message}`);
    }
  }, [dispatch, tournament?.id]);

  // Security check
  const canAccessTournament = useMemo(() => {
    if (!user || !tournament) return false;
    return tournament.user_id === user.id;
  }, [user, tournament]);

  // Tournament state calculation
  const tournamentState = useMemo(() => {
    if (!tournament) return 'NO_TOURNAMENT';
    if (tournament.status === 'completed') return 'TOURNAMENT_COMPLETE';
    
    const currentRound = tournament.currentRound || 1;
    const pairingsForCurrentRound = tournament.pairing_schedule?.[currentRound];
    
    if (pairingsForCurrentRound || tournament.type === 'best_of_league') {
      const resultsForCurrentRound = results.filter((r) => r.round === currentRound);
      const expectedResults = (pairingsForCurrentRound || []).filter(p => p.player2?.name !== 'BYE').length;

      if (tournament.type === 'best_of_league') {
        const matchesForRound = players.length / 2;
        const completedMatches = results.filter(m => m.round === currentRound).length;
        if (completedMatches >= matchesForRound) return 'ROUND_COMPLETE';
        return 'ROUND_IN_PROGRESS';
      } else {
        if (resultsForCurrentRound.length >= expectedResults) return 'ROUND_COMPLETE';
        return 'ROUND_IN_PROGRESS';
      }
    }
    
    return (players || []).length >= 2 ? 'ROSTER_READY' : 'EMPTY_ROSTER';
  }, [tournament, players, results]);

  // Actions
  const updateTournamentData = useCallback(async (updates) => {
    if (!tournament?.id) return;
    
    try {
      await dispatch(updateTournament({ id: tournament.id, updates })).unwrap();
      toast.success('Tournament updated successfully');
    } catch (error) {
      toast.error(`Failed to update tournament: ${error.message}`);
    }
  }, [dispatch, tournament?.id]);

  const deleteTournamentData = useCallback(async () => {
    if (!tournament?.id || !user?.id) return;
    
    try {
      await dispatch(deleteTournament({ id: tournament.id, userId: user.id })).unwrap();
      toast.success('Tournament deleted successfully');
      return true;
    } catch (error) {
      toast.error(`Failed to delete tournament: ${error.message}`);
      return false;
    }
  }, [dispatch, tournament?.id, user?.id]);

  const submitTournamentResult = useCallback(async (resultData) => {
    if (!tournament?.id) return;
    
    try {
      await dispatch(submitResult({ ...resultData, tournament_id: tournament.id })).unwrap();
      toast.success('Result submitted successfully');
    } catch (error) {
      toast.error(`Failed to submit result: ${error.message}`);
    }
  }, [dispatch, tournament?.id]);

  const updateTournamentResult = useCallback(async (resultId, updates) => {
    try {
      await dispatch(updateResult({ id: resultId, updates })).unwrap();
      toast.success('Result updated successfully');
    } catch (error) {
      toast.error(`Failed to update result: ${error.message}`);
    }
  }, [dispatch]);

  const deleteTournamentResult = useCallback(async (resultId) => {
    try {
      await dispatch(deleteResult(resultId)).unwrap();
      toast.success('Result deleted successfully');
    } catch (error) {
      toast.error(`Failed to delete result: ${error.message}`);
    }
  }, [dispatch]);

  const approveResult = useCallback(async (pendingResultId, resultData) => {
    try {
      await dispatch(approvePendingResult({ pendingResultId, resultData })).unwrap();
      toast.success('Result approved successfully');
    } catch (error) {
      toast.error(`Failed to approve result: ${error.message}`);
    }
  }, [dispatch]);

  const rejectResult = useCallback(async (pendingResultId) => {
    try {
      await dispatch(rejectPendingResult(pendingResultId)).unwrap();
      toast.success('Result rejected successfully');
    } catch (error) {
      toast.error(`Failed to reject result: ${error.message}`);
    }
  }, [dispatch]);

  // Initial data fetch
  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  useEffect(() => {
    if (tournament?.id) {
      fetchPlayers();
      fetchResults();
    }
  }, [tournament?.id, fetchPlayers, fetchResults]);

  return {
    tournament,
    players,
    results,
    pendingResults,
    loading: loading || playersLoading || resultsLoading,
    error,
    tournamentState,
    canAccessTournament,
    actions: {
      updateTournament: updateTournamentData,
      deleteTournament: deleteTournamentData,
      submitResult: submitTournamentResult,
      updateResult: updateTournamentResult,
      deleteResult: deleteTournamentResult,
      approveResult,
      rejectResult,
      refreshData: () => {
        fetchTournamentData();
        fetchPlayers();
        fetchResults();
      }
    }
  };
}; 