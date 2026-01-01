import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import ClassicalPairingsTable from 'components/ClassicalPairingsTable';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import ShareButton from 'components/ui/ShareButton';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import ReportFooter from 'components/public/ReportFooter';
import PlayerStatsModal from 'components/PlayerStatsModal';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import { applyGibsonRuleToPairings } from '../utils/gibsonRule';

const PublicTournamentPairings = () => {
  const { tournamentSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract round from query parameters
  const searchParams = new URLSearchParams(location.search);
  const roundParam = searchParams.get('round');
  const selectedRound = roundParam ? parseInt(roundParam) : null;

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentSlug]);

  const generatePairings = () => {
    // First, check if tournament has pairing_schedule data
    if (tournament?.pairing_schedule) {
      // Get pairings for the selected round or all rounds
      if (selectedRound && tournament.pairing_schedule[selectedRound]) {
        // Format pairing schedule data for display
        return tournament.pairing_schedule[selectedRound].map((pairing, index) => ({
          id: `pairing-${selectedRound}-${index}`,
          round: selectedRound,
          player1_id: pairing.player1?.player_id || pairing.player1_id,
          player2_id: pairing.player2?.player_id || pairing.player2_id,
          player1_name: pairing.player1?.name || 'Unknown Player',
          player2_name: pairing.player2?.name || 'Unknown Player',
          player1: pairing.player1,
          player2: pairing.player2,
          table: pairing.table
        }));
      } else if (!selectedRound) {
        // Return all pairings from all rounds
        const allPairings = [];
        Object.keys(tournament.pairing_schedule).forEach(roundNum => {
          const roundPairings = tournament.pairing_schedule[roundNum];
          roundPairings.forEach((pairing, index) => {
            allPairings.push({
              id: `pairing-${roundNum}-${index}`,
              round: parseInt(roundNum),
              player1_id: pairing.player1?.player_id || pairing.player1_id,
              player2_id: pairing.player2?.player_id || pairing.player2_id,
              player1_name: pairing.player1?.name || 'Unknown Player',
              player2_name: pairing.player2?.name || 'Unknown Player',
              player1: pairing.player1,
              player2: pairing.player2,
              table: pairing.table
            });
          });
        });
        return allPairings;
      }
    }

    // For best of league tournaments, use matches data directly if available
    if (tournament?.type === 'best_of_league' && matches.length > 0) {
      let matchPairings = matches;

      // If a specific round is selected, only show pairings for that round
      if (selectedRound) {
        matchPairings = matches.filter(m => m.round === selectedRound);
      }

      // Enrich matches with player names
      return matchPairings.map(match => ({
        ...match,
        player1_name: getPlayerName(match.player1_id),
        player2_name: getPlayerName(match.player2_id)
      }));
    }

    // For other tournament types or when no matches data, use results data
    if (!results.length) return [];

    const rounds = [...new Set(results.map(r => r.round))];
    const pairings = [];

    rounds.forEach(round => {
      // Skip if we're filtering by round and this isn't the selected round
      if (selectedRound && round !== selectedRound) return;

      const roundResults = results.filter(r => r.round === round);
      const uniqueMatches = new Map();

      roundResults.forEach(result => {
        const matchKey = `${Math.min(result.player1_id, result.player2_id)}-${Math.max(result.player1_id, result.player2_id)}-${round}`;

        if (!uniqueMatches.has(matchKey)) {
          // Create a pairing with aggregated result data
          const pairing = {
            id: matchKey,
            key: matchKey,
            round,
            player1_id: result.player1_id,
            player2_id: result.player2_id,
            player1_name: getPlayerName(result.player1_id),
            player2_name: getPlayerName(result.player2_id),
            player1_team_id: result.player1_team_id,
            player2_team_id: result.player2_team_id,
            // For single game tournaments, use the result directly
            score1: result.score1,
            score2: result.score2,
            winner_id: result.winner_id
          };

          uniqueMatches.set(matchKey, pairing);
        }
      });

      pairings.push(...Array.from(uniqueMatches.values()));
    });

    // Apply Gibson rule if enabled
    if (tournament?.gibson_rule_enabled && tournament?.currentRound) {
      const totalRounds = tournament.rounds || 10;
      const prizeCount = tournament.prizes?.length || 3;
      return applyGibsonRuleToPairings(pairings, players, tournament.currentRound, totalRounds, prizeCount, tournament?.type);
    }

    return pairings;
  };

  // Sorting Logic - Moved to top to prevent "Rendered more hooks" error
  const pairings = generatePairings();
  const sortParam = searchParams.get('sort');

  const sortedPairings = useMemo(() => {
    // If not loaded, return empty to prevent errors
    if (!pairings.length) return [];

    let sorted = [...pairings];
    if (sortParam === 'alpha') {
      sorted.sort((a, b) => (a.player1_name || '').localeCompare(b.player1_name || ''));
    } else if (sortParam === 'rank') {
      sorted.sort((a, b) => {
        const r1 = a.player1?.rank || 9999;
        const r2 = b.player1?.rank || 9999;
        return r1 - r2;
      });
    } else {
      sorted.sort((a, b) => a.table - b.table);
    }
    return sorted;
  }, [pairings, sortParam]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tournament
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('slug', tournamentSlug)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('tournament_players')
        .select(`
          *,
          players (*)
        `)
        .eq('tournament_id', tournamentData.id)
        .order('seed', { ascending: true });

      if (playersError) throw playersError;
      const enrichedPlayers = playersData.map((tp, index) => ({
        ...tp.players,
        player_id: tp.players.id,
        seed: tp.seed || tp.initial_seed || (index + 1),
        initial_seed: tp.initial_seed || tp.seed || (index + 1),
        team_id: tp.team_id,
        status: tp.status
      }));
      setPlayers(enrichedPlayers);

      // Fetch results
      const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select('*')
        .eq('tournament_id', tournamentData.id);

      if (resultsError) throw resultsError;
      setResults(resultsData);

      // Fetch matches for best of league tournaments
      if (tournamentData.type === 'best_of_league') {
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .eq('tournament_id', tournamentData.id)
          .order('round', { ascending: true });

        if (!matchesError) {
          setMatches(matchesData);
        }
      }

      // Fetch teams if team tournament
      if (tournamentData.type === 'team') {
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .eq('tournament_id', tournamentData.id);

        if (!teamsError) {
          setTeams(teamsData);
        }
      }

    } catch (err) {
      console.error('Error fetching tournament data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.player_id === playerId);
    return player ? player.name : 'Unknown Player';
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getMatchResult = (match) => {
    // For best of league tournaments, check if match data comes directly from matches table
    if (tournament?.type === 'best_of_league' && match.player1_wins !== undefined && match.player2_wins !== undefined) {
      const p1Wins = match.player1_wins || 0;
      const p2Wins = match.player2_wins || 0;
      const totalGames = p1Wins + p2Wins;
      const winsNeeded = Math.ceil((tournament?.games_per_match || 15) / 2);

      if (totalGames === 0) {
        return { status: 'pending', score: null };
      }

      if (p1Wins >= winsNeeded) {
        return { status: 'completed', winner: 'player1', score: `${p1Wins}-${p2Wins}` };
      } else if (p2Wins >= winsNeeded) {
        return { status: 'completed', winner: 'player2', score: `${p1Wins}-${p2Wins}` };
      } else {
        return { status: 'in_progress', score: `${p1Wins}-${p2Wins}` };
      }
    }

    // For results from the results table
    const matchResults = results.filter(r =>
      r.player1_id === match.player1_id &&
      r.player2_id === match.player2_id &&
      r.round === match.round
    );

    if (matchResults.length === 0) return { status: 'pending', score: null };

    const totalGames = matchResults.length;
    const p1Wins = matchResults.filter(r => r.winner_id === match.player1_id).length;
    const p2Wins = matchResults.filter(r => r.winner_id === match.player2_id).length;

    if (tournament?.type === 'best_of_league') {
      const winsNeeded = Math.ceil((tournament?.games_per_match || 15) / 2);
      if (p1Wins >= winsNeeded) {
        return { status: 'completed', winner: 'player1', score: `${p1Wins}-${p2Wins}` };
      } else if (p2Wins >= winsNeeded) {
        return { status: 'completed', winner: 'player2', score: `${p1Wins}-${p2Wins}` };
      } else {
        return { status: 'in_progress', score: `${p1Wins}-${p2Wins}` };
      }
    } else {
      // Single game format
      const lastResult = matchResults[matchResults.length - 1];
      if (lastResult.winner_id === match.player1_id) {
        return { status: 'completed', winner: 'player1', score: '1-0' };
      } else if (lastResult.winner_id === match.player2_id) {
        return { status: 'completed', winner: 'player2', score: '0-1' };
      } else {
        return { status: 'draw', score: '0.5-0.5' };
      }
    }
  };



  if (loading) {
    return <PublicLoadingScreen />;
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center min-h-screen w-full"
        >
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-4 text-muted-foreground"><Icon name="AlertTriangle" size={48} /></div>
            <h1 className="text-xl font-heading font-bold text-foreground mb-2">Tournament Not Found</h1>
            <p className="text-muted-foreground mb-5">
              {error || "The tournament you're looking for doesn't exist or has been removed."}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate(`/tournament/${tournamentSlug}`)}
            >
              <Icon name="ArrowLeft" className="mr-2" size={16} />
              Back to Tournament
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }



  const rounds = [...new Set(results.map(r => r.round))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-white text-slate-900 tracking-normal">
      {/* Banner */}
      <PublicTournamentBanner tournament={tournament} />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Navigation Row */}
        <div className="relative flex flex-col md:flex-row items-center justify-center mb-8">
          <button
            onClick={() => navigate(`/tournament/${tournamentSlug}`)}
            className="static md:absolute md:left-0 text-blue-700 hover:underline flex items-center gap-1 text-sm font-medium mb-2 md:mb-0"
          >
            <Icon name="ArrowLeft" size={16} />
            Back to Tournament
          </button>
          <div className="text-center">


          </div>
          <div className="hidden md:absolute md:right-0 md:flex">
            <ShareButton
              variant="ghost"
              size="sm"
              shareData={{
                type: 'pairings',
                data: { tournament: tournament.name },
                url: window.location.href
              }}
              platforms={['twitter', 'facebook', 'whatsapp', 'copy']}
              position="bottom-right"
            />
          </div>
        </div>




        {/* Tournament Info Card */}


        {/* Pairings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <ClassicalPairingsTable
            pairings={sortedPairings}
            players={players}
            selectedRound={selectedRound}
          />
        </motion.div>

        <ReportFooter />
      </motion.div>
    </div>
  );
};

export default PublicTournamentPairings;