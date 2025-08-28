import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
import { cn } from '../utils/cn';

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

  return (
    <div className={LAYOUT_TEMPLATES.spacing.content}>
      {/* Controls */}
      <div className={cn("flex flex-wrap items-center justify-between gap-4", LAYOUT_TEMPLATES.spacing.contentSm)}>
        <div className="text-sm text-muted-foreground">
          {Object.keys(groupedPairings).length} rounds • {pairings.length} pairings
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

      {/* Rounds */}
      {Object.entries(groupedPairings).map(([round, roundPairings]) => (
        <motion.div
          key={round}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: parseInt(round) * 0.05 }}
        >
          <Card variant="glass" padding="none" className="overflow-hidden">
            {/* Round Header */}
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

            {/* Round Pairings */}
            {expandedRounds.has(round) && (
              <div className="divide-y divide-border/20">
                {roundPairings.map((pairing, index) => {
                  const matchStatus = tournamentType === 'best-of-league' 
                    ? getBestOfLeagueStatus(pairing)
                    : getMatchStatus(pairing);

                  return (
                    <motion.div
                      key={pairing.id || index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 py-4 hover:bg-surface/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4">
                            {/* Player 1 */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {pairing.player1_name || 'TBD'}
                              </div>
                              {tournamentType === 'best-of-league' ? (
                                <div className="text-sm text-muted-foreground">
                                  {pairing.player1_wins || 0} wins
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  Score: {pairing.player1_score || '-'}
                                </div>
                              )}
                            </div>

                            {/* VS */}
                            <div className="text-center px-4">
                              <div className="text-2xl font-bold text-muted-foreground">VS</div>
                            </div>

                            {/* Player 2 */}
                            <div className="flex-1 min-w-0 text-right">
                              <div className="font-medium text-foreground truncate">
                                {pairing.player2_name || 'TBD'}
                              </div>
                              {tournamentType === 'best-of-league' ? (
                                <div className="text-sm text-muted-foreground">
                                  {pairing.player2_wins || 0} wins
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  Score: {pairing.player2_score || '-'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="ml-4 text-right">
                          <div className={cn("text-sm font-medium", matchStatus.color)}>
                            {matchStatus.label}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default PairingsTable; 