import React, { useState, useEffect, useMemo } from 'react';
import Icon from './AppIcon';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import ScorecardExporter from './ScorecardExporter';

const PlayerStatsModal = ({ player, results, onClose, onSelectPlayer, onEditResult, teamName, players, tournamentType, tournamentId, matches: allMatches, tournament }) => {
  const navigate = useNavigate();
  const [showScorecardExport, setShowScorecardExport] = useState(false);

  const playerMatches = useMemo(() => {
    if (!player || !allMatches) return [];
    return allMatches
        .filter(m => m.player1_id === player.player_id || m.player2_id === player.player_id)
        .sort((a, b) => a.round - b.round);
  }, [player, allMatches]);

  const handleOpponentClick = (opponent) => {
    onClose(); // Close current modal
    if (opponent?.slug) {
        setTimeout(() => navigate(`/players/${opponent.slug}`), 150);
    } else if (opponent) {
        // Fallback for older data or if slug is not available
        setTimeout(() => onSelectPlayer(opponent.name), 150);
    }
  };

  // Calculate accurate stats from results (same method as dashboard)
  const playerStats = useMemo(() => {
    if (!player || !results) {
      return { wins: 0, losses: 0, ties: 0, spread: 0, match_wins: 0, match_losses: 0 };
    }
    
    let wins = 0, losses = 0, ties = 0, spread = 0;
    let match_wins = 0, match_losses = 0;
    
    // Calculate stats from results (same as dashboard)
    results.forEach(result => {
      if (result.player1_id === player.player_id || result.player2_id === player.player_id) {
        let isP1 = result.player1_id === player.player_id;
        let myScore = isP1 ? result.score1 : result.score2;
        let oppScore = isP1 ? result.score2 : result.score1;
        
        if (myScore > oppScore) wins++;
        else if (myScore < oppScore) losses++;
        else ties++;
        
        spread += (myScore - oppScore);
      }
    });
    
    // For best-of-league, calculate match wins and losses
    if (tournamentType === 'best_of_league') {
      const bestOf = 15; // Default value, should match dashboard
      const majority = Math.floor(bestOf / 2) + 1;
      
      // Build matchup map
      const matchupMap = {};
      results.forEach(result => {
        if (!result.player1_id || !result.player2_id) return;
        const ids = [result.player1_id, result.player2_id].sort((a, b) => a - b);
        const key = ids.join('-');
        if (!matchupMap[key]) matchupMap[key] = [];
        matchupMap[key].push(result);
      });
      
      // Calculate match wins and losses
      Object.entries(matchupMap).forEach(([key, matchResults]) => {
        // Only consider match-ups where this player participated
        if (!key.split('-').includes(String(player.player_id))) return;
        
        const [id1, id2] = key.split('-').map(Number);
        let p1Wins = 0, p2Wins = 0;
        
        matchResults.forEach(r => {
          if (r.score1 > r.score2) {
            if (r.player1_id === id1) p1Wins++;
            else p2Wins++;
          } else if (r.score2 > r.score1) {
            if (r.player2_id === id1) p1Wins++;
            else p2Wins++;
          }
        });
        
        // Determine match winner and update stats
        if (id1 === player.player_id) {
          if (p1Wins >= majority) match_wins++;
          else if (p2Wins >= majority) match_losses++;
        }
        if (id2 === player.player_id) {
          if (p2Wins >= majority) match_wins++;
          else if (p1Wins >= majority) match_losses++;
        }
      });
    }
    
    return { wins, losses, ties, spread, match_wins, match_losses };
  }, [player, results, tournamentType]);

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
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass-card w-full max-w-2xl mx-auto my-8 flex flex-col max-h-[90vh]"
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
                    <p className="text-muted-foreground mt-1">Rank: <span className="text-primary font-bold">{player.rank}</span> • Record: <span className="text-primary font-bold">{tournamentType === 'best_of_league' ? `${playerStats.match_wins}-${playerStats.match_losses}` : `${playerStats.wins}-${playerStats.losses}`}</span> • Spread: <span className={`font-bold ${playerStats.spread > 0 ? 'text-success' : 'text-destructive'}`}>{playerStats.spread > 0 ? '+' : ''}{playerStats.spread}</span></p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowScorecardExport(!showScorecardExport)}
                  className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                >
                  <Icon name="Download" size={16} className="mr-2" />
                  Export Scorecard
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}><Icon name="X" /></Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{advancedStats.performanceRating}</p><p className="text-xs text-muted-foreground">Performance Rating</p></div>
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{advancedStats.avgOpponentRating}</p><p className="text-xs text-muted-foreground">Avg. Opponent Rating</p></div>
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{advancedStats.highScore}</p><p className="text-xs text-muted-foreground">High Score</p></div>
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{advancedStats.lowScore === Infinity ? 0 : advancedStats.lowScore}</p><p className="text-xs text-muted-foreground">Low Score</p></div>
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{advancedStats.avgScore}</p><p className="text-xs text-muted-foreground">Avg Score</p></div>
                 <div className="p-4 bg-card text-center"><p className="text-xl font-bold">{player.rating || 'N/A'}</p><p className="text-xs text-muted-foreground">Official Rating</p></div>
            </div>

            {/* Scorecard Export Section */}
            {showScorecardExport && tournament && (
              <div className="p-6 border-b border-border bg-muted/5">
                <ScorecardExporter 
                  player={player}
                  tournament={tournament}
                  results={results}
                  matches={allMatches}
                  tournamentType={tournamentType}
                />
              </div>
            )}

            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="font-semibold mb-3">
                {tournamentType === 'best_of_league' ? 'Match History' : 'Game History'}
              </h3>
              <div className="space-y-3">
                {tournamentType === 'best_of_league' ? (
                    playerMatches.map(match => {
                        const opponent = players.find(p => p.player_id !== player.player_id && (p.player_id === match.player1_id || p.player_id === match.player2_id));
                        const matchResults = results.filter(r => r.match_id === match.id);
                        return (
                            <div key={match.id} className="p-3 bg-muted/10 rounded-lg">
                                <p className="font-semibold text-foreground">Round {match.round} vs {opponent?.name}</p>
                                {matchResults.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((r, index) => {
                                  // Disable edit if match is complete
                                  const matchObj = allMatches?.find(m => m.id === r.match_id);
                                  const isMatchComplete = matchObj && (matchObj.status === 'complete' || matchObj.winner_id);
                                  return (
                                    <div key={r.id} className="flex justify-between items-center text-sm ml-4 mt-2 p-2 rounded-md hover:bg-muted/20">
                                        <span className="font-medium text-muted-foreground">Game {index + 1}</span>
                                        <span className="font-mono text-foreground">{r.score1} - {r.score2}</span>
                                        <Button size="xs" variant="ghost" onClick={() => onEditResult(r)} disabled={isMatchComplete} aria-disabled={isMatchComplete} aria-label={isMatchComplete ? 'Match complete' : 'Edit result'}>
                                          Edit
                                        </Button>
                                    </div>
                                  );
                                })}
                            </div>
                        )
                    })
                ) : (
                    playerResults.map(r => {
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
                    })
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlayerStatsModal;