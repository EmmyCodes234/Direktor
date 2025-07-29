import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Toaster, toast } from 'sonner';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const RegistrationPage = () => {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', rating: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchTournament = async () => {
            if (!tournamentId) {
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from('tournaments')
                .select('name, date, venue, players')
                .eq('id', tournamentId)
                .single();
            
            if (error || !data) {
                console.error("Error fetching tournament for registration", error);
            } else {
                setTournament(data);
            }
            setLoading(false);
        };
        fetchTournament();
    }, [tournamentId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error("Player name is required.");
            return;
        }
        setIsSubmitting(true);

        const newPlayer = {
            id: `P${String((tournament.players || []).length + 1).padStart(3, '0')}`,
            name: formData.name,
            email: formData.email,
            rating: formData.rating ? parseInt(formData.rating, 10) : null,
            status: 'pending_approval', // New status for pre-registered players
            registeredAt: new Date().toISOString()
        };

        const updatedPlayers = [...(tournament.players || []), newPlayer];

        const { error } = await supabase
            .from('tournaments')
            .update({ players: updatedPlayers })
            .eq('id', tournamentId);

        if (error) {
            toast.error("Registration failed. Please try again.");
            console.error(error);
        } else {
            toast.success("You have been successfully registered for the tournament!");
            setFormData({ name: '', email: '', rating: '' });
        }
        setIsSubmitting(false);
    };

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading Registration...</p></div>;
    }

    if (!tournament) {
        return <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4"><Icon name="SearchX" size={64} className="text-destructive opacity-50 mb-4" /><h1 className="text-2xl font-heading font-bold text-foreground">Tournament Not Found</h1></div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="top-center" richColors />
            <div className="max-w-xl mx-auto py-12 px-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-heading font-bold text-gradient">{tournament.name}</h1>
                    <p className="text-muted-foreground mt-1">Player Registration</p>
                </div>

                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Full Name" name="name" type="text" value={formData.name} onChange={handleChange} required placeholder="Enter your full name" />
                        <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="For updates and notifications" />
                        <Input label="Scrabble Rating (Optional)" name="rating" type="number" value={formData.rating} onChange={handleChange} placeholder="e.g., 1500" />
                        <div className="pt-4">
                            <Button type="submit" className="w-full" loading={isSubmitting}>
                                Register for Tournament
                            </Button>
                        </div>
                    </form>
                </div>
                 <div className="text-center mt-6">
                    <Button variant="link" onClick={() => navigate(`/tournaments/${tournamentId}/live`)}>
                        View Tournament Portal
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RegistrationPage;