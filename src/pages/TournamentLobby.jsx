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
import LobbyHero from '../components/lobby/LobbyHero';
import LobbyStats from '../components/lobby/LobbyStats';

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
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        let currentUserId = user?.id;

        // If no user immediately available, try to fetch session
        if (!currentUserId) {
          try {
            const userData = await dispatch(fetchUser()).unwrap();
            currentUserId = userData?.id;
          } catch (e) {
            // User fetch failed or no session - fail gracefully
            console.log('No active session found during init');
          }
        }

        // If we have a user now, fetch their data
        if (currentUserId && mounted) {
          await dispatch(fetchUserTournaments(currentUserId)).unwrap();
        }
      } catch (error) {
        console.error('Initialization error:', error);
        // Only redirect on specific auth errors, otherwise let UI handle empty state
        if (error?.message?.includes('auth')) {
          handleError(error, 'Session expired', { redirect: '/login' });
        }
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    initializeApp();

    return () => { mounted = false; };
  }, [dispatch]); // Run once on mount

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
    const url = `https://direktorapp.netlify.app/tournament/${tournamentSlug}`;
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

  if (loading || isInitializing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className={cn("relative safe-area-inset-bottom", LAYOUT_TEMPLATES.page.withHeader)}>
          <div className={LAYOUT_TEMPLATES.container['2xl']}>
            <div className={cn(LAYOUT_TEMPLATES.spacing.sectionLg)}>

              {/* LobbyHero Skeleton */}
              <div className="w-full h-80 rounded-3xl border border-border bg-card shadow-sm p-8 md:p-12 mb-12 flex flex-col justify-center space-y-6">
                <div className="h-6 w-32 bg-secondary rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-12 w-2/3 bg-secondary rounded animate-pulse" />
                  <div className="h-12 w-1/2 bg-secondary rounded animate-pulse" />
                </div>
                <div className="flex gap-4 pt-4">
                  <div className="h-12 w-40 bg-secondary rounded animate-pulse" />
                  <div className="h-12 w-32 bg-secondary/50 rounded animate-pulse" />
                </div>
              </div>

              {/* LobbyStats Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
                      <div className="h-8 w-8 bg-secondary rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Tournament List Skeleton */}
              <div className="space-y-4">
                <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
                      <div className="h-6 w-3/4 bg-secondary rounded animate-pulse" />
                      <div className="h-4 w-full bg-secondary/50 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-secondary/50 rounded animate-pulse" />
                      <div className="pt-4 flex gap-2">
                        <div className="h-8 w-20 bg-secondary/30 rounded animate-pulse" />
                        <div className="h-8 w-20 bg-secondary/30 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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

        {/* Hero Background - Monochrome */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-background dark:bg-background border-b border-border/10" />

        <main className={cn("relative safe-area-inset-bottom", LAYOUT_TEMPLATES.page.withHeader)}>
          <div className={LAYOUT_TEMPLATES.container['2xl']}>
            {/* Enhanced Hero Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(LAYOUT_TEMPLATES.spacing.sectionLg)}
            >
              <LobbyHero
                userName={userName}
                onCreateClick={() => navigate('/tournament-setup-configuration')}
                onRecoverClick={() => setShowRecoveryModal(true)}
              />

              <LobbyStats
                totalTournaments={tournaments.length}
                activeCount={officialTournaments.length}
                draftCount={draftTournaments.length}
              />
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
                <Card className="bg-card border border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary border border-border/50">
                        <Icon name="FileText" size={20} className="text-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">Draft Tournaments</h2>
                        <p className="text-sm text-muted-foreground">Continue setting up your tournaments</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">
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
              <Card className="bg-card border border-border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary border border-border/50">
                      <Icon name="Trophy" size={20} className="text-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Active Tournaments</h2>
                      <p className="text-sm text-muted-foreground">Manage your running and completed tournaments</p>
                    </div>
                    {officialTournaments.length > 0 && (
                      <Badge variant="primary" className="ml-auto">
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
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary border border-border flex items-center justify-center">
                        <Icon name="Trophy" size={40} className="text-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">No tournaments yet</h3>
                      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Create your first tournament to start managing Scrabble competitions with ease.
                      </p>
                      <Button
                        onClick={() => navigate('/tournament-setup-configuration')}
                        iconName="Plus"
                        iconPosition="left"
                        variant="primary"
                        size="lg"
                        className="px-8 py-3 text-lg"
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