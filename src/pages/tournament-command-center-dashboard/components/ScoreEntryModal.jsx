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

  const isEditing = !!existingResult;
  const isBestOfLeague = tournamentType === 'best_of_league';

  // Defensive: always use an object for currentMatchScore
  const safeCurrentMatchScore = currentMatchScore && typeof currentMatchScore === 'object' ? currentMatchScore : {};

  useEffect(() => {
    if (isOpen) {
      setScore1(isEditing ? existingResult.score1 : '');
      setScore2(isEditing ? existingResult.score2 : '');
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
    if (score1 === '' || score2 === '') {
      toast.error("Please enter scores for both players.");
      return;
    }
    setIsLoading(true);
    const resultPayload = {
      player1: player1Name,
      player2: player2Name,
      score1: parseInt(score1, 10),
      score2: parseInt(score2, 10),
      id: isEditing ? existingResult.id : undefined,
      match_id: isBestOfLeague ? matchup.id : undefined,
    };
    try {
      await onResultSubmit(resultPayload, isEditing);
      onClose();
    } catch (error) {
      // Parent component will show the error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass-card w-full max-w-md mx-auto rounded-t-xl sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-semibold text-foreground">
                    {isEditing ? 'Edit Score' : 'Enter Score'}
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="touch-target p-2 rounded-lg hover:bg-muted/20 transition-colors"
                    aria-label="Close modal"
                  >
                    <Icon name="X" size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      {isBestOfLeague ? 'Match' : `Table ${matchup.table}`} • Round {matchup.round}
                    </p>
                    
                    {isBestOfLeague && (
                      <div className="bg-muted/20 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{player1Name}</span>
                          <span className="font-bold text-primary text-lg">
                            {safeCurrentMatchScore[player1Name] !== undefined
                              ? safeCurrentMatchScore[player1Name]
                              : 0}
                          </span>
                        </div>
                        <div className="text-center text-muted-foreground my-2">
                          <Icon name="Minus" size={16} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{player2Name}</span>
                          <span className="font-bold text-primary text-lg">
                            {safeCurrentMatchScore[player2Name] !== undefined
                              ? safeCurrentMatchScore[player2Name]
                              : 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {player1Name} Score
                      </label>
                      <Input
                        type="number"
                        value={score1}
                        onChange={(e) => setScore1(e.target.value)}
                        placeholder="0"
                        className="text-center text-lg font-mono touch-target-mobile"
                        disabled={isMatchComplete}
                        min="0"
                      />
                    </div>

                    <div className="text-center text-muted-foreground">
                      <Icon name="Minus" size={20} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {player2Name} Score
                      </label>
                      <Input
                        type="number"
                        value={score2}
                        onChange={(e) => setScore2(e.target.value)}
                        placeholder="0"
                        className="text-center text-lg font-mono touch-target-mobile"
                        disabled={isMatchComplete}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="touch-target-mobile flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isLoading}
                  className="touch-target-mobile flex-1"
                  disabled={isMatchComplete}
                >
                  {isEditing ? 'Update Score' : 'Submit Score'}
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