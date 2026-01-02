import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { GlowingEffect } from '../components/ui/GlowingEffect';
import TournamentCard from '../components/ui/TournamentCard';
import StatsGrid from '../components/ui/StatsGrid';
import FilterControls from '../components/ui/FilterControls';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Header from '../components/ui/NewHeader';
import Icon from '../components/AppIcon';
import { toast } from 'sonner';
import { cn } from '../utils/cn';

const TournamentLobby = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, completed, draft
  const [sortBy, setSortBy] = useState('recent'); // recent, name, status
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        setUser(user);

        // Fetch tournaments
        await fetchTournaments(user.id);
      } catch (error) {
        console.error('Error initializing app:', error);
        toast.error('Failed to load tournaments');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [navigate]);

  const fetchTournaments = async (userId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_managed_tournaments')
        .select(`
          *,
          tournament_players(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process tournaments to add computed fields
      const processedTournaments = data.map(tournament => {
        const isShared = tournament.user_id !== userId;
        return {
          ...tournament,
          is_shared: isShared,
          player_count: tournament.tournament_players?.[0]?.count || 0,
          director_name: isShared ? 'Shared Tournament' : (user?.user_metadata?.full_name || user?.email),
          director_avatar: isShared ? null : user?.user_metadata?.avatar_url
        };
      });

      setTournaments(processedTournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Failed to load tournaments');
    }
  };

  const handleTournamentManage = (tournament) => {
    if (tournament.status === 'draft') {
      navigate(`/tournament-setup-configuration?draftId=${tournament.id}`);
    } else {
      navigate(`/tournaments/${tournament.slug}/settings`);
    }
  };

  const handleTournamentView = (tournament) => {
    if (tournament.status === 'draft') {
      navigate(`/tournament-setup-configuration?draftId=${tournament.id}`);
    } else {
      navigate(`/tournaments/${tournament.slug}/dashboard`);
    }
  };

  const handleTournamentShare = (tournament) => {
    toast.success('Tournament link copied to clipboard!');
  };

  const handleTournamentDelete = (tournament) => {
    setTournamentToDelete(tournament);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!tournamentToDelete) return;

    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTournaments(prev => prev.filter(t => t.id !== tournamentToDelete.id));
      toast.success('Tournament deleted successfully');
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast.error('Failed to delete tournament');
    } finally {
      setShowDeleteModal(false);
      setTournamentToDelete(null);
    }
  };

  const getFilteredTournaments = () => {
    let filtered = tournaments;

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(tournament => {
        switch (filter) {
          case 'active':
            return ['active', 'in_progress'].includes(tournament.status);
          case 'completed':
            return tournament.status === 'completed';
          case 'draft':
            return tournament.status === 'draft';
          case 'shared':
            return tournament.is_shared;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'recent':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  };

  const getStatusCounts = () => {
    return {
      all: tournaments.length,
      active: tournaments.filter(t => ['active', 'in_progress'].includes(t.status)).length,
      completed: tournaments.filter(t => t.status === 'completed').length,
      draft: tournaments.filter(t => t.status === 'draft').length,
      shared: tournaments.filter(t => t.is_shared).length
    };
  };

  const filteredTournaments = getFilteredTournaments();
  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 bg-muted rounded animate-pulse mx-auto"></div>
            <p className="text-muted-foreground">Loading your tournaments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Header />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

      <div className="relative pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title and Description */}
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  Tournament{' '}
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Dashboard
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Manage your tournaments, track progress, and create memorable competitive experiences.
                </p>
              </div>

              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate('/tournament-setup')}
                  size="lg"
                  className="shadow-glow hover:shadow-glow-lg transition-all duration-300"
                >
                  <Icon name="Plus" size={20} className="mr-2" />
                  New Tournament
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/import')}
                  size="lg"
                  className="border-border/40 hover:border-border/60"
                >
                  <Icon name="Upload" size={20} className="mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Cards */}
          <StatsGrid
            stats={[
              {
                key: 'total',
                label: 'Total Tournaments',
                value: statusCounts.all,
                icon: 'Trophy',
                color: 'from-blue-500 to-cyan-500',
                description: 'All tournaments'
              },
              {
                key: 'active',
                label: 'Active',
                value: statusCounts.active,
                icon: 'Play',
                color: 'from-green-500 to-emerald-500',
                description: 'Currently running'
              },
              {
                key: 'completed',
                label: 'Completed',
                value: statusCounts.completed,
                icon: 'CheckCircle',
                color: 'from-purple-500 to-pink-500',
                description: 'Finished tournaments'
              },
              {
                key: 'shared',
                label: 'Shared',
                value: statusCounts.shared,
                icon: 'Users',
                color: 'from-yellow-500 to-orange-500',
                description: 'Collaborating'
              }
            ]}
            columns={4}
            onStatClick={(stat) => setFilter(stat.key === 'total' ? 'all' : stat.key)}
            className="mb-8"
          />

          {/* Filters and Controls */}
          <FilterControls
            filters={[
              { key: 'all', label: 'All', count: statusCounts.all },
              { key: 'active', label: 'Active', count: statusCounts.active },
              { key: 'completed', label: 'Completed', count: statusCounts.completed },
              { key: 'shared', label: 'Shared', count: statusCounts.shared },
              { key: 'draft', label: 'Drafts', count: statusCounts.draft }
            ]}
            activeFilter={filter}
            onFilterChange={setFilter}
            sortOptions={[
              { value: 'recent', label: 'Most Recent' },
              { value: 'name', label: 'Name A-Z' },
              { value: 'status', label: 'Status' }
            ]}
            activeSortBy={sortBy}
            onSortChange={setSortBy}
            onSearch={() => console.log('Search clicked')}
            searchPlaceholder="Search tournaments..."
            className="mb-8"
          />

          {/* Tournaments Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {filteredTournaments.length === 0 ? (
              <EmptyState
                icon="Trophy"
                title={filter === 'all' ? 'No tournaments yet' : `No ${filter} tournaments`}
                description={
                  filter === 'all'
                    ? 'Create your first tournament to get started with managing competitive Scrabble events.'
                    : `You don't have any ${filter} tournaments at the moment.`
                }
                action={
                  filter === 'all' ? (
                    <Button
                      onClick={() => navigate('/tournament-setup')}
                      className="shadow-glow hover:shadow-glow-lg transition-all duration-300"
                    >
                      <Icon name="Plus" size={16} className="mr-2" />
                      Create Tournament
                    </Button>
                  ) : null
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredTournaments.map((tournament, index) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onManage={handleTournamentManage}
                      onView={handleTournamentView}
                      onShare={handleTournamentShare}
                      onDelete={handleTournamentDelete}
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <GlowingEffect spread={40} glow={true} proximity={80}>
                <Card className="shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Icon name="AlertTriangle" size={20} className="text-destructive" />
                      <span>Delete Tournament</span>
                    </CardTitle>
                    <CardDescription>
                      Are you sure you want to permanently delete "{tournamentToDelete?.name}"?
                      All associated data will be lost and cannot be recovered.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmDelete}
                    >
                      Delete Tournament
                    </Button>
                  </CardContent>
                </Card>
              </GlowingEffect>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TournamentLobby;