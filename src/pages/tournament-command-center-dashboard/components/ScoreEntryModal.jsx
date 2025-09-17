import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';

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
      if (matchStatus === 'forfeit') {
        if (forfeitPlayer === 'player1') {
          finalScore1 = 0;
          finalScore2 = 400; // Standard forfeit score
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
        player1: player1Name,
        player2: player2Name,
        score1: finalScore1,
        score2: finalScore2,
        match_id: matchup.id,
        is_bye: matchStatus === 'bye',
        is_forfeit: matchStatus === 'forfeit',
        forfeit_player: forfeitPlayer,
        bye_player: byePlayer
      };

      // Add player IDs if available from player objects
      if (matchup.player1?.player_id) {
        resultData.player1_id = matchup.player1.player_id;
      }
      if (matchup.player2?.player_id) {
        resultData.player2_id = matchup.player2.player_id;
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={cn(
              "bg-background shadow-xl relative overflow-hidden",
              "w-full h-full md:max-w-lg md:w-full md:h-auto md:rounded-lg",
              "flex flex-col",
              isMatchComplete ? 'opacity-75' : ''
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
              <h2 className="text-xl md:text-lg font-semibold text-foreground">
                {isEditing ? 'Edit Result' : 'Submit Result'}
              </h2>
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] p-3 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors touch-manipulation active:scale-90"
                aria-label="Close modal"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {isMatchComplete && (
                <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Icon name="CheckCircle" size={16} className="text-success" />
                    <p className="text-base font-medium text-success-foreground">
                      ✅ Match Complete
                    </p>
                  </div>
                  <p className="text-sm text-success-foreground/80 mt-2">
                    {existingResult ? 
                      `Result: ${existingResult.score1} - ${existingResult.score2}` : 
                      'This match has been completed and cannot be modified.'
                    }
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Match Status Selection */}
              <div className="space-y-3">
                <label className="text-base md:text-sm font-medium text-foreground">Match Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('normal')}
                    disabled={isMatchComplete}
                    className={cn(
                      "min-h-[48px] md:min-h-[40px] p-3 text-base md:text-sm rounded-lg border transition-colors touch-manipulation active:scale-95",
                      matchStatus === 'normal' 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background border-border hover:bg-muted',
                      isMatchComplete && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Normal Match
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('forfeit')}
                    disabled={isMatchComplete}
                    className={cn(
                      "min-h-[48px] md:min-h-[40px] p-3 text-base md:text-sm rounded-lg border transition-colors touch-manipulation active:scale-95",
                      matchStatus === 'forfeit' 
                        ? 'bg-destructive text-destructive-foreground border-destructive' 
                        : 'bg-background border-border hover:bg-muted',
                      isMatchComplete && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Forfeit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('withdrawal')}
                    disabled={isMatchComplete}
                    className={cn(
                      "min-h-[48px] md:min-h-[40px] p-3 text-base md:text-sm rounded-lg border transition-colors touch-manipulation active:scale-95",
                      matchStatus === 'withdrawal' 
                        ? 'bg-warning text-warning-foreground border-warning' 
                        : 'bg-background border-border hover:bg-muted',
                      isMatchComplete && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Withdrawal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatchStatusChange('bye')}
                    disabled={isMatchComplete}
                    className={cn(
                      "min-h-[48px] md:min-h-[40px] p-3 text-base md:text-sm rounded-lg border transition-colors touch-manipulation active:scale-95",
                      matchStatus === 'bye' 
                        ? 'bg-secondary text-secondary-foreground border-secondary' 
                        : 'bg-background border-border hover:bg-muted',
                      isMatchComplete && 'opacity-50 cursor-not-allowed'
                    )}
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-base md:text-sm font-medium text-foreground">{player1Name}</label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={score1}
                        onChange={(e) => setScore1(e.target.value)}
                        placeholder="Score"
                        min="0"
                        disabled={isMatchComplete}
                        className="text-center text-xl md:text-base min-h-[56px] md:min-h-[40px] touch-manipulation"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-base md:text-sm font-medium text-foreground">{player2Name}</label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={score2}
                        onChange={(e) => setScore2(e.target.value)}
                        placeholder="Score"
                        min="0"
                        disabled={isMatchComplete}
                        className="text-center text-xl md:text-base min-h-[56px] md:min-h-[40px] touch-manipulation"
                      />
                    </div>
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

              {/* Bottom Actions - Sticky on mobile */}
              <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 md:p-6 mt-6">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 min-h-[48px] text-base font-medium"
                    disabled={isLoading}
                  >
                    {isMatchComplete ? 'Close' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 min-h-[48px] text-base font-medium touch-manipulation"
                    loading={isLoading}
                    disabled={isMatchComplete || 
                             (matchStatus === 'normal' && (!score1 || !score2)) || 
                             ((matchStatus === 'forfeit' || matchStatus === 'withdrawal') && !forfeitPlayer) ||
                             (matchStatus === 'bye' && !byePlayer)}
                  >
                    {isEditing ? 'Update' : 'Submit'}
                  </Button>
                </div>
              </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScoreEntryModal;