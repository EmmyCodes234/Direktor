import React, { useState, useMemo } from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import { toast } from 'sonner';

const RatingsCalculator = ({ players, results }) => {
    const [newRatings, setNewRatings] = useState([]);
    const [kFactor, setKFactor] = useState(32);

    const calculateElo = (ratingA, ratingB, scoreA) => {
        const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
        const actualA = scoreA;
        const newRatingA = ratingA + kFactor * (actualA - expectedA);
        return Math.round(newRatingA);
    };

    const handleCalculateRatings = () => {
        const ratings = new Map(players.map(p => [p.player_id, p.rating || 1500]));

        results.forEach(result => {
            const rating1 = ratings.get(result.player1_id);
            const rating2 = ratings.get(result.player2_id);

            const score1 = result.score1 > result.score2 ? 1 : (result.score1 < result.score2 ? 0 : 0.5);
            const score2 = 1 - score1;

            const newRating1 = calculateElo(rating1, rating2, score1);
            const newRating2 = calculateElo(rating2, rating1, score2);

            ratings.set(result.player1_id, newRating1);
            ratings.set(result.player2_id, newRating2);
        });

        const updatedRatings = players.map(p => ({
            ...p,
            new_rating: ratings.get(p.player_id),
            rating_change: ratings.get(p.player_id) - (p.rating || 1500),
        }));

        setNewRatings(updatedRatings);
        toast.success("New performance ratings have been calculated.");
    };

    return (
        <div className="glass-card p-6 mt-8">
            <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2">
                <Icon name="Calculator" size={20} className="text-primary" />
                <span>Performance Ratings Calculator</span>
            </h3>
            <div className="flex items-end space-x-4 mb-4">
                <div className="w-32">
                    <Input
                        label="K-Factor"
                        type="number"
                        value={kFactor}
                        onChange={(e) => setKFactor(parseInt(e.target.value, 10))}
                    />
                </div>
                <Button onClick={handleCalculateRatings}>Calculate New Ratings</Button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="p-3 text-left font-semibold text-foreground">Player</th>
                            <th className="p-3 text-center font-semibold text-foreground">Old Rating</th>
                            <th className="p-3 text-center font-semibold text-foreground">New Rating</th>
                            <th className="p-3 text-center font-semibold text-foreground">Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(newRatings.length > 0 ? newRatings : players).map(player => (
                            <tr key={player.id} className="border-b border-border/50">
                                <td className="p-3 text-left font-medium text-foreground">{player.name}</td>
                                <td className="p-3 text-center font-mono">{player.rating || 1500}</td>
                                <td className="p-3 text-center font-mono font-bold text-primary">{player.new_rating || '-'}</td>
                                <td className={`p-3 text-center font-mono font-semibold ${player.rating_change > 0 ? 'text-success' : (player.rating_change < 0 ? 'text-destructive' : '')}`}>
                                    {player.rating_change ? (player.rating_change > 0 ? `+${player.rating_change}` : player.rating_change) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RatingsCalculator;