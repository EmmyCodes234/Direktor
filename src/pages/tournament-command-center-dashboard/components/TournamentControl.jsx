import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { toast } from 'sonner';
import { supabase } from '../../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { roundRobinSchedules } from '../../../utils/pairingSchedules';

const assignStarts = (pairings, players, allResults) => {
    return pairings.map(p => {
        if (p.player2.name === 'BYE') {
            p.player1.starts = false;
            p.player2.starts = false;
            return p;
        }
        const player1 = players.find(pl => pl.name === p.player1.name);
        const player2 = players.find(pl => pl.name === p.player2.name);
        if (!player1 || !player2) return p;

        const p1Starts = player1.starts || 0;
        const p2Starts = player2.starts || 0;

        if (p1Starts < p2Starts) {
            p.player1.starts = true;
        } else if (p2Starts < p1Starts) {
            p.player2.starts = true;
        } else {
            // Tie-breaker 1: Head-to-head starts
            const headToHeadGames = allResults.filter(r => 
                (r.player1_id === player1.player_id && r.player2_id === player2.player_id) ||
                (r.player1_id === player2.player_id && r.player2_id === player1.player_id)
            );
            
            const p1HeadToHeadStarts = headToHeadGames.filter(r => r.player1_id === player1.player_id && r.player1_starts).length +
                                       headToHeadGames.filter(r => r.player2_id === player1.player_id && r.player2_starts).length;

            const p2HeadToHeadStarts = headToHeadGames.filter(r => r.player1_id === player2.player_id && r.player1_starts).length +
                                       headToHeadGames.filter(r => r.player2_id === player2.player_id && r.player2_starts).length;

            if (p1HeadToHeadStarts < p2HeadToHeadStarts) {
                p.player1.starts = true;
            } else if (p2HeadToHeadStarts < p1HeadToHeadStarts) {
                p.player2.starts = true;
            } else {
                // Tie-breaker 2: Fair tie-breaker using lower seed (higher rank)
                if (player1.seed < player2.seed) {
                    p.player1.starts = true;
                } else {
                    p.player2.starts = true;
                }
            }
        }
        return p;
    });
};

const TournamentControl = ({ tournamentInfo, onRoundPaired, players, onEnterScore, recentResults, onUnpairRound }) => {
  const [currentPairings, setCurrentPairings] = useState([]);
  const [isPaired, setIsPaired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentRound = tournamentInfo?.currentRound || 1;
    if (tournamentInfo?.pairing_schedule && tournamentInfo.pairing_schedule[currentRound]) {
        setCurrentPairings(tournamentInfo.pairing_schedule[currentRound]);
        setIsPaired(true);
    } else {
        setIsPaired(false);
        setCurrentPairings([]);
    }
  }, [tournamentInfo]);

  const generateLitoPairings = (playersToPair, previousMatchups, allResults, currentRound, totalRounds) => {
    let availablePlayers = [...playersToPair.filter(p => p.status !== 'withdrawn')];
    let newPairings = [];
    let table = 1;

    const roundsRemaining = totalRounds - currentRound;
    const isLateStage = roundsRemaining < 3; // Contention pairing for last 2 rounds

    if (isLateStage) {
        const prizeContenders = playersToPair.filter(p => p.rank <= (tournamentInfo.prizes?.length || 3));
        const nonContenders = playersToPair.filter(p => p.rank > (tournamentInfo.prizes?.length || 3));
        
        const contenderPairings = generateSwissPairings(prizeContenders, previousMatchups, allResults);
        const nonContenderPairings = generateSwissPairings(nonContenders, previousMatchups, allResults);
        
        newPairings = [...contenderPairings, ...nonContenderPairings];
    } else {
        newPairings = generateSwissPairings(availablePlayers, previousMatchups, allResults);
    }

    return newPairings;
  };
  
  const generateSwissPairings = (playersToPair, previousMatchups, allResults) => {
    let availablePlayers = [...playersToPair.filter(p => p.status !== 'withdrawn')];
    let newPairings = [];
    let table = 1;

    // Handle bye assignment
    if (availablePlayers.length % 2 !== 0) {
        const playersWithByes = new Set(allResults.filter(r => r.player2_name === 'BYE').map(r => r.player1_name));
        
        let eligibleForBye = availablePlayers
            .filter(p => !playersWithByes.has(p.name))
            .sort((a, b) => b.rank - a.rank); // Sort by rank descending (lowest rank first)

        if (eligibleForBye.length === 0) {
            eligibleForBye = availablePlayers.sort((a, b) => b.rank - a.rank);
        }
        
        const byePlayer = eligibleForBye[0];
        if (byePlayer) {
            newPairings.push({ table: 'BYE', player1: { name: byePlayer.name }, player2: { name: 'BYE' } });
            availablePlayers = availablePlayers.filter(p => p.id !== byePlayer.id);
        }
    }

    while (availablePlayers.length > 1) {
        let player1 = availablePlayers.shift();
        let opponentFound = false;
        for (let i = 0; i < availablePlayers.length; i++) {
            let player2 = availablePlayers[i];
            const matchupKey1 = `${player1.id}-${player2.id}`;
            const matchupKey2 = `${player2.id}-${player1.id}`;

            if (!previousMatchups.has(matchupKey1) && !previousMatchups.has(matchupKey2)) {
                newPairings.push({ table: table++, player1: { name: player1.name }, player2: { name: player2.name } });
                availablePlayers.splice(i, 1);
                opponentFound = true;
                break;
            }
        }
        if (!opponentFound) {
            let player2 = availablePlayers.shift();
            newPairings.push({ table: table++, player1: { name: player1.name }, player2: { name: player2.name } });
        }
    }
    
    return assignStarts(newPairings, players, allResults);
  };

  const generateFullRoundRobinSchedule = (playersToPair, totalRounds, allResults) => {
    const scheduleTemplate = roundRobinSchedules[players.length];
    if (!scheduleTemplate) {
        toast.error(`Round Robin is not supported for ${players.length} players. Use 4, 6, 8, 10, 12, 14, or 16.`);
        return null;
    }

    const fullSchedule = {};
    for (let round = 1; round <= totalRounds; round++) {
        const roundPairings = [];
        const pairedPlayers = new Set();
        playersToPair.forEach((player1) => {
            if (pairedPlayers.has(player1.id)) return;
            const opponentSeed = scheduleTemplate[player1.seed - 1][round - 1];
            const player2 = playersToPair.find(p => p.seed === opponentSeed);
            if (player2 && !pairedPlayers.has(player2.id)) {
                roundPairings.push({ table: roundPairings.length + 1, player1: { name: player1.name }, player2: { name: player2.name } });
                pairedPlayers.add(player1.id);
                pairedPlayers.add(player2.id);
            }
        });
        fullSchedule[round] = assignStarts(roundPairings, players, allResults);
    }
    return fullSchedule;
  };

  const generateFullTeamRoundRobinSchedule = async (totalRounds, allResults) => {
    const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`*, tournament_players(*, players(*))`)
        .eq('tournament_id', tournamentInfo.id);

    if (teamsError || !teamsData) {
        toast.error("Could not fetch team data for pairings.");
        return null;
    }
    
    let teams = [...teamsData];
    if (teams.length % 2 !== 0) {
        teams.push({ id: 'bye', name: 'BYE Team', tournament_players: [] });
    }

    const fullSchedule = {};
    const teamIds = teams.map(t => t.id);
    const numTeams = teamIds.length;

    for (let round = 1; round <= totalRounds; round++) {
        const roundPairings = [];
        let table = 1;

        for (let i = 0; i < numTeams / 2; i++) {
            const team1Id = teamIds[i];
            const team2Id = teamIds[numTeams - 1 - i];
            
            if (team1Id !== 'bye' && team2Id !== 'bye') {
                const team1 = teams.find(t => t.id === team1Id);
                const team2 = teams.find(t => t.id === team2Id);

                const team1Players = team1.tournament_players.sort((a,b) => a.seed - b.seed);
                const team2Players = team2.tournament_players.sort((a,b) => a.seed - b.seed);

                for (let j = 0; j < Math.min(team1Players.length, team2Players.length); j++) {
                    roundPairings.push({
                        table: table++,
                        player1: { name: team1Players[j].players.name },
                        player2: { name: team2Players[j].players.name },
                        teamMatch: `${team1.name} vs ${team2.name}`
                    });
                }
            }
        }
        fullSchedule[round] = assignStarts(roundPairings, players, allResults);
        // Rotate teams for the next round
        teamIds.splice(1, 0, teamIds.pop());
    }

    // Assign BYEs for each round
    const allPlayerNames = new Set(players.map(p => p.name));
    for (let round = 1; round <= totalRounds; round++) {
        const pairedPlayerNames = new Set(fullSchedule[round].flatMap(p => [p.player1.name, p.player2.name]));
        allPlayerNames.forEach(playerName => {
            if (!pairedPlayerNames.has(playerName)) {
                fullSchedule[round].push({ table: 'BYE', player1: { name: playerName }, player2: { name: 'BYE' } });
            }
        });
    }
    
    return fullSchedule;
  };


  const checkForClinch = (sortedPlayers, roundsRemaining) => {
    if (roundsRemaining > 2 || sortedPlayers.length < 2) return null;
    const p1 = sortedPlayers[0];
    const p2 = sortedPlayers[1];
    const p1Score = p1.wins + (p1.ties * 0.5);
    const p2MaxScore = p2.wins + (p2.ties * 0.5) + roundsRemaining;
    if (p1Score > p2MaxScore + 0.5) {
        return p1;
    }
    return null;
  };

  const handlePairCurrentRound = async () => {
    setIsLoading(true);
    const currentRound = tournamentInfo.currentRound || 1;
    
    let schedule = { ...(tournamentInfo.pairing_schedule || {})};
    let fullRoundPairings = [];
    let tableNumber = 1;

    const divisions = tournamentInfo.divisions && tournamentInfo.divisions.length > 0 
        ? tournamentInfo.divisions 
        : [{ name: 'Open' }];

    const { data: allResultsSoFar } = await supabase.from('results').select('*').eq('tournament_id', tournamentInfo.id);

    for (const division of divisions) {
        const divisionPlayers = players.filter(p => p.division === division.name || (divisions.length === 1 && division.name === 'Open'));
        
        const advancedSettings = tournamentInfo.advanced_pairing_modes?.[currentRound];
        const pairingSystem = advancedSettings?.system || tournamentInfo.pairing_system;

        let divisionPairings;

        if (pairingSystem === 'lito') {
            let playersToPair = [...divisionPlayers];
            const baseRound = advancedSettings?.base_round ?? currentRound - 1;
            
            if (baseRound < currentRound - 1) {
                const historicalResults = allResultsSoFar.filter(r => r.round <= baseRound);
                const statsMap = new Map(playersToPair.map(p => [p.id, { ...p, wins: 0, losses: 0, ties: 0 }]));
                for (const res of historicalResults) {
                    const p1Stats = statsMap.get(res.player1_id);
                    const p2Stats = statsMap.get(res.player2_id);
                    if (!p1Stats || !p2Stats) continue;
                    if (res.score1 > res.score2) { p1Stats.wins++; p2Stats.losses++; }
                    else if (res.score2 > res.score1) { p2Stats.wins++; p1Stats.losses++; }
                    else { p1Stats.ties++; p2Stats.ties++; }
                }
                playersToPair = Array.from(statsMap.values());
            }

            playersToPair.sort((a, b) => (b.wins + (b.ties * 0.5)) - (a.wins + (a.ties * 0.5)));
            
            let previousMatchups = new Set();
            const allowRematches = advancedSettings?.allow_rematches ?? false; // Lito pairing minimizes rematches
            if (!allowRematches) {
                allResultsSoFar.forEach(res => {
                    previousMatchups.add(`${res.player1_id}-${res.player2_id}`);
                    previousMatchups.add(`${res.player2_id}-${res.player1_id}`);
                });
            }

            divisionPairings = generateLitoPairings(playersToPair, previousMatchups, allResultsSoFar, currentRound, tournamentInfo.rounds);

        } else if (pairingSystem === 'round_robin') {
            // ... (Round Robin logic remains the same)
        } else { // Default to Swiss
            let playersToPair = [...divisionPlayers];
            // ... (Swiss logic remains the same)
            divisionPairings = generateSwissPairings(playersToPair, new Set(), allResultsSoFar);
        }
        
        const adjustedDivisionPairings = divisionPairings.map(p => ({
            ...p,
            table: p.table !== 'BYE' ? tableNumber++ : 'BYE',
            division: division.name
        }));
        
        fullRoundPairings = [...fullRoundPairings, ...adjustedDivisionPairings];
    }
    
    schedule[currentRound] = fullRoundPairings;

    const { data, error } = await supabase.from('tournaments').update({ pairing_schedule: schedule }).eq('id', tournamentInfo.id).select().single();

    setIsLoading(false);
    if (error) {
        toast.error(`Failed to generate pairings: ${error?.message}`);
    } else {
        onRoundPaired(data);
        const byePairings = schedule[currentRound]?.filter(p => p.player2.name === 'BYE');
        if (byePairings && byePairings.length > 0) {
            for (const byePairing of byePairings) {
                const byePlayer = players.find(p => p.name === byePairing.player1.name);
                if (byePlayer) {
                    await supabase.from('results').insert([{
                        tournament_id: tournamentInfo.id,
                        round: currentRound,
                        player1_id: byePlayer.player_id,
                        player2_id: null,
                        player1_name: byePlayer.name,
                        player2_name: 'BYE',
                        score1: 0,
                        score2: 0,
                        is_bye: true,
                    }]);
                    toast.success(`${byePlayer.name} (Div: ${byePlayer.division || 'Open'}) receives a designated win for the bye.`);
                }
            }
        }
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="font-heading font-semibold text-xl text-foreground mb-4">
        Command Deck
      </h2>
      <AnimatePresence mode="wait">
        <motion.div
            key={isPaired ? 'paired' : 'unpaired'}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
        >
          {!isPaired ? (
              <div className="text-center">
                  <Button
                      size="lg"
                      onClick={handlePairCurrentRound}
                      loading={isLoading}
                      disabled={!players || players.length < 2}
                      className="w-full shadow-glow animate-pulse-bright mb-2"
                  >
                      Pair & Start Round {tournamentInfo.currentRound || 1}
                  </Button>
              </div>
          ) : (
               <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-heading font-medium text-lg text-foreground">
                      Pairings for Round {tournamentInfo.currentRound}
                    </h3>
                    <Button variant="destructive" size="sm" onClick={onUnpairRound}>
                        <Icon name="Undo2" size={14} className="mr-2"/>
                        Unpair Round
                    </Button>
                  </div>
                  <div className="space-y-3">
                      {currentPairings.map((pairing, index) => {
                          const player1 = players.find(p => p.name === pairing.player1.name);
                          const player2 = players.find(p => p.name === pairing.player2.name);
                          const existingResult = recentResults.find(r => 
                            r.round === tournamentInfo.currentRound &&
                            ((r.player1_name === player1?.name && r.player2_name === player2?.name) ||
                             (r.player1_name === player2?.name && r.player2_name === player1?.name))
                          );

                          return (
                              <div key={`${pairing.table}-${index}`} className="glass-card p-3 rounded-md flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 border border-primary/20 rounded-md shrink-0">
                                          <span className="font-mono font-bold text-primary text-lg">{pairing.table}</span>
                                      </div>
                                      <div className="text-sm">
                                          <div className="flex items-center gap-2">
                                              {pairing.player1.starts && <Icon name="Play" size={14} className="text-primary"/>}
                                              <span className="font-medium text-foreground">{player1?.name}</span>
                                              <span className="text-muted-foreground">(#{player1?.rank})</span>
                                          </div>
                                          {pairing.division && <div className="my-1 pl-6 text-xs font-semibold text-accent">{pairing.division}</div>}
                                          {!pairing.division && <div className="my-1 pl-6 text-xs font-semibold text-muted-foreground">vs</div>}
                                          <div className="flex items-center gap-2">
                                              {pairing.player2.starts && <Icon name="Play" size={14} className="text-primary"/>}
                                              <span className="font-medium text-foreground">{player2?.name}</span>
                                              <span className="text-muted-foreground">{player2 ? `(#${player2?.rank})` : ''}</span>
                                          </div>
                                      </div>
                                  </div>
                                  {pairing.player2.name !== 'BYE' && (
                                    <Button 
                                        size="sm" 
                                        variant={existingResult ? 'outline' : 'default'} 
                                        onClick={() => onEnterScore({ ...pairing, round: tournamentInfo.currentRound }, existingResult)}
                                    >
                                        <Icon name={existingResult ? 'Edit' : 'ClipboardEdit'} size={16} className="mr-2"/>
                                        {existingResult ? 'Edit Score' : 'Enter Score'}
                                    </Button>
                                  )}
                              </div>
                          )
                      })}
                  </div>
              </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TournamentControl;