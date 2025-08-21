import React from 'react';
import { motion } from 'framer-motion';
import { User, Trophy, Star } from 'lucide-react';

const PlayerCard = ({ player, index, tournamentType }) => {
  const getPlayerStats = () => {
    if (!player) return { wins: 0, losses: 0, draws: 0, points: 0, gamesPlayed: 0 };
    
    return {
      wins: player.wins || 0,
      losses: player.losses || 0,
      draws: player.draws || 0,
      points: player.points || 0,
      gamesPlayed: (player.wins || 0) + (player.losses || 0) + (player.draws || 0)
    };
  };

  const stats = getPlayerStats();
  const winRate = stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : 0;

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-4 lg:p-6 hover:border-border/20 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        {/* Player Info */}
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar */}
          <div className="w-14 h-14 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
            {player?.avatar_url ? (
              <img 
                src={player.avatar_url} 
                alt={player.name}
                className="w-14 h-14 sm:w-12 sm:h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 sm:w-6 sm:h-6 text-primary" />
            )}
          </div>

          {/* Name and Rank */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate text-base sm:text-sm">
                {player?.name || 'Unknown Player'}
              </h3>
              {player?.rank && (
                <div className="flex items-center gap-1">
                  {getRankIcon(player.rank) && (
                    <span className="text-lg">{getRankIcon(player.rank)}</span>
                  )}
                  <span className={`text-sm font-medium ${getRankColor(player.rank)}`}>
                    #{player.rank}
                  </span>
                </div>
              )}
            </div>
            
            {player?.team && (
              <p className="text-sm text-muted-foreground truncate">
                {player.team}
              </p>
            )}
          </div>
        </div>

        {/* Points/Score */}
        <div className="text-right">
          <div className="text-xl sm:text-lg font-bold text-primary">
            {tournamentType === 'best-of-league' ? stats.wins : stats.points}
          </div>
          <div className="text-xs text-muted-foreground">
            {tournamentType === 'best-of-league' ? 'Wins' : 'Points'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-surface/50 rounded-lg p-3 sm:p-2">
          <div className="text-xl sm:text-lg font-semibold text-green-500">
            {stats.wins}
          </div>
          <div className="text-xs text-muted-foreground">
            Wins
          </div>
        </div>
        
        <div className="bg-surface/50 rounded-lg p-3 sm:p-2">
          <div className="text-xl sm:text-lg font-semibold text-red-500">
            {stats.losses}
          </div>
          <div className="text-xs text-muted-foreground">
            Losses
          </div>
        </div>
        
        <div className="bg-surface/50 rounded-lg p-3 sm:p-2">
          <div className="text-xl sm:text-lg font-semibold text-blue-500">
            {stats.draws}
          </div>
          <div className="text-xs text-muted-foreground">
            Draws
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-3 pt-3 border-t border-border/10">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Star className="w-4 h-4" />
            <span>Win Rate</span>
          </div>
          <span className="font-medium text-foreground">
            {winRate}%
          </span>
        </div>
        
        {stats.gamesPlayed > 0 && (
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-muted-foreground">Games Played</span>
            <span className="font-medium text-foreground">
              {stats.gamesPlayed}
            </span>
          </div>
        )}
      </div>

      {/* Special Badges */}
      {player?.special_badges && player.special_badges.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/10">
          <div className="flex flex-wrap gap-1">
            {player.special_badges.map((badge, badgeIndex) => (
              <span
                key={badgeIndex}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PlayerCard; 