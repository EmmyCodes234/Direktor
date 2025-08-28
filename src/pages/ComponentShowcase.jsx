import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import TournamentCard from '../components/ui/TournamentCard';
import StatsGrid from '../components/ui/StatsGrid';
import FilterControls from '../components/ui/FilterControls';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Header from '../components/ui/NewHeader';
import Icon from '../components/AppIcon';
import { toast } from 'sonner';

const ComponentShowcase = () => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Sample tournament data
  const sampleTournaments = [
    {
      id: '1',
      name: 'Spring Championship 2024',
      slug: 'spring-championship-2024',
      status: 'active',
      mode: 'individual',
      description: 'Annual spring tournament featuring top players from across the region.',
      player_count: 32,
      current_round: 4,
      total_rounds: 8,
      completed_games: 64,
      created_at: '2024-03-01T10:00:00Z',
      start_date: '2024-03-15T09:00:00Z',
      location: 'Community Center Hall A',
      is_public: true,
      director_name: 'Sarah Johnson',
      director_avatar: null
    },
    {
      id: '2',
      name: 'Weekly Club Tournament',
      slug: 'weekly-club-tournament',
      status: 'completed',
      mode: 'swiss',
      description: 'Regular weekly tournament for club members.',
      player_count: 16,
      current_round: 5,
      total_rounds: 5,
      completed_games: 40,
      created_at: '2024-02-20T14:00:00Z',
      start_date: '2024-02-25T13:00:00Z',
      location: 'Club Room B',
      is_public: false,
      director_name: 'Mike Chen',
      director_avatar: null
    },
    {
      id: '3',
      name: 'Summer League Draft',
      slug: 'summer-league-draft',
      status: 'draft',
      mode: 'team',
      description: 'Preparing for the upcoming summer league season.',
      player_count: 0,
      current_round: 0,
      total_rounds: 6,
      completed_games: 0,
      created_at: '2024-03-10T16:00:00Z',
      start_date: '2024-06-01T10:00:00Z',
      location: 'TBD',
      is_public: true,
      director_name: 'Alex Rivera',
      director_avatar: null
    }
  ];

  const statsData = [
    {
      key: 'total',
      label: 'Total Tournaments',
      value: 3,
      icon: 'Trophy',
      color: 'from-blue-500 to-cyan-500',
      description: 'All tournaments',
      trend: { direction: 'up', value: '+2 this month' }
    },
    {
      key: 'active',
      label: 'Active',
      value: 1,
      icon: 'Play',
      color: 'from-green-500 to-emerald-500',
      description: 'Currently running'
    },
    {
      key: 'completed',
      label: 'Completed',
      value: 1,
      icon: 'CheckCircle',
      color: 'from-purple-500 to-pink-500',
      description: 'Finished tournaments'
    },
    {
      key: 'drafts',
      label: 'Drafts',
      value: 1,
      icon: 'FileText',
      color: 'from-orange-500 to-red-500',
      description: 'In preparation'
    }
  ];

  const handleTournamentAction = (action, tournament) => {
    toast.success(`${action} action triggered for ${tournament.name}`);
  };

  const handleStatClick = (stat) => {
    setFilter(stat.key === 'total' ? 'all' : stat.key);
    toast.info(`Filtered by ${stat.label}`);
  };

  const handleSearch = () => {
    toast.info('Search functionality would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Header />
      
              <div className="relative pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Component{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Showcase
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Demonstrating the redesigned UI components with shadcn/ui principles.
            </p>
          </motion.div>

          {/* Stats Grid Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon name="BarChart3" size={20} />
                  <span>Stats Grid Component</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatsGrid
                  stats={statsData}
                  columns={4}
                  onStatClick={handleStatClick}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Filter Controls Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon name="Filter" size={20} />
                  <span>Filter Controls Component</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterControls
                  filters={[
                    { key: 'all', label: 'All', count: 3 },
                    { key: 'active', label: 'Active', count: 1 },
                    { key: 'completed', label: 'Completed', count: 1 },
                    { key: 'draft', label: 'Drafts', count: 1 }
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
                  onSearch={handleSearch}
                  searchPlaceholder="Search tournaments..."
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Tournament Cards Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon name="Trophy" size={20} />
                  <span>Tournament Cards</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sampleTournaments.map((tournament, index) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onManage={(t) => handleTournamentAction('Manage', t)}
                      onView={(t) => handleTournamentAction('View', t)}
                      onShare={(t) => handleTournamentAction('Share', t)}
                      onDelete={(t) => handleTournamentAction('Delete', t)}
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Empty State Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon name="FileX" size={20} />
                  <span>Empty State Component</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon="Trophy"
                  title="No tournaments found"
                  description="This is how the empty state looks when there are no tournaments to display."
                  action={
                    <Button onClick={() => toast.info('Create tournament clicked')}>
                      <Icon name="Plus" size={16} className="mr-2" />
                      Create Tournament
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Component Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon name="Palette" size={20} />
                  <span>Design System</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Consistent color schemes</li>
                  <li>• Unified spacing and typography</li>
                  <li>• Accessible contrast ratios</li>
                  <li>• Responsive design patterns</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon name="Zap" size={20} />
                  <span>Interactions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Smooth hover animations</li>
                  <li>• Glowing border effects</li>
                  <li>• Click feedback</li>
                  <li>• Keyboard navigation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon name="Smartphone" size={20} />
                  <span>Responsive</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Mobile-first approach</li>
                  <li>• Flexible grid layouts</li>
                  <li>• Touch-friendly targets</li>
                  <li>• Adaptive typography</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ComponentShowcase;