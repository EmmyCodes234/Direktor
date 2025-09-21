import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
import { cn } from '../utils/cn';

const PairingsTable = ({ pairings, tournamentType, isLoading, selectedRound, players = [], teams = [], results = [], matches = [] }) => {
  const [expandedRounds, setExpandedRounds] = useState(new Set());
  const [sortBy, setSortBy] = useState('round');
  const [sortOrder, setSortOrder] = useState('asc');

  // Group pairings by round
  const groupedPairings = useMemo(() => {
    if (!pairings || pairings.length === 0) return {};

    const grouped = {};
    pairings.forEach(pairing => {
      const round = pairing.round || 1;
      if (!grouped[round]) {
        grouped[round] = [];
      }
      grouped[round].push(pairing);
    });

    // Sort rounds
    return Object.keys(grouped)
      .sort((a, b) => parseInt(b) - parseInt(a)) // Sort descending (latest round first)
      .reduce((acc, round) => {
        acc[round] = grouped[round];
        return acc;
      }, {});
  }, [pairings]);

  // Filter pairings by selected round if provided
  const filteredGroupedPairings = useMemo(() => {
    if (!selectedRound) return groupedPairings;
    
    // Only show the selected round
    const roundPairings = groupedPairings[selectedRound];
    if (!roundPairings) return {};
    
    return {
      [selectedRound]: roundPairings
    };
  }, [groupedPairings, selectedRound]);

  const toggleRound = (round) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(round)) {
      newExpanded.delete(round);
    } else {
      newExpanded.add(round);
    }
    setExpandedRounds(newExpanded);
  };

  const expandAll = () => {
    setExpandedRounds(new Set(Object.keys(filteredGroupedPairings)));
  };

  const collapseAll = () => {
    setExpandedRounds(new Set());
  };

  const getMatchResult = (pairing) => {
    // Get player names first for better result display
    let player1Name, player2Name;
    
    if (pairing.player1_id && pairing.player2_id && players.length > 0) {
      const player1 = players.find(p => p.player_id === pairing.player1_id || p.id === pairing.player1_id);
      const player2 = players.find(p => p.player_id === pairing.player2_id || p.id === pairing.player2_id);
      
      player1Name = player1?.name || 'Player 1';
      player2Name = player2?.name || 'Player 2';
    } else {
      player1Name = pairing.player1_name || 'Player 1';
      player2Name = pairing.player2_name || 'Player 2';
    }

    // First, check if this pairing already has result data embedded
    if (pairing.score1 !== undefined && pairing.score2 !== undefined) {
      const score1 = pairing.score1 || 0;
      const score2 = pairing.score2 || 0;
      
      if (score1 > score2) {
        return { 
          status: 'completed', 
          label: `${player1Name} wins ${score1}-${score2}`, 
          color: 'text-green-500',
          score: `${score1}-${score2}`,
          winner: 'player1'
        };
      } else if (score2 > score1) {
        return { 
          status: 'completed', 
          label: `${player2Name} wins ${score2}-${score1}`, 
          color: 'text-green-500',
          score: `${score1}-${score2}`,
          winner: 'player2'
        };
      } else {
        return { 
          status: 'draw', 
          label: `Draw ${score1}-${score2}`, 
          color: 'text-blue-500',
          score: `${score1}-${score2}`,
          winner: null
        };
      }
    }

    // For best of league tournaments, check matches table data
    if (tournamentType === 'best_of_league' && pairing.player1_wins !== undefined && pairing.player2_wins !== undefined) {
      const p1Wins = pairing.player1_wins || 0;
      const p2Wins = pairing.player2_wins || 0;
      const totalGames = p1Wins + p2Wins;
      
      if (totalGames > 0) {
        if (p1Wins > p2Wins) {
          return { 
            status: 'completed', 
            label: `${player1Name} wins ${p1Wins}-${p2Wins}`, 
            color: 'text-green-500',
            score: `${p1Wins}-${p2Wins}`,
            winner: 'player1'
          };
        } else if (p2Wins > p1Wins) {
          return { 
            status: 'completed', 
            label: `${player2Name} wins ${p2Wins}-${p1Wins}`, 
            color: 'text-green-500',
            score: `${p1Wins}-${p2Wins}`,
            winner: 'player2'
          };
        } else {
          return { 
            status: 'draw', 
            label: `Draw ${p1Wins}-${p2Wins}`, 
            color: 'text-blue-500',
            score: `${p1Wins}-${p2Wins}`,
            winner: null
          };
        }
      }
    }

    // Look for results in the results array
    if (results && results.length > 0 && pairing.player1_id && pairing.player2_id) {
      // Find all results for this matchup in this round
      const matchResults = results.filter(r => 
        ((r.player1_id === pairing.player1_id && r.player2_id === pairing.player2_id) ||
         (r.player1_id === pairing.player2_id && r.player2_id === pairing.player1_id)) &&
        r.round === pairing.round
      );

      if (matchResults.length > 0) {
        if (tournamentType === 'best_of_league') {
          // For best of league, count wins for each player
          let p1Wins = 0;
          let p2Wins = 0;
          
          matchResults.forEach(result => {
            if (result.score1 > result.score2) {
              if (result.player1_id === pairing.player1_id) p1Wins++;
              else p2Wins++;
            } else if (result.score2 > result.score1) {
              if (result.player2_id === pairing.player1_id) p1Wins++;
              else p2Wins++;
            }
          });

          if (p1Wins > p2Wins) {
            return { 
              status: 'completed', 
              label: `${player1Name} wins ${p1Wins}-${p2Wins}`, 
              color: 'text-green-500',
              score: `${p1Wins}-${p2Wins}`,
              winner: 'player1'
            };
          } else if (p2Wins > p1Wins) {
            return { 
              status: 'completed', 
              label: `${player2Name} wins ${p2Wins}-${p1Wins}`, 
              color: 'text-green-500',
              score: `${p1Wins}-${p2Wins}`,
              winner: 'player2'
            };
          } else if (p1Wins > 0 || p2Wins > 0) {
            return { 
              status: 'draw', 
              label: `Draw ${p1Wins}-${p2Wins}`, 
              color: 'text-blue-500',
              score: `${p1Wins}-${p2Wins}`,
              winner: null
            };
          }
        } else {
          // For single game format, use the latest result
          const latestResult = matchResults[matchResults.length - 1];
          const score1 = latestResult.player1_id === pairing.player1_id ? latestResult.score1 : latestResult.score2;
          const score2 = latestResult.player1_id === pairing.player1_id ? latestResult.score2 : latestResult.score1;
          
          if (score1 > score2) {
            return { 
              status: 'completed', 
              label: `${player1Name} wins ${score1}-${score2}`, 
              color: 'text-green-500',
              score: `${score1}-${score2}`,
              winner: 'player1'
            };
          } else if (score2 > score1) {
            return { 
              status: 'completed', 
              label: `${player2Name} wins ${score2}-${score1}`, 
              color: 'text-green-500',
              score: `${score1}-${score2}`,
              winner: 'player2'
            };
          } else {
            return { 
              status: 'draw', 
              label: `Draw ${score1}-${score2}`, 
              color: 'text-blue-500',
              score: `${score1}-${score2}`,
              winner: null
            };
          }
        }
      }
    }

    // Handle case where we have a winner_id but no scores
    if (pairing.winner_id !== undefined && pairing.winner_id !== null) {
      if (pairing.winner_id === pairing.player1_id) {
        return { 
          status: 'completed', 
          label: `${player1Name} wins`, 
          color: 'text-green-500',
          score: '1-0',
          winner: 'player1'
        };
      } else if (pairing.winner_id === pairing.player2_id) {
        return { 
          status: 'completed', 
          label: `${player2Name} wins`, 
          color: 'text-green-500',
          score: '0-1',
          winner: 'player2'
        };
      }
    }
    
    return { status: 'pending', label: 'Pending', color: 'text-yellow-500', score: '-', winner: null };
  };

  if (isLoading) {
    return (
      <div className={LAYOUT_TEMPLATES.spacing.content}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card variant="glass" padding="md">
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="text-center">
                      <div className="h-6 bg-muted rounded animate-pulse w-8"></div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!pairings || pairings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("text-center", LAYOUT_TEMPLATES.spacing.sectionLg)}
      >
        <div className="text-muted-foreground text-lg mb-2">
          No pairings available yet
        </div>
        <p className="text-sm text-muted-foreground/70">
          Tournament pairings will appear here once they are generated
        </p>
      </motion.div>
    );
  }

  const roundsToShow = Object.keys(filteredGroupedPairings);
  
  if (roundsToShow.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("text-center", LAYOUT_TEMPLATES.spacing.sectionLg)}
      >
        <div className="text-muted-foreground text-lg mb-2">
          No pairings available for this round
        </div>
        <p className="text-sm text-muted-foreground/70">
          Pairings for round {selectedRound} will appear here once they are generated
        </p>
      </motion.div>
    );
  }

  return (
    <div className={LAYOUT_TEMPLATES.spacing.content}>
      {/* Controls */}
      {!selectedRound && (
        <div className={cn("flex flex-wrap items-center justify-between gap-4", LAYOUT_TEMPLATES.spacing.contentSm)}>
          <div className="text-sm text-muted-foreground">
            {roundsToShow.length} rounds • {pairings.length} pairings
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Expand All
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={collapseAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      )}

      {/* Rounds */}
      {roundsToShow.map((round) => {
        const roundPairings = filteredGroupedPairings[round];
        const isExpanded = expandedRounds.has(round) || selectedRound !== null;
        
        // Auto-expand the selected round
        if (selectedRound && parseInt(round) === selectedRound) {
          if (!expandedRounds.has(round)) {
            setTimeout(() => {
              setExpandedRounds(prev => new Set(prev).add(round));
            }, 0);
          }
        }
        
        return (
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: parseInt(round) * 0.05 }}
          >
            <Card variant="glass" padding="none" className="overflow-hidden">
              {/* Round Header - only show if not filtered to a specific round */}
              {!selectedRound && (
                <button
                  onClick={() => toggleRound(round)}
                  className={cn(
                    "w-full px-6 py-4 flex items-center justify-between hover:bg-border/5 transition-colors",
                    LAYOUT_TEMPLATES.flex.between
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium"
                    )}>
                      {round}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Round {round}</h3>
                      <p className="text-sm text-muted-foreground">
                        {roundPairings.length} pairing{roundPairings.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {expandedRounds.has(round) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              )}

              {/* Round Pairings */}
              {(isExpanded || selectedRound) && (
                <div className="divide-y divide-border/20">
                  {roundPairings.map((pairing, index) => {
                    const matchResult = getMatchResult(pairing);
                    
                    // Get player names from different possible sources
                    let player1Name, player2Name;
                    
                    // Try to get names from player IDs using the players prop
                    if (pairing.player1_id && pairing.player2_id && players.length > 0) {
                      const player1 = players.find(p => p.player_id === pairing.player1_id || p.id === pairing.player1_id);
                      const player2 = players.find(p => p.player_id === pairing.player2_id || p.id === pairing.player2_id);
                      
                      player1Name = player1?.name || 'Unknown Player';
                      player2Name = player2?.name || 'Unknown Player';
                    } 
                    // Try team names if it's a team tournament
                    else if (pairing.player1_team_id && pairing.player2_team_id && teams.length > 0) {
                      const team1 = teams.find(t => t.id === pairing.player1_team_id);
                      const team2 = teams.find(t => t.id === pairing.player2_team_id);
                      
                      player1Name = team1?.name || 'Unknown Team';
                      player2Name = team2?.name || 'Unknown Team';
                    }
                    // Fallback to existing name fields
                    else {
                      player1Name = pairing.player1_name || 
                                   (pairing.player1 && pairing.player1.name) || 
                                   'TBD';
                      player2Name = pairing.player2_name || 
                                   (pairing.player2 && pairing.player2.name) || 
                                   'TBD';
                    }
                    
                    // Get player ratings if available
                    const player1Rating = pairing.player1 && pairing.player1.rating ? ` (${pairing.player1.rating})` : '';
                    const player2Rating = pairing.player2 && pairing.player2.rating ? ` (${pairing.player2.rating})` : '';

                    return (
                      <motion.div
                        key={pairing.id || index}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-3 sm:px-6 py-4 hover:bg-surface/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-4">
                              {/* Player 1 */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">
                                  {player1Name}
                                  {player1Rating && <span className="text-xs text-muted-foreground ml-1">{player1Rating}</span>}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {matchResult.status === 'completed' && matchResult.winner === 'player1' && (
                                    <span className="text-green-500 font-medium">Winner</span>
                                  )}
                                  {matchResult.status === 'completed' && matchResult.winner === 'player2' && (
                                    <span className="text-red-500 font-medium">Lost</span>
                                  )}
                                  {matchResult.status === 'draw' && (
                                    <span className="text-blue-500 font-medium">Draw</span>
                                  )}
                                  {matchResult.status === 'pending' && (
                                    <span className="text-muted-foreground">Waiting</span>
                                  )}
                                </div>
                              </div>

                              {/* VS & Score */}
                              <div className="text-center px-2 sm:px-4">
                                <div className="text-base sm:text-lg font-bold text-muted-foreground mb-1">VS</div>
                                {matchResult.score && matchResult.score !== '-' && (
                                  <div className={cn("text-xs sm:text-sm font-mono font-semibold", matchResult.color)}>
                                    {matchResult.score}
                                  </div>
                                )}
                              </div>

                              {/* Player 2 */}
                              <div className="flex-1 min-w-0 text-right">
                                <div className="font-medium text-foreground truncate">
                                  {player2Name}
                                  {player2Rating && <span className="text-xs text-muted-foreground ml-1">{player2Rating}</span>}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {matchResult.status === 'completed' && matchResult.winner === 'player2' && (
                                    <span className="text-green-500 font-medium">Winner</span>
                                  )}
                                  {matchResult.status === 'completed' && matchResult.winner === 'player1' && (
                                    <span className="text-red-500 font-medium">Lost</span>
                                  )}
                                  {matchResult.status === 'draw' && (
                                    <span className="text-blue-500 font-medium">Draw</span>
                                  )}
                                  {matchResult.status === 'pending' && (
                                    <span className="text-muted-foreground">Waiting</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="sm:ml-4 text-center sm:text-right min-w-0">
                            <div className={cn("text-xs sm:text-sm font-medium truncate", matchResult.color)}>
                              {matchResult.status === 'completed' && (
                                <div className="flex items-center justify-center sm:justify-end gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="hidden sm:inline">Complete</span>
                                  <span className="sm:hidden">Done</span>
                                </div>
                              )}
                              {matchResult.status === 'draw' && (
                                <div className="flex items-center justify-center sm:justify-end gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span>Draw</span>
                                </div>
                              )}
                              {matchResult.status === 'pending' && (
                                <div className="flex items-center justify-center sm:justify-end gap-1">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span className="hidden sm:inline">Pending</span>
                                  <span className="sm:hidden">Wait</span>
                                </div>
                              )}
                              {matchResult.status === 'ongoing' && (
                                <div className="flex items-center justify-center sm:justify-end gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span className="hidden sm:inline">In Progress</span>
                                  <span className="sm:hidden">Live</span>
                                </div>
                              )}
                            </div>
                            {matchResult.score && matchResult.score !== '-' && matchResult.status === 'completed' && (
                              <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                                Final: {matchResult.score}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PairingsTable;