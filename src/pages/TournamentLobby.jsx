import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/ui/Header';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';
import ConfirmationModal from '../components/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';

const TournamentLobby = () => {
  const [tournaments, setTournaments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndTournaments = async () => {
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUser(session.user);
        } else {
            navigate('/login');
            return;
        }

        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tournaments:', error);
          toast.error("Failed to load tournaments.");
        } else {
          setTournaments(data);
        }
        setLoading(false);
    };

    fetchUserAndTournaments();
  }, [navigate]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
        toast.error(`Logout failed: ${error.message}`);
    } else {
        toast.success("You have been logged out.");
        navigate('/');
    }
  };

  const handleSelectTournament = (tournament) => {
    if (tournament.status === 'draft') {
        navigate(`/tournament-setup-configuration?draftId=${tournament.id}`);
    } else {
        navigate(`/tournament/${tournament.id}/dashboard`);
    }
  };

  const handleShareTournament = (tournamentId) => {
    const url = `https://direktorapp.netlify.app/tournaments/${tournamentId}/live`;
    navigator.clipboard.writeText(url).then(() => {
        toast.success("Public link copied to clipboard!");
    });
  };

  const openDeleteConfirm = (tournament) => {
    setTournamentToDelete(tournament);
    setShowConfirmModal(true);
  };

  const handleDeleteTournament = async () => {
    if (!tournamentToDelete) return;
    const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentToDelete.id);
    
    if (error) {
        toast.error(`Failed to delete tournament: ${error.message}`);
    } else {
        toast.success(`Tournament "${tournamentToDelete.name}" has been deleted.`);
        setTournaments(prev => prev.filter(t => t.id !== tournamentToDelete.id));
    }
    setShowConfirmModal(false);
    setTournamentToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading Lobby...</p>
      </div>
    );
  }
  
  const officialTournaments = tournaments.filter(t => t.status !== 'draft');
  const draftTournaments = tournaments.filter(t => t.status === 'draft');
  const userName = user?.user_metadata?.full_name || user?.email;

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Delete Tournament"
        message={`Are you sure you want to permanently delete "${tournamentToDelete?.name}"? All associated data will be lost.`}
        onConfirm={handleDeleteTournament}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Yes, Delete"
      />
      <div className="min-h-screen bg-background">
        <Toaster position="top-center" richColors />
        <Header />
        <main className="pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-gradient">Tournament Lobby</h1>
                    <p className="text-muted-foreground">Welcome back, {userName}!</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={() => navigate('/tournament-setup-configuration')} iconName="Plus" iconPosition="left">
                      New Tournament
                  </Button>
                  <div className="relative">
                      <Button variant="outline" size="icon" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                          <Icon name="User" size={16} />
                      </Button>
                      <AnimatePresence>
                        {userMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20"
                            >
                                <Button variant="ghost" className="w-full justify-start" onClick={() => {navigate('/profile'); setUserMenuOpen(false);}}>
                                    <Icon name="Settings" size={14} className="mr-2"/> Profile Settings
                                </Button>
                                <div className="h-px bg-border mx-2"></div>
                                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleLogout}>
                                    <Icon name="LogOut" size={14} className="mr-2"/> Logout
                                </Button>
                            </motion.div>
                        )}
                      </AnimatePresence>
                  </div>
                </div>
            </div>
            
            {draftTournaments.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Drafts</h2>
                    <div className="space-y-4">
                        {draftTournaments.map((tourney) => (
                             <div key={tourney.id} className="glass-card p-4 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                                <div>
                                    <h3 className="font-semibold text-foreground">{tourney.name || "Untitled Tournament"}</h3>
                                    <p className="text-sm text-muted-foreground">Draft saved on {new Date(tourney.created_at).toLocaleDateString()}</p>
                                </div>
                                <Button variant="outline" onClick={() => handleSelectTournament(tourney)}>Continue Setup</Button>
                             </div>
                        ))}
                    </div>
                </div>
            )}

            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">My Tournaments</h2>
            <div className="space-y-4">
              {officialTournaments.length > 0 ? (
                officialTournaments.map((tourney) => (
                  <div key={tourney.id} className="glass-card p-4 flex flex-wrap items-center justify-between hover:shadow-glow transition-shadow gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{tourney.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tourney.playerCount || 0} players • {tourney.rounds} rounds • Status: {tourney.status}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleShareTournament(tourney.id)}><Icon name="Link" size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(tourney)}><Icon name="Trash2" size={16} /></Button>
                      <Button variant="outline" onClick={() => handleSelectTournament(tourney)}>Manage</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center glass-card p-12">
                  <Icon name="Trophy" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No tournaments yet</h3>
                  <p className="text-muted-foreground mt-1 mb-4">Click "New Tournament" to get started.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TournamentLobby;