import React from 'react';
import Icon from './AppIcon';
import { motion } from 'framer-motion';
import useMediaQuery from '../hooks/useMediaQuery';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
import { cn } from '../utils/cn';

const PrizeDisplay = ({ prizes, players, tournament }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (!prizes || prizes.length === 0) {
    return null;
  }

  const currency = tournament?.currency || '$';

  if (isMobile) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-heading font-semibold text-foreground flex items-center space-x-2">
            <Icon name="Gift" size={18} className="text-primary" />
            <span>Prize Table</span>
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-4", LAYOUT_TEMPLATES.spacing.content)}>
          {prizes.map((prize, index) => {
            const player = players.find(p => p.rank === prize.rank);
            const winLossRecord = player ? `${player.wins || 0}-${player.losses || 0}` : '';
            const spread = player ? (player.spread > 0 ? `+${player.spread}` : player.spread) : '';

            return (
              <motion.div
                key={prize.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="muted" padding="md" className="touch-target hover:shadow-md transition-all duration-200">
                  <CardContent className="p-0">
                    <div className={cn("flex items-center justify-between", "mb-3")}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center">
                          <span className="font-mono font-bold text-lg text-foreground">{prize.rank}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{prize.description || `Rank: ${prize.rank}`}</h4>
                          <p className="font-mono text-muted-foreground text-sm">{prize.value ? `${currency}${prize.value}` : '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background/50 p-3 rounded-lg">
                      {player ? (
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{player.name}</p>
                          <p className="text-xs text-muted-foreground">
                            #{player.seed} • {winLossRecord} • {spread}
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">TBD</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </CardContent>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="font-heading font-semibold text-foreground flex items-center space-x-2">
          <Icon name="Gift" size={18} className="text-primary" />
          <span>Prize Table</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 w-[5%] text-left font-semibold text-foreground">#</th>
                <th className="p-4 w-[25%] text-left font-semibold text-foreground">Description</th>
                <th className="p-4 w-[15%] text-left font-semibold text-foreground">Value</th>
                <th className="p-4 w-[55%] text-left font-semibold text-foreground">Winner(s)</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map(prize => {
                const player = players.find(p => p.rank === prize.rank);
                const winLossRecord = player ? `${player.wins || 0}-${player.losses || 0}` : '';
                const spread = player ? (player.spread > 0 ? `+${player.spread}` : player.spread) : '';

                return (
                  <tr key={prize.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-lg text-foreground">{prize.rank}</td>
                    <td className="p-4 font-medium text-foreground">{prize.description || `Rank: ${prize.rank}`}</td>
                    <td className="p-4 font-mono text-muted-foreground">{prize.value ? `${currency}${prize.value}` : '-'}</td>
                    <td className="p-4 font-medium text-foreground">
                      {player ? (
                        <span>
                          {player.name}
                          <span className="text-muted-foreground ml-2">
                            (#{player.seed}) {winLossRecord} {spread}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">TBD</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </div>
  );
};

export default PrizeDisplay;