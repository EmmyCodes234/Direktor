import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Header from '../components/ui/Header';
import DashboardSidebar from './tournament-command-center-dashboard/components/DashboardSidebar';
import { Toaster, toast } from 'sonner';
import Icon from '../components/AppIcon';

const WallChartPage = () => {
    const { tournamentSlug } = useParams();
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTournamentData = useCallback(async () => {
        if (!tournamentSlug) return;
        setLoading(true);

        const { data: tournamentData, error: tError } = await supabase
            .from('tournaments')
            .select('id, name, rounds')
            .eq('slug', tournamentSlug)
            .single();

        if (tError) {
            toast.error("Failed to load tournament data.");
            setLoading(false);
            return;
        }
        setTournament(tournamentData);

        const { data: playersData, error: pError } = await supabase
            .from('tournament_players')
            .select('*, players(name)')
            .eq('tournament_id', tournamentData.id)
            .order('rank', { ascending: true });

        if (pError) {
            toast.error("Failed to load player data.");
        } else {
            setPlayers(playersData.map(p => ({ ...p, name: p.players.name })));
        }

        const { data: resultsData, error: rError } = await supabase
            .from('results')
            .select('*')
            .eq('tournament_id', tournamentData.id);

        if (rError) {
            toast.error("Failed to load results data.");
        } else {
            setResults(resultsData);
        }

        setLoading(false);
    }, [tournamentSlug]);

    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData]);

    const wallChartData = useMemo(() => {
        return players.map(player => {
            const playerResults = Array.from({ length: tournament?.rounds || 0 });
            results.forEach(result => {
                if (result.player1_id === player.player_id) {
                    playerResults[result.round - 1] = { opponent: result.player2_name, score: `${result.score1}-${result.score2}` };
                } else if (result.player2_id === player.player_id) {
                    playerResults[result.round - 1] = { opponent: result.player1_name, score: `${result.score2}-${result.score1}` };
                }
            });
            return {
                ...player,
                results: playerResults,
            };
        });
    }, [players, results, tournament]);

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-20 pb-8">
                <div className="max-w-7xl mx-auto px-4 lg:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
                        <DashboardSidebar tournamentSlug={tournamentSlug} />
                        <div className="md:col-span-3">
                            <div className="mb-8">
                                <h1 className="text-3xl font-heading font-bold text-gradient mb-2">Wall Chart</h1>
                                <p className="text-muted-foreground">A complete grid view of all tournament games.</p>
                            </div>
                            <div className="glass-card overflow-x-auto">
                                {loading ? (
                                    <p className="p-12 text-center text-muted-foreground">Loading chart data...</p>
                                ) : (
                                    <table className="w-full min-w-[800px] text-sm text-center">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="p-3 text-left font-semibold text-foreground">Player</th>
                                                {Array.from({ length: tournament?.rounds || 0 }, (_, i) => (
                                                    <th key={i} className="p-3 font-semibold text-foreground">{i + 1}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {wallChartData.map(player => (
                                                <tr key={player.id} className="border-b border-border/50">
                                                    <td className="p-3 text-left font-medium text-foreground sticky left-0 bg-card">{player.name}</td>
                                                    {player.results.map((res, index) => (
                                                        <td key={index} className="p-3">
                                                            {res ? (
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">{res.opponent}</p>
                                                                    <p className="font-mono">{res.score}</p>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WallChartPage;