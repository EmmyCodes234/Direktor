import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/ui/Header';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/LoadingStates';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import TournamentRecoveryModal from '../components/TournamentRecoveryModal';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserTournaments, deleteTournament } from '../store/slices/tournamentsSlice';
import { fetchUser, signOut } from '../store/slices/authSlice';
import { useUser } from '../store/hooks';
import { handleError } from '../utils/errorHandler';

const TournamentLobby = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useUser();
  const { list: tournaments, loading, deleting } = useAppSelector(state => state.tournaments);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app, current user:', user);
        
        // Fetch user if not already loaded
        if (!user) {
          console.log('No user found, fetching user...');
          const userData = await dispatch(fetchUser()).unwrap();
          console.log('Fetched user:', userData);
        }
        
        // Fetch tournaments if user is available
        if (user?.id) {
          console.log('User available, fetching tournaments for:', user.id);
          await dispatch(fetchUserTournaments(user.id)).unwrap();
        } else {
          console.log('No user ID available for tournament fetching');
        }
      } catch (error) {
        console.error('Error in initializeApp:', error);
        handleError(error, 'Failed to initialize app', { redirect: '/login' });
      }
    };

    initializeApp();
  }, [dispatch, user]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await dispatch(signOut()).unwrap();
      navigate('/');
    } catch (error) {
      handleError(error, 'Logout failed');
    }
  };

  const handleSelectTournament = (tournament) => {
    if (tournament.status === 'draft') {
        navigate(`/tournament-setup-configuration?draftId=${tournament.id}`);
    } else {
        navigate(`/tournament/${tournament.slug}/dashboard`);
    }
  };

  const handleShareTournament = (tournamentSlug) => {
    const url = `https://direktorapp.netlify.app/tournaments/${tournamentSlug}/live`;
    navigator.clipboard.writeText(url).then(() => {
        toast.success("Public link copied to clipboard!");
    });
  };

  const openDeleteConfirm = (tournament) => {
    setTournamentToDelete(tournament);
    setShowConfirmModal(true);
  };

  const handleDeleteTournament = async () => {
    if (!tournamentToDelete || !user?.id) return;
    
    try {
      await dispatch(deleteTournament({ 
        id: tournamentToDelete.id, 
        userId: user.id 
      })).unwrap();
      setShowConfirmModal(false);
      setTournamentToDelete(null);
    } catch (error) {
      handleError(error, 'Failed to delete tournament');
    }
  };

  const handleTournamentRecovered = (tournament) => {
    // Refresh the tournament list
    if (user?.id) {
      dispatch(fetchUserTournaments(user.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-6">
            <div className="mb-8">
              <div className="h-8 w-64 bg-muted/20 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-48 bg-muted/20 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  const officialTournaments = tournaments.filter(t => t.status !== 'draft');
  const draftTournaments = tournaments.filter(t => t.status === 'draft');
  const userName = user?.user_metadata?.full_name || user?.email;

  return (
    <>
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleDeleteTournament}
        title="Delete Tournament"
        message={`Are you sure you want to permanently delete "${tournamentToDelete?.name}"? All associated data will be lost and cannot be recovered.`}
        confirmText="Delete Tournament"
        variant="destructive"
      />
      
      <div className="min-h-screen bg-background">
        <Toaster position="top-center" richColors />
        <Header />
        <main className="pt-20 pb-8 safe-area-inset-bottom">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Enhanced Header Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gradient">
                    Tournament Lobby
                  </h1>
                  <p className="text-muted-foreground">
                    Welcome back, <span className="font-medium text-foreground">{userName}</span>!
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => navigate('/tournament-setup-configuration')} 
                    iconName="Plus" 
                    iconPosition="left"
                    className="shadow-glow"
                  >
                    <span className="hidden sm:inline">New Tournament</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setShowRecoveryModal(true)} 
                    iconName="Search" 
                    iconPosition="left"
                    size="sm"
                  >
                    <span className="hidden sm:inline">Recover Tournaments</span>
                    <span className="sm:hidden">Recover</span>
                  </Button>
                  
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      aria-label="User menu"
                      className="focus-ring"
                    >
                      <Icon name="User" size={16} />
                    </Button>
                    
                    <AnimatePresence>
                      {userMenuOpen && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-48 glass-card shadow-glass-xl z-20"
                          >
                            <div className="p-2">
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start focus-ring" 
                                onClick={() => {navigate('/profile'); setUserMenuOpen(false);}}
                              >
                                <Icon name="Settings" size={14} className="mr-2" /> 
                                Profile Settings
                              </Button>
                              <div className="h-px bg-border/50 my-1" />
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 focus-ring" 
                                onClick={handleLogout}
                              >
                                <Icon name="LogOut" size={14} className="mr-2" /> 
                                Logout
                              </Button>
                            </div>
                          </motion.div>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setUserMenuOpen(false)}
                          />
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Draft Tournaments Section */}
            {draftTournaments.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="FileText" size={20} className="text-muted-foreground" />
                  <h2 className="text-xl font-semibold text-muted-foreground">Draft Tournaments</h2>
                  <span className="px-2 py-1 text-xs bg-muted/20 text-muted-foreground rounded-full">
                    {draftTournaments.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {draftTournaments.map((tourney, index) => (
                    <motion.div
                      key={tourney.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="glass-card-interactive p-4 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {tourney.name || "Untitled Tournament"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Draft saved {new Date(tourney.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Icon name="Edit3" size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSelectTournament(tourney)}
                        className="w-full"
                      >
                        Continue Setup
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Active Tournaments Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Icon name="Trophy" size={20} className="text-muted-foreground" />
                <h2 className="text-xl font-semibold text-muted-foreground">My Tournaments</h2>
                {officialTournaments.length > 0 && (
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    {officialTournaments.length}
                  </span>
                )}
              </div>

              {officialTournaments.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {officialTournaments.map((tourney, index) => (
                    <motion.div
                      key={tourney.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="glass-card-interactive p-6 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-lg mb-1 truncate">
                            {tourney.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Icon name="Users" size={14} />
                              {tourney.playerCount || 0} players
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Icon name="RotateCcw" size={14} />
                              {tourney.rounds} rounds
                            </span>
                            <span>•</span>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              tourney.status === 'active' ? 'bg-success/10 text-success' :
                              tourney.status === 'completed' ? 'bg-muted/20 text-muted-foreground' :
                              'bg-warning/10 text-warning'
                            )}>
                              {tourney.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            onClick={() => handleShareTournament(tourney.slug)}
                            tooltip="Share tournament"
                            aria-label="Share tournament"
                          >
                            <Icon name="Share2" size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            onClick={() => openDeleteConfirm(tourney)}
                            tooltip="Delete tournament"
                            aria-label="Delete tournament"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                        <Button 
                          onClick={() => handleSelectTournament(tourney)}
                          className="shadow-sm"
                        >
                          Manage
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center glass-card p-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/10 flex items-center justify-center">
                    <Icon name="Trophy" size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No tournaments yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first tournament to start managing Scrabble competitions with ease.
                  </p>
                  <Button 
                    onClick={() => navigate('/tournament-setup-configuration')}
                    iconName="Plus"
                    iconPosition="left"
                    className="shadow-glow"
                  >
                    Create Tournament
                  </Button>
                </motion.div>
              )}
            </motion.section>
          </div>
        </main>
      </div>
      
      <TournamentRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onTournamentRecovered={handleTournamentRecovered}
      />
    </>
  );
};

export default TournamentLobby;