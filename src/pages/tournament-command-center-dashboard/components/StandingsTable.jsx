import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { cn } from '../../../utils/cn';

const StandingsTable = ({ players, onSelectPlayer, tournamentType, teamStandings }) => {
  const [viewMode, setViewMode] = useState('individual');
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const playersByDivision = useMemo(() => {
    return players.reduce((acc, player) => {
      const division = player.division || 'Open';
      if (!acc[division]) {
        acc[division] = [];
      }
      acc[division].push(player);
      return acc;
    }, {});
  }, [players]);

  const divisions = useMemo(() => Object.keys(playersByDivision), [playersByDivision]);
  const [activeDivision, setActiveDivision] = useState(divisions[0]);

  useEffect(() => {
    if (divisions.length > 0 && !divisions.includes(activeDivision)) {
      setActiveDivision(divisions[0]);
    }
  }, [divisions, activeDivision]);

  const sortedPlayers = useMemo(() => {
    const divisionPlayers = playersByDivision[activeDivision] || [];
    return [...divisionPlayers].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }, [playersByDivision, activeDivision]);

  const getRecordDisplay = (player) => {
    const wins = player.wins || 0;
    const losses = player.losses || 0;
    const ties = player.ties || 0;
    const winPoints = wins + (ties * 0.5);
    const lossPoints = losses + (ties * 0.5);
    return `${winPoints} - ${lossPoints}`;
  };

  const IndividualStandings = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="p-4 w-[10%] text-left font-semibold text-foreground">Rank</th>
            <th className="p-4 w-[50%] text-left font-semibold text-foreground">Player</th>
            <th className="p-4 w-[20%] text-center font-semibold text-foreground">Record</th>
            <th className="p-4 w-[20%] text-center font-semibold text-foreground">Spread</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => (
            <tr key={player.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors group cursor-pointer" onClick={() => onSelectPlayer(player)}>
              <td className="p-4 font-mono font-bold text-lg text-primary">{player.rank}</td>
              <td className="p-4 font-medium text-foreground">{player.name}</td>
              <td className="p-4 text-center font-mono">{getRecordDisplay(player)}</td>
              <td className={`p-4 text-center font-mono font-semibold ${player.spread > 0 ? 'text-success' : player.spread < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {player.spread > 0 ? '+' : ''}{player.spread || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
  const TeamStandings = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="p-4 w-[10%] text-left font-semibold text-foreground">Rank</th>
            <th className="p-4 w-[40%] text-left font-semibold text-foreground">Team</th>
            <th className="p-4 w-[20%] text-center font-semibold text-foreground">Team Record (W-L)</th>
            <th className="p-4 w-[15%] text-center font-semibold text-foreground">Indiv. Wins</th>
            <th className="p-4 w-[15%] text-center font-semibold text-foreground">Total Spread</th>
          </tr>
        </thead>
        <tbody>
          {teamStandings.map((team) => (
            <tr key={team.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors group">
              <td className="p-4 font-mono font-bold text-lg text-primary">{team.rank}</td>
              <td className="p-4 font-medium text-foreground">{team.name}</td>
              <td className="p-4 text-center font-mono">{team.teamWins} - {team.teamLosses}</td>
              <td className="p-4 text-center font-mono">{team.individualWins}</td>
              <td className={`p-4 text-center font-mono font-semibold ${team.totalSpread > 0 ? 'text-success' : team.totalSpread < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {team.totalSpread > 0 ? '+' : ''}{team.totalSpread || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2 border-b-2 border-transparent">
            {divisions.map(division => (
                <button
                    key={division}
                    onClick={() => setActiveDivision(division)}
                    className={cn(
                        "px-3 py-1 text-sm font-medium rounded-md",
                        activeDivision === division ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                    )}
                >
                    {division}
                </button>
            ))}
        </div>
        {tournamentType === 'team' && (
            <div className="flex items-center space-x-1 bg-muted/20 rounded-lg p-1">
                <Button variant={viewMode === 'individual' ? 'default' : 'ghost'} size="xs" onClick={() => setViewMode('individual')}>Individual</Button>
                <Button variant={viewMode === 'team' ? 'default' : 'ghost'} size="xs" onClick={() => setViewMode('team')}>Team</Button>
            </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Icon name="Users" size={48} className="opacity-50 mb-4" />
            <h4 className="font-heading font-semibold text-lg">No Players in Roster</h4>
            <p className="text-sm">Add players to begin the tournament.</p>
          </div>
        ) : (
          viewMode === 'individual' ? <IndividualStandings /> : <TeamStandings />
        )}
      </div>
    </div>
  );
};

export default StandingsTable;