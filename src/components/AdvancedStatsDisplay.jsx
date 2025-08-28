import React, { useMemo } from 'react';
import Icon from './AppIcon';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
import { cn } from '../utils/cn';

const StatItem = ({ icon, label, value, subtext, index }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
    >
        <Card variant="glass" padding="md" className="touch-target hover:shadow-md transition-all duration-200">
            <CardContent className="p-0">
                <div className={cn(
                    "flex flex-col sm:flex-row sm:items-center",
                    "space-y-3 sm:space-y-0 sm:space-x-3"
                )}>
                    <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20",
                        "mx-auto sm:mx-0"
                    )}>
                        <Icon name={icon} size={24} className="text-primary" />
                    </div>
                    <div className="text-center sm:text-left">
                        <p className={cn(
                            "font-bold font-mono text-foreground",
                            "text-xl sm:text-2xl"
                        )}>{value}</p>
                        <p className="text-sm text-foreground font-medium">{label}</p>
                        {subtext && (
                            <p className={cn(
                                "text-xs text-muted-foreground mt-1 leading-relaxed"
                            )}>{subtext}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

const AdvancedStatsDisplay = ({ results, players }) => {
    const stats = useMemo(() => {
        if (!results || results.length === 0) {
            return {
                highGame: { value: 'N/A' },
                lowGame: { value: 'N/A' },
                highCombined: { value: 'N/A' },
                largestBlowout: { value: 'N/A' },
                biggestUpset: { value: 'N/A' },
            };
        }

        let highGame = { value: 0, player: '', opponent: '', score: '' };
        let lowGame = { value: Infinity, player: '', opponent: '', score: '' };
        let highCombined = { value: 0, player1: '', player2: '', score: '' };
        let largestBlowout = { value: 0, winner: '', loser: '', score: '' };
        let biggestUpset = { value: 0, winner: '', loser: '', ratings: '' };

        results.forEach(r => {
            const player1 = players.find(p => p.id === r.player1_id);
            const player2 = players.find(p => p.id === r.player2_id);
            
            // High/Low Game
            if (r.score1 > highGame.value) highGame = { value: r.score1, player: r.player1_name, opponent: r.player2_name, score: `${r.score1}-${r.score2}` };
            if (r.score2 > highGame.value) highGame = { value: r.score2, player: r.player2_name, opponent: r.player1_name, score: `${r.score2}-${r.score1}` };
            if (r.score1 < lowGame.value) lowGame = { value: r.score1, player: r.player1_name, opponent: r.player2_name, score: `${r.score1}-${r.score2}` };
            if (r.score2 < lowGame.value) lowGame = { value: r.score2, player: r.player2_name, opponent: r.player1_name, score: `${r.score2}-${r.score1}` };

            // High Combined Score
            const combined = r.score1 + r.score2;
            if (combined > highCombined.value) highCombined = { value: combined, player1: r.player1_name, player2: r.player2_name, score: `${r.score1}-${r.score2}` };
            
            // Largest Blowout
            const spread = Math.abs(r.score1 - r.score2);
            if (spread > largestBlowout.value) {
                const winner = r.score1 > r.score2 ? r.player1_name : r.player2_name;
                const loser = r.score1 > r.score2 ? r.player2_name : r.player1_name;
                largestBlowout = { value: spread, winner, loser, score: `${r.score1}-${r.score2}` };
            }

            // Biggest Upset
            if (player1 && player2) {
                const ratingDiff = Math.abs(player1.rating - player2.rating);
                if (r.score1 > r.score2 && player1.rating < player2.rating && ratingDiff > biggestUpset.value) {
                    biggestUpset = { value: ratingDiff, winner: player1.name, loser: player2.name, ratings: `${player1.rating} vs ${player2.rating}` };
                } else if (r.score2 > r.score1 && player2.rating < player1.rating && ratingDiff > biggestUpset.value) {
                    biggestUpset = { value: ratingDiff, winner: player2.name, loser: player1.name, ratings: `${player2.rating} vs ${player1.rating}` };
                }
            }
        });

        return { highGame, lowGame, highCombined, largestBlowout, biggestUpset };

    }, [results, players]);

    return (
        <div className={LAYOUT_TEMPLATES.grid['3']}>
            <StatItem icon="Flame" label="High Game Score" value={stats.highGame.value} subtext={stats.highGame.player && `${stats.highGame.player} vs ${stats.highGame.opponent} (${stats.highGame.score})`} index={0} />
            <StatItem icon="IceCream" label="Low Game Score" value={stats.lowGame.value === Infinity ? 'N/A' : stats.lowGame.value} subtext={stats.lowGame.player && `${stats.lowGame.player} vs ${stats.lowGame.opponent} (${stats.lowGame.score})`} index={1} />
            <StatItem icon="Users" label="High Combined Score" value={stats.highCombined.value} subtext={stats.highCombined.player1 && `${stats.highCombined.player1} & ${stats.highCombined.player2} (${stats.highCombined.score})`} index={2} />
            <StatItem icon="Zap" label="Largest Blowout" value={`+${stats.largestBlowout.value}`} subtext={stats.largestBlowout.winner && `${stats.largestBlowout.winner} over ${stats.largestBlowout.loser}`} index={3} />
            <StatItem icon="TrendingUp" label="Biggest Upset" value={`+${stats.biggestUpset.value} pts`} subtext={stats.biggestUpset.winner && `${stats.biggestUpset.winner} over ${stats.biggestUpset.loser} (${stats.biggestUpset.ratings})`} index={4} />
        </div>
    );
};

export default AdvancedStatsDisplay;