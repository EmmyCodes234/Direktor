import React, { useMemo } from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';

const SmartSuggestions = ({ players, onApplyDivisions }) => {
    const suggestions = useMemo(() => {
        if (!players || players.length < 12) {
            return null; // Don't show suggestions for small tournaments
        }

        const ratings = players.map(p => p.rating || 0).sort((a, b) => b - a);
        const topRating = ratings[0];
        const medianRating = ratings[Math.floor(ratings.length / 2)];
        
        let divisionSuggestions = [];

        if (topRating > 1600 && medianRating < 1500) {
            // Suggest 2 divisions
            const cutoff = Math.round(medianRating / 100) * 100;
            divisionSuggestions = [
                { name: 'Division A', min_rating: cutoff, max_rating: 9999 },
                { name: 'Division B', min_rating: 0, max_rating: cutoff - 1 }
            ];
        } else if (topRating > 1800 && ratings[Math.floor(ratings.length / 3)] > 1500) {
            // Suggest 3 divisions
            const cutoff1 = 1600;
            const cutoff2 = 1200;
            divisionSuggestions = [
                { name: 'Division A', min_rating: cutoff1, max_rating: 9999 },
                { name: 'Division B', min_rating: cutoff2, max_rating: cutoff1 - 1 },
                { name: 'Division C', min_rating: 0, max_rating: cutoff2 - 1 }
            ];
        }

        if (divisionSuggestions.length === 0) return null;

        return {
            title: `Suggestion: Create ${divisionSuggestions.length} Divisions`,
            description: `Based on the rating distribution of your players, we recommend splitting the tournament into ${divisionSuggestions.length} divisions for more competitive games.`,
            divisions: divisionSuggestions
        };
    }, [players]);

    if (!suggestions) {
        return null;
    }

    return (
        <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg mt-6">
            <div className="flex items-start space-x-3">
                <Icon name="Wand2" size={20} className="text-accent mt-1" />
                <div>
                    <h4 className="font-semibold text-foreground">{suggestions.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">{suggestions.description}</p>
                    <Button size="sm" onClick={() => onApplyDivisions(suggestions.divisions)}>
                        Apply Suggestion
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SmartSuggestions;