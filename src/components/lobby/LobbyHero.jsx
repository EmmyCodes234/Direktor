import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import Icon from '../AppIcon';

const LobbyHero = ({ userName, tournaments = [], onCreateClick }) => {
    // Generate data for the graph based on recent tournaments
    const graphData = React.useMemo(() => {
        // Take last 7 created tournaments
        const recent = [...tournaments]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .slice(-7);

        // Map to player counts or default value, normalized to 20-100 range for visuals
        const values = recent.map(t => (t.playerCount || 0));
        const max = Math.max(...values, 10); // Avoid divide by zero

        // Create 7 bars, padding with "empty" states if not enough data
        const bars = Array(7).fill(0).map((_, i) => {
            if (i < 7 - recent.length) return 10; // Base height for empty slots
            const value = values[i - (7 - recent.length)];
            return 10 + ((value / max) * 80); // Normalize to 10-90%
        });

        return bars;
    }, [tournaments]);

    return (
        <div className="relative w-full overflow-hidden mb-12 rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6 text-center lg:text-left"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        SYSTEM OPERATIONAL
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white">
                        Welcome back,<br />
                        <span className="text-slate-400">{userName}</span>
                    </h1>

                    <p className="text-lg text-slate-400 max-w-md mx-auto lg:mx-0 font-light">
                        Ready to manage your next world-class Scrabble event?
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <Button
                            onClick={onCreateClick}
                            size="lg"
                            className="h-12 px-8 text-base shadow-lg hover:shadow-emerald-500/20 transition-all bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                            iconName="Plus"
                        >
                            Create Tournament
                        </Button>

                    </div>
                </motion.div>

                {/* Abstract Data Viz Decoration */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="hidden lg:block relative h-64 w-full rounded-2xl border border-white/5 bg-black/20 overflow-hidden backdrop-blur-sm"
                >
                    <div className="absolute inset-0 grid grid-cols-6 gap-px opacity-10">
                        {[...Array(24)].map((_, i) => (
                            <div key={i} className="bg-white/10" />
                        ))}
                    </div>
                    {/* Dynamic Graph */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-between px-8 pb-8 gap-2">
                        {graphData.map((h, i) => (
                            <div
                                key={i}
                                className="w-full bg-emerald-500 rounded-t-sm opacity-20 hover:opacity-100 transition-opacity duration-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                    <div className="absolute top-4 right-4 text-xs font-mono text-emerald-500/50">
                        RECENT_ACTIVITY
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LobbyHero;
