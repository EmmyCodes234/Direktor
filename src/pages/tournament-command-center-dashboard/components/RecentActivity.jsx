import React from 'react';
import Icon from '../../../components/AppIcon';

const RecentActivity = ({ recentResults, players }) => {
  const getActivityIcon = (result) => {
    const winner = result.score1 > result.score2 ? result.player1 : result.player2;
    const margin = Math.abs(result.score1 - result.score2);
    
    if (margin > 100) return { icon: 'Zap', color: 'text-warning' }; // Blowout
    if (margin < 20) return { icon: 'Target', color: 'text-success' }; // Close game
    return { icon: 'Gamepad2', color: 'text-primary' }; // Regular game
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  const getResultSummary = (result) => {
    const winner = result.score1 > result.score2 ? result.player1 : result.player2;
    const loser = result.score1 > result.score2 ? result.player2 : result.player1;
    const winScore = Math.max(result.score1, result.score2);
    const loseScore = Math.min(result.score1, result.score2);
    const margin = winScore - loseScore;
    
    return {
      winner,
      loser,
      winScore,
      loseScore,
      margin,
      isBlowout: margin > 100,
      isClose: margin < 20
    };
  };

  const sortedResults = [...recentResults]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border/10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent/20">
            <Icon name="Clock" size={16} className="text-accent" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">Recent Activity</h3>
            <p className="text-xs text-muted-foreground">Latest game results</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Icon name="Clock" size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {sortedResults.map((result, index) => {
              const activity = getActivityIcon(result);
              const summary = getResultSummary(result);
              
              return (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 lg:p-4 rounded-lg border border-border/10 hover:bg-muted/5 transition-colors group"
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${activity.color.replace('text-', 'bg-')}/20`}>
                    <Icon name={activity.icon} size={16} className={activity.color} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-foreground truncate">
                        {summary.winner}
                      </span>
                      <span className="text-success font-mono text-sm">
                        {summary.winScore}
                      </span>
                      <span className="text-muted-foreground text-xs">vs</span>
                      <span className="text-muted-foreground truncate">
                        {summary.loser}
                      </span>
                      <span className="text-destructive font-mono text-sm">
                        {summary.loseScore}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span>+{summary.margin} margin</span>
                      {summary.isBlowout && (
                        <span className="text-warning">Blowout</span>
                      )}
                      {summary.isClose && (
                        <span className="text-success">Close game</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground font-mono">
                    {formatTimeAgo(result.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing latest {Math.min(sortedResults.length, 10)} results</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Icon name="Zap" size={12} className="text-warning" />
              <span>Blowout (&gt;100)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="Target" size={12} className="text-success" />
              <span>Close (&lt;20)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;