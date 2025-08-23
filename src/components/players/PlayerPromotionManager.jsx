import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const PlayerPromotionManager = ({ 
    tournamentId, 
    players, 
    groups, 
    isOpen, 
    onClose, 
    onPlayerMoved 
}) => {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [targetGroup, setTargetGroup] = useState('');
    const [eventType, setEventType] = useState('promotion');
    const [loading, setLoading] = useState(false);
    const [carryoverConfig, setCarryoverConfig] = useState(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchCarryoverConfig();
        }
    }, [isOpen, tournamentId]);

    useEffect(() => {
        if (selectedPlayer && targetGroup && carryoverConfig) {
            calculatePreview();
        }
    }, [selectedPlayer, targetGroup, carryoverConfig]);

    const fetchCarryoverConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('carryover_config')
                .select('*')
                .eq('tournament_id', tournamentId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            setCarryoverConfig(data || { policy: 'none' });
        } catch (error) {
            console.error('Error fetching carry-over config:', error);
        }
    };

    const calculatePreview = () => {
        if (!selectedPlayer || !carryoverConfig) return;

        const currentWins = selectedPlayer.wins || 0;
        const currentLosses = selectedPlayer.losses || 0;
        const currentTies = selectedPlayer.ties || 0;
        const currentSpread = selectedPlayer.spread || 0;
        const gamesPlayed = currentWins + currentLosses + currentTies;

        let carryoverWins = 0;
        let carryoverSpread = 0;

        switch (carryoverConfig.policy) {
            case 'none':
                carryoverWins = 0;
                carryoverSpread = 0;
                break;
            case 'full':
                carryoverWins = currentWins;
                carryoverSpread = currentSpread;
                break;
            case 'partial':
                const percentage = carryoverConfig.percentage || 50;
                carryoverWins = Math.round((currentWins * percentage / 100) * 100) / 100;
                carryoverSpread = Math.round((currentSpread * percentage / 100) * 100) / 100;
                break;
            case 'capped':
                carryoverWins = currentWins;
                const spreadCap = carryoverConfig.spread_cap || 100;
                carryoverSpread = Math.min(currentSpread, spreadCap * gamesPlayed);
                break;
            case 'seedingOnly':
                carryoverWins = currentWins;
                carryoverSpread = currentSpread;
                break;
            default:
                carryoverWins = 0;
                carryoverSpread = 0;
        }

        setPreview({
            current: { wins: currentWins, losses: currentLosses, ties: currentTies, spread: currentSpread },
            carryover: { wins: carryoverWins, spread: carryoverSpread },
            total: carryoverConfig.policy === 'seedingOnly' 
                ? { wins: 0, spread: 0 }
                : { wins: carryoverWins, spread: carryoverSpread }
        });
    };

    const handleMovePlayer = async () => {
        if (!selectedPlayer || !targetGroup) {
            toast.error('Please select a player and target group');
            return;
        }

        setLoading(true);
        try {
            // Call the database function to apply carry-over
            const { data, error } = await supabase.rpc('apply_carryover_to_player', {
                p_tournament_id: parseInt(tournamentId),
                p_player_id: parseInt(selectedPlayer.player_id),
                p_to_group_id: parseInt(targetGroup),
                p_event_type: eventType
            });

            if (error) throw error;

            toast.success(`${selectedPlayer.name} has been ${eventType === 'promotion' ? 'promoted' : 'demoted'} successfully`);
            
            if (onPlayerMoved) {
                onPlayerMoved();
            }
            
            handleClose();
        } catch (error) {
            console.error('Error moving player:', error);
            toast.error(`Failed to ${eventType} player: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedPlayer(null);
        setTargetGroup('');
        setEventType('promotion');
        setPreview(null);
        onClose();
    };

    const getPolicyDescription = () => {
        if (!carryoverConfig) return '';
        
        switch (carryoverConfig.policy) {
            case 'none':
                return 'No carry-over - player starts fresh';
            case 'full':
                return 'Full carry-over of all wins and spread';
            case 'partial':
                return `${carryoverConfig.percentage}% carry-over of wins and spread`;
            case 'capped':
                return `Full wins, spread capped at ${carryoverConfig.spread_cap} per game`;
            case 'seedingOnly':
                return 'Carry-over used for seeding only';
            default:
                return '';
        }
    };

    const groupOptions = groups?.map(group => ({
        value: group.id,
        label: group.name
    })) || [];

    const playerOptions = players?.map(player => ({
        value: player.player_id,
        label: `${player.name} (${player.group_name || 'No Group'}) - ${player.wins || 0}W/${player.losses || 0}L/${player.ties || 0}T, ${player.spread >= 0 ? '+' : ''}${player.spread || 0}`
    })) || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`${eventType === 'promotion' ? 'Promote' : 'Demote'} Player`}
            size="lg"
        >
            <div className="space-y-6">
                {/* Event Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                        Event Type
                    </label>
                    <div className="flex space-x-4">
                        <Button
                            variant={eventType === 'promotion' ? 'default' : 'outline'}
                            onClick={() => setEventType('promotion')}
                            className="flex-1"
                        >
                            <Icon name="ArrowUp" className="mr-2" size={16} />
                            Promotion
                        </Button>
                        <Button
                            variant={eventType === 'demotion' ? 'default' : 'outline'}
                            onClick={() => setEventType('demotion')}
                            className="flex-1"
                        >
                            <Icon name="ArrowDown" className="mr-2" size={16} />
                            Demotion
                        </Button>
                    </div>
                </div>

                {/* Player Selection */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                        Select Player
                    </label>
                    <Select
                        value={selectedPlayer?.player_id || ''}
                        onChange={(value) => {
                            const player = players.find(p => p.player_id === value);
                            setSelectedPlayer(player);
                        }}
                        options={playerOptions}
                        placeholder="Choose a player to move"
                        className="w-full"
                    />
                </div>

                {/* Target Group Selection */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                        Target Group
                    </label>
                    <Select
                        value={targetGroup}
                        onChange={setTargetGroup}
                        options={groupOptions.filter(g => g.value !== selectedPlayer?.group_id)}
                        placeholder="Select destination group"
                        className="w-full"
                    />
                </div>

                {/* Carry-Over Configuration Display */}
                {carryoverConfig && (
                    <div className="bg-muted/20 rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-2">Carry-Over Policy</h4>
                        <p className="text-sm text-muted-foreground">{getPolicyDescription()}</p>
                    </div>
                )}

                {/* Preview Section */}
                {preview && selectedPlayer && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-muted/10 rounded-lg p-4 space-y-4"
                    >
                        <h4 className="font-medium text-foreground">Carry-Over Preview</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            {/* Current Stats */}
                            <div className="space-y-2">
                                <h5 className="font-medium text-muted-foreground">Current</h5>
                                <div className="space-y-1">
                                    <div>Wins: {preview.current.wins}</div>
                                    <div>Losses: {preview.current.losses}</div>
                                    <div>Ties: {preview.current.ties}</div>
                                    <div>Spread: {preview.current.spread >= 0 ? '+' : ''}{preview.current.spread}</div>
                                </div>
                            </div>

                            {/* Carry-Over Stats */}
                            <div className="space-y-2">
                                <h5 className="font-medium text-muted-foreground">Carry-Over</h5>
                                <div className="space-y-1">
                                    <div>Wins: {preview.carryover.wins}</div>
                                    <div>Spread: {preview.carryover.spread >= 0 ? '+' : ''}{preview.carryover.spread}</div>
                                </div>
                            </div>

                            {/* Total Stats */}
                            <div className="space-y-2">
                                <h5 className="font-medium text-muted-foreground">Total</h5>
                                <div className="space-y-1">
                                    <div>Wins: {preview.total.wins}</div>
                                    <div>Spread: {preview.total.spread >= 0 ? '+' : ''}{preview.total.spread}</div>
                                </div>
                            </div>
                        </div>

                        {carryoverConfig?.policy === 'seedingOnly' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <Icon name="Info" className="inline mr-1" size={14} />
                                    Carry-over values will be used for seeding only and won't count toward official totals.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleMovePlayer}
                        disabled={!selectedPlayer || !targetGroup || loading}
                        className="min-w-[120px]"
                    >
                        {loading ? (
                            <>
                                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                                Moving...
                            </>
                        ) : (
                            <>
                                <Icon name={eventType === 'promotion' ? 'ArrowUp' : 'ArrowDown'} className="mr-2" size={16} />
                                {eventType === 'promotion' ? 'Promote' : 'Demote'} Player
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PlayerPromotionManager;
