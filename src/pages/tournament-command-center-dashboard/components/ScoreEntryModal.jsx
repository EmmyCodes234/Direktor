import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const ScoreEntryModal = ({ isOpen, onClose, matchup, onResultSubmit, existingResult, tournamentType }) => {
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!existingResult;
  const isBestOfLeague = tournamentType === 'best_of_league';

  useEffect(() => {
    if (isOpen) {
      setScore1(isEditing ? existingResult.score1 : '');
      setScore2(isEditing ? existingResult.score2 : '');
    }
  }, [isOpen, isEditing, existingResult]);

  if (!matchup) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (score1 === '' || score2 === '') {
      toast.error("Please enter scores for both players.");
      return;
    }
    setIsLoading(true);
    
    const resultPayload = {
      player1: isBestOfLeague ? matchup.player1_name : matchup.player1.name,
      player2: isBestOfLeague ? matchup.player2_name : matchup.player2.name,
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

  const player1Name = isBestOfLeague ? matchup.player1_name : matchup.player1.name;
  const player2Name = isBestOfLeague ? matchup.player2_name : matchup.player2.name;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass-card w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  {isEditing ? 'Edit Score' : 'Enter Score'} for {isBestOfLeague ? 'Match' : `Table ${matchup.table}`}
                </h2>
                <p className="text-sm text-muted-foreground">Round {matchup.round}</p>
                {isBestOfLeague && (
                    <div className="mt-2 text-center bg-muted/20 p-2 rounded-lg">
                        <span className="font-medium text-foreground">{player1Name}</span>
                        <span className="font-bold text-primary mx-2">{matchup.player1_wins}</span>
                        <span className="text-muted-foreground mx-2">vs</span>
                        <span className="font-bold text-primary mx-2">{matchup.player2_wins}</span>
                        <span className="font-medium text-foreground">{player2Name}</span>
                    </div>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-medium text-foreground">{player1Name}</label>
                  <Input
                    type="number"
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    placeholder="Score"
                    className="w-24 text-center"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-lg font-medium text-foreground">{player2Name}</label>
                  <Input
                    type="number"
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    placeholder="Score"
                    className="w-24 text-center"
                  />
                </div>
              </div>
              <div className="p-4 bg-muted/10 flex justify-end space-x-2 rounded-b-lg">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={isLoading}>{isEditing ? 'Update Result' : 'Record Result'}</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScoreEntryModal;