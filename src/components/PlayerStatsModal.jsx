import React, { useMemo } from 'react';
import Icon from './AppIcon';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PlayerStatsModal = ({ player, results, onClose, onSelectPlayer, onEditResult, teamName, players }) => {
  const navigate = useNavigate();

  const handleOpponentClick = (opponent) => {
    onClose(); // Close current modal
    if (opponent?.slug) {
        setTimeout(() => navigate(`/players/${opponent.slug}`), 150);
    } else if (opponent) {
        // Fallback for older data or if slug is not available
        setTimeout(() => onSelectPlayer(opponent.name), 150);
    }
  };

  const playerResults = player
    ? results
        .filter(r => r.player1_name === player.name || r.player2_name === player.name)
        .sort((a, b) => a.round - b.round)
    : [];

  const advancedStats = useMemo(() => {
    if (!player || playerResults.length === 0) {
      return {
        avgOpponentRating: 'N/A',
        performanceRating: 'N/A',
        highScore: 0,
        lowScore: 0,
        avgScore: 0,
      };
    }
    const opponents = playerResults.map(r => {
        const isPlayer1 = r.player1_name === player.name;
        const opponentName = isPlayer1 ? r.player2_name : r.player1_name;
        const opponent = players.find(p => p.name === opponentName) || { rating: 1500 }; 
        return opponent;
    });
    const totalOpponentRating = opponents.reduce((acc, opp) => acc + (opp.rating || 1500), 0);
    const avgOpponentRating = Math.round(totalOpponentRating / opponents.length);
    const wins = playerResults.filter(r => {
        const isPlayer1 = r.player1_name === player.name;
        return isPlayer1 ? r.score1 > r.score2 : r.score2 > r.score1;
    }).length;
    const losses = playerResults.filter(r => {
        const isPlayer1 = r.player1_name === player.name;
        return isPlayer1 ? r.score1 < r.score2 : r.score2 < r.score1;
    }).length;
    const performanceRating = avgOpponentRating + 400 * (wins - losses) / playerResults.length;
    return {
      avgOpponentRating: avgOpponentRating,
      performanceRating: Math.round(performanceRating),
      highScore: Math.max(0, ...playerResults.map(r => r.player1_name === player.name ? r.score1 : r.score2)),
      lowScore: Math.min(Infinity, ...playerResults.map(r => r.player1_name === player.name ? r.score1 : r.score2)),
      avgScore: playerResults.length > 0 ? Math.round(playerResults.reduce((acc, r) => acc + (r.player1_name === player.name ? r.score1 : r.score2), 0) / playerResults.length) : 0,
    };
  }, [player, playerResults, players]);
  

  return (
    <AnimatePresence>
      {player && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass-card w-full max-w-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex justify-between items-start">
              <div className="flex items-center space-x-4">
                {player.photo_url && (
                    <img src={player.photo_url} alt={player.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
                )}
                <div>
                    <h2 className="text-2xl font-heading font-semibold text-foreground">{player.name}</h2>
                    {teamName && (
                        <div className="flex items-center space-x-2 text-sm text-accent mt-1">
                            <Icon name="Shield" size={14} />
                            <span>{teamName}</span>
                        </div>
                    )}
                    <p className="text-muted-foreground mt-1">Rank: <span className="text-primary font-bold">{player.rank}</span> • Record: <span className="text-primary font-bold">{player.wins}-{player.losses}</span> • Spread: <span className={`font-bold ${player.spread > 0 ? 'text-success' : 'text-destructive'}`}>{player.spread > 0 ? '+' : ''}{player.spread}</span></p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}><Icon name="X" /></Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{advancedStats.performanceRating}</p><p className="text-xs text-muted-foreground">Performance Rating</p></div>
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{advancedStats.avgOpponentRating}</p><p className="text-xs text-muted-foreground">Avg. Opponent Rating</p></div>
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{advancedStats.highScore}</p><p className="text-xs text-muted-foreground">High Score</p></div>
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{advancedStats.lowScore === Infinity ? 0 : advancedStats.lowScore}</p><p className="text-xs text-muted-foreground">Low Score</p></div>
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{advancedStats.avgScore}</p><p className="text-xs text-muted-foreground">Avg Score</p></div>
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{player.rating || 'N/A'}</p><p className="text-xs text-muted-foreground">Official Rating</p></div>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <h3 className="font-semibold mb-3">Game History</h3>
              <div className="space-y-3">
                {playerResults.map(r => {
                  const isPlayer1 = r.player1_name === player.name;
                  const opponentName = isPlayer1 ? r.player2_name : r.player1_name;
                  const opponent = players.find(p => p.name === opponentName);
                  const playerScore = isPlayer1 ? r.score1 : r.score2;
                  const opponentScore = isPlayer1 ? r.score2 : r.score1;
                  const isDraw = playerScore === opponentScore;
                  const won = playerScore > opponentScore;

                  return (
                    <div key={r.id} className="p-3 bg-muted/10 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                         <Icon name={isDraw ? 'Minus' : won ? "TrendingUp" : "TrendingDown"} className={isDraw ? 'text-warning' : won ? "text-success" : "text-destructive"} />
                         <div>
                            <p className="text-sm text-muted-foreground">vs <button onClick={() => handleOpponentClick(opponent)} className="text-primary hover:underline">{opponentName}</button> (Round {r.round})</p>
                            <p className="font-mono text-lg">{playerScore} - {opponentScore}</p>
                         </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {onEditResult && (
                          <Button variant="ghost" size="sm" onClick={() => onEditResult(r)}>
                            Edit
                          </Button>
                        )}
                        <div className={`font-semibold px-2 py-1 rounded text-xs ${isDraw ? 'bg-warning/20 text-warning' : won ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                          {isDraw ? 'DRAW' : won ? `WIN (+${playerScore - opponentScore})` : `LOSS (${playerScore - opponentScore})`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlayerStatsModal;