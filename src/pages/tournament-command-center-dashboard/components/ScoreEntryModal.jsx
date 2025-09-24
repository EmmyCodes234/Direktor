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
  const [byePlayer, setByePlayer] = useState(null); // 'player1', 'player2', or null

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
      setByePlayer(existingResult?.bye_player || null);
    }
  }, [isOpen, isEditing, existingResult]);

  // Defensive: only render if matchup is valid and has player info (AFTER all hooks)
  if (!matchup || (!matchup.player1 && !matchup.player1_name) || (!matchup.player2 && !matchup.player2_name)) return null;

  // Check if match is complete - for best_of_league check status, for others check if result exists
  const isMatchComplete = isBestOfLeague ? 
    matchup.status === 'complete' : 
    !!existingResult;

  const player1Name = isBestOfLeague ? matchup.player1_name : (matchup.player1?.name || '');
  const player2Name = isBestOfLeague ? matchup.player2_name : (matchup.player2?.name || '');

  // Debug logging to understand matchup structure
  console.log('ScoreEntryModal debug:', {
    matchup,
    player1Name,
    player2Name,
    player1Id: matchup.player1?.player_id || matchup.player1_id,
    player2Id: matchup.player2?.player_id || matchup.player2_id,
    isBestOfLeague,
    isMatchComplete,
    existingResult
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isMatchComplete) {
      toast.error("This match is already complete and cannot be modified.");
      return;
    }

    // Validate bye selection
    if (matchStatus === 'bye' && !byePlayer) {
      toast.error("Please select which player receives the bye");
      return;
    }

    // Validate forfeit/withdrawal selection
    if ((matchStatus === 'forfeit' || matchStatus === 'withdrawal') && !forfeitPlayer) {
      toast.error("Please select which player forfeits/withdraws");
      return;
    }

    setIsLoading(true);

    try {
      let finalScore1 = score1;
      let finalScore2 = score2;

      // Handle special match statuses
      if (matchStatus === 'forfeit' || matchStatus === 'withdrawal') {
        // Forfeit and withdrawal have the same scoring logic
        if (forfeitPlayer === 'player1') {
          finalScore1 = 0;
          finalScore2 = 400; // Standard forfeit/withdrawal score
        } else if (forfeitPlayer === 'player2') {
          finalScore1 = 400;
          finalScore2 = 0;
        }
      } else if (matchStatus === 'bye') {
        if (byePlayer === 'player1') {
          finalScore1 = 400;
          finalScore2 = 0;
        } else if (byePlayer === 'player2') {
          finalScore1 = 0;
          finalScore2 = 400;
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

      // Get player IDs correctly
      const player1Id = matchup.player1_id || matchup.player1?.player_id || matchup.player1?.id;
      const player2Id = matchup.player2_id || matchup.player2?.player_id || matchup.player2?.id;

      const resultData = {
        tournament_id: matchup.tournament_id,
        round: matchup.round,
        player1_id: player1Id,
        player2_id: player2Id,
        player1: player1Name,
        player2: player2Name,
        score1: finalScore1,
        score2: finalScore2,
        match_id: matchup.id,
        is_bye: matchStatus === 'bye',
        is_forfeit: matchStatus === 'forfeit' || matchStatus === 'withdrawal',
        forfeit_player: forfeitPlayer,
        bye_player: byePlayer
      };

      // For bye matches, ensure the correct player gets the bye score and proper player IDs
      if (matchStatus === 'bye' && byePlayer) {
        if (byePlayer === 'player1') {
          resultData.score1 = 400;
          resultData.score2 = 0;
          resultData.bye_player = 'player1';
          // Ensure player2 is marked as BYE
          resultData.player2 = 'BYE';
          resultData.player2_id = null;
        } else {
          resultData.score1 = 0;
          resultData.score2 = 400;
          resultData.bye_player = 'player2';
          // Ensure player1 is marked as BYE
          resultData.player1 = 'BYE';
          resultData.player1_id = null;
        }
      }
      
      // For forfeit/withdrawal matches, ensure the correct player gets the forfeit score
      if ((matchStatus === 'forfeit' || matchStatus === 'withdrawal') && forfeitPlayer) {
        if (forfeitPlayer === 'player1') {
          resultData.score1 = 0;
          resultData.score2 = 400;
          resultData.forfeit_player = 'player1';
        } else {
          resultData.score1 = 400;
          resultData.score2 = 0;
          resultData.forfeit_player = 'player2';
        }
      }

      console.log('ScoreEntryModal submitting resultData:', resultData);

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
    if (isMatchComplete) return; // Prevent changes if match is complete
    
    setMatchStatus(status);
    if (status === 'normal') {
      setForfeitPlayer(null);
      setByePlayer(null);
    } else if (status === 'bye') {
      setForfeitPlayer(null);
      // Default to player1 for bye, but user can change
      setByePlayer('player1');
    } else if (status === 'forfeit' || status === 'withdrawal') {
      setByePlayer(null);
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
            className={`bg-background rounded-lg shadow-xl max-w-md w-full p-6 relative ${
              isMatchComplete ? 'opacity-75' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Greyed out overlay for completed matches */}
            {isMatchComplete && (
              <div className="absolute inset-0 bg-gray-500/20 rounded-lg pointer-events-none z-10" />
            )}
            
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
              <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-md">
                <div className="flex items-center space-x-2">
                  <Icon name="CheckCircle" size={16} className="text-success" />
                  <p className="text-sm text-success-foreground font-medium">
                    ✅ Match Complete
                  </p>
                </div>
                <p className="text-xs text-success-foreground/80 mt-1">
                  {existingResult ? 
                    `Result: ${existingResult.score1} - ${existingResult.score2}` : 
                    'This match has been completed and cannot be modified.'
                  }
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
                    disabled={isMatchComplete}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      matchStatus === 'normal' 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background border-border hover:bg-muted'
                    } ${isMatchComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Normal Match
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('forfeit')}
                    disabled={isMatchComplete}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      matchStatus === 'forfeit' 
                        ? 'bg-destructive text-destructive-foreground border-destructive' 
                        : 'bg-background border-border hover:bg-muted'
                    } ${isMatchComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Forfeit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('withdrawal')}
                    disabled={isMatchComplete}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      matchStatus === 'withdrawal' 
                        ? 'bg-warning text-warning-foreground border-warning' 
                        : 'bg-background border-border hover:bg-muted'
                    } ${isMatchComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Withdrawal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('bye')}
                    disabled={isMatchComplete}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      matchStatus === 'bye' 
                        ? 'bg-secondary text-secondary-foreground border-secondary' 
                        : 'bg-background border-border hover:bg-muted'
                    } ${isMatchComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Bye
                  </button>
                </div>
              </div>

              {/* Bye Player Selection */}
              {matchStatus === 'bye' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Player Receiving Bye
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setByePlayer('player1')}
                      disabled={isMatchComplete}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        byePlayer === 'player1' 
                          ? 'bg-secondary text-secondary-foreground border-secondary' 
                          : 'bg-background border-border hover:bg-muted'
                      } ${isMatchComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {player1Name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setByePlayer('player2')}
                      disabled={isMatchComplete}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        byePlayer === 'player2' 
                          ? 'bg-secondary text-secondary-foreground border-secondary' 
                          : 'bg-background border-border hover:bg-muted'
                      } ${isMatchComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {player2Name}
                    </button>
                  </div>
                </div>
              )}

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
                      disabled={isMatchComplete}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        forfeitPlayer === 'player1' 
                          ? 'bg-destructive text-destructive-foreground border-destructive' 
                          : 'bg-background border-border hover:bg-muted'
                      } ${isMatchComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {player1Name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForfeitPlayer('player2')}
                      disabled={isMatchComplete}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        forfeitPlayer === 'player2' 
                          ? 'bg-destructive text-destructive-foreground border-destructive' 
                          : 'bg-background border-border hover:bg-muted'
                      } ${isMatchComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    {matchStatus === 'bye' && byePlayer && 
                      `${byePlayer === 'player1' ? player1Name : player2Name} receives a bye`
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
                  {isMatchComplete ? 'Close' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={isLoading}
                  disabled={isMatchComplete || 
                           (matchStatus === 'normal' && (!score1 || !score2)) || 
                           ((matchStatus === 'forfeit' || matchStatus === 'withdrawal') && !forfeitPlayer) ||
                           (matchStatus === 'bye' && !byePlayer)}
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