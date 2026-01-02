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
          className: 'bg-slate-800/50 text-slate-400 border-slate-700',
          icon: 'Clock'
        };
      case 'in_progress':
      case 'active':
        return {
          variant: 'default',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: 'Play'
        };
      case 'completed':
        return {
          variant: 'secondary',
          className: 'bg-slate-800 text-slate-300 border-transparent',
          icon: 'CheckCircle'
        };
      default:
        return {
          variant: 'outline',
          className: 'bg-slate-800/50 text-slate-400 border-slate-700',
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
      <Card className="h-full bg-slate-900/50 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/10 overflow-hidden backdrop-blur-sm">
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-all duration-500 pointer-events-none" />

        <CardHeader className="pb-3 relative z-10">
          <div className={cn("flex items-start justify-between", LAYOUT_TEMPLATES.flex.between)}>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-bold mb-2 truncate text-white group-hover:text-emerald-400 transition-colors",
                isDraft ? "text-lg" : "text-xl"
              )}>
                {tournamentName}
              </h3>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-2">
                {tournament.is_shared && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
                  >
                    <Icon name="Users" size={12} />
                    Shared
                  </Badge>
                )}
                <StatusBadge status={tournament.status} />
              </div>
            </div>

            {/* Draft Indicator Icon */}
            {isDraft && (
              <div className="p-2 rounded-full bg-slate-800 border border-slate-700">
                <Icon
                  name="Edit3"
                  size={16}
                  className="text-slate-400"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4 relative z-10">
          <div className={LAYOUT_TEMPLATES.spacing.content}>
            {/* Date Information */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="p-1.5 rounded-md bg-slate-800 text-slate-300">
                <Icon name="Calendar" size={14} />
              </div>
              <span>
                {isDraft ? `Draft saved ${createdDate}` : `Created ${createdDate}`}
              </span>
            </div>

            {/* Player and Round Information (only for non-draft tournaments) */}
            {!isDraft && (
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 rounded-md bg-slate-800 text-slate-300">
                    <Icon name="Users" size={14} />
                  </div>
                  <span>{playerCount} players</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 rounded-md bg-slate-800 text-slate-300">
                    <Icon name="RotateCcw" size={14} />
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
                  className="text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200"
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
                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            </div>

            {/* Primary Action Button */}
            <Button
              onClick={() => onSelect(tournament)}
              variant={isDraft ? "outline" : "primary"}
              className={cn(
                "font-medium transition-all duration-300 shadow-sm hover:shadow-emerald-500/20",
                !isDraft && "bg-emerald-600 hover:bg-emerald-500 text-white border-0",
                isDraft && "bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700 hover:text-white"
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
