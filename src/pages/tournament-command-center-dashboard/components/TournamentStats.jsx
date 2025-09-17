import React from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const TournamentStats = ({ players, recentResults, tournamentInfo }) => {
  const totalGames = recentResults.length;
  const averageScore = totalGames > 0 
    ? Math.round(recentResults.reduce((sum, result) => sum + result.score1 + result.score2, 0) / (totalGames * 2))
    : 0;
  
  const highestSpread = players.length > 0 
    ? Math.max(...players.map(p => p.spread || 0))
    : 0;
    
  const activePlayers = players.filter(p => {
    if (!p.lastGame) return false;
    const timeDiff = Date.now() - new Date(p.lastGame).getTime();
    return timeDiff < 30 * 60 * 1000; // Active in last 30 minutes
  }).length;

  const completionRate = tournamentInfo.rounds > 0 
    ? Math.round(((tournamentInfo.currentRound || 1) - 1) / tournamentInfo.rounds * 100)
    : 0;

  const stats = [
    {
      label: 'Total Players',
      value: players.length,
      icon: 'Users',
      color: 'text-primary',
      bgColor: 'bg-primary/20'
    },
    {
      label: 'Games Played',
      value: totalGames,
      icon: 'LayoutGrid',
      color: 'text-success',
      bgColor: 'bg-success/20'
    },
    {
      label: 'Active Now',
      value: activePlayers,
      icon: 'Activity',
      color: 'text-warning',
      bgColor: 'bg-warning/20'
    },
    {
      label: 'Avg Score',
      value: averageScore,
      icon: 'Target',
      color: 'text-accent',
      bgColor: 'bg-accent/20'
    },
    {
      label: 'Top Spread',
      value: `+${highestSpread}`,
      icon: 'TrendingUp',
      color: 'text-success',
      bgColor: 'bg-success/20'
    },
    {
      label: 'Progress',
      value: `${completionRate}%`,
      icon: 'BarChart3',
      color: 'text-primary',
      bgColor: 'bg-primary/20'
    }
  ];

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:gap-4 lg:gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className="glass-card p-4 md:p-5 lg:p-6 hover:border-primary/30 transition-all duration-200 group min-h-[88px] md:min-h-[120px] lg:min-h-[140px] touch-manipulation active:scale-[0.98]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex md:flex-col items-center md:items-center text-left md:text-center gap-4 md:gap-3 lg:gap-4 h-full">
            {/* Mobile: Icon on left, content on right */}
            <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
              <Icon name={stat.icon} size={24} className={`${stat.color} md:w-7 md:h-7 lg:w-8 lg:h-8`} />
            </div>
            
            {/* Content */}
            <div className="flex-1 md:flex-none space-y-1 md:space-y-2 min-w-0">
              <div className="font-mono font-bold text-xl md:text-2xl lg:text-3xl text-foreground leading-none">
                {stat.value}
              </div>
              <div className="text-sm md:text-base lg:text-lg text-muted-foreground font-medium leading-tight">
                {stat.label}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TournamentStats;