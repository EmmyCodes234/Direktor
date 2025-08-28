import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../../design-system';
import { cn } from '../../utils/cn';

// Status Badge Component with hero section colors
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'setup':
      case 'draft':
        return {
          variant: 'secondary',
          className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20',
          icon: 'Clock'
        };
      case 'in_progress':
      case 'active':
        return {
          variant: 'default',
          className: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0',
          icon: 'Play'
        };
      case 'completed':
        return {
          variant: 'secondary',
          className: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
          icon: 'CheckCircle'
        };
      default:
        return {
          variant: 'outline',
          className: 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
          icon: 'HelpCircle'
        };
    }
  };

  const config = getStatusConfig(status);
  const displayStatus = status === 'draft' ? 'Draft' : 
                       status === 'in_progress' ? 'In Progress' : 
                       status === 'active' ? 'Active' : 
                       status === 'completed' ? 'Completed' : 
                       status;

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200',
        config.className
      )}
    >
      <Icon name={config.icon} size={12} />
      {displayStatus}
    </Badge>
  );
};

const TournamentCard = ({ 
  tournament, 
  onSelect, 
  onShare, 
  onDelete, 
  variant = 'default',
  index = 0 
}) => {
  const isDraft = variant === 'draft';
  const tournamentName = tournament.name || "Untitled Tournament";
  const createdDate = new Date(tournament.created_at).toLocaleDateString();
  
  // Format player count and rounds for display
  const playerCount = tournament.playerCount || 0;
  const rounds = tournament.rounds || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="group"
    >
      <Card className="h-full bg-gradient-to-br from-zinc-50/50 via-white to-zinc-100/30 dark:from-zinc-900/50 dark:via-zinc-800 dark:to-zinc-900/30 border-zinc-200/50 dark:border-zinc-700/50 hover:border-purple-300/50 dark:hover:border-purple-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20 overflow-hidden">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
        
        <CardHeader className="pb-3 relative z-10">
          <div className={cn("flex items-start justify-between", LAYOUT_TEMPLATES.flex.between)}>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-bold mb-2 truncate bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent",
                isDraft ? "text-lg" : "text-xl"
              )}>
                {tournamentName}
              </h3>
              
              {/* Status Badge */}
              <StatusBadge status={tournament.status} />
            </div>
            
            {/* Draft Indicator Icon */}
            {isDraft && (
              <div className="p-2 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/20 dark:from-amber-400/10 dark:to-orange-400/10 border border-amber-300/30 dark:border-amber-600/30">
                <Icon 
                  name="Edit3" 
                  size={16} 
                  className="text-amber-600 dark:text-amber-400" 
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4 relative z-10">
          <div className={LAYOUT_TEMPLATES.spacing.content}>
            {/* Date Information */}
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                <Icon name="Calendar" size={14} className="text-zinc-500 dark:text-zinc-400" />
              </div>
              <span>
                {isDraft ? `Draft saved ${createdDate}` : `Created ${createdDate}`}
              </span>
            </div>

            {/* Player and Round Information (only for non-draft tournaments) */}
            {!isDraft && (
              <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                    <Icon name="Users" size={14} className="text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <span>{playerCount} players</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                    <Icon name="RotateCcw" size={14} className="text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <span>{rounds} rounds</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 relative z-10">
          <div className={cn("flex items-center justify-between w-full", LAYOUT_TEMPLATES.flex.between)}>
            {/* Secondary Actions */}
            <div className="flex items-center gap-1">
              {/* Share Button */}
              {!isDraft && (
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={() => onShare(tournament.slug)}
                  tooltip="Share tournament"
                  aria-label="Share tournament"
                  className="text-zinc-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-200"
                >
                  <Icon name="Share2" size={16} />
                </Button>
              )}
              
              {/* Delete Button */}
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={() => onDelete(tournament)}
                tooltip="Delete tournament"
                aria-label="Delete tournament"
                className="text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            </div>

            {/* Primary Action Button */}
            <Button 
              onClick={() => onSelect(tournament)}
              className={cn(
                "font-medium transition-all duration-300 shadow-lg hover:shadow-xl",
                isDraft 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25 hover:shadow-amber-500/40" 
                  : "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-purple-500/25 hover:shadow-purple-500/40"
              )}
            >
              {isDraft ? "Continue Setup" : "Manage"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default TournamentCard;
