import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import Icon from '../AppIcon';
import LadderSystemStatus from './LadderSystemStatus';

const LadderSystemConfigSection = ({ tournamentId, onConfigChange }) => {
    const [config, setConfig] = useState({
        isLadderMode: false,
        divisions: [
            { name: 'Premier', minRating: 1800, maxRating: 9999, color: '#FFD700' },
            { name: 'Division 1', minRating: 1600, maxRating: 1799, color: '#C0C0C0' },
            { name: 'Division 2', minRating: 1400, maxRating: 1599, color: '#CD7F32' },
            { name: 'Division 3', minRating: 0, maxRating: 1399, color: '#4A90E2' }
        ],
        promotionRules: {
            topPromote: 2,
            bottomRelegate: 2,
            autoPromoteRating: 1800,
            autoRelegateRating: 1600,
            minGamesForPromotion: 4
        },
        carryoverPolicy: 'partial',
        carryoverPercentage: 75,
        spreadCap: 100,
        showCarryoverInStandings: true,
        seasonLength: 8,
        seasonTransition: 'carryover',
        ratingSystem: 'elo',
        ratingKFactor: 32,
        ratingFloor: 1000,
        ratingCeiling: 2500
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const carryoverPolicyOptions = [
        { value: 'none', label: 'None - Reset scores on promotion/demotion' },
        { value: 'full', label: 'Full - Carry all wins and spread' },
        { value: 'partial', label: 'Partial - Carry percentage of wins and spread' },
        { value: 'capped', label: 'Capped - Carry wins but limit spread per game' },
        { value: 'seedingOnly', label: 'Seeding Only - Carry-over counts only for initial seeding' }
    ];

    const seasonTransitionOptions = [
        { value: 'carryover', label: 'Carry-over to next season' },
        { value: 'reset', label: 'Reset all scores' },
        { value: 'partial_reset', label: 'Partial reset (keep some history)' }
    ];

    const ratingSystemOptions = [
        { value: 'elo', label: 'Elo Rating System' },
        { value: 'glicko', label: 'Glicko Rating System' },
        { value: 'custom', label: 'Custom Rating System' }
    ];

    useEffect(() => {
        fetchConfig();
    }, [tournamentId]);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('ladder_system_config')
                .select('*')
                .eq('tournament_id', parseInt(tournamentId))
                .single();

            if (error && error.code !== 'PGRST116') {
                // If table doesn't exist, just log a warning and continue
                if (error.code === '42P01') {
                    console.warn('Ladder system table not available yet. Run database migration to enable ladder features.');
                    setLoading(false);
                    return;
                }
                throw error;
            }

            if (data) {
                setConfig(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Failed to fetch ladder config:', error);
            // Don't show error toast for missing table
            if (error.code !== '42P01') {
                toast.error('Failed to load ladder system configuration');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('ladder_system_config')
                .upsert({
                    tournament_id: parseInt(tournamentId),
                    ...config
                });

            if (error) {
                if (error.code === '42P01') {
                    toast.error('Ladder system not available. Please run database migration first.');
                    setSaving(false);
                    return;
                }
                throw error;
            }

            toast.success('Ladder system configuration saved successfully');
            if (onConfigChange) {
                onConfigChange(config);
            }
        } catch (error) {
            console.error('Failed to save ladder config:', error);
            if (error.code !== '42P01') {
                toast.error('Failed to save ladder system configuration');
            }
        } finally {
            setSaving(false);
        }
    };

    const addDivision = () => {
        setConfig(prev => ({
            ...prev,
            divisions: [...prev.divisions, {
                name: `Division ${prev.divisions.length + 1}`,
                minRating: 0,
                maxRating: 9999,
                color: '#4A90E2'
            }]
        }));
    };

    const removeDivision = (index) => {
        if (config.divisions.length <= 2) {
            toast.error('At least 2 divisions are required');
            return;
        }
        setConfig(prev => ({
            ...prev,
            divisions: prev.divisions.filter((_, i) => i !== index)
        }));
    };

    const updateDivision = (index, field, value) => {
        setConfig(prev => ({
            ...prev,
            divisions: prev.divisions.map((div, i) => 
                i === index ? { ...div, [field]: value } : div
            )
        }));
    };

    const getPolicyDescription = () => {
        switch (config.carryoverPolicy) {
            case 'none':
                return 'Players start fresh in their new division with no carry-over from previous performance.';
            case 'full':
                return 'All wins and spread are carried over to maintain competitive continuity.';
            case 'partial':
                return `${config.carryoverPercentage}% of wins and spread are carried over to balance fresh starts with competitive history.`;
            case 'capped':
                return `All wins are carried over, but spread is capped at ${config.spreadCap} points per game to prevent overwhelming advantages.`;
            case 'seedingOnly':
                return 'Carry-over values are used only for initial seeding in the new division, not for official standings.';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className="glass-card p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-32 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    // Check if ladder system is available
    const isLadderSystemAvailable = () => {
        // This will be true once the database migration is applied
        return true; // For now, always show the interface
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass-card p-6 space-y-6"
        >
            {/* Header */}
            <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent">
                    <Icon name="TrendingUp" size={20} color="white" />
                </div>
                <div>
                    <h3 className="font-heading font-semibold text-lg">Ladder System Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure multi-division ladder with promotion/relegation and carry-over policies
                    </p>
                </div>
            </div>

            {/* Status Indicator */}
            <LadderSystemStatus />

            {/* Enable Ladder Mode */}
            <div className="space-y-3">
                <div className="flex items-center space-x-3">
                    <Checkbox
                        id="ladderMode"
                        checked={config.isLadderMode}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isLadderMode: checked }))}
                    />
                    <label htmlFor="ladderMode" className="font-medium">
                        Enable Ladder System Mode
                    </label>
                </div>
                <p className="text-sm text-muted-foreground">
                    Transform this tournament into a multi-division ladder system with automatic promotion/relegation
                </p>
            </div>

            {config.isLadderMode && (
                <>
                    {/* Divisions Configuration */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center space-x-2">
                            <Icon name="Layers" size={16} />
                            <span>Divisions</span>
                        </h4>
                        
                        <div className="space-y-3">
                            {config.divisions.map((division, index) => (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg"
                                >
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <Input
                                            placeholder="Division Name"
                                            value={division.name}
                                            onChange={(e) => updateDivision(index, 'name', e.target.value)}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Min Rating"
                                            value={division.minRating}
                                            onChange={(e) => updateDivision(index, 'minRating', parseInt(e.target.value) || 0)}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Max Rating"
                                            value={division.maxRating}
                                            onChange={(e) => updateDivision(index, 'maxRating', parseInt(e.target.value) || 9999)}
                                        />
                                        <Input
                                            type="color"
                                            value={division.color}
                                            onChange={(e) => updateDivision(index, 'color', e.target.value)}
                                            className="w-full h-10"
                                        />
                                    </div>
                                    {config.divisions.length > 2 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeDivision(index)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Icon name="Trash2" size={16} />
                                        </Button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                        
                        <Button onClick={addDivision} variant="outline" size="sm">
                            <Icon name="Plus" className="mr-2" size={16} />
                            Add Division
                        </Button>
                    </div>

                    {/* Promotion/Relegation Rules */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center space-x-2">
                            <Icon name="ArrowUpDown" size={16} />
                            <span>Promotion & Relegation Rules</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                type="number"
                                label="Top Players to Promote"
                                value={config.promotionRules.topPromote}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    promotionRules: { ...prev.promotionRules, topPromote: parseInt(e.target.value) || 0 }
                                }))}
                            />
                            <Input
                                type="number"
                                label="Bottom Players to Relegate"
                                value={config.promotionRules.bottomRelegate}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    promotionRules: { ...prev.promotionRules, bottomRelegate: parseInt(e.target.value) || 0 }
                                }))}
                            />
                            <Input
                                type="number"
                                label="Auto-Promote Rating"
                                value={config.promotionRules.autoPromoteRating}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    promotionRules: { ...prev.promotionRules, autoPromoteRating: parseInt(e.target.value) || 0 }
                                }))}
                            />
                            <Input
                                type="number"
                                label="Auto-Relegate Rating"
                                value={config.promotionRules.autoRelegateRating}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    promotionRules: { ...prev.promotionRules, autoRelegateRating: parseInt(e.target.value) || 0 }
                                }))}
                            />
                        </div>
                    </div>

                    {/* Carry-Over Configuration */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center space-x-2">
                            <Icon name="Repeat" size={16} />
                            <span>Carry-Over Policy</span>
                        </h4>
                        
                        <Select
                            label="Carry-Over Policy"
                            value={config.carryoverPolicy}
                            onChange={(value) => setConfig(prev => ({ ...prev, carryoverPolicy: value }))}
                            options={carryoverPolicyOptions}
                        />
                        
                        <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded">
                            {getPolicyDescription()}
                        </p>

                        {config.carryoverPolicy === 'partial' && (
                            <Input
                                type="number"
                                label="Carry-Over Percentage"
                                value={config.carryoverPercentage}
                                onChange={(e) => setConfig(prev => ({ ...prev, carryoverPercentage: parseInt(e.target.value) || 0 }))}
                                min="0"
                                max="100"
                            />
                        )}

                        {config.carryoverPolicy === 'capped' && (
                            <Input
                                type="number"
                                label="Spread Cap per Game"
                                value={config.spreadCap}
                                onChange={(e) => setConfig(prev => ({ ...prev, spreadCap: parseInt(e.target.value) || 0 }))}
                            />
                        )}

                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="showCarryover"
                                checked={config.showCarryoverInStandings}
                                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showCarryoverInStandings: checked }))}
                            />
                            <label htmlFor="showCarryover" className="text-sm">
                                Show carry-over values in standings table
                            </label>
                        </div>
                    </div>

                    {/* Season Configuration */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center space-x-2">
                            <Icon name="Calendar" size={16} />
                            <span>Season Configuration</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                type="number"
                                label="Season Length (Rounds)"
                                value={config.seasonLength}
                                onChange={(e) => setConfig(prev => ({ ...prev, seasonLength: parseInt(e.target.value) || 8 }))}
                                min="4"
                                max="20"
                            />
                            <Select
                                label="Season Transition"
                                value={config.seasonTransition}
                                onChange={(value) => setConfig(prev => ({ ...prev, seasonTransition: value }))}
                                options={seasonTransitionOptions}
                            />
                        </div>
                    </div>

                    {/* Rating System */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center space-x-2">
                            <Icon name="BarChart3" size={16} />
                            <span>Rating System</span>
                        </h4>
                        
                        <Select
                            label="Rating System"
                            value={config.ratingSystem}
                            onChange={(value) => setConfig(prev => ({ ...prev, ratingSystem: value }))}
                            options={ratingSystemOptions}
                        />
                        
                        {config.ratingSystem === 'elo' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    type="number"
                                    label="K-Factor"
                                    value={config.ratingKFactor}
                                    onChange={(e) => setConfig(prev => ({ ...prev, ratingKFactor: parseInt(e.target.value) || 32 }))}
                                    min="10"
                                    max="100"
                                />
                                <Input
                                    type="number"
                                    label="Rating Floor"
                                    value={config.ratingFloor}
                                    onChange={(e) => setConfig(prev => ({ ...prev, ratingFloor: parseInt(e.target.value) || 1000 }))}
                                />
                                <Input
                                    type="number"
                                    label="Rating Ceiling"
                                    value={config.ratingCeiling}
                                    onChange={(e) => setConfig(prev => ({ ...prev, ratingCeiling: parseInt(e.target.value) || 2500 }))}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSave} loading={saving} disabled={!config.isLadderMode}>
                    <Icon name="Save" className="mr-2" size={16} />
                    Save Ladder Configuration
                </Button>
            </div>
        </motion.div>
    );
};

export default LadderSystemConfigSection;
