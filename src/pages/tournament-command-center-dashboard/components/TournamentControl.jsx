import React, { useState, useEffect, useMemo } from 'react';
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
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const currentRound = tournamentInfo?.currentRound || 1;
    if (tournamentInfo?.pairing_schedule && tournamentInfo.pairing_schedule[currentRound]) {
        setCurrentPairings(tournamentInfo.pairing_schedule[currentRound]);
        setIsPaired(true);
    } else {
        setIsPaired(false);
        setCurrentPairings([]);
    }

    if (tournamentInfo?.type === 'best_of_league') {
        const fetchMatches = async () => {
            const { data } = await supabase
                .from('matches')
                .select('*')
                .eq('tournament_id', tournamentInfo.id)
                .eq('round', currentRound);
            setMatches(data || []);
        };
        fetchMatches();
    }
  }, [tournamentInfo]);

  const generateFullLeagueSchedule = async () => {
    setIsLoading(true);
    toast.info("Generating all league matches...");

    const playersBySeed = [...players].sort((a, b) => a.seed - b.seed);
    const scheduleTemplate = roundRobinSchedules[players.length];

    if (!scheduleTemplate) {
        toast.error(`Round Robin is not supported for ${players.length} players.`);
        setIsLoading(false);
        return;
    }

    const allMatches = [];
    for (let round = 1; round < players.length; round++) {
        const pairedPlayers = new Set();
        playersBySeed.forEach(player1 => {
            if (pairedPlayers.has(player1.id)) return;

            const opponentSeed = scheduleTemplate[player1.seed - 1][round - 1];
            const player2 = playersBySeed.find(p => p.seed === opponentSeed);

            if (player2 && !pairedPlayers.has(player2.id)) {
                allMatches.push({
                    tournament_id: tournamentInfo.id,
                    round: round,
                    player1_id: player1.player_id,
                    player2_id: player2.player_id,
                });
                pairedPlayers.add(player1.id);
                pairedPlayers.add(player2.id);
            }
        });
    }

    const { error } = await supabase.from('matches').insert(allMatches);

    if (error) {
        toast.error(`Failed to generate schedule: ${error.message}`);
    } else {
        const { data, error: updateError } = await supabase
            .from('tournaments')
            .update({ status: 'in_progress' })
            .eq('id', tournamentInfo.id)
            .select()
            .single();
        if (updateError) {
            toast.error(`Failed to update tournament status: ${updateError.message}`);
        } else {
            onRoundPaired(data);
            toast.success("Full league schedule has been generated!");
        }
    }
    setIsLoading(false);
  };

  const generateLitoPairings = (playersToPair, previousMatchups, allResults, currentRound, totalRounds) => {
    let availablePlayers = [...playersToPair.filter(p => p.status !== 'withdrawn')];
    let newPairings = [];

    const roundsRemaining = totalRounds - currentRound;
    const isLateStage = roundsRemaining < 3;

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

    if (availablePlayers.length % 2 !== 0) {
        const playersWithByes = new Set(allResults.filter(r => r.player2_name === 'BYE').map(r => r.player1_name));
        
        let eligibleForBye = availablePlayers
            .filter(p => !playersWithByes.has(p.name))
            .sort((a, b) => b.rank - a.rank);

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
            const allowRematches = advancedSettings?.allow_rematches ?? false;
            if (!allowRematches) {
                allResultsSoFar.forEach(res => {
                    previousMatchups.add(`${res.player1_id}-${res.player2_id}`);
                    previousMatchups.add(`${res.player2_id}-${res.player1_id}`);
                });
            }

            divisionPairings = generateLitoPairings(playersToPair, previousMatchups, allResultsSoFar, currentRound, tournamentInfo.rounds);

        } else { // Fallback to Swiss
            let playersToPair = [...divisionPlayers];
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
        toast.error(`Failed to generate pairings: ${error.message}`);
    } else {
        onRoundPaired(data);

        // --- New "Clash of the Titans" Logic ---
        const roundPairings = schedule[currentRound] || [];
        let topMatchup = null;
        let highestCombinedRating = 0;

        roundPairings.forEach(p => {
            if (p.player2.name === 'BYE') return;
            const player1 = players.find(pl => pl.name === p.player1.name);
            const player2 = players.find(pl => pl.name === p.player2.name);
            if (player1 && player2) {
                const combinedRating = (player1.rating || 0) + (player2.rating || 0);
                if (combinedRating > highestCombinedRating) {
                    highestCombinedRating = combinedRating;
                    topMatchup = { player1, player2, table: p.table };
                }
            }
        });

        if (topMatchup) {
            const announcementMessage = `🔥 Clash of the Titans! Don't miss this Round ${currentRound} marquee matchup between ${topMatchup.player1.name} (${topMatchup.player1.rating}) and ${topMatchup.player2.name} (${topMatchup.player2.rating}) on Table ${topMatchup.table}.`;
            await supabase.from('announcements').insert({
                tournament_id: tournamentInfo.id,
                message: announcementMessage,
            });
        }
        
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
  
  const isLeagueGenerated = useMemo(() => {
    return tournamentInfo?.type === 'best_of_league' && matches.length > 0;
  }, [tournamentInfo, matches]);

  return (
    <div className="glass-card p-6">
      <h2 className="font-heading font-semibold text-xl text-foreground mb-4">
        Command Deck
      </h2>
      <AnimatePresence mode="wait">
        <motion.div
            key={isPaired || isLeagueGenerated ? 'paired' : 'unpaired'}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
        >
          {!isPaired && tournamentInfo?.type !== 'best_of_league' ? (
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
          ) : tournamentInfo?.type === 'best_of_league' ? (
             isLeagueGenerated ? (
                <div>
                    <h3 className="font-heading font-medium text-lg text-foreground mb-4">
                      Match Terminal - Round {tournamentInfo.currentRound}
                    </h3>
                    <div className="space-y-3">
                        {matches.map(match => {
                            const player1 = players.find(p => p.player_id === match.player1_id);
                            const player2 = players.find(p => p.player_id === match.player2_id);
                            return (
                                <div key={match.id} className="glass-card p-3 rounded-md flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-sm">
                                            <span className="font-medium text-foreground">{player1?.name}</span>
                                            <span className="font-bold text-primary mx-2">{match.player1_wins}</span>
                                            <span className="text-muted-foreground mx-2">vs</span>
                                            <span className="font-bold text-primary mx-2">{match.player2_wins}</span>
                                            <span className="font-medium text-foreground">{player2?.name}</span>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => onEnterScore(match)}>
                                        Enter Game Score
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <Button size="lg" onClick={generateFullLeagueSchedule} loading={isLoading} className="w-full shadow-glow">
                        Generate League Matches
                    </Button>
                </div>
            )
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