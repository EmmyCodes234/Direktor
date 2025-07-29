import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header';
import { useParams } from 'react-router-dom';
import DashboardSidebar from './tournament-command-center-dashboard/components/DashboardSidebar';
import FileExporter from '../components/export/FileExporter'; // Corrected Path
import { supabase } from '../supabaseClient';
import { Toaster, toast } from 'sonner';

const ReportsPage = () => {
    const { tournamentId } = useParams();
    const [tournamentData, setTournamentData] = useState(null);

    useEffect(() => {
        const fetchTournament = async () => {
          if (!tournamentId) return;
          const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', tournamentId)
            .single();
          
          if (error) {
            toast.error("Failed to load tournament data for reports.");
          } else {
            const { data: resultsData } = await supabase
              .from('results')
              .select('*')
              .eq('tournament_id', tournamentId);
            
            setTournamentData({ ...data, results: resultsData || [] });
          }
        };
        fetchTournament();
    }, [tournamentId]);

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-20 pb-8">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <DashboardSidebar tournamentId={tournamentId} />
                        <div className="md:col-span-3 space-y-8">
                             <div>
                                <h1 className="text-3xl font-heading font-bold text-gradient mb-2">Reports & Exports</h1>
                                <p className="text-muted-foreground">Generate official files and view tournament reports.</p>
                            </div>
                            {tournamentData ? (
                                <FileExporter 
                                    tournamentInfo={tournamentData}
                                    players={tournamentData.players}
                                    results={tournamentData.results}
                                />
                            ) : (
                                <p className="text-muted-foreground">Loading tournament data...</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportsPage;