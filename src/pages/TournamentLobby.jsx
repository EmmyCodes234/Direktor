import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/ui/Header';
import Icon from '../components/AppIcon';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';

import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import TournamentRecoveryModal from '../components/TournamentRecoveryModal';
import TournamentCard from '../components/tournaments/TournamentCard';
import TournamentFilters from '../components/tournaments/TournamentFilters';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserTournaments, deleteTournament } from '../store/slices/tournamentsSlice';
import { fetchUser, signOut } from '../store/slices/authSlice';
import { useUser } from '../store/hooks';
import { handleError } from '../utils/errorHandler';
import { supabase } from '../supabaseClient';
import { LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';

const TournamentLobby = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useUser();
  const { list: tournaments, loading, deleting } = useAppSelector(state => state.tournaments);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentView, setCurrentView] = useState('grid');

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
        
        // Diagnostic: Check database tables and data
        if (user?.id) {
          console.log('Running database diagnostics for user:', user.id);
          
          // Check if tournaments table exists and has data
          try {
            const { data: allTournaments, error: tournamentsError } = await supabase
              .from('tournaments')
              .select('id, name, user_id, created_at')
              .order('created_at', { ascending: false })
              .limit(10);
            
            console.log('Database diagnostic - All tournaments:', allTournaments);
            console.log('Database diagnostic - Tournaments error:', tournamentsError);
            
            // Check user-specific tournaments
            const { data: userTournaments, error: userError } = await supabase
              .from('tournaments')
              .select('id, name, user_id, created_at')
              .eq('user_id', user.id);
            
            console.log('Database diagnostic - User tournaments:', userTournaments);
            console.log('Database diagnostic - User tournaments error:', userError);
            
            // Check if user exists in auth.users
            const { data: authUser, error: authError } = await supabase.auth.getUser();
            console.log('Database diagnostic - Auth user:', authUser);
            console.log('Database diagnostic - Auth error:', authError);
            
          } catch (diagnosticError) {
            console.error('Database diagnostic failed:', diagnosticError);
          }
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

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

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
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <Header />
        <main className="pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="mb-8">
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <div className="h-8 w-8 bg-muted rounded animate-pulse mx-auto"></div>
                  <p className="text-zinc-600 dark:text-zinc-400">Loading lobby...</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-muted rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                  </div>
                </div>
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
      <ConfirmationModal
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleDeleteTournament}
        title="Delete Tournament"
        message={`Are you sure you want to permanently delete "${tournamentToDelete?.name}"? All associated data will be lost and cannot be recovered.`}
        confirmText="Delete Tournament"
      />
      
      <div className={cn("min-h-screen", LAYOUT_TEMPLATES.page.withHeader)}>
        <Toaster position="top-center" richColors />
        <Header />
        
        {/* Hero Background with Purple Gradient */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-purple-950/5 dark:bg-purple-950/10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <main className={cn("relative safe-area-inset-bottom", LAYOUT_TEMPLATES.page.withHeader)}>
          <div className={LAYOUT_TEMPLATES.container['2xl']}>
            {/* Enhanced Hero Header Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("text-center", LAYOUT_TEMPLATES.spacing.sectionLg)}
            >
              <div className="max-w-4xl mx-auto">
                {/* Welcome Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-tr from-zinc-300/20 via-purple-400/30 to-transparent dark:from-zinc-300/5 dark:via-purple-400/20 border border-zinc-300/50 dark:border-zinc-600/50 rounded-full text-sm text-zinc-700 dark:text-zinc-300 mb-6"
                >
                  <Icon name="Trophy" size={16} className="text-purple-600 dark:text-purple-400" />
                  Tournament Management Hub
                </motion.div>
                
                {/* Main Title */}
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
                >
                  <span className="bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
                    Welcome back,
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    {userName}
                  </span>
                </motion.h1>
                
                {/* Subtitle */}
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto"
                >
                  Manage your tournaments, track player progress, and create unforgettable Scrabble experiences.
                </motion.p>
                
                {/* Action Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <Button 
                    onClick={() => navigate('/tournament-setup-configuration')} 
                    iconName="Plus" 
                    iconPosition="left"
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg hover:shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 px-8 py-3 text-lg"
                  >
                    Create New Tournament
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setShowRecoveryModal(true)} 
                    iconName="Search" 
                    iconPosition="left"
                    className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-8 py-3 text-lg"
                  >
                    Recover Tournaments
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Tournament Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className={LAYOUT_TEMPLATES.spacing.sectionSm}
            >
              <TournamentFilters 
                onFilterChange={handleFilterChange}
                onViewChange={handleViewChange}
                currentView={currentView}
              />
            </motion.div>
            
            {/* Draft Tournaments Section */}
            {draftTournaments.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={LAYOUT_TEMPLATES.spacing.sectionLg}
              >
                <Card className="bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 dark:from-amber-950/20 dark:via-zinc-800 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-700/30">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-400/20 dark:from-amber-400/10 dark:to-orange-400/10">
                        <Icon name="FileText" size={20} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Draft Tournaments</h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Continue setting up your tournaments</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                        {draftTournaments.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className={LAYOUT_TEMPLATES.grid['3']}>
                      {draftTournaments.map((tourney, index) => (
                        <TournamentCard
                          key={tourney.id}
                          tournament={tourney}
                          variant="draft"
                          index={index}
                          onSelect={handleSelectTournament}
                          onShare={handleShareTournament}
                          onDelete={openDeleteConfirm}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.section>
            )}

            {/* Active Tournaments Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-gradient-to-br from-zinc-50/50 via-white to-zinc-100/30 dark:from-zinc-900/50 dark:via-zinc-800 dark:to-zinc-900/30 border-zinc-200/50 dark:border-zinc-700/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-400/10 dark:to-pink-400/10">
                      <Icon name="Trophy" size={20} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Active Tournaments</h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage your running and completed tournaments</p>
                    </div>
                    {officialTournaments.length > 0 && (
                      <Badge variant="default" className="ml-auto bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
                        {officialTournaments.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {officialTournaments.length > 0 ? (
                    <div className={LAYOUT_TEMPLATES.grid['3']}>
                      {officialTournaments.map((tourney, index) => (
                        <TournamentCard
                          key={tourney.id}
                          tournament={tourney}
                          variant="default"
                          index={index}
                          onSelect={handleSelectTournament}
                          onShare={handleShareTournament}
                          onDelete={openDeleteConfirm}
                        />
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      className={cn("text-center", LAYOUT_TEMPLATES.spacing.sectionLg)}
                    >
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                        <Icon name="Trophy" size={40} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">No tournaments yet</h3>
                      <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
                        Create your first tournament to start managing Scrabble competitions with ease.
                      </p>
                      <Button 
                        onClick={() => navigate('/tournament-setup-configuration')}
                        iconName="Plus"
                        iconPosition="left"
                        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg hover:shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 px-8 py-3 text-lg"
                      >
                        Create Tournament
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
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