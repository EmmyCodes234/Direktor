import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Trophy, Star, User, Download } from 'lucide-react';
import { cn } from '../utils/cn';
import { Card, CardContent } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import PlayerAvatar from './ui/PlayerAvatar';
import ScorecardExporter from './ScorecardExporter';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';

const StandingsTable = ({ players, tournamentType, isLoading, onPlayerClick, tournament, results }) => {
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedPlayerForExport, setSelectedPlayerForExport] = useState(null);

  const sortedPlayers = useMemo(() => {
    if (!players || players.length === 0) return [];

    const sorted = [...players].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'rank':
          aValue = a.rank || 999;
          bValue = b.rank || 999;
          break;
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'matchWins':
          aValue = a.match_wins || 0;
          bValue = b.match_wins || 0;
          break;
        case 'wins':
          aValue = a.wins || 0;
          bValue = b.wins || 0;
          break;
        case 'losses':
          aValue = a.losses || 0;
          bValue = b.losses || 0;
          break;
        case 'draws':
          aValue = a.ties || 0;
          bValue = b.ties || 0;
          break;
        case 'winRate':
          const aGames = (a.wins || 0) + (a.losses || 0) + (a.ties || 0);
          const bGames = (b.wins || 0) + (b.losses || 0) + (b.ties || 0);
          aValue = aGames > 0 ? (a.wins || 0) / aGames : 0;
          bValue = bGames > 0 ? (b.wins || 0) / bGames : 0;
          break;
        case 'spread':
          aValue = a.spread || 0;
          bValue = b.spread || 0;
          break;
        default:
          aValue = a.rank || 999;
          bValue = b.rank || 999;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [players, sortBy, sortOrder, tournamentType]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ChevronUp className="w-4 h-4 text-muted-foreground/50" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-primary" /> : 
      <ChevronDown className="w-4 h-4 text-primary" />;
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-foreground';
  };

  // Format record as "wins.5-losses.5" where draws are split as 0.5 each
  const formatRecord = (player) => {
    const wins = player.wins || 0;
    const losses = player.losses || 0;
    const ties = player.ties || 0;
    
    // Add 0.5 to both wins and losses for each draw
    const adjustedWins = wins + (ties * 0.5);
    const adjustedLosses = losses + (ties * 0.5);
    
    // Only show decimals if there are draws
    if (ties > 0) {
      return `${adjustedWins.toFixed(1)}-${adjustedLosses.toFixed(1)}`;
    } else {
      return `${adjustedWins}-${adjustedLosses}`;
    }
  };

  if (isLoading) {
    return (
      <div className={LAYOUT_TEMPLATES.spacing.content}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card variant="glass" padding="md">
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("text-center", LAYOUT_TEMPLATES.spacing.sectionLg)}
      >
        <div className="text-muted-foreground text-lg mb-2">
          No standings available yet
        </div>
        <p className="text-sm text-muted-foreground/70">
          Tournament standings will appear here once matches are played
        </p>
      </motion.div>
    );
  }

  return (
    <div className={LAYOUT_TEMPLATES.spacing.content}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className={cn(
            "grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground border-b border-border/10"
          )}>
            <div className="col-span-1">
              <button
                onClick={() => handleSort('rank')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Rank {getSortIcon('rank')}
              </button>
            </div>
            <div className="col-span-4">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Player {getSortIcon('name')}
              </button>
            </div>
            {tournamentType === 'best_of_league' && (
              <div className="col-span-1 text-center">
                <button
                  onClick={() => handleSort('matchWins')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Match Wins {getSortIcon('matchWins')}
                </button>
              </div>
            )}
            <div className={cn("text-center", tournamentType === 'best_of_league' ? "col-span-2" : "col-span-2")}>
              <button
                onClick={() => handleSort('wins')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Record {getSortIcon('wins')}
              </button>
            </div>
            <div className="col-span-2 text-center">
              <button
                onClick={() => handleSort('spread')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Spread {getSortIcon('spread')}
              </button>
            </div>
            <div className="col-span-2 text-center">
              <button
                onClick={() => handleSort('winRate')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                % {getSortIcon('winRate')}
              </button>
            </div>
            <div className="col-span-1 text-center">
              Games
            </div>
          </div>

          {/* Desktop Table Body */}
          <div className="divide-y divide-border/20">
            {sortedPlayers.map((player, index) => {
              const gamesPlayed = (player.wins || 0) + (player.losses || 0) + (player.ties || 0);
              const winRate = gamesPlayed > 0 ? ((player.wins || 0) / gamesPlayed * 100).toFixed(1) : 0;

              return (
                <motion.div
                  key={player.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group grid grid-cols-12 gap-4 p-4 hover:bg-surface/30 transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center">
                    <span className={`font-bold ${getRankColor(player.rank)}`}>
                      {getRankDisplay(player.rank)}
                    </span>
                  </div>

                  {/* Player Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <PlayerAvatar 
                      player={player} 
                      size="sm" 
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div 
                        className="font-medium text-foreground truncate hover:text-primary cursor-pointer transition-colors"
                        onClick={() => onPlayerClick && onPlayerClick(player)}
                      >
                        {player.name || 'Unknown Player'}
                      </div>
                      {player.team && (
                        <div className="text-xs text-muted-foreground truncate">
                          {player.team}
                        </div>
                      )}
                      {player.rating && (
                        <div className="text-xs text-primary/70 truncate">
                          Rating: {player.rating}
                        </div>
                      )}
                    </div>
                    {/* Export Button for Desktop */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlayerForExport(player);
                        setShowExportModal(true);
                      }}
                      className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                      title="Export Scorecard"
                    >
                      <Download size={12} />
                      Export
                    </button>
                  </div>

                  {/* Match Wins */}
                  {tournamentType === 'best_of_league' && (
                    <div className="col-span-1 text-center">
                      <span className="font-bold text-primary">
                        {player.match_wins || 0}
                      </span>
                    </div>
                  )}

                  {/* Record */}
                  <div className="col-span-2 text-center">
                    <span className="font-mono font-medium text-foreground">
                      {formatRecord(player)}
                    </span>
                  </div>

                  {/* Spread */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-medium">
                      {player.spread || 0}
                    </span>
                  </div>

                  {/* Win Rate */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-medium">
                      {winRate}%
                    </span>
                  </div>

                  {/* Games Played */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-muted-foreground">
                      {gamesPlayed}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Mobile Standings Cards */}
      <div className={cn("md:hidden", LAYOUT_TEMPLATES.spacing.content)}>
        {sortedPlayers.map((player, index) => {
          const gamesPlayed = (player.wins || 0) + (player.losses || 0) + (player.ties || 0);
          const winRate = gamesPlayed > 0 ? ((player.wins || 0) / gamesPlayed * 100).toFixed(1) : 0;

          return (
            <motion.div
              key={player.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="glass" padding="md" className="hover:bg-surface/30 transition-colors">
                <CardContent className="p-0">
                  {/* Player Header */}
                  <div className={cn("flex items-center justify-between", "mb-3")}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("text-lg font-bold", getRankColor(player.rank))}>
                          {getRankDisplay(player.rank)}
                        </span>
                        <PlayerAvatar 
                          player={player} 
                          size="md" 
                          className="flex-shrink-0"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div 
                          className="font-semibold text-foreground text-base truncate hover:text-primary cursor-pointer transition-colors"
                          onClick={() => onPlayerClick && onPlayerClick(player)}
                        >
                          {player.name || 'Unknown Player'}
                        </div>
                        {player.team && (
                          <div className="text-sm text-muted-foreground truncate">
                            {player.team}
                          </div>
                        )}
                        {player.rating && (
                          <div className="text-xs text-primary/70 truncate">
                            Rating: {player.rating}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      {tournamentType === 'best_of_league' && (
                        <>
                          <div className="text-lg font-bold text-primary">
                            {player.match_wins || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Match Wins</div>
                        </>
                      )}
                      {/* Export Scorecard Button for Mobile */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Export clicked for player:', player.name);
                          console.log('Tournament data:', tournament);
                          console.log('Results data:', results);
                          setSelectedPlayerForExport(player);
                          setShowExportModal(true);
                        }}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 touch-manipulation"
                      >
                        <Download size={12} />
                        Export
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className={cn("grid gap-3 text-center", tournamentType === 'best_of_league' ? "grid-cols-5" : "grid-cols-5")}>
                    <div className="bg-green-500/10 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-500">
                        {player.wins || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Wins</div>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-2">
                      <div className="text-lg font-bold text-red-500">
                        {player.losses || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Losses</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-500">
                        {player.ties || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Ties</div>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-2">
                      <div className="text-lg font-bold text-primary">
                        {winRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="bg-orange-500/10 rounded-lg p-2">
                      <div className="text-lg font-bold text-orange-500">
                        {player.spread || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Spread</div>
                    </div>
                  </div>

                  {/* Games Played */}
                  <div className="mt-3 text-center">
                    <div className="text-sm text-muted-foreground">
                      {gamesPlayed} games played
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card variant="glass" padding="md">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {players.length}
              </div>
              <div className="text-sm text-muted-foreground">Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {players.reduce((sum, p) => sum + (p.wins || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Wins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {players.reduce((sum, p) => sum + (p.ties || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Ties</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-muted-foreground">
                {players.reduce((sum, p) => {
                  const games = (p.wins || 0) + (p.losses || 0) + (p.ties || 0);
                  return sum + games;
                }, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Modal */}
      {showExportModal && selectedPlayerForExport && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
              <h3 className="text-lg font-semibold text-foreground">
                Export Scorecard - {selectedPlayerForExport.name}
              </h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowExportModal(false);
                  setSelectedPlayerForExport(null);
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {tournament && results ? (
                <ScorecardExporter
                  player={selectedPlayerForExport}
                  tournament={tournament}
                  results={results || []}
                  players={players || []}
                  tournamentType={tournamentType}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Unable to load scorecard data. Please try again.</p>
                  <p className="text-xs mt-2">Tournament: {tournament ? 'Available' : 'Missing'}</p>
                  <p className="text-xs">Results: {results ? results.length + ' available' : 'Missing'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-[9998] bg-red-500 text-white p-2 rounded text-xs">
          Modal: {showExportModal ? 'Open' : 'Closed'} | 
          Player: {selectedPlayerForExport ? selectedPlayerForExport.name : 'None'} | 
          Tournament: {tournament ? 'Available' : 'Missing'}
        </div>
      )}
    </div>
  );
};

export default StandingsTable; 