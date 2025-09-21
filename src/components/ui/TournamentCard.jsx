import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { Badge } from './Badge';
import { Avatar, AvatarFallback, AvatarImage } from './Avatar';
import { Separator } from './Separator';
import { GlowingEffect } from './GlowingEffect';
import Button from './Button';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const TournamentCard = ({
  tournament,
  onManage,
  onShare,
  onDelete,
  onView,
  className,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      setup: {
        variant: 'secondary',
        label: 'Setup',
        icon: 'Settings',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20'
      },
      in_progress: {
        variant: 'success',
        label: 'In Progress',
        icon: 'Play',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/20'
      },
      active: {
        variant: 'success',
        label: 'Active',
        icon: 'Play',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/20'
      },
      completed: {
        variant: 'outline',
        label: 'Completed',
        icon: 'CheckCircle',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20'
      },
      paused: {
        variant: 'warning',
        label: 'Paused',
        icon: 'Pause',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20'
      },
      draft: {
        variant: 'secondary',
        label: 'Draft',
        icon: 'FileText',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20'
      }
    };
    return configs[status] || configs.setup;
  };

  const statusConfig = getStatusConfig(tournament.status);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/tournament/${tournament.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      onShare?.(tournament);
    });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(tournament);
  };

  const handleManage = (e) => {
    e.stopPropagation();
    onManage?.(tournament);
  };

  const handleCardClick = () => {
    onView?.(tournament);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn("group cursor-pointer", className)}
      onClick={handleCardClick}
      {...props}
    >
      <GlowingEffect spread={35} glow={true} proximity={70}>
        <Card className="h-full hover:shadow-xl transition-all duration-300 border-border/40 hover:border-border/60">
          {/* Card Header */}
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 space-y-3">
                {/* Tournament Name */}
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors pr-2">
                    {tournament.name}
                  </CardTitle>
                  
                  {/* Action Buttons */}
                  <div className={cn(
                    "flex items-center space-x-1 transition-opacity duration-200",
                    isHovered ? "opacity-100" : "opacity-0"
                  )}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20"
                    >
                      <Icon name="Share2" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>

                {/* Status and Mode Badges */}
                <div className="flex items-center space-x-2">
                  <Badge variant={statusConfig.variant} className="flex items-center space-x-1">
                    <Icon name={statusConfig.icon} size={12} />
                    <span>{statusConfig.label}</span>
                  </Badge>
                  
                  <Badge variant="outline" className="text-xs">
                    {tournament.mode === 'individual' ? 'Individual' : 
                     tournament.mode === 'team' ? 'Team' : 
                     tournament.mode === 'swiss' ? 'Swiss' : 'Individual'}
                  </Badge>
                  
                  {tournament.is_public && (
                    <Badge variant="info" className="text-xs">
                      <Icon name="Globe" size={10} className="mr-1" />
                      Public
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {tournament.description && (
                  <CardDescription className="line-clamp-2 text-sm">
                    {tournament.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Card Content */}
          <CardContent className="pt-0 space-y-4">
            {/* Tournament Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {tournament.player_count || 0}
                </div>
                <div className="text-xs text-muted-foreground">Players</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {tournament.current_round || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {tournament.total_rounds ? `of ${tournament.total_rounds}` : 'Rounds'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tournament.completed_games || 0}
                </div>
                <div className="text-xs text-muted-foreground">Games</div>
              </div>
            </div>

            <Separator />

            {/* Tournament Details */}
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Icon name="Calendar" size={14} className="mr-2 flex-shrink-0" />
                <span>Created {formatDate(tournament.created_at)}</span>
              </div>
              
              {tournament.start_date && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Icon name="Clock" size={14} className="mr-2 flex-shrink-0" />
                  <span>
                    {tournament.status === 'completed' ? 'Completed' : 'Starts'} {formatDate(tournament.start_date)}
                    {tournament.start_time && ` at ${formatTime(tournament.start_date)}`}
                  </span>
                </div>
              )}
              
              {tournament.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Icon name="MapPin" size={14} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{tournament.location}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Footer with Avatar and Action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={tournament.director_avatar} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-purple-600 text-white">
                    {tournament.director_name?.charAt(0) || tournament.name?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {tournament.director_name || 'Tournament Director'}
                </span>
              </div>

              {/* Primary Action Button */}
              <Button
                size="sm"
                onClick={handleManage}
                className="shadow-sm hover:shadow-glow transition-all duration-300"
              >
                <Icon name="Settings" size={14} className="mr-1" />
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      </GlowingEffect>
    </motion.div>
  );
};

export default TournamentCard;