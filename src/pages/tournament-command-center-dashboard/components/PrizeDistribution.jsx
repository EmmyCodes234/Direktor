import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PrizeDistribution = ({ players, prizes, tournamentInfo, onPrizeDistribution }) => {
  const [showDistribution, setShowDistribution] = useState(false);
  const [customPrizes, setCustomPrizes] = useState(prizes || []);
  const [isDistributing, setIsDistributing] = useState(false);

  // Calculate final standings with tie-breakers
  const finalStandings = useMemo(() => {
    if (!players.length) return [];

    // Sort players by wins, then spread, then head-to-head
    return [...players].sort((a, b) => {
      // Primary: Wins
      const aWins = a.wins || 0;
      const bWins = b.wins || 0;
      if (aWins !== bWins) return bWins - aWins;

      // Secondary: Spread
      const aSpread = a.spread || 0;
      const bSpread = b.spread || 0;
      if (aSpread !== bSpread) return bSpread - aSpread;

      // Tertiary: Head-to-head (if available)
      if (a.headToHeadWins !== undefined && b.headToHeadWins !== undefined) {
        if (a.headToHeadWins !== b.headToHeadWins) return b.headToHeadWins - a.headToHeadWins;
      }

      // Quaternary: Opponent win percentage
      const aOppWinPct = a.opponentWinPercentage || 0;
      const bOppWinPct = b.opponentWinPercentage || 0;
      if (aOppWinPct !== bOppWinPct) return bOppWinPct - aOppWinPct;

      // Quinary: Higher seed (lower number)
      return (a.seed || 999) - (b.seed || 999);
    });
  }, [players]);

  // Calculate prize distribution
  const prizeDistribution = useMemo(() => {
    if (!customPrizes.length || !finalStandings.length) return [];

    const distribution = [];
    let currentPosition = 1;
    let currentPrizeIndex = 0;

    for (let i = 0; i < finalStandings.length; i++) {
      const player = finalStandings[i];
      const nextPlayer = finalStandings[i + 1];
      
      // Check if this player is tied with the next player
      const isTied = nextPlayer && 
        (player.wins || 0) === (nextPlayer.wins || 0) &&
        (player.spread || 0) === (nextPlayer.spread || 0) &&
        (player.headToHeadWins || 0) === (nextPlayer.headToHeadWins || 0) &&
        (player.opponentWinPercentage || 0) === (nextPlayer.opponentWinPercentage || 0);

      if (currentPrizeIndex < customPrizes.length) {
        const prize = customPrizes[currentPrizeIndex];
        
        if (isTied) {
          // Handle ties by splitting prize
          const tiedPlayers = [player];
          let j = i + 1;
          while (j < finalStandings.length && 
                 (finalStandings[j].wins || 0) === (player.wins || 0) &&
                 (finalStandings[j].spread || 0) === (player.spread || 0) &&
                 (finalStandings[j].headToHeadWins || 0) === (player.headToHeadWins || 0) &&
                 (finalStandings[j].opponentWinPercentage || 0) === (player.opponentWinPercentage || 0)) {
            tiedPlayers.push(finalStandings[j]);
            j++;
          }
          
          const splitAmount = Math.round(prize.amount / tiedPlayers.length);
          
          tiedPlayers.forEach((tiedPlayer, index) => {
            distribution.push({
              position: currentPosition,
              player: tiedPlayer,
              prize: {
                ...prize,
                amount: splitAmount,
                originalAmount: prize.amount,
                isSplit: true,
                splitCount: tiedPlayers.length
              },
              isTied: true
            });
          });
          
          i = j - 1; // Skip the tied players we've already processed
          currentPosition += tiedPlayers.length;
        } else {
          distribution.push({
            position: currentPosition,
            player: player,
            prize: prize,
            isTied: false
          });
          currentPosition++;
        }
        
        currentPrizeIndex++;
      } else {
        // No more prizes, but still show player
        distribution.push({
          position: currentPosition,
          player: player,
          prize: null,
          isTied: false
        });
        currentPosition++;
      }
    }

    return distribution;
  }, [finalStandings, customPrizes]);

  // Calculate total prize pool
  const totalPrizePool = useMemo(() => {
    return customPrizes.reduce((sum, prize) => sum + (prize.amount || 0), 0);
  }, [customPrizes]);

  // Calculate distributed amount
  const distributedAmount = useMemo(() => {
    return prizeDistribution
      .filter(d => d.prize)
      .reduce((sum, d) => sum + (d.prize.amount || 0), 0);
  }, [prizeDistribution]);

  const handleAddPrize = () => {
    setCustomPrizes(prev => [...prev, {
      id: Date.now(),
      position: prev.length + 1,
      name: `Prize ${prev.length + 1}`,
      amount: 0,
      type: 'cash'
    }]);
  };

  const handleUpdatePrize = (index, field, value) => {
    setCustomPrizes(prev => prev.map((prize, i) => 
      i === index ? { ...prize, [field]: value } : prize
    ));
  };

  const handleRemovePrize = (index) => {
    setCustomPrizes(prev => prev.filter((_, i) => i !== index));
  };

  const handleDistributePrizes = async () => {
    setIsDistributing(true);
    try {
      await onPrizeDistribution?.(prizeDistribution);
      toast.success('Prize distribution completed successfully!');
      setShowDistribution(false);
    } catch (error) {
      toast.error('Failed to distribute prizes');
      console.error('Prize distribution error:', error);
    } finally {
      setIsDistributing(false);
    }
  };

  const getPositionBadge = (position) => {
    const colors = {
      1: 'bg-yellow-500 text-yellow-900',
      2: 'bg-gray-400 text-gray-900',
      3: 'bg-amber-600 text-amber-900'
    };
    return colors[position] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowDistribution(!showDistribution)}
        variant="outline"
        className="w-full"
      >
        <Icon name="Trophy" size={16} className="mr-2" />
        Prize Distribution
      </Button>

      {showDistribution && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-muted/20 border border-border rounded-lg p-4 space-y-4"
        >
          {/* Prize Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Prize Configuration</h4>
              <Button onClick={handleAddPrize} size="sm">
                <Icon name="Plus" size={14} className="mr-1" />
                Add Prize
              </Button>
            </div>

            {customPrizes.map((prize, index) => (
              <div key={prize.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <div className="flex-1">
                  <Input
                    placeholder="Prize Name"
                    value={prize.name}
                    onChange={(e) => handleUpdatePrize(index, 'name', e.target.value)}
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={prize.amount}
                      onChange={(e) => handleUpdatePrize(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <select
                      value={prize.type}
                      onChange={(e) => handleUpdatePrize(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="cash">Cash</option>
                      <option value="trophy">Trophy</option>
                      <option value="medal">Medal</option>
                      <option value="certificate">Certificate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={() => handleRemovePrize(index)}
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            ))}

            {customPrizes.length > 0 && (
              <div className="p-3 bg-background rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Total Prize Pool:</span>
                  <span className="font-bold text-primary">${totalPrizePool.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Final Standings Preview */}
          {finalStandings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Final Standings</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {finalStandings.map((player, index) => (
                  <div key={player.player_id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPositionBadge(index + 1)}`}>
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {player.wins || 0} wins, {player.spread > 0 ? '+' : ''}{player.spread || 0} spread
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Seed: {player.seed || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prize Distribution Preview */}
          {prizeDistribution.length > 0 && customPrizes.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Prize Distribution Preview</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {prizeDistribution.map((dist, index) => (
                  <div key={dist.player.player_id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPositionBadge(dist.position)}`}>
                        #{dist.position}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{dist.player.name}</p>
                        {dist.isTied && (
                          <p className="text-xs text-warning">Tied with {dist.prize?.splitCount - 1} other player(s)</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {dist.prize ? (
                        <div>
                          <p className="font-bold text-success">
                            ${dist.prize.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {dist.prize.name} ({dist.prize.type})
                          </p>
                          {dist.prize.isSplit && (
                            <p className="text-xs text-warning">
                              Split from ${dist.prize.originalAmount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No prize</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-background rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Total Distributed:</span>
                  <span className="font-bold text-success">${distributedAmount.toLocaleString()}</span>
                </div>
                {distributedAmount < totalPrizePool && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Remaining: ${(totalPrizePool - distributedAmount).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleDistributePrizes}
              disabled={!customPrizes.length || isDistributing}
              loading={isDistributing}
              className="flex-1 bg-success hover:bg-success/90"
            >
              <Icon name="CheckCircle" size={16} className="mr-2" />
              Distribute Prizes
            </Button>
            <Button
              onClick={() => setShowDistribution(false)}
              variant="outline"
              disabled={isDistributing}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PrizeDistribution;
