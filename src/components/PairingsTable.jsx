import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const PairingsTable = ({ pairings, tournamentType, isLoading }) => {
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
      .sort((a, b) => parseInt(a) - parseInt(b))
      .reduce((acc, round) => {
        acc[round] = grouped[round];
        return acc;
      }, {});
  }, [pairings]);

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
    setExpandedRounds(new Set(Object.keys(groupedPairings)));
  };

  const collapseAll = () => {
    setExpandedRounds(new Set());
  };

  const getMatchStatus = (pairing) => {
    if (!pairing.player1_score && !pairing.player2_score) {
      return { status: 'pending', label: 'Pending', color: 'text-yellow-500' };
    }
    
    if (pairing.player1_score > pairing.player2_score) {
      return { status: 'completed', label: `${pairing.player1_name} wins`, color: 'text-green-500' };
    } else if (pairing.player2_score > pairing.player1_score) {
      return { status: 'completed', label: `${pairing.player2_name} wins`, color: 'text-green-500' };
    } else {
      return { status: 'draw', label: 'Draw', color: 'text-blue-500' };
    }
  };

  const getBestOfLeagueStatus = (pairing) => {
    if (!pairing.player1_wins && !pairing.player2_wins) {
      return { status: 'pending', label: 'Not Started', color: 'text-yellow-500' };
    }
    
    const totalGames = pairing.player1_wins + pairing.player2_wins;
    const maxWins = Math.ceil(totalGames / 2);
    
    if (pairing.player1_wins >= maxWins) {
      return { status: 'completed', label: `${pairing.player1_name} wins ${pairing.player1_wins}-${pairing.player2_wins}`, color: 'text-green-500' };
    } else if (pairing.player2_wins >= maxWins) {
      return { status: 'completed', label: `${pairing.player2_name} wins ${pairing.player2_wins}-${pairing.player1_wins}`, color: 'text-green-500' };
    } else {
      return { status: 'ongoing', label: `${pairing.player1_wins}-${pairing.player2_wins}`, color: 'text-blue-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card/90 backdrop-blur-sm border border-border/10 rounded-lg p-4"
          >
            <div className="animate-pulse">
              <div className="h-6 bg-border/20 rounded mb-3 w-1/3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-border/20 rounded w-full"></div>
                <div className="h-4 bg-border/20 rounded w-3/4"></div>
              </div>
            </div>
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
        className="text-center py-12"
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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {Object.keys(groupedPairings).length} rounds • {pairings.length} total matches
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs bg-border/20 hover:bg-border/30 text-foreground rounded-md transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Pairings by Round */}
      <div className="space-y-4">
        {Object.entries(groupedPairings).map(([round, roundPairings], roundIndex) => (
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: roundIndex * 0.1 }}
            className="bg-card/90 backdrop-blur-sm border border-border/10 rounded-lg overflow-hidden"
          >
            {/* Round Header */}
            <button
              onClick={() => toggleRound(round)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-border/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                  {round}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Round {round}</h3>
                  <p className="text-sm text-muted-foreground">
                    {roundPairings.length} match{roundPairings.length !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
              {expandedRounds.has(round) ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Round Pairings */}
            {expandedRounds.has(round) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border/10"
              >
                <div className="p-6 space-y-3">
                  {roundPairings.map((pairing, matchIndex) => {
                    return (
                      <motion.div
                        key={pairing.key || `${round}-${matchIndex}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: matchIndex * 0.05 }}
                        className="bg-surface/50 border border-border/10 rounded-lg p-4 hover:bg-surface/70 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Match Number */}
                            <div className="text-sm font-medium text-muted-foreground min-w-[60px]">
                              Match {matchIndex + 1}
                            </div>

                            {/* Players */}
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1 text-right">
                                <div className="font-medium text-foreground">
                                  Player {pairing.player1_id}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-lg font-bold text-muted-foreground">vs</div>
                              </div>

                              <div className="flex-1 text-left">
                                <div className="font-medium text-foreground">
                                  Player {pairing.player2_id}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="ml-4">
                            <span className="text-sm font-medium text-muted-foreground">
                              Pending
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PairingsTable; 