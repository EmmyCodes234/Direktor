import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';



const ScoreEntryModal = ({ isOpen, onClose, matchup, onResultSubmit, existingResult, tournamentType, currentMatchScore }) => {
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [matchStatus, setMatchStatus] = useState('normal'); // normal, forfeit, withdrawal, bye
  const [forfeitPlayer, setForfeitPlayer] = useState(null); // 'player1', 'player2', or null

  const isEditing = !!existingResult;
  const isBestOfLeague = tournamentType === 'best_of_league';

  // Defensive: always use an object for currentMatchScore
  const safeCurrentMatchScore = currentMatchScore && typeof currentMatchScore === 'object' ? currentMatchScore : {};

  useEffect(() => {
    if (isOpen) {
      setScore1(isEditing ? existingResult.score1 : '');
      setScore2(isEditing ? existingResult.score2 : '');
      setMatchStatus(existingResult?.is_forfeit ? 'forfeit' : existingResult?.is_bye ? 'bye' : 'normal');
      setForfeitPlayer(existingResult?.forfeit_player || null);
    }
  }, [isOpen, isEditing, existingResult]);

  // Defensive: only render if matchup is valid and has player info (AFTER all hooks)
  if (!matchup || (!matchup.player1 && !matchup.player1_name) || (!matchup.player2 && !matchup.player2_name)) return null;

  // Prevent submission if match is complete (best-of-league)
  const isMatchComplete = isBestOfLeague && matchup.status === 'complete';

  const player1Name = isBestOfLeague ? matchup.player1_name : (matchup.player1?.name || '');
  const player2Name = isBestOfLeague ? matchup.player2_name : (matchup.player2?.name || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isMatchComplete) {
      toast.error("This match is already complete and cannot be modified.");
      return;
    }

    setIsLoading(true);

    try {
      let finalScore1 = score1;
      let finalScore2 = score2;

      // Handle special match statuses
      if (matchStatus === 'forfeit') {
        if (forfeitPlayer === 'player1') {
          finalScore1 = 0;
          finalScore2 = 400; // Standard forfeit score
        } else if (forfeitPlayer === 'player2') {
          finalScore1 = 400;
          finalScore2 = 0;
        }
      } else if (matchStatus === 'bye') {
        finalScore1 = 400;
        finalScore2 = 0;
      } else if (matchStatus === 'withdrawal') {
        // Handle withdrawal logic
        if (forfeitPlayer === 'player1') {
          finalScore1 = 0;
          finalScore2 = 400;
        } else if (forfeitPlayer === 'player2') {
          finalScore1 = 400;
          finalScore2 = 0;
        }
      } else {
        // Normal match - validate scores
        const num1 = parseInt(score1, 10);
        const num2 = parseInt(score2, 10);
        
        if (isNaN(num1) || isNaN(num2) || num1 < 0 || num2 < 0) {
          toast.error("Please enter valid non-negative scores.");
          setIsLoading(false);
          return;
        }
        
        finalScore1 = num1;
        finalScore2 = num2;
      }

      const resultData = {
        tournament_id: matchup.tournament_id,
        round: matchup.round,
        player1_id: matchup.player1_id,
        player2_id: matchup.player2_id,
        score1: finalScore1,
        score2: finalScore2,
        match_id: matchup.id,
        is_bye: matchStatus === 'bye',
        is_forfeit: matchStatus === 'forfeit',
        forfeit_player: forfeitPlayer,
        player1_starts: matchup.player1_starts || false,
        player2_starts: matchup.player2_starts || false
      };

      await onResultSubmit(resultData, isEditing);
      onClose();
    } catch (error) {
      console.error('Error submitting result:', error);
      toast.error('Failed to submit result. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchStatusChange = (status) => {
    setMatchStatus(status);
    if (status === 'normal') {
      setForfeitPlayer(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {isEditing ? 'Edit Result' : 'Submit Result'}
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {isMatchComplete && (
              <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-md">
                <p className="text-sm text-warning-foreground">
                  ⚠️ This match is already complete and cannot be modified.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Match Status Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Match Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('normal')}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      matchStatus === 'normal' 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                  >
                    Normal Match
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('forfeit')}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      matchStatus === 'forfeit' 
                        ? 'bg-destructive text-destructive-foreground border-destructive' 
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                  >
                    Forfeit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('withdrawal')}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      matchStatus === 'withdrawal' 
                        ? 'bg-warning text-warning-foreground border-warning' 
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                  >
                    Withdrawal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('bye')}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      matchStatus === 'bye' 
                        ? 'bg-secondary text-secondary-foreground border-secondary' 
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                  >
                    Bye
                  </button>
                </div>
              </div>

              {/* Forfeit/Withdrawal Player Selection */}
              {(matchStatus === 'forfeit' || matchStatus === 'withdrawal') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {matchStatus === 'forfeit' ? 'Forfeiting Player' : 'Withdrawing Player'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForfeitPlayer('player1')}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        forfeitPlayer === 'player1' 
                          ? 'bg-destructive text-destructive-foreground border-destructive' 
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                    >
                      {player1Name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForfeitPlayer('player2')}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        forfeitPlayer === 'player2' 
                          ? 'bg-destructive text-destructive-foreground border-destructive' 
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                    >
                      {player2Name}
                    </button>
                  </div>
                </div>
              )}

              {/* Score Inputs (only for normal matches) */}
              {matchStatus === 'normal' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{player1Name}</label>
                    <Input
                      type="number"
                      value={score1}
                      onChange={(e) => setScore1(e.target.value)}
                      placeholder="Score"
                      min="0"
                      disabled={isMatchComplete}
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{player2Name}</label>
                    <Input
                      type="number"
                      value={score2}
                      onChange={(e) => setScore2(e.target.value)}
                      placeholder="Score"
                      min="0"
                      disabled={isMatchComplete}
                      className="text-center"
                    />
                  </div>
                </div>
              )}

              {/* Status Display */}
              {matchStatus !== 'normal' && (
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {matchStatus === 'forfeit' && forfeitPlayer && 
                      `${forfeitPlayer === 'player1' ? player1Name : player2Name} forfeits`
                    }
                    {matchStatus === 'withdrawal' && forfeitPlayer && 
                      `${forfeitPlayer === 'player1' ? player1Name : player2Name} withdraws`
                    }
                    {matchStatus === 'bye' && 
                      `${player1Name} receives a bye`
                    }
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={isLoading}
                  disabled={isMatchComplete || (matchStatus === 'normal' && (!score1 || !score2)) || 
                           ((matchStatus === 'forfeit' || matchStatus === 'withdrawal') && !forfeitPlayer)}
                >
                  {isEditing ? 'Update' : 'Submit'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScoreEntryModal;