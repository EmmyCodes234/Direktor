import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import useMediaQuery from '../../../hooks/useMediaQuery';
import { cn } from '../../../utils/cn';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const StandingsTable = ({ players, onSelectPlayer, tournamentType, teamStandings }) => {
  const [viewMode, setViewMode] = useState('individual');
  const navigate = useNavigate();
  const isBestOfLeague = tournamentType === 'best_of_league';
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  // StandingsTable received players

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
  const [activeDivision, setActiveDivision] = useState(divisions[0] || 'Open');

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

    if (ties > 0) {
      return `${wins} - ${losses} - ${ties}`;
    }
    return `${wins} - ${losses}`;
  };

  const handlePlayerClick = (e, player) => {
    e.preventDefault();
    navigate(`/players/${player.slug}`);
  };

  const handleModalClick = (e, player) => {
    e.stopPropagation();
    onSelectPlayer(player);
  };

  // Pagination for large player lists
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(sortedPlayers.length / pageSize);
  const pagedPlayers = sortedPlayers.slice((page - 1) * pageSize, page * pageSize);

  const IndividualStandings = () => {
    if (isMobile) {
      // Enhanced card layout for mobile
      return (
        <div className="flex flex-col gap-3 p-4">
          {pagedPlayers.map((player, index) => {
            let isComplete = false;
            let matchWins = 0;
            let matchLosses = 0;
            if (isBestOfLeague) {
              const totalMatches = players.length - 1;
              matchWins = typeof player.match_wins === 'string' ? parseInt(player.match_wins || 0, 10) : (player.match_wins || 0);
              matchLosses = typeof player.match_losses === 'string' ? parseInt(player.match_losses || 0, 10) : (player.match_losses || 0);
              isComplete = (matchWins + matchLosses) >= totalMatches && totalMatches > 0;
            }
            return (
              <motion.div 
                key={player.id} 
                className={cn(
                  "rounded-xl border border-border bg-background shadow-sm p-4 flex flex-col gap-3 transition-all duration-200",
                  isComplete ? 'bg-success/5 border-success/30 shadow-success/10' : 'hover:shadow-md hover:border-border/50'
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                aria-label={isComplete ? 'Player matches complete' : undefined}
              >
                {/* Header Row */}
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-lg transition-all duration-200",
                    player.rank <= 3 
                      ? "bg-primary/20 text-primary border-2 border-primary/30" 
                      : "bg-muted/20 text-muted-foreground border border-border"
                  )}>
                    {player.rank}
                  </div>
                  
                  {/* Player Name */}
                  <div className="flex-1 min-w-0">
                    <a 
                      href={`/players/${player.slug}`} 
                      onClick={(e) => handlePlayerClick(e, player)} 
                      className="block font-semibold text-foreground hover:text-primary transition-colors duration-200 truncate"
                    >
                      {player.name}
                    </a>
                    {isBestOfLeague && isComplete && (
                      <div className="flex items-center gap-1 mt-1">
                        <Icon name="CheckCircle" size={14} className="text-success" aria-label="All matches complete" />
                        <span className="text-xs text-success font-medium">Complete</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Stats Button */}
                  <button 
                    onClick={(e) => handleModalClick(e, player)} 
                    aria-label="View player stats"
                    className="touch-target p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-all duration-200"
                  >
                    <Icon name="BarChartHorizontal" size={18} className="text-muted-foreground" />
                  </button>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {isBestOfLeague && (
                    <div className="bg-muted/10 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground font-medium mb-1">Match Wins</div>
                      <div className="font-mono font-bold text-lg text-foreground">{matchWins}</div>
                    </div>
                  )}
                  <div className="bg-muted/10 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Record</div>
                    <div className="font-mono font-bold text-lg text-foreground">{getRecordDisplay(player)}</div>
                  </div>
                  <div className="bg-muted/10 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Spread</div>
                    <div className={cn(
                      "font-mono font-bold text-lg",
                      player.spread > 0 ? 'text-success' : player.spread < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {player.spread > 0 ? '+' : ''}{player.spread || 0}
                    </div>
                  </div>
                  <div className="bg-muted/10 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Points</div>
                    <div className="font-mono font-bold text-lg text-foreground">{player.points || 0}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6 p-4 bg-muted/10 rounded-xl">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1} 
                aria-label="Previous page"
                className="touch-target px-4 py-2 rounded-lg bg-background border border-border hover:bg-muted/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Icon name="ChevronLeft" size={16} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Page</span>
                <span className="font-mono font-bold text-lg text-foreground">{page}</span>
                <span className="text-sm font-medium text-muted-foreground">of {totalPages}</span>
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages} 
                aria-label="Next page"
                className="touch-target px-4 py-2 rounded-lg bg-background border border-border hover:bg-muted/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Icon name="ChevronRight" size={16} />
              </button>
            </div>
          )}
        </div>
      );
    }
    // Table layout for desktop
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 w-[10%] text-left font-semibold text-foreground">Rank</th>
              <th className="p-4 w-[40%] text-left font-semibold text-foreground">Player</th>
              {isBestOfLeague && <th className="p-4 w-[15%] text-center font-semibold text-foreground">Match Wins</th>}
              <th className="p-4 w-[20%] text-center font-semibold text-foreground">Record (W-L-T)</th>
              <th className="p-4 w-[15%] text-center font-semibold text-foreground">Spread</th>
              <th className="p-4 w-[10%] text-center font-semibold text-foreground">Stats</th>
            </tr>
          </thead>
          <tbody>
            {pagedPlayers.map((player) => {
              let isComplete = false;
              let matchWins = 0;
              let matchLosses = 0;
              if (isBestOfLeague) {
                const totalMatches = players.length - 1;
                matchWins = typeof player.match_wins === 'string' ? parseInt(player.match_wins || 0, 10) : (player.match_wins || 0);
                matchLosses = typeof player.match_losses === 'string' ? parseInt(player.match_losses || 0, 10) : (player.match_losses || 0);
                isComplete = (matchWins + matchLosses) >= totalMatches && totalMatches > 0;
              }
              return (
                <tr key={player.id} className={`border-b border-border/50 hover:bg-muted/5 transition-colors group ${isComplete ? 'bg-success/10 border-success/60' : ''}`}
                  aria-label={isComplete ? 'Player matches complete' : undefined}
                >
                  <td className="p-4 font-mono font-bold text-lg text-primary flex items-center gap-2">
                    {player.rank}
                    {isBestOfLeague && isComplete && <Icon name="CheckCircle" size={16} className="text-success ml-1" aria-label="All matches complete" />}
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    <a href={`/players/${player.slug}`} onClick={(e) => handlePlayerClick(e, player)} className="hover:underline">
                      {player.name}
                    </a>
                  </td>
                  {isBestOfLeague && <td className="p-4 text-center font-mono">{matchWins}</td>}
                  <td className="p-4 text-center font-mono">{getRecordDisplay(player)}</td>
                  <td className={`p-4 text-center font-mono font-semibold ${player.spread > 0 ? 'text-success' : player.spread < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {player.spread > 0 ? '+' : ''}{player.spread || 0}
                  </td>
                  <td className="p-4 text-center">
                    <Button variant="ghost" size="icon" onClick={(e) => handleModalClick(e, player)} aria-label="View player stats">
                      <Icon name="BarChartHorizontal" size={16} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">Prev</Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page">Next</Button>
          </div>
        )}
      </div>
    );
  };

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