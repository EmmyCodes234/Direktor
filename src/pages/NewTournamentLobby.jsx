import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { GlowingEffect } from '../components/ui/GlowingEffect';
import Header from '../components/ui/NewHeader';
import Icon from '../components/AppIcon';
import { toast } from 'sonner';

const TournamentLobby = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      fetchTournaments(user.id);
    };
    getUser();
  }, [navigate]);

  const fetchTournaments = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      setup: { variant: 'secondary', label: 'Setup', icon: 'Settings' },
      active: { variant: 'success', label: 'Active', icon: 'Play' },
      completed: { variant: 'outline', label: 'Completed', icon: 'CheckCircle' },
      paused: { variant: 'warning', label: 'Paused', icon: 'Pause' }
    };

    const config = statusConfig[status] || statusConfig.setup;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon name={config.icon} size={12} />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {user?.user_metadata?.full_name || 'Director'}
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Manage your tournaments, track player performance, and create memorable competitive experiences.
                </p>
              </div>
              
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
                  Import Data
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          >
            {[
              { label: 'Total Tournaments', value: tournaments.length, icon: 'Trophy', color: 'from-blue-500 to-cyan-500' },
              { label: 'Active', value: tournaments.filter(t => t.status === 'active').length, icon: 'Play', color: 'from-green-500 to-emerald-500' },
              { label: 'Completed', value: tournaments.filter(t => t.status === 'completed').length, icon: 'CheckCircle', color: 'from-purple-500 to-pink-500' },
              { label: 'In Setup', value: tournaments.filter(t => t.status === 'setup').length, icon: 'Settings', color: 'from-orange-500 to-red-500' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <GlowingEffect spread={30} glow={true} proximity={60}>
                  <Card className="text-center hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                        <Icon name={stat.icon} size={24} className="text-white" />
                      </div>
                      <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                </GlowingEffect>
              </motion.div>
            ))}
          </motion.div>

          {/* Tournaments Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Your Tournaments</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Icon name="Filter" size={16} className="mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Icon name="Search" size={16} className="mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {tournaments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-16"
              >
                <GlowingEffect spread={40} glow={true} proximity={80}>
                  <Card className="max-w-md mx-auto">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full flex items-center justify-center">
                        <Icon name="Trophy" size={32} className="text-primary" />
                      </div>
                      <CardTitle className="mb-2">No tournaments yet</CardTitle>
                      <CardDescription className="mb-6">
                        Create your first tournament to get started with managing competitive Scrabble events.
                      </CardDescription>
                      <Button
                        onClick={() => navigate('/tournament-setup')}
                        className="shadow-glow hover:shadow-glow-lg transition-all duration-300"
                      >
                        <Icon name="Plus" size={16} className="mr-2" />
                        Create Tournament
                      </Button>
                    </CardContent>
                  </Card>
                </GlowingEffect>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament, index) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <GlowingEffect spread={35} glow={true} proximity={70}>
                      <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg mb-2 truncate group-hover:text-primary transition-colors">
                                {tournament.name}
                              </CardTitle>
                              <div className="flex items-center space-x-2 mb-2">
                                {getStatusBadge(tournament.status)}
                                <Badge variant="outline" className="text-xs">
                                  {tournament.mode || 'Individual'}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/tournaments/${tournament.slug}/settings`);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Icon name="Settings" size={16} />
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Icon name="Calendar" size={14} className="mr-2" />
                              Created {formatDate(tournament.created_at)}
                            </div>
                            
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Icon name="Users" size={14} className="mr-2" />
                              {tournament.player_count || 0} players
                            </div>
                            
                            {tournament.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {tournament.description}
                              </p>
                            )}
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-purple-600 text-white">
                                  {tournament.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {user?.user_metadata?.full_name || 'You'}
                              </span>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => navigate(`/tournaments/${tournament.slug}`)}
                              className="shadow-sm hover:shadow-glow transition-all duration-300"
                            >
                              <Icon name="ArrowRight" size={14} className="mr-1" />
                              Open
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </GlowingEffect>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TournamentLobby;