import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';
import { Card, CardContent } from 'components/ui/Card';

const RemoteResultsSubmission = () => {
  const { tournamentSlug } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [round, setRound] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentSlug]);

  const fetchTournamentData = async () => {
    if (!tournamentSlug) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch tournament data
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('slug', tournamentSlug)
        .single();

      if (tournamentError) throw tournamentError;
      if (!tournamentData.remote_submission_enabled) {
        throw new Error("Remote submission is not enabled for this tournament");
      }
      setTournament(tournamentData);

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('tournament_players')
        .select('*, players (*)')
        .eq('tournament_id', tournamentData.id);

      if (playersError) throw playersError;

      const enrichedPlayers = playersData.map(tp => ({
        ...tp.players,
        player_id: tp.players.id,
        seed: tp.seed,
        team_id: tp.team_id,
        status: tp.status
      }));
      setPlayers(enrichedPlayers);

    } catch (err) {
      console.error('Error fetching tournament data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!player1 || !player2 || !score1 || !score2 || !round) {
      setError('Please fill in all fields');
      return;
    }

    if (player1 === player2) {
      setError('Please select different players');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { error: submitError } = await supabase
        .from('results')
        .insert({
          tournament_id: tournament.id,
          player1_id: parseInt(player1),
          player2_id: parseInt(player2),
          player1_name: players.find(p => p.id === parseInt(player1))?.name || '',
          player2_name: players.find(p => p.id === parseInt(player2))?.name || '',
          score1: parseInt(score1),
          score2: parseInt(score2),
          round: parseInt(round),
          submitted_remotely: true
        });

      if (submitError) throw submitError;

      setSuccess(true);
      // Reset form
      setPlayer1('');
      setPlayer2('');
      setScore1('');
      setScore2('');
      setRound('');

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Error submitting result:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 bg-muted rounded animate-pulse mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <Icon name="AlertCircle" size={48} className="text-destructive opacity-50 mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Button 
          onClick={() => navigate(`/tournament/${tournamentSlug}`)}
          className="mt-4"
        >
          Back to Tournament
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/20 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/tournament/${tournamentSlug}`)}
            className="flex items-center space-x-2"
          >
            <Icon name="ArrowLeft" size={20} />
            <span>Back to Tournament</span>
          </Button>
          <h1 className="text-xl font-bold text-foreground">Submit Results</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Submit Match Result</h2>
                <p className="text-muted-foreground">
                  Submit the result of a completed match for {tournament?.name}
                </p>
              </div>

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Icon name="CheckCircle" size={20} className="text-green-500" />
                    <span className="text-green-500 font-medium">Result submitted successfully!</span>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Icon name="AlertCircle" size={20} className="text-destructive" />
                    <span className="text-destructive font-medium">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Round
                  </label>
                  <Input
                    type="number"
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    placeholder="Enter round number"
                    min="1"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Player 1
                    </label>
                    <select
                      value={player1}
                      onChange={(e) => setPlayer1(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select Player 1</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Player 1 Score
                    </label>
                    <Input
                      type="number"
                      value={score1}
                      onChange={(e) => setScore1(e.target.value)}
                      placeholder="Score"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Player 2
                    </label>
                    <select
                      value={player2}
                      onChange={(e) => setPlayer2(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select Player 2</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Player 2 Score
                    </label>
                    <Input
                      type="number"
                      value={score2}
                      onChange={(e) => setScore2(e.target.value)}
                      placeholder="Score"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit Result'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RemoteResultsSubmission;