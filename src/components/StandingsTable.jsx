import React, { useState } from 'react';
import Icon from './AppIcon';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import PlayerAvatar from './ui/PlayerAvatar';

const StandingsTable = ({ players, tournamentType, isLoading, onPlayerClick, results, tournament }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'asc' });
  const isBestOfLeague = tournamentType === 'best_of_league';

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPlayers = React.useMemo(() => {
    if (!players || players.length === 0) return [];

    const sortablePlayers = [...players];

    sortablePlayers.sort((a, b) => {
      if (sortConfig.key === 'rank') {
        return (a.rank || 999) - (b.rank || 999);
      }

      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      if (sortConfig.key === 'wins') {
        return sortConfig.direction === 'asc'
          ? (a.wins || 0) - (b.wins || 0)
          : (b.wins || 0) - (a.wins || 0);
      }

      if (sortConfig.key === 'spread') {
        return sortConfig.direction === 'asc'
          ? (a.spread || 0) - (b.spread || 0)
          : (b.spread || 0) - (a.spread || 0);
      }

      return (a.rank || 999) - (b.rank || 999);
    });

    return sortablePlayers;
  }, [players, sortConfig]);

  const getRecordDisplay = (player) => {
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
      <div className="bg-card rounded-xl border border-border mt-4 p-4 sm:p-8 shadow-sm">
        <div className="space-y-3 sm:space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2 sm:space-x-4 animate-pulse">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-muted rounded"></div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-1 sm:space-y-2">
                <div className="h-3 sm:h-4 bg-muted rounded w-1/4"></div>
                <div className="h-2 sm:h-3 bg-muted rounded w-1/6"></div>
              </div>
              <div className="h-3 sm:h-4 bg-muted rounded w-8 sm:w-12"></div>
              <div className="h-3 sm:h-4 bg-muted rounded w-10 sm:w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sortedPlayers || sortedPlayers.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border mt-4 p-8 sm:p-12 text-center shadow-sm">
        <Icon name="Users" size={40} className="mx-auto text-muted-foreground mb-3 sm:mb-4 sm:w-12 sm:h-12" />
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No Players Found</h3>
        <p className="text-muted-foreground text-sm sm:text-base">Player standings will appear here once the tournament begins.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border mt-4 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/30">
          <thead className="bg-muted/20">
            <tr>
              <th
                className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center space-x-1">
                  <span className="hidden sm:inline">Rank</span>
                  <span className="sm:hidden">#</span>
                  {sortConfig.key === 'rank' && (
                    <Icon
                      name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={12}
                      className="text-primary sm:w-3.5 sm:h-3.5"
                    />
                  )}
                </div>
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Player</th>
              {isBestOfLeague && (
                <th
                  className="px-1 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleSort('wins')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span className="hidden sm:inline">Match W</span>
                    <span className="sm:hidden">MW</span>
                    {sortConfig.key === 'wins' && (
                      <Icon
                        name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                        size={12}
                        className="text-primary sm:w-3.5 sm:h-3.5"
                      />
                    )}
                  </div>
                </th>
              )}
              <th
                className="px-1 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleSort('wins')}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>W</span>
                  {sortConfig.key === 'wins' && (
                    <Icon
                      name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={12}
                      className="text-primary sm:w-3.5 sm:h-3.5"
                    />
                  )}
                </div>
              </th>
              <th className="px-1 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">L</th>
              <th className="px-1 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">T</th>
              <th
                className="px-1 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleSort('spread')}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span className="hidden sm:inline">Spread</span>
                  <span className="sm:hidden">Spr</span>
                  {sortConfig.key === 'spread' && (
                    <Icon
                      name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={12}
                      className="text-primary sm:w-3.5 sm:h-3.5"
                    />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {sortedPlayers.map((player, index) => {
              const isComplete = isBestOfLeague && player.match_wins >= (sortedPlayers.length - 1);

              return (
                <motion.tr
                  key={player.player_id || player.id}
                  className={cn(
                    "hover:bg-muted/10 transition-colors cursor-pointer touch-target",
                    isComplete && "bg-success/5"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onPlayerClick && onPlayerClick(player)}
                >
                  <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                    <div className={cn(
                      "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold border border-border/50",
                      player.rank <= 3
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {player.rank}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <PlayerAvatar player={player} size="sm" className="sm:w-10 sm:h-10" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground text-sm sm:text-base truncate">{player.name}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className="hidden sm:inline">Seed #{player.seed || 'N/A'}</span>
                          <span className="sm:hidden">#{player.seed || 'N/A'}</span>
                          {isComplete && (
                            <span className="ml-1 sm:ml-2 inline-flex items-center text-success">
                              <Icon name="CheckCircle" size={10} className="mr-0.5 sm:mr-1 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">Complete</span>
                              <span className="sm:hidden">✓</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {isBestOfLeague && (
                    <td className="px-1 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center font-mono font-semibold text-sm sm:text-base">
                      <span className={player.match_wins > 0 ? "text-foreground" : "text-muted-foreground"}>
                        {player.match_wins || 0}
                      </span>
                    </td>
                  )}
                  <td className="px-1 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center font-mono font-semibold text-foreground text-sm sm:text-base">
                    {player.wins || 0}
                  </td>
                  <td className="px-1 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center font-mono font-semibold text-foreground text-sm sm:text-base">
                    {player.losses || 0}
                  </td>
                  <td className="px-1 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center font-mono font-semibold text-foreground text-sm sm:text-base">
                    {player.ties || 0}
                  </td>
                  <td className="px-1 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center font-mono font-semibold text-sm sm:text-base">
                    <span className={player.spread > 0 ? "text-success" : player.spread < 0 ? "text-destructive" : "text-foreground"}>
                      {player.spread > 0 ? `+${player.spread}` : player.spread || 0}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsTable; 