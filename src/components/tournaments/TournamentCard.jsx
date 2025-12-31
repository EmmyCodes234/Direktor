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
          variant: 'outline',
          className: 'bg-background text-muted-foreground border-border',
          icon: 'Clock'
        };
      case 'in_progress':
      case 'active':
        return {
          variant: 'default',
          className: 'bg-primary text-primary-foreground border-transparent',
          icon: 'Play'
        };
      case 'completed':
        return {
          variant: 'secondary',
          className: 'bg-secondary text-secondary-foreground border-transparent',
          icon: 'CheckCircle'
        };
      default:
        return {
          variant: 'outline',
          className: 'bg-background text-muted-foreground border-border',
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
      <Card className="h-full bg-card border border-border hover:border-border-active transition-all duration-300 hover:shadow-lg overflow-hidden">
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/5 transition-all duration-500 pointer-events-none" />

        <CardHeader className="pb-3 relative z-10">
          <div className={cn("flex items-start justify-between", LAYOUT_TEMPLATES.flex.between)}>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-bold mb-2 truncate text-foreground",
                isDraft ? "text-lg" : "text-xl"
              )}>
                {tournamentName}
              </h3>

              {/* Status Badge */}
              <StatusBadge status={tournament.status} />
            </div>

            {/* Draft Indicator Icon */}
            {isDraft && (
              <div className="p-2 rounded-full bg-secondary border border-border">
                <Icon
                  name="Edit3"
                  size={16}
                  className="text-muted-foreground"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4 relative z-10">
          <div className={LAYOUT_TEMPLATES.spacing.content}>
            {/* Date Information */}
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="p-1.5 rounded-md bg-secondary">
                <Icon name="Calendar" size={14} className="text-muted-foreground" />
              </div>
              <span>
                {isDraft ? `Draft saved ${createdDate}` : `Created ${createdDate}`}
              </span>
            </div>

            {/* Player and Round Information (only for non-draft tournaments) */}
            {!isDraft && (
              <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 rounded-md bg-secondary">
                    <Icon name="Users" size={14} className="text-muted-foreground" />
                  </div>
                  <span>{playerCount} players</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 rounded-md bg-secondary">
                    <Icon name="RotateCcw" size={14} className="text-muted-foreground" />
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
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
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
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            </div>

            {/* Primary Action Button */}
            <Button
              onClick={() => onSelect(tournament)}
              variant={isDraft ? "outline" : "primary"}
              className={cn(
                "font-medium transition-all duration-300 shadow-sm hover:shadow-md",
                isDraft && "bg-secondary text-foreground hover:bg-secondary/80 border-border"
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
