import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import Input from '../ui/Input';

const PrizeManager = ({ currency = '$' }) => {
    const { tournamentId } = useParams();
    const [prizes, setPrizes] = useState([]);
    const [newPrize, setNewPrize] = useState({ rank: 1, value: '', description: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrizes = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('prizes')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('rank', { ascending: true });
            if (error) {
                toast.error(`Failed to load prizes: ${error.message}`);
            } else {
                setPrizes(data);
                setNewPrize({ rank: data.length + 1, value: '', description: '' });
            }
            setLoading(false);
        };
        fetchPrizes();
    }, [tournamentId]);

    const handleAddPrize = async () => {
        if (!newPrize.description && !newPrize.value) {
            toast.error("Please enter a value or description for the prize.");
            return;
        }

        if (newPrize.rank <= 0) {
            toast.error("Rank must be a positive number.");
            return;
        }

        if (prizes.some(p => p.rank === newPrize.rank)) {
            toast.error(`A prize for rank ${newPrize.rank} already exists.`);
            return;
        }

        const { data, error } = await supabase
            .from('prizes')
            .insert({ ...newPrize, tournament_id: tournamentId, value: newPrize.value || null })
            .select();
        
        if (error) {
            toast.error(`Failed to add prize: ${error.message || 'An unknown error occurred.'}`);
        } else {
            const updatedPrizes = [...prizes, ...data].sort((a, b) => a.rank - b.rank);
            setPrizes(updatedPrizes);
            setNewPrize({ rank: updatedPrizes.length + 1, value: '', description: '' });
            toast.success("Prize added successfully.");
        }
    };

    const handleRemovePrize = async (prizeId) => {
        const { error } = await supabase
            .from('prizes')
            .delete()
            .eq('id', prizeId);

        if (error) {
            toast.error(`Failed to remove prize: ${error.message}`);
        } else {
            const updatedPrizes = prizes.filter(p => p.id !== prizeId);
            setPrizes(updatedPrizes);
            setNewPrize({ rank: updatedPrizes.length + 1, value: '', description: '' });
            toast.success("Prize removed.");
        }
    };

    return (
        <div className="glass-card p-6">
            <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2">
                <Icon name="Gift" size={20} className="text-primary" />
                <span>Prize Declarations</span>
            </h3>
            {loading ? (
                <p className="text-muted-foreground">Loading prizes...</p>
            ) : (
                <div className="space-y-4 mb-6">
                    {prizes.map(prize => (
                        <div key={prize.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <span className="font-bold text-primary">#{prize.rank}</span>
                                <div>
                                    <p className="font-medium text-foreground">{prize.description}</p>
                                    {prize.value && <p className="text-sm text-success font-mono">{currency}{prize.value}</p>}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemovePrize(prize.id)}>
                                <Icon name="Trash2" size={16} className="text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,1fr,auto] gap-4 items-end p-4 border-t border-border">
                <Input
                    label="Rank"
                    type="number"
                    value={newPrize.rank}
                    onChange={(e) => setNewPrize({ ...newPrize, rank: parseInt(e.target.value) || 1 })}
                    className="w-20"
                />
                <Input
                    label={`Monetary Value (${currency})`}
                    type="number"
                    placeholder="e.g., 500"
                    value={newPrize.value}
                    onChange={(e) => setNewPrize({ ...newPrize, value: e.target.value })}
                />
                <Input
                    label="Non-Monetary Prize"
                    placeholder="e.g., Trophy + Plaque"
                    value={newPrize.description}
                    onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
                />
                <Button onClick={handleAddPrize}>
                    <Icon name="Plus" size={16} className="mr-2" />
                    Add
                </Button>
            </div>
        </div>
    );
};

export default PrizeManager;