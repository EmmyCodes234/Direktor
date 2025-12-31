import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';
import Icon from '../components/AppIcon';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const ReportsPage = () => {
  const { tournamentSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [tournamentInfo, setTournamentInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: tourney, error: tourneyError } = await supabase
          .from('tournaments')
          .select('*')
          .eq('slug', tournamentSlug)
          .single();

        if (tourneyError) throw tourneyError;
        setTournamentInfo(tourney);

        // Fetch available reports (mocked for now, or fetch from a 'reports' table if exists)
        // In a real app, you might have generated PDF reports stored in storage or generated on the fly.
        setReports([
          { id: 'standings', name: 'Current Standings', type: 'PDF', date: new Date().toISOString(), icon: 'Trophy' },
          { id: 'roster', name: 'Player Roster', type: 'CSV', date: new Date().toISOString(), icon: 'Users' },
          { id: 'games', name: 'Game Results', type: 'CSV', date: new Date().toISOString(), icon: 'Gamepad2' },
          { id: 'ratings', name: 'Rating Changes (Proj.)', type: 'PDF', date: new Date().toISOString(), icon: 'TrendingUp' },
        ]);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournamentSlug]);

  const handleDownload = (report) => {
    toast.info(`Downloading ${report.name}...`);
    // Simulate download
    setTimeout(() => toast.success('Download started'), 1000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout tournamentInfo={tournamentInfo}>
      <Toaster position="top-center" richColors />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports & Exports</h1>
          <p className="text-muted-foreground mt-1">Download tournament data, standings, and statistical reports.</p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="bg-card border border-border shadow-sm hover:border-primary/50 transition-colors group cursor-pointer" onClick={() => handleDownload(report)}>
              <div className="p-6 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon name={report.icon} size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{report.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Generated: {new Date(report.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-xs font-bold px-2 py-1 rounded bg-secondary text-muted-foreground uppercase tracking-wider">
                  {report.type}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="p-4 rounded-lg border border-border bg-secondary/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Icon name="Info" size={20} />
          </div>
          <div>
            <h4 className="font-medium text-sm">Need a custom report?</h4>
            <p className="text-xs text-muted-foreground">Contact support to request specific data exports for your tournament.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;