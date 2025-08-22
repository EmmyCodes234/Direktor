import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const RatingCalculator = ({ player1, player2, result, onRatingUpdate }) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [rating1, setRating1] = useState(player1?.rating || 1500);
  const [rating2, setRating2] = useState(player2?.rating || 1500);
  const [score1, setScore1] = useState(result?.score1 || 0);
  const [score2, setScore2] = useState(result?.score2 || 0);
  const [kFactor, setKFactor] = useState(32); // Standard K-factor for tournament play

  // Calculate expected scores using Elo formula
  const expectedScores = useMemo(() => {
    const ratingDiff = rating1 - rating2;
    const expected1 = 1 / (1 + Math.pow(10, -ratingDiff / 400));
    const expected2 = 1 - expected1;
    return { expected1, expected2 };
  }, [rating1, rating2]);

  // Calculate actual scores (1 for win, 0.5 for draw, 0 for loss)
  const actualScores = useMemo(() => {
    if (score1 > score2) return { actual1: 1, actual2: 0 };
    if (score2 > score1) return { actual1: 0, actual2: 1 };
    return { actual1: 0.5, actual2: 0.5 };
  }, [score1, score2]);

  // Calculate rating changes
  const ratingChanges = useMemo(() => {
    const change1 = Math.round(kFactor * (actualScores.actual1 - expectedScores.expected1));
    const change2 = Math.round(kFactor * (actualScores.actual2 - expectedScores.expected2));
    return { change1, change2 };
  }, [actualScores, expectedScores, kFactor]);

  // Calculate new ratings
  const newRatings = useMemo(() => {
    return {
      newRating1: rating1 + ratingChanges.change1,
      newRating2: rating2 + ratingChanges.change2
    };
  }, [rating1, rating2, ratingChanges]);

  // Performance indicators
  const performanceIndicators = useMemo(() => {
    const getPerformance = (rating, opponentRating, result) => {
      if (result === 1) return opponentRating + 400;
      if (result === 0) return opponentRating - 400;
      return opponentRating; // Draw
    };

    const perf1 = getPerformance(rating1, rating2, actualScores.actual1);
    const perf2 = getPerformance(rating2, rating1, actualScores.actual2);

    return { perf1, perf2 };
  }, [rating1, rating2, actualScores]);

  const handleUpdateRatings = async () => {
    try {
      // Update player ratings in database
      await onRatingUpdate?.({
        player1: { id: player1?.player_id, oldRating: rating1, newRating: newRatings.newRating1 },
        player2: { id: player2?.player_id, oldRating: rating2, newRating: newRatings.newRating2 }
      });
      
      toast.success('Player ratings updated successfully!');
      setShowCalculator(false);
    } catch (error) {
      toast.error('Failed to update ratings');
      console.error('Rating update error:', error);
    }
  };

  const getResultText = () => {
    if (score1 > score2) return `${player1?.name || 'Player 1'} wins`;
    if (score2 > score1) return `${player2?.name || 'Player 2'} wins`;
    return 'Draw';
  };

  const getRatingChangeColor = (change) => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getRatingChangeIcon = (change) => {
    if (change > 0) return 'TrendingUp';
    if (change < 0) return 'TrendingDown';
    return 'Minus';
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowCalculator(!showCalculator)}
        variant="outline"
        className="w-full"
      >
        <Icon name="Calculator" size={16} className="mr-2" />
        Rating Calculator
      </Button>

      {showCalculator && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-muted/20 border border-border rounded-lg p-4 space-y-4"
        >
          {/* Result Summary */}
          <div className="text-center p-3 bg-background rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Game Result</h4>
            <p className="text-lg font-mono">
              {score1} - {score2}
            </p>
            <p className="text-sm text-muted-foreground">{getResultText()}</p>
          </div>

          {/* Rating Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {player1?.name || 'Player 1'} Rating
              </label>
              <Input
                type="number"
                value={rating1}
                onChange={(e) => setRating1(parseInt(e.target.value) || 1500)}
                className="text-center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {player2?.name || 'Player 2'} Rating
              </label>
              <Input
                type="number"
                value={rating2}
                onChange={(e) => setRating2(parseInt(e.target.value) || 1500)}
                className="text-center"
              />
            </div>
          </div>

          {/* K-Factor */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              K-Factor (Rating Volatility)
            </label>
            <select
              value={kFactor}
              onChange={(e) => setKFactor(parseInt(e.target.value))}
              className="w-full p-2 border border-border rounded-md bg-background"
            >
              <option value={16}>16 - Master level</option>
              <option value={24}>24 - Expert level</option>
              <option value={32}>32 - Tournament level</option>
              <option value={40}>40 - Beginner level</option>
            </select>
          </div>

          {/* Expected vs Actual Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-background rounded-lg">
              <h5 className="font-medium text-foreground mb-2">Expected Scores</h5>
              <div className="space-y-1 text-sm">
                <p>{player1?.name || 'Player 1'}: {(expectedScores.expected1 * 100).toFixed(1)}%</p>
                <p>{player2?.name || 'Player 2'}: {(expectedScores.expected2 * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <h5 className="font-medium text-foreground mb-2">Actual Scores</h5>
              <div className="space-y-1 text-sm">
                <p>{player1?.name || 'Player 1'}: {(actualScores.actual1 * 100).toFixed(0)}%</p>
                <p>{player2?.name || 'Player 2'}: {(actualScores.actual2 * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Rating Changes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-background rounded-lg">
              <h5 className="font-medium text-foreground mb-2">{player1?.name || 'Player 1'}</h5>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current: {rating1}</p>
                <p className="text-sm text-muted-foreground">New: {newRatings.newRating1}</p>
                <p className={`font-semibold flex items-center ${getRatingChangeColor(ratingChanges.change1)}`}>
                  <Icon name={getRatingChangeIcon(ratingChanges.change1)} size={14} className="mr-1" />
                  {ratingChanges.change1 > 0 ? '+' : ''}{ratingChanges.change1}
                </p>
                <p className="text-xs text-muted-foreground">
                  Performance: {Math.round(performanceIndicators.perf1)}
                </p>
              </div>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <h5 className="font-medium text-foreground mb-2">{player2?.name || 'Player 2'}</h5>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current: {rating2}</p>
                <p className="text-sm text-muted-foreground">New: {newRatings.newRating2}</p>
                <p className={`font-semibold flex items-center ${getRatingChangeColor(ratingChanges.change2)}`}>
                  <Icon name={getRatingChangeIcon(ratingChanges.change2)} size={14} className="mr-1" />
                  {ratingChanges.change2 > 0 ? '+' : ''}{ratingChanges.change2}
                </p>
                <p className="text-xs text-muted-foreground">
                  Performance: {Math.round(performanceIndicators.perf2)}
                </p>
              </div>
            </div>
          </div>

          {/* Update Button */}
          <Button
            onClick={handleUpdateRatings}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Icon name="Save" size={16} className="mr-2" />
            Update Player Ratings
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default RatingCalculator;
