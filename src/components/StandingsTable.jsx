import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Trophy, Star } from 'lucide-react';

const StandingsTable = ({ players, tournamentType, isLoading }) => {
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');

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
        case 'points':
          aValue = tournamentType === 'best-of-league' ? (a.wins || 0) : (a.points || 0);
          bValue = tournamentType === 'best-of-league' ? (b.wins || 0) : (b.points || 0);
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
          aValue = a.draws || 0;
          bValue = b.draws || 0;
          break;
        case 'winRate':
          const aGames = (a.wins || 0) + (a.losses || 0) + (a.draws || 0);
          const bGames = (b.wins || 0) + (b.losses || 0) + (b.draws || 0);
          aValue = aGames > 0 ? (a.wins || 0) / aGames : 0;
          bValue = bGames > 0 ? (b.wins || 0) / bGames : 0;
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card/90 backdrop-blur-sm border border-border/10 rounded-lg p-4"
          >
            <div className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 bg-border/20 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border/20 rounded w-1/3"></div>
                  <div className="h-3 bg-border/20 rounded w-1/4"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-border/20 rounded w-12"></div>
                  <div className="h-3 bg-border/20 rounded w-8"></div>
                </div>
              </div>
            </div>
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
        className="text-center py-12"
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
    <div className="space-y-4">
      {/* Table Header */}
      <div className="bg-card/90 backdrop-blur-sm border border-border/10 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground border-b border-border/10">
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
          <div className="col-span-1 text-center">
            <button
              onClick={() => handleSort('points')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {tournamentType === 'best-of-league' ? 'Wins' : 'Points'} {getSortIcon('points')}
            </button>
          </div>
          <div className="col-span-1 text-center">
            <button
              onClick={() => handleSort('wins')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              W {getSortIcon('wins')}
            </button>
          </div>
          <div className="col-span-1 text-center">
            <button
              onClick={() => handleSort('losses')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              L {getSortIcon('losses')}
            </button>
          </div>
          <div className="col-span-1 text-center">
            <button
              onClick={() => handleSort('draws')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              D {getSortIcon('draws')}
            </button>
          </div>
          <div className="col-span-1 text-center">
            <button
              onClick={() => handleSort('winRate')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              % {getSortIcon('winRate')}
            </button>
          </div>
          <div className="col-span-2 text-center">
            Games
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/20">
          {sortedPlayers.map((player, index) => {
            const gamesPlayed = (player.wins || 0) + (player.losses || 0) + (player.draws || 0);
            const winRate = gamesPlayed > 0 ? ((player.wins || 0) / gamesPlayed * 100).toFixed(1) : 0;

            return (
              <motion.div
                key={player.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-surface/30 transition-colors"
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center">
                  <span className={`font-bold ${getRankColor(player.rank)}`}>
                    {getRankDisplay(player.rank)}
                  </span>
                </div>

                {/* Player Info */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    {player.avatar_url ? (
                      <img 
                        src={player.avatar_url} 
                        alt={player.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <Star className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">
                      {player.name || 'Unknown Player'}
                    </div>
                    {player.team && (
                      <div className="text-xs text-muted-foreground truncate">
                        {player.team}
                      </div>
                    )}
                  </div>
                </div>

                {/* Points/Wins */}
                <div className="col-span-1 text-center">
                  <span className="font-bold text-primary">
                    {tournamentType === 'best-of-league' ? (player.wins || 0) : (player.points || 0)}
                  </span>
                </div>

                {/* Wins */}
                <div className="col-span-1 text-center">
                  <span className="text-green-500 font-medium">
                    {player.wins || 0}
                  </span>
                </div>

                {/* Losses */}
                <div className="col-span-1 text-center">
                  <span className="text-red-500 font-medium">
                    {player.losses || 0}
                  </span>
                </div>

                {/* Draws */}
                <div className="col-span-1 text-center">
                  <span className="text-blue-500 font-medium">
                    {player.draws || 0}
                  </span>
                </div>

                {/* Win Rate */}
                <div className="col-span-1 text-center">
                  <span className="text-sm font-medium">
                    {winRate}%
                  </span>
                </div>

                {/* Games Played */}
                <div className="col-span-2 text-center">
                  <span className="text-sm text-muted-foreground">
                    {gamesPlayed}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-card/90 backdrop-blur-sm border border-border/10 rounded-lg p-4">
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
              {players.reduce((sum, p) => sum + (p.draws || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Draws</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-muted-foreground">
              {players.reduce((sum, p) => {
                const games = (p.wins || 0) + (p.losses || 0) + (p.draws || 0);
                return sum + games;
              }, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Games Played</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandingsTable; 