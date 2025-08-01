import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Header from '../components/ui/Header';
import { Toaster, toast } from 'sonner';
import Icon from '../components/AppIcon';
import PerformanceGraph from '../components/players/PerformanceGraph';

const PlayerProfilePage = () => {
    const { playerSlug } = useParams();
    const navigate = useNavigate();
    const [player, setPlayer] = useState(null);
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayerData = async () => {
            if (!playerSlug) return;
            setLoading(true);

            const { data: playerData, error: pError } = await supabase
                .from('players')
                .select('*')
                .eq('slug', playerSlug)
                .single();

            if (pError || !playerData) {
                toast.error("Player not found.");
                setLoading(false);
                return;
            }
            setPlayer(playerData);

            const { data: participationData, error: tError } = await supabase
                .from('tournament_players')
                .select('*, tournaments(*)')
                .eq('player_id', playerData.id)
                .order('created_at', { referencedTable: 'tournaments', ascending: false });
            
            if (tError) {
                toast.error("Failed to load tournament history.");
            } else {
                setTournaments(participationData.map(p => ({...p.tournaments, ...p})));
            }
            
            setLoading(false);
        };
        fetchPlayerData();
    }, [playerSlug]);

    const performanceData = useMemo(() => {
        return tournaments.map(t => ({
            tournamentName: t.name,
            rating: t.rating_after || t.rating_before || player.rating, // Placeholder for future implementation
        })).reverse();
    }, [tournaments, player]);

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading Player Profile...</p></div>;
    }

    if (!player) {
        return <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4"><Icon name="SearchX" size={64} className="text-destructive opacity-50 mb-4" /><h1 className="text-2xl font-heading font-bold text-foreground">Player Not Found</h1></div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-20 pb-8">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                        <img 
                            src={player.photo_url || `https://ui-avatars.com/api/?name=${player.name.split(' ').join('+')}&background=0d89ec&color=fff&size=128`} 
                            alt={player.name}
                            className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg"
                        />
                        <div>
                            <h1 className="text-4xl font-heading font-bold text-foreground">{player.name}</h1>
                            <p className="text-lg text-muted-foreground">Rating: <span className="text-primary font-bold">{player.rating || 'Unrated'}</span></p>
                        </div>
                    </div>

                    <PerformanceGraph data={performanceData} />

                    <div className="mt-8">
                        <h3 className="font-heading font-semibold text-2xl mb-4">Tournament History</h3>
                        <div className="space-y-4">
                            {tournaments.map(t => (
                                <div key={t.id} className="glass-card p-4 flex justify-between items-center hover:shadow-glow transition-shadow">
                                    <div>
                                        <p className="font-semibold text-foreground">{t.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Rank: {t.rank} • Wins: {t.wins} • Spread: {t.spread > 0 ? '+' : ''}{t.spread}
                                        </p>
                                    </div>
                                    <button onClick={() => navigate(`/tournaments/${t.slug}/live`)} className="text-primary hover:underline text-sm">
                                        View Event
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlayerProfilePage;