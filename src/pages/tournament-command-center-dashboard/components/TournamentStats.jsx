import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const StatCard = ({ label, value, subtext, icon, compact }) => (
  <div className={cn(
    "bg-card border border-border rounded-xl shadow-sm transition-all duration-200",
    compact ? "p-3 flex items-center justify-between border-slate-800 bg-slate-900/10 backdrop-blur-sm" : "p-5 hover:shadow-md"
  )}>
    <div className={cn("flex flex-col", compact ? "flex-1" : "mb-2")}>
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">{label}</span>
          <div className="p-2 bg-slate-800/50 rounded-lg text-emerald-400">
            <Icon name={icon} size={18} />
          </div>
        </div>
      )}
      <div className="flex items-baseline gap-2">
        <span className={cn("font-bold tracking-tight text-white", compact ? "text-xl text-emerald-400" : "text-3xl")}>{value}</span>
        {subtext && <span className="text-xs text-slate-500 font-medium truncate max-w-[100px]">{subtext}</span>}
      </div>
      {compact && <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">{label}</span>}
    </div>
    {compact && (
      <div className="p-1.5 bg-slate-800/40 rounded-lg text-slate-400">
        <Icon name={icon} size={12} />
      </div>
    )}
  </div>
);

const TournamentStats = ({ players, recentResults, tournamentInfo, compact = false }) => {
  const stats = useMemo(() => {
    const totalPlayers = players?.length || 0;
    const activePlayers = players?.filter(p => !p.withdrawn)?.length || 0;
    const totalGames = recentResults?.length || 0;
    const currentRound = tournamentInfo?.current_round || 1;

    return [
      {
        label: compact ? "Players" : "Active Players",
        value: activePlayers,
        subtext: totalPlayers !== activePlayers ? `of ${totalPlayers}` : null,
        icon: "Users"
      },
      {
        label: compact ? "Round" : "Current Round",
        value: currentRound,
        subtext: `of ${tournamentInfo?.rounds || '?'}`,
        icon: "Clock"
      },
      {
        label: compact ? "Games" : "Games Played",
        value: totalGames,
        subtext: null,
        icon: "Gamepad2"
      }
    ];
  }, [players, recentResults, tournamentInfo, compact]);

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-1 md:grid-cols-3 sm:gap-6")}>
      {stats.map((stat, i) => (
        <StatCard key={i} {...stat} compact={compact} />
      ))}
    </div>
  );
};

import { cn } from '../../../utils/cn';
export default TournamentStats;