import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import Icon from '../AppIcon';

const LobbyHero = ({ userName, onCreateClick, onRecoverClick }) => {
    return (
        <div className="relative w-full overflow-hidden mb-12 rounded-3xl border border-border bg-card shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-foreground to-transparent opacity-20" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6 text-center lg:text-left"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-mono text-muted-foreground">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        SYSTEM OPERATIONAL
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground">
                        Welcome back,<br />
                        <span className="text-muted-foreground">{userName}</span>
                    </h1>

                    <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 font-light">
                        Ready to manage your next world-class Scrabble event?
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <Button
                            onClick={onCreateClick}
                            size="lg"
                            className="h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all"
                            iconName="Plus"
                        >
                            Create Tournament
                        </Button>
                        <Button
                            onClick={onRecoverClick}
                            variant="outline"
                            size="lg"
                            className="h-12 px-8 text-base border-border bg-transparent hover:bg-secondary"
                            iconName="Search"
                        >
                            Recover Data
                        </Button>
                    </div>
                </motion.div>

                {/* Abstract Data Viz Decoration */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="hidden lg:block relative h-64 w-full rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden"
                >
                    <div className="absolute inset-0 grid grid-cols-6 gap-px opacity-20">
                        {[...Array(24)].map((_, i) => (
                            <div key={i} className="bg-foreground/5" />
                        ))}
                    </div>
                    {/* Mock Graph */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-between px-8 pb-8 gap-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div
                                key={i}
                                className="w-full bg-foreground rounded-t-sm opacity-20 hover:opacity-40 transition-opacity duration-500"
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                    <div className="absolute top-4 right-4 text-xs font-mono text-muted-foreground">
                        ACTIVITY_LOG_V2
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LobbyHero;
