import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent } from '../ui/Card';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import { toast } from 'sonner';

const ClassConfigurationSection = ({ classDefinitions = [], onChange }) => {
    const [newClass, setNewClass] = useState({ name: '', min: 0, max: 2000 });

    const handleAddClass = () => {
        if (!newClass.name.trim()) {
            toast.error("Class name is required");
            return;
        }
        if (newClass.min > newClass.max) {
            toast.error("Min rating cannot be greater than Max rating");
            return;
        }

        const updated = [...classDefinitions, { ...newClass, id: Date.now() }];
        // Sort by Min Rating Descending (Highest classes first) usually looks better
        updated.sort((a, b) => b.min - a.min);

        onChange(updated);
        setNewClass({ name: '', min: 0, max: 2000 });
        toast.success(`Class "${newClass.name}" added`);
    };

    const handleRemoveClass = (index) => {
        const updated = [...classDefinitions];
        updated.splice(index, 1);
        onChange(updated);
    };

    return (
        <Card className="bg-slate-900/40 border border-slate-800 shadow-none">
            <CardHeader className="pb-4 border-b border-slate-800">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <Icon name="Layers" size={18} className="text-emerald-500" /> Class Definitions
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    Define rating ranges to automatically group players. (e.g., Class A: 1600-1800)
                </p>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

                {/* Add New Class Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-950/50 p-4 rounded-xl border border-dashed border-slate-800">
                    <div className="md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Pro, Class A"
                            className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white focus:border-emerald-500 transition-colors"
                            value={newClass.name}
                            onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Min Rating</label>
                        <input
                            type="number"
                            className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white focus:border-emerald-500 transition-colors"
                            value={newClass.min}
                            onChange={e => setNewClass({ ...newClass, min: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Max Rating</label>
                        <input
                            type="number"
                            className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white focus:border-emerald-500 transition-colors"
                            value={newClass.max}
                            onChange={e => setNewClass({ ...newClass, max: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div>
                        <Button
                            type="button"
                            onClick={handleAddClass}
                            className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            <Icon name="Plus" size={16} className="mr-2" /> Add
                        </Button>
                    </div>
                </div>

                {/* List of Classes */}
                <div className="space-y-2">
                    <AnimatePresence>
                        {classDefinitions.length === 0 ? (
                            <div className="text-center py-8 text-slate-600 italic text-sm">
                                No classes defined. All players will be "Unclassified".
                            </div>
                        ) : (
                            classDefinitions.map((def, i) => (
                                <motion.div
                                    key={def.id || i}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs">
                                            {def.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-200 text-sm">{def.name}</h4>
                                            <p className="text-xs text-slate-500 font-mono">
                                                Rating: <span className="text-emerald-400">{def.min}</span> - <span className="text-emerald-400">{def.max}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveClass(i)}
                                        className="text-slate-600 hover:text-red-400 hover:bg-red-950/20"
                                    >
                                        <Icon name="Trash2" size={16} />
                                    </Button>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

            </CardContent>
        </Card>
    );
};

export default ClassConfigurationSection;
