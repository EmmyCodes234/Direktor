import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Icon from './AppIcon';
import Button from './ui/Button';
import { cn } from '../utils/cn';

const ManualPairingModal = ({ 
  isOpen, 
  onClose, 
  players, 
  currentRound, 
  onSavePairings, 
  existingPairings = [],
  tournamentInfo 
}) => {
  const [pairings, setPairings] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tableNumber, setTableNumber] = useState(1);

  // Initialize pairings from existing data or start fresh
  useEffect(() => {
    if (isOpen) {
      if (existingPairings.length > 0) {
        setPairings(existingPairings.map(p => ({
          ...p,
          table: p.table || 'BYE'
        })));
        setTableNumber(Math.max(...existingPairings.map(p => p.table === 'BYE' ? 0 : p.table), 0) + 1);
      } else {
        setPairings([]);
        setTableNumber(1);
      }
      setSelectedPlayer(null);
    }
  }, [isOpen, existingPairings]);

  // Update available players based on current pairings
  useEffect(() => {
    const pairedPlayerIds = new Set();
    pairings.forEach(pairing => {
      if (pairing.player1?.player_id) pairedPlayerIds.add(pairing.player1.player_id);
      if (pairing.player2?.player_id && pairing.player2.name !== 'BYE') {
        pairedPlayerIds.add(pairing.player2.player_id);
      }
    });

    const available = players.filter(p => !pairedPlayerIds.has(p.player_id));
    setAvailablePlayers(available);
  }, [pairings, players]);

  const handleAddPairing = () => {
    if (!selectedPlayer) {
      toast.error('Please select a player first');
      return;
    }

    const newPairing = {
      id: `temp-${Date.now()}`,
      table: tableNumber,
      player1: selectedPlayer,
      player2: { name: 'TBD', player_id: null },
      division: selectedPlayer.division || 'Open'
    };

    setPairings(prev => [...prev, newPairing]);
    setSelectedPlayer(null);
    setTableNumber(prev => prev + 1);
  };

  const handleAddBye = () => {
    if (!selectedPlayer) {
      toast.error('Please select a player first');
      return;
    }

    const newPairing = {
      id: `temp-${Date.now()}`,
      table: 'BYE',
      player1: selectedPlayer,
      player2: { name: 'BYE', player_id: null },
      division: selectedPlayer.division || 'Open'
    };

    setPairings(prev => [...prev, newPairing]);
    setSelectedPlayer(null);
  };

  const handleRemovePairing = (pairingId) => {
    setPairings(prev => prev.filter(p => p.id !== pairingId));
    // Recalculate table numbers
    const nonByePairings = pairings.filter(p => p.id !== pairingId && p.table !== 'BYE');
    setTableNumber(nonByePairings.length + 1);
  };

  const handleUpdatePairing = (pairingId, field, value) => {
    setPairings(prev => prev.map(p => 
      p.id === pairingId ? { ...p, [field]: value } : p
    ));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validate pairings
      const pairedPlayerIds = new Set();
      const errors = [];

      pairings.forEach((pairing, index) => {
        if (pairing.player1?.player_id) {
          if (pairedPlayerIds.has(pairing.player1.player_id)) {
            errors.push(`${pairing.player1.name} is paired multiple times`);
          }
          pairedPlayerIds.add(pairing.player1.player_id);
        }

        if (pairing.player2?.player_id && pairing.player2.name !== 'BYE') {
          if (pairedPlayerIds.has(pairing.player2.player_id)) {
            errors.push(`${pairing.player2.name} is paired multiple times`);
          }
          pairedPlayerIds.add(pairing.player2.player_id);
        }

        if (pairing.player1?.player_id === pairing.player2?.player_id && pairing.player2.name !== 'BYE') {
          errors.push(`Player cannot be paired against themselves`);
        }
      });

      if (errors.length > 0) {
        toast.error(`Validation errors: ${errors.join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Format pairings for saving
      const formattedPairings = pairings.map(pairing => ({
        table: pairing.table,
        player1: pairing.player1,
        player2: pairing.player2,
        division: pairing.division
      }));

      await onSavePairings(formattedPairings);
      toast.success('Manual pairings saved successfully!');
      onClose();
    } catch (error) {
      toast.error(`Failed to save pairings: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlayerStats = (player) => {
    const wins = player.wins || 0;
    const losses = player.losses || 0;
    const ties = player.ties || 0;
    const spread = player.spread || 0;
    return `${wins}-${losses}-${ties} (${spread > 0 ? '+' : ''}${spread})`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border/20">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Manual Pairings - Round {currentRound}</h2>
                <p className="text-muted-foreground mt-1">
                  Drag and drop players or use the interface below to create pairings
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon name="X" size={20} />
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
            {/* Left Panel - Available Players */}
            <div className="w-full lg:w-1/3 p-6 border-r border-border/20 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Available Players</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availablePlayers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Icon name="Users" size={48} className="mx-auto mb-2 opacity-50" />
                        <p>All players have been paired</p>
                      </div>
                    ) : (
                      availablePlayers.map((player) => (
                        <div
                          key={player.player_id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                            selectedPlayer?.player_id === player.player_id
                              ? "border-primary bg-primary/10"
                              : "border-border/20 hover:border-primary/50 hover:bg-muted/20"
                          )}
                          onClick={() => setSelectedPlayer(player)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-foreground">{player.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Rank #{player.rank} • {getPlayerStats(player)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono text-primary">{player.rating}</div>
                              {player.division && player.division !== 'Open' && (
                                <div className="text-xs text-accent">{player.division}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedPlayer && (
                  <div className="space-y-2 pt-4 border-t border-border/20">
                    <Button
                      onClick={handleAddPairing}
                      className="w-full"
                      disabled={availablePlayers.length < 2}
                    >
                      <Icon name="Plus" size={16} className="mr-2" />
                      Add to Pairing
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAddBye}
                      className="w-full"
                    >
                      <Icon name="UserX" size={16} className="mr-2" />
                      Give Bye
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Current Pairings */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Current Pairings</h3>
                  <div className="text-sm text-muted-foreground">
                    {pairings.length} pairings • {availablePlayers.length} players remaining
                  </div>
                </div>

                {pairings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="Swords" size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No pairings yet</p>
                    <p>Select a player from the left panel to start creating pairings</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pairings.map((pairing, index) => (
                      <motion.div
                        key={pairing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-muted/10 border border-border/20 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                              {pairing.table === 'BYE' ? 'BYE' : `Table ${pairing.table}`}
                            </span>
                            {pairing.division && pairing.division !== 'Open' && (
                              <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded">
                                {pairing.division}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePairing(pairing.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Player 1 */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Player 1</label>
                            <div className="p-3 bg-background border border-border/20 rounded-lg">
                              <div className="font-medium text-foreground">{pairing.player1.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {getPlayerStats(pairing.player1)} • {pairing.player1.rating}
                              </div>
                            </div>
                          </div>

                          {/* VS */}
                          <div className="flex items-center justify-center">
                            <div className="text-2xl font-bold text-muted-foreground">VS</div>
                          </div>

                          {/* Player 2 */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Player 2</label>
                            {pairing.player2.name === 'BYE' ? (
                              <div className="p-3 bg-background border border-border/20 rounded-lg">
                                <div className="font-medium text-muted-foreground">BYE</div>
                                <div className="text-sm text-muted-foreground">No opponent</div>
                              </div>
                            ) : pairing.player2.name === 'TBD' ? (
                              <select
                                value=""
                                onChange={(e) => {
                                  const selected = availablePlayers.find(p => p.player_id === parseInt(e.target.value));
                                  if (selected) {
                                    handleUpdatePairing(pairing.id, 'player2', selected);
                                  }
                                }}
                                className="w-full p-3 bg-background border border-border/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              >
                                <option value="">Select opponent...</option>
                                {availablePlayers.map(player => (
                                  <option key={player.player_id} value={player.player_id}>
                                    {player.name} ({getPlayerStats(player)})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="p-3 bg-background border border-border/20 rounded-lg">
                                <div className="font-medium text-foreground">{pairing.player2.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {getPlayerStats(pairing.player2)} • {pairing.player2.rating}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border/20 bg-muted/5">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {pairings.length > 0 && (
                  <>
                    {pairings.filter(p => p.player2.name === 'BYE').length} byes • 
                    {pairings.filter(p => p.player2.name === 'TBD').length} incomplete pairings
                  </>
                )}
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  loading={isLoading}
                  disabled={pairings.length === 0 || pairings.some(p => p.player2.name === 'TBD')}
                >
                  <Icon name="Save" size={16} className="mr-2" />
                  Save Pairings
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ManualPairingModal;
