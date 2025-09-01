import React from 'react';
import { motion } from 'framer-motion';
import { User, Trophy, Star, MapPin, Award } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
import { cn } from '../utils/cn';

const PlayerCard = ({ player, index, tournamentType }) => {
  const getPlayerStats = () => {
    if (!player) return { wins: 0, losses: 0, ties: 0, points: 0, gamesPlayed: 0 };
    
    return {
      wins: player.wins || 0,
      losses: player.losses || 0,
      ties: player.ties || 0,
      points: player.points || 0,
      gamesPlayed: (player.wins || 0) + (player.losses || 0) + (player.ties || 0)
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
      className={cn(
        "glass-card hover:border-border/20 transition-all duration-200 group",
        LAYOUT_TEMPLATES.spacing.contentSm
      )}
    >
      <Card variant="glass" padding="md" className="h-full">
        <CardContent className="p-0">
          <div className={cn("flex items-start justify-between", LAYOUT_TEMPLATES.spacing.contentSm)}>
            {/* Player Info */}
            <div className="flex items-center gap-4 flex-1">
              {/* Avatar */}
              <Avatar size="xl" variant="primary" className="ring-2 ring-primary/20">
                {player?.photo_url || player?.avatar_url ? (
                  <AvatarImage 
                    src={player.photo_url || player.avatar_url} 
                    alt={player.name}
                    onError={(e) => {
                      console.log(`Failed to load image for ${player.name}: ${player.photo_url || player.avatar_url}`);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : null}
                <AvatarFallback variant="primary" size="xl">
                  {player?.name ? player.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>

              {/* Name and Details */}
              <div className="flex-1 min-w-0">
                <div className={cn("flex items-center gap-2", "mb-1")}>
                  <h3 className={cn(
                    "font-bold text-foreground truncate",
                    "text-lg sm:text-base"
                  )}>
                    {player?.name || 'Unknown Player'}
                  </h3>
                  {player?.rank && (
                    <div className="flex items-center gap-1">
                      {getRankIcon(player.rank) && (
                        <span className="text-lg">{getRankIcon(player.rank)}</span>
                      )}
                      <span className={cn("text-sm font-medium", getRankColor(player.rank))}>
                        #{player.rank}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  {player?.team && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Award className="w-3 h-3" />
                      <span className="truncate">{player.team}</span>
                    </div>
                  )}
                  
                  {player?.rating && (
                    <div className="flex items-center gap-1 text-sm text-primary/80">
                      <Star className="w-3 h-3" />
                      <span>Rating: {player.rating}</span>
                    </div>
                  )}
                  
                  {player?.seed && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Trophy className="w-3 h-3" />
                      <span>Seed: #{player.seed}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Points/Score */}
            <div className="text-right">
              <div className={cn(
                "font-bold text-primary",
                "text-xl sm:text-lg"
              )}>
                {tournamentType === 'best-of-league' ? stats.wins : stats.points}
              </div>
              <div className="text-xs text-muted-foreground">
                {tournamentType === 'best-of-league' ? 'Wins' : 'Points'}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={cn(
            "grid grid-cols-4 gap-2 text-center",
            LAYOUT_TEMPLATES.spacing.contentSm
          )}>
            <div className={cn(
              "bg-green-500/10 border border-green-500/20 rounded-xl",
              "p-3 sm:p-2"
            )}>
              <div className={cn(
                "font-bold text-green-600",
                "text-xl sm:text-lg"
              )}>
                {stats.wins}
              </div>
              <div className="text-xs text-green-600/80 font-medium">
                Wins
              </div>
            </div>
            
            <div className={cn(
              "bg-red-500/10 border border-red-500/20 rounded-xl",
              "p-3 sm:p-2"
            )}>
              <div className={cn(
                "font-bold text-red-600",
                "text-xl sm:text-lg"
              )}>
                {stats.losses}
              </div>
              <div className="text-xs text-red-600/80 font-medium">
                Losses
              </div>
            </div>
            
            <div className={cn(
              "bg-blue-500/10 border border-blue-500/20 rounded-xl",
              "p-3 sm:p-2"
            )}>
              <div className={cn(
                "font-bold text-blue-600",
                "text-xl sm:text-lg"
              )}>
                {stats.ties}
              </div>
              <div className="text-xs text-blue-600/80 font-medium">
                Ties
              </div>
            </div>
            
            <div className={cn(
              "bg-primary/10 border border-primary/20 rounded-xl",
              "p-3 sm:p-2"
            )}>
              <div className={cn(
                "font-bold text-primary",
                "text-xl sm:text-lg"
              )}>
                {winRate}%
              </div>
              <div className="text-xs text-primary/80 font-medium">
                Win Rate
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className={cn(
            "border-t border-border/10 bg-muted/20 rounded-lg",
            "mt-4 p-3"
          )}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-foreground text-lg">
                  {stats.gamesPlayed}
                </div>
                <div className="text-muted-foreground font-medium">
                  Games Played
                </div>
              </div>
              
              <div className="text-center">
                <div className="font-bold text-primary text-lg">
                  {tournamentType === 'best-of-league' ? stats.wins : stats.points}
                </div>
                <div className="text-muted-foreground font-medium">
                  {tournamentType === 'best-of-league' ? 'Total Wins' : 'Points'}
                </div>
              </div>
            </div>
          </div>

          {/* Special Badges */}
          {player?.special_badges && player.special_badges.length > 0 && (
            <div className={cn(
              "border-t border-border/10",
              "mt-3 pt-3"
            )}>
              <div className="flex flex-wrap gap-1">
                {player.special_badges.map((badge, badgeIndex) => (
                  <Badge
                    key={badgeIndex}
                    variant="primary"
                    size="sm"
                    className="bg-primary/10 text-primary"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlayerCard; 