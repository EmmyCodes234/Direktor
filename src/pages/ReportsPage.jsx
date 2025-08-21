import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header';
import { useParams } from 'react-router-dom';
import DashboardSidebar from './tournament-command-center-dashboard/components/DashboardSidebar';
import FileExporter from '../components/export/FileExporter';
import Icon from '../components/AppIcon';
import { supabase } from '../supabaseClient';
import { Toaster, toast } from 'sonner';

const ReportsPage = () => {
    const { tournamentSlug } = useParams();
    const [tournamentData, setTournamentData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTournament = async () => {
          if (!tournamentSlug) return;
          setLoading(true);
          
          try {
            const { data, error } = await supabase
              .from('tournaments')
              .select('*')
              .eq('slug', tournamentSlug)
              .single();
            
            if (error) {
              toast.error("Failed to load tournament data for reports.");
              return;
            }

            // Fetch players data
            const { data: playersData, error: playersError } = await supabase
              .from('tournament_players')
              .select(`
                *,
                players (*)
              `)
              .eq('tournament_id', data.id);

            if (playersError) {
              toast.error("Failed to load players data for reports.");
              return;
            }

            // Fetch results data
            const { data: resultsData, error: resultsError } = await supabase
              .from('results')
              .select('*')
              .eq('tournament_id', data.id);

            if (resultsError) {
              toast.error("Failed to load results data for reports.");
              return;
            }
              
            setTournamentData({ 
              ...data, 
              players: playersData || [],
              results: resultsData || [] 
            });
          } catch (error) {
            toast.error("An unexpected error occurred while loading tournament data.");
          } finally {
            setLoading(false);
          }
        };
        fetchTournament();
    }, [tournamentSlug]);

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-20 pb-8">
                 <div className="max-w-7xl mx-auto px-4 lg:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
                        <DashboardSidebar tournamentSlug={tournamentSlug} />
                        <div className="md:col-span-3 space-y-8">
                             <div>
                                <h1 className="text-3xl font-heading font-bold text-gradient mb-2">Reports & Exports</h1>
                                <p className="text-muted-foreground">Generate official files and view tournament reports.</p>
                            </div>
                            {loading ? (
                                <div className="glass-card p-8 text-center">
                                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-muted-foreground">Loading tournament data...</p>
                                </div>
                            ) : tournamentData ? (
                                <FileExporter 
                                    tournamentInfo={tournamentData}
                                    players={tournamentData.players?.map(tp => tp.players) || []}
                                    results={tournamentData.results}
                                />
                            ) : (
                                <div className="glass-card p-8 text-center">
                                    <Icon name="AlertCircle" size={48} className="mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Failed to load tournament data.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportsPage;