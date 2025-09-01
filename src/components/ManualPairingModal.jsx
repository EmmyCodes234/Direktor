import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './AppIcon';
import Button from './ui/Button';
import { toast } from 'sonner';

const ManualPairingModal = ({ 
  isOpen, 
  onClose, 
  players = [], 
  onSavePairings, 
  existingPairings = [],
  onAutoPairRemaining 
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [manualPairings, setManualPairings] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);

  // Calculate available players (not already paired)
  useEffect(() => {
    const pairedPlayerIds = new Set();
    
    // Add players from existing pairings
    if (existingPairings && Array.isArray(existingPairings)) {
      existingPairings.forEach(pairing => {
        if (pairing.player1?.player_id) pairedPlayerIds.add(pairing.player1.player_id);
        if (pairing.player2?.player_id && pairing.player2.name !== 'BYE') {
          pairedPlayerIds.add(pairing.player2.player_id);
        }
      });
    }
    
    // Add players from new manual pairings
    if (manualPairings && Array.isArray(manualPairings)) {
      manualPairings.forEach(pairing => {
        if (pairing.player1?.player_id) pairedPlayerIds.add(pairing.player1.player_id);
        if (pairing.player2?.player_id && pairing.player2.name !== 'BYE') {
          pairedPlayerIds.add(pairing.player2.player_id);
        }
      });
    }

    const available = players.filter(p => !pairedPlayerIds.has(p.player_id));
    setAvailablePlayers(available);
  }, [players, existingPairings, manualPairings]);

  // Handle player selection
  const handlePlayerClick = (player) => {
    if (!selectedPlayer) {
      // First player selected
      setSelectedPlayer(player);
      toast.success(`Selected ${player.name}. Now click another player to pair them.`);
    } else if (selectedPlayer.player_id === player.player_id) {
      // Same player clicked - deselect
      setSelectedPlayer(null);
      toast.info('Selection cleared. Click a player to start pairing.');
    } else {
      // Second player selected - create pairing
      const newPairing = {
        id: `manual-${Date.now()}-${manualPairings.length}`,
        player1: selectedPlayer,
        player2: player,
        table: manualPairings.length + 1,
        division: selectedPlayer.division || 'Open'
      };
      
      setManualPairings(prev => [...prev, newPairing]);
      setSelectedPlayer(null);
      toast.success(`Paired ${selectedPlayer.name} vs ${player.name} on Table ${newPairing.table}`);
    }
  };

  // Handle bye creation
  const handleCreateBye = (player) => {
    const byePairing = {
      id: `bye-${Date.now()}-${manualPairings.length}`,
      player1: player,
      player2: { name: 'BYE' },
      table: 'BYE',
      division: player.division || 'Open'
    };
    
    setManualPairings(prev => [...prev, byePairing]);
    toast.success(`${player.name} gets a BYE`);
  };

  // Remove a pairing
  const handleRemovePairing = (pairingId) => {
    setManualPairings(prev => prev.filter(p => p.id !== pairingId));
    toast.success('Pairing removed');
  };

  // Save all pairings
  const handleSave = async () => {
    try {
      const allPairings = [...(existingPairings || []), ...manualPairings];
      
      // Auto-pair remaining players if any
      if (availablePlayers.length > 1 && onAutoPairRemaining) {
        const loadingToast = toast.loading('Auto-pairing remaining players...');
        const autoPairings = await onAutoPairRemaining(availablePlayers, allPairings);
        
        // Dismiss the loading toast
        toast.dismiss(loadingToast);
        
        if (autoPairings && autoPairings.length > 0) {
          const validAutoPairings = autoPairings.filter(pairing => {
            return pairing.player1?.player_id && 
                   (pairing.player2?.player_id || pairing.player2?.name === 'BYE');
          });
          
          const finalPairings = [...allPairings, ...validAutoPairings];
          await onSavePairings(finalPairings);
          toast.success(`Saved ${allPairings.length} manual + ${validAutoPairings.length} auto pairings!`);
        } else {
          await onSavePairings(allPairings);
          toast.success(`Saved ${allPairings.length} manual pairings!`);
        }
      } else {
        await onSavePairings(allPairings);
        toast.success(`Saved ${allPairings.length} manual pairings!`);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving pairings:', error);
      toast.error('Failed to save pairings');
    }
  };

  // Auto-pair all remaining players
  const handleAutoPairAll = async () => {
    if (!onAutoPairRemaining || availablePlayers.length < 2) {
      toast.error('Not enough players to auto-pair');
      return;
    }

    try {
      const loadingToast = toast.loading('Auto-pairing all remaining players...');
      const autoPairings = await onAutoPairRemaining(availablePlayers, existingPairings);
      
      // Dismiss the loading toast
      toast.dismiss(loadingToast);
      
      if (autoPairings && autoPairings.length > 0) {
        const validAutoPairings = autoPairings.filter(pairing => {
          return pairing.player1?.player_id && 
                 (pairing.player2?.player_id || pairing.player2?.name === 'BYE');
        });
        
        const allPairings = [...(existingPairings || []), ...manualPairings, ...validAutoPairings];
        await onSavePairings(allPairings);
        toast.success(`Auto-paired ${validAutoPairings.length} players!`);
        onClose();
      } else {
        toast.error('Could not auto-pair remaining players');
      }
    } catch (error) {
      console.error('Auto-pairing error:', error);
      toast.error('Auto-pairing failed');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Manual Pairing</h2>
                <p className="text-white/80 mt-1">
                  Click players to pair them. {availablePlayers.length} players available.
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Icon name="X" className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="Info" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">How to Pair Players:</h3>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Click a player to select them (they'll be highlighted)</li>
                    <li>2. Click another player to pair them together</li>
                    <li>3. Click the "BYE" button next to a player to give them a bye</li>
                    <li>4. Use "Auto-Pair All" to automatically pair remaining players</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Available Players */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icon name="Users" className="w-5 h-5" />
                Available Players ({availablePlayers.length})
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availablePlayers.map((player) => (
                  <motion.div
                    key={player.player_id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedPlayer?.player_id === player.player_id
                        ? 'border-accent bg-accent/10 shadow-lg'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                      }
                    `}
                    onClick={() => handlePlayerClick(player)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Rating: {player.rating || 'N/A'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateBye(player);
                          }}
                          className="text-xs"
                        >
                          BYE
                        </Button>
                        {selectedPlayer?.player_id === player.player_id && (
                          <Icon name="Check" className="w-5 h-5 text-accent" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Manual Pairings */}
            {manualPairings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Icon name="Swords" className="w-5 h-5" />
                  Manual Pairings ({manualPairings.length})
                </h3>
                
                <div className="space-y-3">
                  {manualPairings.map((pairing) => (
                    <motion.div
                      key={pairing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-semibold">{pairing.player1.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Rating: {pairing.player1.rating || 'N/A'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Icon name="Swords" className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">
                              Table {pairing.table}
                            </span>
                            <Icon name="Swords" className="w-4 h-4 text-green-600" />
                          </div>
                          
                          <div className="text-center">
                            <div className="font-semibold">
                              {pairing.player2.name === 'BYE' ? 'BYE' : pairing.player2.name}
                            </div>
                            {pairing.player2.name !== 'BYE' && (
                              <div className="text-sm text-muted-foreground">
                                Rating: {pairing.player2.rating || 'N/A'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemovePairing(pairing.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Icon name="Trash" className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              <Button
                onClick={handleAutoPairAll}
                disabled={availablePlayers.length < 2}
                className="flex-1"
                size="lg"
              >
                <Icon name="Zap" className="mr-2" />
                Auto-Pair All Remaining ({availablePlayers.length} players)
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={manualPairings.length === 0 && availablePlayers.length < 2}
                className="flex-1"
                size="lg"
              >
                <Icon name="Save" className="mr-2" />
                Save Pairings
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ManualPairingModal;
