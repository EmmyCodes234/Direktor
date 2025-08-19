import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import PairingsTable from '../components/PairingsTable';
import { 
  CalendarDays, 
  Users, 
  Trophy, 
  Clock, 
  ChevronLeft,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

const PublicTournamentPairings = () => {
  const { tournamentSlug } = useParams();
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchTournamentData();
  }, [tournamentSlug]);

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
      const enrichedPlayers = playersData.map(tp => ({
        ...tp.players,
        player_id: tp.players.id,
        seed: tp.seed,
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
      const winsNeeded = Math.ceil(totalGames / 2);
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

  const generatePairings = () => {
    if (!results.length) return [];

    const rounds = [...new Set(results.map(r => r.round))];
    const pairings = [];

    rounds.forEach(round => {
      const roundResults = results.filter(r => r.round === round);
      const uniqueMatches = [];

      roundResults.forEach(result => {
        const matchKey = `${Math.min(result.player1_id, result.player2_id)}-${Math.max(result.player1_id, result.player2_id)}`;
        if (!uniqueMatches.find(m => m.key === matchKey)) {
          uniqueMatches.push({
            key: matchKey,
            round,
            player1_id: result.player1_id,
            player2_id: result.player2_id,
            player1_team_id: result.player1_team_id,
            player2_team_id: result.player2_team_id
          });
        }
      });

      pairings.push(...uniqueMatches);
    });

    return pairings;
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-screen"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"
            />
            <p className="text-white/80 text-lg">Loading tournament pairings...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center min-h-screen"
        >
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-white mb-2">Tournament Not Found</h1>
            <p className="text-white/70 mb-6">
              {error || "The tournament you're looking for doesn't exist or has been removed."}
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  const pairings = generatePairings();
  const rounds = [...new Set(results.map(r => r.round))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20" />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <a
              href={`/tournament/${tournamentSlug}`}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{tournament.name}</h1>
              <div className="flex items-center gap-6 text-white/70">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>{new Date(tournament.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{players.length} Players</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>{tournament.type === 'best_of_league' ? 'Best of League' : 'Single Game'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 mb-8"
      >
        <div className="bg-card/90 backdrop-blur-sm border border-border/10 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value=""
                  onChange={() => {}}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            {/* Round Filter */}
            <div className="flex gap-4">
              <select
                value="all"
                onChange={() => {}}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
              >
                <option value="all">All Rounds</option>
                {rounds.map(round => (
                  <option key={round} value={round}>Round {round}</option>
                ))}
              </select>

              <select
                value="round"
                onChange={() => {}}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
              >
                <option value="round">Sort by Round</option>
                <option value="player">Sort by Player</option>
              </select>

              <button
                onClick={fetchTournamentData}
                className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pairings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 pb-8"
      >
        <PairingsTable 
          pairings={generatePairings()}
          tournamentType={tournament?.type}
          isLoading={loading}
        />
      </motion.div>
    </div>
  );
};

export default PublicTournamentPairings; 