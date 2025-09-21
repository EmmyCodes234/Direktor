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
            // Handle both results table and matches table data
            const score1 = r.score1 !== undefined ? r.score1 : (r.player1_score || 0);
            const score2 = r.score2 !== undefined ? r.score2 : (r.player2_score || 0);
            const player1Name = r.player1_name || 'Player 1';
            const player2Name = r.player2_name || 'Player 2';
            
            // Find players by ID for rating information
            const player1 = players.find(p => p.id === r.player1_id || p.player_id === r.player1_id);
            const player2 = players.find(p => p.id === r.player2_id || p.player_id === r.player2_id);
            
            // Handle case where player IDs might be strings
            if (!player1 && typeof r.player1_id === 'string') {
                const player1Alt = players.find(p => p.id === parseInt(r.player1_id) || p.player_id === parseInt(r.player1_id));
                if (player1Alt) player1 = player1Alt;
            }
            if (!player2 && typeof r.player2_id === 'string') {
                const player2Alt = players.find(p => p.id === parseInt(r.player2_id) || p.player_id === parseInt(r.player2_id));
                if (player2Alt) player2 = player2Alt;
            }
            
            // High/Low Game
            if (score1 > highGame.value) highGame = { value: score1, player: player1Name, opponent: player2Name, score: `${score1}-${score2}` };
            if (score2 > highGame.value) highGame = { value: score2, player: player2Name, opponent: player1Name, score: `${score2}-${score1}` };
            if (score1 < lowGame.value) lowGame = { value: score1, player: player1Name, opponent: player2Name, score: `${score1}-${score2}` };
            if (score2 < lowGame.value) lowGame = { value: score2, player: player2Name, opponent: player1Name, score: `${score2}-${score1}` };

            // High Combined Score
            const combined = score1 + score2;
            if (combined > highCombined.value) highCombined = { value: combined, player1: player1Name, player2: player2Name, score: `${score1}-${score2}` };
            
            // Largest Blowout
            const spread = Math.abs(score1 - score2);
            if (spread > largestBlowout.value) {
                const winner = score1 > score2 ? player1Name : player2Name;
                const loser = score1 > score2 ? player2Name : player1Name;
                largestBlowout = { value: spread, winner, loser, score: `${score1}-${score2}` };
            }

            // Biggest Upset (only if we have player ratings)
            if (player1 && player2 && player1.rating && player2.rating) {
                const ratingDiff = Math.abs(player1.rating - player2.rating);
                if (score1 > score2 && player1.rating < player2.rating && ratingDiff > biggestUpset.value) {
                    biggestUpset = { value: ratingDiff, winner: player1.name, loser: player2.name, ratings: `${player1.rating} vs ${player2.rating}` };
                } else if (score2 > score1 && player2.rating < player1.rating && ratingDiff > biggestUpset.value) {
                    biggestUpset = { value: ratingDiff, winner: player2.name, loser: player1.name, ratings: `${player2.rating} vs ${player1.rating}` };
                }
            }
        });

        // Handle edge case for lowGame
        if (lowGame.value === Infinity) {
            lowGame = { value: 'N/A', player: '', opponent: '', score: '' };
        }

        return { highGame, lowGame, highCombined, largestBlowout, biggestUpset };

    }, [results, players]);

    return (
        <div className={LAYOUT_TEMPLATES.grid['3']}>
            <StatItem icon="Flame" label="High Game Score" value={stats.highGame.value} subtext={stats.highGame.player && `${stats.highGame.player} vs ${stats.highGame.opponent} (${stats.highGame.score})`} index={0} />
            <StatItem icon="IceCream" label="Low Game Score" value={stats.lowGame.value} subtext={stats.lowGame.player && `${stats.lowGame.player} vs ${stats.lowGame.opponent} (${stats.lowGame.score})`} index={1} />
            <StatItem icon="Users" label="High Combined Score" value={stats.highCombined.value} subtext={stats.highCombined.player1 && `${stats.highCombined.player1} & ${stats.highCombined.player2} (${stats.highCombined.score})`} index={2} />
            <StatItem icon="Zap" label="Largest Blowout" value={stats.largestBlowout.value !== 0 ? `+${stats.largestBlowout.value}` : 'N/A'} subtext={stats.largestBlowout.winner && `${stats.largestBlowout.winner} over ${stats.largestBlowout.loser}`} index={3} />
            <StatItem icon="TrendingUp" label="Biggest Upset" value={stats.biggestUpset.value !== 0 ? `+${stats.biggestUpset.value} pts` : 'N/A'} subtext={stats.biggestUpset.winner && `${stats.biggestUpset.winner} over ${stats.biggestUpset.loser} (${stats.biggestUpset.ratings})`} index={4} />
        </div>
    );
};

export default AdvancedStatsDisplay;