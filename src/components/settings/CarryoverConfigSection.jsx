import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import Icon from '../AppIcon';

const CarryoverConfigSection = ({ tournamentId, onConfigChange }) => {
    const [config, setConfig] = useState({
        policy: 'none',
        percentage: 50,
        spread_cap: 100,
        show_carryover_in_standings: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const policyOptions = [
        { value: 'none', label: 'None - Reset scores on promotion/demotion' },
        { value: 'full', label: 'Full - Carry all wins and spread' },
        { value: 'partial', label: 'Partial - Carry percentage of wins and spread' },
        { value: 'capped', label: 'Capped - Carry wins but limit spread per game' },
        { value: 'seedingOnly', label: 'Seeding Only - Carry-over counts only for initial seeding' }
    ];

    useEffect(() => {
        fetchConfig();
    }, [tournamentId]);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('carryover_config')
                .select('*')
                .eq('tournament_id', parseInt(tournamentId))
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setConfig({
                    policy: data.policy || 'none',
                    percentage: data.percentage || 50,
                    spread_cap: data.spread_cap || 100,
                    show_carryover_in_standings: data.show_carryover_in_standings !== false
                });
            }
        } catch (error) {
            console.error('Error fetching carry-over config:', error);
            toast.error('Failed to load carry-over configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('carryover_config')
                .upsert({
                    tournament_id: parseInt(tournamentId),
                    policy: config.policy,
                    percentage: config.policy === 'partial' ? config.percentage : null,
                    spread_cap: config.policy === 'capped' ? config.spread_cap : null,
                    show_carryover_in_standings: config.show_carryover_in_standings
                });

            if (error) throw error;

            toast.success('Carry-over configuration saved successfully');
            if (onConfigChange) {
                onConfigChange(config);
            }
        } catch (error) {
            console.error('Error saving carry-over config:', error);
            toast.error('Failed to save carry-over configuration');
        } finally {
            setSaving(false);
        }
    };

    const getPolicyDescription = () => {
        switch (config.policy) {
            case 'none':
                return 'Players start fresh in their new group with no carry-over from previous performance.';
            case 'full':
                return 'Players carry their complete win/loss record and point spread to the new group.';
            case 'partial':
                return `Players carry ${config.percentage}% of their wins and spread to the new group.`;
            case 'capped':
                return `Players carry all wins but spread is capped at ${config.spread_cap} points per game played.`;
            case 'seedingOnly':
                return 'Carry-over values are used only for initial seeding in the new group but do not count toward official totals.';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className="glass-card p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
        >
            <div className="flex items-center space-x-2 mb-6">
                <Icon name="ArrowUpDown" size={24} className="text-primary" />
                <h3 className="font-heading font-semibold text-xl">Carry-Over Configuration</h3>
            </div>

            <div className="space-y-6">
                {/* Policy Selection */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                        Carry-Over Policy
                    </label>
                    <Select
                        value={config.policy}
                        onChange={(value) => setConfig(prev => ({ ...prev, policy: value }))}
                        options={policyOptions}
                        placeholder="Select a carry-over policy"
                        className="w-full"
                    />
                    {config.policy && (
                        <p className="text-sm text-muted-foreground mt-2">
                            {getPolicyDescription()}
                        </p>
                    )}
                </div>

                {/* Partial Policy Configuration */}
                {config.policy === 'partial' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                    >
                        <label className="block text-sm font-medium text-foreground">
                            Carry-Over Percentage
                        </label>
                        <div className="flex items-center space-x-3">
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={config.percentage}
                                onChange={(e) => setConfig(prev => ({ 
                                    ...prev, 
                                    percentage: parseFloat(e.target.value) || 0 
                                }))}
                                className="w-32"
                                placeholder="50"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter a percentage between 0 and 100. Wins and spread will be rounded to 2 decimal places.
                        </p>
                    </motion.div>
                )}

                {/* Capped Policy Configuration */}
                {config.policy === 'capped' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                    >
                        <label className="block text-sm font-medium text-foreground">
                            Spread Cap per Game
                        </label>
                        <div className="flex items-center space-x-3">
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={config.spread_cap}
                                onChange={(e) => setConfig(prev => ({ 
                                    ...prev, 
                                    spread_cap: parseFloat(e.target.value) || 0 
                                }))}
                                className="w-32"
                                placeholder="100"
                            />
                            <span className="text-sm text-muted-foreground">points per game</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Maximum spread points that can be carried per game played. Total spread cap = cap × games played.
                        </p>
                    </motion.div>
                )}

                {/* Display Options */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-foreground">
                        Display Options
                    </label>
                    <Checkbox
                        checked={config.show_carryover_in_standings}
                        onChange={(checked) => setConfig(prev => ({ 
                            ...prev, 
                            show_carryover_in_standings: checked 
                        }))}
                        label="Show carry-over columns in standings table"
                    />
                    <p className="text-xs text-muted-foreground">
                        When enabled, standings will show separate columns for Carryover, Current, and Total values.
                    </p>
                </div>

                {/* Policy Examples */}
                <div className="bg-muted/20 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-3">Policy Examples</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Player with 8 wins, 2 losses, +150 spread:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <strong>Full:</strong> 8.00 wins, +150.00 spread
                            </div>
                            <div>
                                <strong>Partial (50%):</strong> 4.00 wins, +75.00 spread
                            </div>
                            <div>
                                <strong>Capped (100/game):</strong> 8.00 wins, +100.00 spread
                            </div>
                            <div>
                                <strong>Seeding Only:</strong> Used for seeding only
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="min-w-[120px]"
                    >
                        {saving ? (
                            <>
                                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Icon name="Save" className="mr-2" size={16} />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

export default CarryoverConfigSection;
