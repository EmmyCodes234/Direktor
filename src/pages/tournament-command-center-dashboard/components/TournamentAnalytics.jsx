import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const TournamentAnalytics = ({ players, results, tournamentInfo }) => {
  const analytics = useMemo(() => {
    if (!players.length || !results.length) return null;

    // Basic statistics
    const totalGames = results.length;
    const totalPlayers = players.length;
    const averageScore = Math.round(
      results.reduce((sum, r) => sum + r.score1 + r.score2, 0) / (totalGames * 2)
    );
    const highestScore = Math.max(
      ...results.map(r => Math.max(r.score1, r.score2))
    );
    const lowestScore = Math.min(
      ...results.map(r => Math.min(r.score1, r.score2))
    );

    // Game distribution analysis
    const scoreRanges = {
      '0-200': 0,
      '201-300': 0,
      '301-400': 0,
      '401-500': 0,
      '501+': 0
    };

    results.forEach(result => {
      const maxScore = Math.max(result.score1, result.score2);
      if (maxScore <= 200) scoreRanges['0-200']++;
      else if (maxScore <= 300) scoreRanges['201-300']++;
      else if (maxScore <= 400) scoreRanges['301-400']++;
      else if (maxScore <= 500) scoreRanges['401-500']++;
      else scoreRanges['501+']++;
    });

    // Player performance analysis
    const playerStats = players.map(player => {
      const playerResults = results.filter(r => 
        r.player1_id === player.player_id || r.player2_id === player.player_id
      );
      
      const wins = playerResults.filter(r => {
        if (r.player1_id === player.player_id) return r.score1 > r.score2;
        return r.score2 > r.score1;
      }).length;
      
      const totalGames = playerResults.length;
      const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : 0;
      
      const scores = playerResults.map(r => {
        if (r.player1_id === player.player_id) return r.score1;
        return r.score2;
      });
      
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      
      return {
        ...player,
        wins,
        totalGames,
        winRate: parseFloat(winRate),
        avgScore,
        highestScore
      };
    });

    // Top performers
    const topPerformers = playerStats
      .filter(p => p.totalGames > 0)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);

    // Most active players
    const mostActive = playerStats
      .sort((a, b) => b.totalGames - a.totalGames)
      .slice(0, 5);

    // Highest scores
    const highestScorers = playerStats
      .filter(p => p.highestScore > 0)
      .sort((a, b) => b.highestScore - a.highestScore)
      .slice(0, 5);

    // Game completion rate
    const completedGames = results.filter(r => r.score1 > 0 || r.score2 > 0).length;
    const completionRate = totalGames > 0 ? (completedGames / totalGames * 100).toFixed(1) : 0;

    // Average game duration (if available)
    const gamesWithDuration = results.filter(r => r.duration);
    const avgDuration = gamesWithDuration.length > 0 
      ? Math.round(gamesWithDuration.reduce((sum, r) => sum + r.duration, 0) / gamesWithDuration.length)
      : null;

    return {
      totalGames,
      totalPlayers,
      averageScore,
      highestScore,
      lowestScore,
      scoreRanges,
      playerStats,
      topPerformers,
      mostActive,
      highestScorers,
      completionRate,
      avgDuration
    };
  }, [players, results]);

  if (!analytics) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Icon name="BarChart3" size={48} className="mx-auto mb-4" />
        <p>No data available for analytics</p>
      </div>
    );
  }

  const getScoreRangeColor = (range) => {
    const colors = {
      '0-200': 'bg-red-500',
      '201-300': 'bg-orange-500',
      '301-400': 'bg-yellow-500',
      '401-500': 'bg-green-500',
      '501+': 'bg-blue-500'
    };
    return colors[range] || 'bg-gray-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Tournament Analytics</h2>
        <Icon name="BarChart3" size={24} className="text-primary" />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">{analytics.totalGames}</p>
          <p className="text-sm text-muted-foreground">Total Games</p>
        </div>
        <div className="bg-background border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-success">{analytics.averageScore}</p>
          <p className="text-sm text-muted-foreground">Avg Score</p>
        </div>
        <div className="bg-background border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-warning">{analytics.highestScore}</p>
          <p className="text-sm text-muted-foreground">Highest Score</p>
        </div>
        <div className="bg-background border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-accent">{analytics.completionRate}%</p>
          <p className="text-sm text-muted-foreground">Completion Rate</p>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Score Distribution</h3>
        <div className="space-y-3">
          {Object.entries(analytics.scoreRanges).map(([range, count]) => (
            <div key={range} className="flex items-center gap-3">
              <div className="w-20 text-sm font-medium text-foreground">{range}</div>
              <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full ${getScoreRangeColor(range)} transition-all duration-300`}
                  style={{ width: `${(count / analytics.totalGames) * 100}%` }}
                />
              </div>
              <div className="w-12 text-sm text-muted-foreground text-right">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Win Rates */}
        <div className="bg-background border border-border rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Icon name="Trophy" size={16} className="mr-2 text-warning" />
            Top Win Rates
          </h4>
          <div className="space-y-2">
            {analytics.topPerformers.map((player, index) => (
              <div key={player.player_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{player.name}</span>
                </div>
                <span className="text-sm font-bold text-success">{player.winRate}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active */}
        <div className="bg-background border border-border rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Icon name="Activity" size={16} className="mr-2 text-primary" />
            Most Active
          </h4>
          <div className="space-y-2">
            {analytics.mostActive.map((player, index) => (
              <div key={player.player_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{player.name}</span>
                </div>
                <span className="text-sm font-bold text-primary">{player.totalGames} games</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highest Scores */}
        <div className="bg-background border border-border rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Icon name="TrendingUp" size={16} className="mr-2 text-success" />
            Highest Scores
          </h4>
          <div className="space-y-2">
            {analytics.highestScorers.map((player, index) => (
              <div key={player.player_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{player.name}</span>
                </div>
                <span className="text-sm font-bold text-success">{player.highestScore}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-foreground mb-2">Tournament Efficiency</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Games per Player:</span>
                <span className="font-medium">{(analytics.totalGames / analytics.totalPlayers).toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Win Rate:</span>
                <span className="font-medium">
                  {(analytics.playerStats.reduce((sum, p) => sum + p.winRate, 0) / analytics.playerStats.length).toFixed(1)}%
                </span>
              </div>
              {analytics.avgDuration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Game Duration:</span>
                  <span className="font-medium">{analytics.avgDuration} min</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Score Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score Range:</span>
                <span className="font-medium">{analytics.lowestScore} - {analytics.highestScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Most Common Range:</span>
                <span className="font-medium">
                  {Object.entries(analytics.scoreRanges).reduce((a, b) => a[1] > b[1] ? a : b)[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Games with 400+:</span>
                <span className="font-medium">
                  {analytics.scoreRanges['401-500'] + analytics.scoreRanges['501+']}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TournamentAnalytics;
