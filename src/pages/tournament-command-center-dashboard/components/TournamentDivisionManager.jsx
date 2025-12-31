import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { toast } from 'sonner';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';

const TournamentDivisionManager = ({ tournamentId, divisions: initialDivisions, onUpdate }) => {
    const [divisions, setDivisions] = useState(initialDivisions || []);
    const [isLoading, setIsLoading] = useState(false);
    const [playerStats, setPlayerStats] = useState({});

    useEffect(() => {
        fetchDivisionStats();
    }, [divisions]);

    const fetchDivisionStats = async () => {
        const { data, error } = await supabase
            .from('tournament_players')
            .select('division')
            .eq('tournament_id', tournamentId);

        if (data) {
            const stats = data.reduce((acc, curr) => {
                const div = curr.division || 'Unassigned';
                acc[div] = (acc[div] || 0) + 1;
                return acc;
            }, {});
            setPlayerStats(stats);
        }
    };

    const handleDivisionChange = (index, field, value) => {
        const newDivisions = [...divisions];
        newDivisions[index][field] = value;
        setDivisions(newDivisions);
    };

    const addDivision = () => {
        const newDivisionName = `Division ${String.fromCharCode(65 + divisions.length)}`;
        setDivisions([...divisions, { name: newDivisionName, min_rating: 0, max_rating: 0 }]);
    };

    const removeDivision = (index) => {
        const newDivisions = divisions.filter((_, i) => i !== index);
        setDivisions(newDivisions);
    };

    const saveDivisions = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('tournaments')
                .update({ divisions: divisions })
                .eq('id', tournamentId);

            if (error) throw error;
            toast.success('Divisions updated successfully!');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update divisions.');
        } finally {
            setIsLoading(false);
        }
    };

    const autoAssignPlayers = async () => {
        if (!confirm("This will overwrite existing division assignments for all players based on their rating. Continue?")) return;

        setIsLoading(true);
        try {
            const { data: players, error: fetchError } = await supabase
                .from('tournament_players')
                .select('player_id, players(rating)')
                .eq('tournament_id', tournamentId);

            if (fetchError) throw fetchError;

            const updates = players.map(tp => {
                const rating = tp.players?.rating || 0;
                const assignedDiv = divisions.find(d => rating >= d.min_rating && rating <= d.max_rating);
                return {
                    player_id: tp.player_id,
                    division: assignedDiv ? assignedDiv.name : 'Unassigned'
                };
            });

            // Batch update using parallel requests
            const updatePromises = updates.map(update =>
                supabase
                    .from('tournament_players')
                    .update({ division: update.division })
                    .eq('tournament_id', tournamentId)
                    .eq('player_id', update.player_id)
            );

            await Promise.all(updatePromises);
            toast.success(`Assigned ${updates.length} players to divisions.`);
            fetchDivisionStats();
        } catch (error) {
            console.error(error);
            toast.error('Failed to auto-assign players.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Division Management</h3>
                    <p className="text-slate-400">Configure rating bands and organize your player pools.</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" onClick={autoAssignPlayers} loading={isLoading} className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                        <Icon name="Wand2" className="mr-2 text-emerald-400" size={16} />
                        Auto-Assign
                    </Button>
                    <Button onClick={saveDivisions} loading={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                        <Icon name="Save" className="mr-2" size={16} />
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Division Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {divisions.map((division, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 overflow-hidden hover:border-emerald-500/30 transition-all duration-300 shadow-lg"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-9xl select-none pointer-events-none transition-opacity group-hover:opacity-10 text-white">
                                    {division.name.charAt(0)}
                                </div>

                                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Division Name</label>
                                                <input
                                                    value={division.name}
                                                    onChange={(e) => handleDivisionChange(index, 'name', e.target.value)}
                                                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-lg font-bold text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-700"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeDivision(index)}
                                                className="mt-6 p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            >
                                                <Icon name="Trash2" size={20} />
                                            </button>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={division.use_rating_caps || false}
                                                    onChange={(e) => handleDivisionChange(index, 'use_rating_caps', e.target.checked)}
                                                />
                                                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/50 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                                <span className="ml-3 text-sm font-medium text-slate-300">Rating Caps</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Rating Inputs */}
                                    <AnimatePresence>
                                        {division.use_rating_caps && (
                                            <motion.div
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="flex gap-4 overflow-hidden"
                                            >
                                                <div className="w-24">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Min</label>
                                                    <input
                                                        type="number"
                                                        value={division.min_rating}
                                                        onChange={(e) => handleDivisionChange(index, 'min_rating', parseInt(e.target.value) || 0)}
                                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 font-mono text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Max</label>
                                                    <input
                                                        type="number"
                                                        value={division.max_rating}
                                                        onChange={(e) => handleDivisionChange(index, 'max_rating', parseInt(e.target.value) || 0)}
                                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 font-mono text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500 bg-black/20 w-fit px-3 py-1 rounded-full">
                                    <Icon name="Users" size={12} />
                                    <span>{playerStats[division.name] || 0} Players</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <button
                        onClick={addDivision}
                        className="p-8 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Icon name="Plus" size={24} />
                        </div>
                        <span className="font-semibold">Add New Division</span>
                    </button>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl">
                        <h4 className="font-bold text-white mb-6 flex items-center">
                            <Icon name="BarChart2" className="mr-2 text-emerald-500" />
                            Distribution
                        </h4>

                        <div className="space-y-4">
                            {Object.entries(playerStats).map(([divName, count]) => (
                                <div key={divName} className="space-y-1">
                                    <div className="flex justify-between text-sm text-slate-300">
                                        <span>{divName}</span>
                                        <span className="font-mono">{count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${Math.max(5, (count / Math.max(1, Object.values(playerStats).reduce((a, b) => a + b, 0))) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {Object.keys(playerStats).length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    No players assigned yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                            <Icon name="AlertTriangle" className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h5 className="font-bold text-yellow-500 text-sm mb-1">Warning</h5>
                                <p className="text-xs text-yellow-500/80 leading-relaxed">
                                    Modifying divisions after the tournament starts may affect pairings and standings. Ensure all players are correctly assigned before generating R1 pairings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentDivisionManager;
