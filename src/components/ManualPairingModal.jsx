import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Icon from './AppIcon';
import Button from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
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
    if (pairings.length === 0) {
      toast.error('Please add at least one pairing');
      return;
    }

    setIsLoading(true);
    try {
      await onSavePairings(pairings);
      toast.success('Pairings saved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save pairings');
      console.error('Save pairings error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card variant="glass" padding="none" className="h-full">
            <CardHeader className={cn("border-b border-border/20", "p-6")}>
              <CardTitle className="text-2xl font-bold text-foreground">
                Manual Pairings - Round {currentRound}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Manually create pairings for this round. Players can be paired against each other or given a BYE.
              </p>
            </CardHeader>

            <div className="flex flex-col lg:flex-row h-full">
              {/* Left Panel - Available Players */}
              <div className={cn("w-full lg:w-1/3", "p-6 border-r border-border/20 overflow-y-auto")}>
                <h3 className="text-lg font-semibold text-foreground mb-3">Available Players</h3>
                
                {availablePlayers.length === 0 ? (
                  <div className={cn("text-center py-8", "text-muted-foreground")}>
                    <Icon name="Users" size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium">All players are paired</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Remove some pairings to make players available again
                    </p>
                  </div>
                ) : (
                  <div className={LAYOUT_TEMPLATES.spacing.content}>
                    {availablePlayers.map((player) => (
                      <div
                        key={player.player_id}
                        className={cn(
                          "p-3 rounded-lg border border-border/20 hover:bg-surface/30 transition-colors cursor-pointer",
                          selectedPlayer?.player_id === player.player_id && "bg-primary/10 border-primary/30"
                        )}
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {player.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Rating: {player.rating || 'N/A'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono text-primary">
                              {player.rating || 'N/A'}
                            </div>
                            <div className="text-xs text-accent">
                              {player.division || 'Open'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Panel - Current Pairings */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Current Pairings</h3>
                  <div className="text-sm text-muted-foreground">
                    {pairings.length} pairing{pairings.length !== 1 ? 's' : ''} created
                  </div>
                </div>

                {pairings.length === 0 ? (
                  <div className={cn("text-center py-12", "text-muted-foreground")}>
                    <Icon name="List" size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium mb-2">No pairings yet</p>
                    <p className="text-sm text-muted-foreground">
                      Select a player from the left panel and create your first pairing
                    </p>
                  </div>
                ) : (
                  <div className={LAYOUT_TEMPLATES.spacing.content}>
                    {pairings.map((pairing) => (
                      <Card
                        key={pairing.id}
                        variant="muted"
                        padding="md"
                        className="bg-muted/10 border border-border/20"
                      >
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded",
                                "font-bold"
                              )}>
                                {pairing.table === 'BYE' ? 'BYE' : `Table ${pairing.table}`}
                              </span>
                              <span className={cn(
                                "text-xs text-accent bg-accent/10 px-2 py-1 rounded"
                              )}>
                                {pairing.division}
                              </span>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemovePairing(pairing.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {/* Player 1 */}
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Player 1</label>
                              <div className={cn(
                                "p-3 bg-background border border-border/20 rounded-lg",
                                "mt-1"
                              )}>
                                <div className="font-medium text-foreground">
                                  {pairing.player1?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Rating: {pairing.player1?.rating || 'N/A'}
                                </div>
                              </div>
                            </div>

                            {/* VS */}
                            <div className="text-center">
                              <div className="text-2xl font-bold text-muted-foreground">VS</div>
                            </div>

                            {/* Player 2 */}
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Player 2</label>
                              <div className={cn(
                                "p-3 bg-background border border-border/20 rounded-lg",
                                "mt-1"
                              )}>
                                <div className="font-medium text-foreground">
                                  {pairing.player2?.name || 'TBD'}
                                </div>
                                {pairing.player2?.name !== 'BYE' && (
                                  <div className="text-sm text-muted-foreground">
                                    Rating: {pairing.player2?.rating || 'N/A'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className={cn(
              "border-t border-border/20 bg-muted/5",
              "p-6"
            )}>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {availablePlayers.length} players available • {pairings.length} pairings created
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    loading={isLoading}
                    disabled={pairings.length === 0}
                  >
                    Save Pairings
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ManualPairingModal;
