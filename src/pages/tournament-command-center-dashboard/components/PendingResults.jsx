import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

const PendingResults = ({ pending, onApprove, onReject, compact = false }) => {
    return (
        <div className={cn("flex flex-col", compact ? "bg-transparent border-0" : "bg-card border border-border rounded-xl shadow-sm")}>
            {!compact && (
                <div className="p-4 sm:p-5 lg:p-6 border-b border-border flex justify-between items-center">
                    <h3 className="font-heading font-semibold text-foreground flex items-center space-x-2">
                        <Icon name="Mail" size={18} className="text-foreground" />
                        <span className="text-base sm:text-lg">Pending Results</span>
                    </h3>
                    {pending.length > 0 && (
                        <motion.span
                            className="bg-primary text-primary-foreground text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                            {pending.length}
                        </motion.span>
                    )}
                </div>
            )}
            <div className={cn("space-y-3 overflow-y-auto", compact ? "px-0" : "p-4 sm:p-5 lg:p-6 max-h-96")}>
                {pending.length === 0 ? (
                    <div className="text-center py-8">
                        <Icon name="CheckCircle" size={compact ? 32 : 48} className="text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">All caught up.</p>
                    </div>
                ) : (
                    pending.map((p, index) => (
                        <motion.div
                            key={p.id}
                            className={cn(
                                "rounded-xl border transition-all duration-200",
                                compact
                                    ? "bg-slate-950/40 p-3 border-slate-800/50"
                                    : "bg-secondary/30 p-4 border-border"
                            )}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className={cn("font-bold text-slate-100 uppercase tracking-wide", compact ? "text-[10px]" : "text-sm sm:text-base")}>
                                            {p.player1_name} <span className="text-slate-600 px-1">VS</span> {p.player2_name}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>Round {p.round}</span>
                                            <span>•</span>
                                            <span className="truncate max-w-[100px]">From {p.submitted_by_name?.split(' ')[0]}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-2">
                                        <div className="text-center min-w-[30px]">
                                            <div className="text-xs font-mono font-black text-emerald-400">{p.score1}</div>
                                        </div>
                                        <div className="w-1.5 h-[1px] bg-slate-700" />
                                        <div className="text-center min-w-[30px]">
                                            <div className="text-xs font-mono font-black text-emerald-400">{p.score2}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onReject(p.id)}
                                        className="h-7 flex-1 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 hover:border-rose-400/20 text-[10px] uppercase font-bold tracking-wider transition-all"
                                    >
                                        <Icon name="X" size={12} className="mr-1.5" />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => onApprove(p)}
                                        className="h-7 flex-1 flex items-center justify-center rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all text-[10px] uppercase font-bold tracking-wider"
                                    >
                                        <Icon name="Check" size={12} className="mr-1.5" />
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PendingResults;