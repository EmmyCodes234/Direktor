import React from 'react';
import Icon from '../../../components/AppIcon';

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
      icon: 'LayoutGrid', // Changed from Gamepad2
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="glass-card p-4 border border-border hover:border-primary/30 transition-all duration-200 group"
        >
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
              <Icon name={stat.icon} size={20} className={stat.color} />
            </div>
            <div>
              <div className="font-mono font-bold text-lg text-foreground">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TournamentStats;