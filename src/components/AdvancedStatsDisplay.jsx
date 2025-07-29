import React, { useMemo } from 'react';
import Icon from './AppIcon';

const StatItem = ({ icon, label, value, subtext }) => (
    <div className="glass-card p-4">
        <div className="flex items-center space-x-3">
            <Icon name={icon} size={24} className="text-primary" />
            <div>
                <p className="text-xl font-bold font-mono">{value}</p>
                <p className="text-sm text-foreground font-medium">{label}</p>
                {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            </div>
        </div>
    </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatItem icon="Flame" label="High Game Score" value={stats.highGame.value} subtext={stats.highGame.player && `${stats.highGame.player} vs ${stats.highGame.opponent} (${stats.highGame.score})`} />
            <StatItem icon="IceCream" label="Low Game Score" value={stats.lowGame.value === Infinity ? 'N/A' : stats.lowGame.value} subtext={stats.lowGame.player && `${stats.lowGame.player} vs ${stats.lowGame.opponent} (${stats.lowGame.score})`} />
            <StatItem icon="Users" label="High Combined Score" value={stats.highCombined.value} subtext={stats.highCombined.player1 && `${stats.highCombined.player1} & ${stats.highCombined.player2} (${stats.highCombined.score})`} />
            <StatItem icon="Zap" label="Largest Blowout" value={`+${stats.largestBlowout.value}`} subtext={stats.largestBlowout.winner && `${stats.largestBlowout.winner} over ${stats.largestBlowout.loser}`} />
            <StatItem icon="TrendingUp" label="Biggest Upset" value={`+${stats.biggestUpset.value} pts`} subtext={stats.biggestUpset.winner && `${stats.biggestUpset.winner} over ${stats.biggestUpset.loser} (${stats.biggestUpset.ratings})`} />
        </div>
    );
};

export default AdvancedStatsDisplay;