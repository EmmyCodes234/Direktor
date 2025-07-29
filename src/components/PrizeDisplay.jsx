import React from 'react';
import Icon from './AppIcon';

const PrizeDisplay = ({ prizes, players, tournament }) => {
  if (!prizes || prizes.length === 0) {
    return null;
  }

  const currency = tournament?.currency || '$';

  return (
    <div className="glass-card">
        <div className="p-4 border-b border-border">
            <h3 className="font-heading font-semibold text-foreground flex items-center space-x-2">
                <Icon name="Gift" size={18} className="text-primary" />
                <span>Prize Table</span>
            </h3>
        </div>
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
                            <tr key={prize.id} className="border-b border-border/50">
                                <td className="p-4 font-mono font-bold text-lg text-primary">{prize.rank}</td>
                                <td className="p-4 font-medium text-foreground">{prize.description || `Rank: ${prize.rank}`}</td>
                                <td className="p-4 font-mono text-success">{prize.value ? `${currency}${prize.value}` : '-'}</td>
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
    </div>
  );
};

export default PrizeDisplay;