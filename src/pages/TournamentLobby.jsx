import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/ui/Header';
import Icon from '../components/AppIcon';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import TournamentCard from '../components/tournaments/TournamentCard';
import DirectorProfileHeader from '../components/lobby/DirectorProfileHeader';

import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserTournaments, deleteTournament } from '../store/slices/tournamentsSlice';
import { fetchUser, signOut } from '../store/slices/authSlice';
import { useUser } from '../store/hooks';
import { handleError } from '../utils/errorHandler';
import { LAYOUT_TEMPLATES } from '../design-system';
import PublicLoadingScreen from '../components/public/PublicLoadingScreen';

const TournamentLobby = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useUser();
  const { list: tournaments, loading } = useAppSelector(state => state.tournaments);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    const initializeApp = async () => {
      try {
        let currentUserId = user?.id;
        if (!currentUserId) {
          try {
            const userData = await dispatch(fetchUser()).unwrap();
            currentUserId = userData?.id;
          } catch (e) { console.log('No active session found during init'); }
        }
        if (currentUserId && mounted) {
          await dispatch(fetchUserTournaments(currentUserId)).unwrap();
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (error?.message?.includes('auth')) handleError(error, 'Session expired', { redirect: '/login' });
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };
    initializeApp();
    return () => { mounted = false; };
  }, [dispatch]);

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

  if (loading || isInitializing) {
    return <PublicLoadingScreen variant="dark" />;
  }

  const officialTournaments = tournaments.filter(t => t.status !== 'draft');
  const draftTournaments = tournaments.filter(t => t.status === 'draft');
  const stats = {
    total: tournaments.length,
    active: officialTournaments.length,
    drafts: draftTournaments.length
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleDeleteTournament}
        title="Delete Tournament"
        message={`Are you sure you want to permanently delete "${tournamentToDelete?.name}"? All associated data will be lost.`}
        confirmText="Delete Tournament"
      />

      <div className="dark min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-emerald-500/30">
        <Toaster position="top-center" richColors />
        <Header />

        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* New Premium Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DirectorProfileHeader
              user={user}
              stats={stats}
              onCreateClick={() => navigate('/tournament-setup-configuration')}
            />
          </motion.div>


          {/* Content Area */}
          <div className="space-y-16">

            {/* Drafts Section */}
            {draftTournaments.length > 0 && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Icon name="FileEdit" className="text-slate-500" />
                    Drafts
                  </h2>
                  <div className="h-px bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              </motion.section>
            )}

            {/* Active Section */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Icon name="Trophy" className="text-emerald-500" />
                  Active Tournaments
                </h2>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {officialTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {officialTournaments.map((tourney, index) => (
                    <TournamentCard
                      key={tourney.id}
                      tournament={tourney}
                      variant="default" // You might want to enhance 'default' card style if needed, but existing is likely good
                      index={index}
                      onSelect={handleSelectTournament}
                      onShare={handleShareTournament}
                      onDelete={openDeleteConfirm}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
                  <div className="inline-flex p-4 rounded-full bg-slate-800/50 mb-4">
                    <Icon name="LayoutGrid" className="text-slate-600 w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300">No active tournaments</h3>
                  <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                    Once you publish a draft, it will appear here ready for management.
                  </p>
                </div>
              )}
            </motion.section>

          </div>

        </main>
      </div>
    </>
  );
};

export default TournamentLobby;