import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../../supabaseClient';
import { roundRobinSchedules } from '../../../utils/pairingSchedules';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';
import ManualPairingModal from '../../../components/ManualPairingModal';

// This pure function can live outside the component
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

const updatePlayerStatsInSupabase = async (statsMap) => {
  const updates = [];
  for (const [playerId, stats] of statsMap.entries()) {
    updates.push(
      supabase
      .from('players')
      .update({
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
      })
      .eq('id', playerId)
    );
  }
  await Promise.all(updates);
};


const TournamentControl = ({ tournamentInfo, onRoundPaired, onManualPairingsSaved, players, onEnterScore, recentResults, onUnpairRound, matches }) => {
  const [currentPairings, setCurrentPairings] = useState([]);
  const [isPaired, setIsPaired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showManualPairing, setShowManualPairing] = useState(false);

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

  const generateSwissPairings = (playersToPair, previousMatchups, allResults) => {
    let availablePlayers = [...playersToPair.filter(p => p.status !== 'withdrawn')];
    let newPairings = [];
    let table = 1;

    // Handle odd number of players with bye
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

    // Group players by score (wins + 0.5 * ties)
    const scoreGroups = new Map();
    availablePlayers.forEach(player => {
      const score = (player.wins || 0) + 0.5 * (player.ties || 0);
      if (!scoreGroups.has(score)) {
        scoreGroups.set(score, []);
      }
      scoreGroups.get(score).push(player);
    });

    // Sort score groups in descending order
    const sortedScores = Array.from(scoreGroups.keys()).sort((a, b) => b - a);

    // Pair within score groups, avoiding rematches
    for (const score of sortedScores) {
      const playersInGroup = scoreGroups.get(score);
      
      while (playersInGroup.length >= 2) {
        const player1 = playersInGroup.shift();
        let opponentFound = false;
        
        // Try to find opponent without rematch
        for (let i = 0; i < playersInGroup.length; i++) {
          const player2 = playersInGroup[i];
          const matchupKey1 = `${player1.id}-${player2.id}`;
          const matchupKey2 = `${player2.id}-${player1.id}`;

          if (!previousMatchups.has(matchupKey1) && !previousMatchups.has(matchupKey2)) {
            newPairings.push({ 
              table: table++, 
              player1: { name: player1.name }, 
              player2: { name: player2.name } 
            });
            playersInGroup.splice(i, 1);
            opponentFound = true;
            break;
          }
        }
        
        // If no opponent found without rematch, take the first available
        if (!opponentFound && playersInGroup.length > 0) {
          const player2 = playersInGroup.shift();
          newPairings.push({ 
            table: table++, 
            player1: { name: player1.name }, 
            player2: { name: player2.name } 
          });
        }
      }
      
      // If odd number in this score group, move to next group
      if (playersInGroup.length === 1) {
        const nextScore = sortedScores.find(s => s < score);
        if (nextScore !== undefined) {
          const nextGroup = scoreGroups.get(nextScore);
          if (nextGroup) {
            nextGroup.unshift(playersInGroup[0]);
          }
        }
      }
    }

    return assignStarts(newPairings, players, allResults);
  };

  const generateLitoPairings = (playersToPair, previousMatchups, allResults, currentRound, totalRounds) => {
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
      newPairings = generateSwissPairings(playersToPair, previousMatchups, allResults);
    }

    return newPairings;
  };

  const generateTeamSwissPairings = (teams, previousTeamMatchups, allResults) => {
    let availableTeams = [...teams];
    let newTeamPairings = [];
    let table = 1;

    // Handle odd number of teams with bye
    if (availableTeams.length % 2 !== 0) {
      const teamsWithByes = new Set(allResults.filter(r => r.player2_name === 'BYE').map(r => r.player1_name));
      let eligibleForBye = availableTeams
        .filter(team => !teamsWithByes.has(team.name))
        .sort((a, b) => b.rank - a.rank);

      if (eligibleForBye.length === 0) {
        eligibleForBye = availableTeams.sort((a, b) => b.rank - a.rank);
      }

      const byeTeam = eligibleForBye[0];
      if (byeTeam) {
        newTeamPairings.push({ 
          table: 'BYE', 
          team1: { name: byeTeam.name }, 
          team2: { name: 'BYE' } 
        });
        availableTeams = availableTeams.filter(t => t.id !== byeTeam.id);
      }
    }

    // Group teams by score (team wins + 0.5 * team ties)
    const scoreGroups = new Map();
    availableTeams.forEach(team => {
      const score = (team.teamWins || 0) + 0.5 * (team.teamTies || 0);
      if (!scoreGroups.has(score)) {
        scoreGroups.set(score, []);
      }
      scoreGroups.get(score).push(team);
    });

    // Sort score groups in descending order
    const sortedScores = Array.from(scoreGroups.keys()).sort((a, b) => b - a);

    // Pair within score groups, avoiding rematches
    for (const score of sortedScores) {
      const teamsInGroup = scoreGroups.get(score);
      
      while (teamsInGroup.length >= 2) {
        const team1 = teamsInGroup.shift();
        let opponentFound = false;
        
        // Try to find opponent without rematch
        for (let i = 0; i < teamsInGroup.length; i++) {
          const team2 = teamsInGroup[i];
          const matchupKey1 = `${team1.id}-${team2.id}`;
          const matchupKey2 = `${team2.id}-${team1.id}`;

          if (!previousTeamMatchups.has(matchupKey1) && !previousTeamMatchups.has(matchupKey2)) {
            newTeamPairings.push({ 
              table: table++, 
              team1: { name: team1.name }, 
              team2: { name: team2.name } 
            });
            teamsInGroup.splice(i, 1);
            opponentFound = true;
            break;
          }
        }
        
        // If no opponent found without rematch, take the first available
        if (!opponentFound && teamsInGroup.length > 0) {
          const team2 = teamsInGroup.shift();
          newTeamPairings.push({ 
            table: table++, 
            team1: { name: team1.name }, 
            team2: { name: team2.name } 
          });
        }
      }
      
      // If odd number in this score group, move to next group
      if (teamsInGroup.length === 1) {
        const nextScore = sortedScores.find(s => s < score);
        if (nextScore !== undefined) {
          const nextGroup = scoreGroups.get(nextScore);
          if (nextGroup) {
            nextGroup.unshift(teamsInGroup[0]);
          }
        }
      }
    }

    return newTeamPairings;
  };

  const handlePairCurrentRound = async () => {
    setIsLoading(true);
    const currentRound = tournamentInfo.currentRound || 1;

    let schedule = { ...(tournamentInfo.pairing_schedule || {}) };
    let fullRoundPairings = [];
    let tableNumber = 1;

    const divisions = tournamentInfo.divisions && tournamentInfo.divisions.length > 0 ?
      tournamentInfo.divisions :
      [{ name: 'Open' }];

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
            if (res.score1 > res.score2) { p1Stats.wins++; p2Stats.losses++; } else if (res.score2 > res.score1) { p2Stats.wins++; p1Stats.losses++; } else { p1Stats.ties++; p2Stats.ties++; }
          }
          await updatePlayerStatsInSupabase(statsMap); // Corrected: Call this after the loop
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
      } else if (pairingSystem === 'team_swiss') {
        // Handle team Swiss pairing
        const teamStats = players.map(p => ({
          ...p,
          teamWins: 0,
          teamLosses: 0,
          teamTies: 0
        })).filter(p => p.team_id); // Filter out players not in a team
        
        // Calculate team stats from previous results
        allResultsSoFar.forEach(result => {
          const p1 = players.find(p => p.player_id === result.player1_id);
          const p2 = players.find(p => p.player_id === result.player2_id);
          if (!p1 || !p2 || !p1.team_id || !p2.team_id || p1.team_id === p2.team_id) return;
          
          // This is simplified - in reality, you'd need to group by team matches
          // For now, we'll use individual wins as proxy for team performance
        });
        
        let previousTeamMatchups = new Set();
        const allowRematches = advancedSettings?.allow_rematches ?? false;
        if (!allowRematches) {
          // Build team matchup history
          allResultsSoFar.forEach(res => {
            const p1 = players.find(p => p.player_id === res.player1_id);
            const p2 = players.find(p => p.player_id === res.player2_id);
            if (p1 && p2 && p1.team_id && p2.team_id && p1.team_id !== p2.team_id) {
              const teamKey = [p1.team_id, p2.team_id].sort().join('-');
              previousTeamMatchups.add(teamKey);
            }
          });
        }
        
        const teamPairings = generateTeamSwissPairings(teamStats, previousTeamMatchups, allResultsSoFar);
        
        // Convert team pairings to individual pairings
        divisionPairings = [];
        for (const teamPairing of teamPairings) {
          if (teamPairing.team2.name === 'BYE') {
            // Handle team bye
            const team1Players = players.filter(p => p.team_id === teamPairing.team1.id);
            team1Players.forEach(player => {
              divisionPairings.push({
                table: 'BYE',
                player1: { name: player.name },
                player2: { name: 'BYE' }
              });
            });
          } else {
            // Generate individual pairings between teams
            const team1Players = players.filter(p => p.team_id === teamPairing.team1.id);
            const team2Players = players.filter(p => p.team_id === teamPairing.team2.id);
            
            // Simple pairing - match players by position within team
            const maxPlayers = Math.min(team1Players.length, team2Players.length);
            for (let i = 0; i < maxPlayers; i++) {
              divisionPairings.push({
                table: tableNumber++,
                player1: { name: team1Players[i].name },
                player2: { name: team2Players[i].name }
              });
            }
          }
        }
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

  const handleSaveManualPairings = async (manualPairings) => {
    setIsLoading(true);
    const currentRound = tournamentInfo.currentRound || 1;
    
    let schedule = { ...(tournamentInfo.pairing_schedule || {}) };
    
    // Process manual pairings to add starts assignment
    const processedPairings = assignStarts(manualPairings, players, recentResults);
    
    schedule[currentRound] = processedPairings;

    const { data, error } = await supabase.from('tournaments').update({ pairing_schedule: schedule }).eq('id', tournamentInfo.id).select().single();

    setIsLoading(false);
    if (error) {
      toast.error(`Failed to save manual pairings: ${error.message}`);
      throw error;
    } else {
      onManualPairingsSaved(data);
      toast.success('Manual pairings saved successfully!');
      
      // Create announcement for top matchup
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
        const announcementMessage = `🔥 Manual Pairing Complete! Round ${currentRound} features ${topMatchup.player1.name} (${topMatchup.player1.rating}) vs ${topMatchup.player2.name} (${topMatchup.player2.rating}) on Table ${topMatchup.table}.`;
        await supabase.from('announcements').insert({
          tournament_id: tournamentInfo.id,
          message: announcementMessage,
        });
      }
    }
  };

  const isLeagueGenerated = useMemo(() => {
    return tournamentInfo?.type === 'best_of_league' && matches.length > 0;
  }, [tournamentInfo, matches]);

  const getGameWins = (match, playerId) => {
    let wins = 0;
    if (recentResults && Array.isArray(recentResults)) {
      recentResults.filter(r => r.match_id === match.id).forEach(r => {
        if (r.score1 > r.score2 && r.player1_id === playerId) wins++;
        else if (r.score2 > r.score1 && r.player2_id === playerId) wins++;
      });
    }
    return wins;
  };

  const isMatchCompleted = (match) => {
    if (tournamentInfo?.type !== 'best_of_league') return match.status === 'complete';
    
    const p1Wins = getGameWins(match, match.player1_id);
    const p2Wins = getGameWins(match, match.player2_id);
    
    // Calculate the number of wins needed (e.g., 8 wins in best of 15)
    const totalGames = tournamentInfo.games_per_match || 15;
    const winsNeeded = Math.ceil(totalGames / 2);
    
    // Match is complete if either player has reached the winning threshold
    return p1Wins >= winsNeeded || p2Wins >= winsNeeded;
  };

  const handleEnterScore = (match) => {
    onEnterScore(match);
  };


  // --- Render Logic ---

  return (
    <div className="space-y-6">
      {/* Tournament Status & Controls - Hidden for best-of-league with generated schedule */}
      {!(tournamentInfo?.type === 'best_of_league' && matches.length > 0) && (
        <div className="bg-card/90 backdrop-blur-sm border border-border/20 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Round {tournamentInfo?.currentRound || 1} Control
              </h2>
              <p className="text-muted-foreground">
                {isPaired ? `${currentPairings.length} pairings generated` : 'No pairings for current round'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {!isPaired && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handlePairCurrentRound}
                    loading={isLoading}
                    className="touch-target-mobile"
                    size="lg"
                  >
                    <Icon name="Swords" className="mr-2" />
                    Auto Pair Round
                  </Button>
                  {tournamentInfo?.type !== 'best_of_league' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowManualPairing(true)}
                      className="touch-target-mobile"
                      size="lg"
                    >
                      <Icon name="Hand" className="mr-2" />
                      Manual Pair
                    </Button>
                  )}
                  {tournamentInfo?.type === 'best_of_league' && (
                    <Button
                      variant="outline"
                      onClick={generateFullLeagueSchedule}
                      loading={isLoading}
                      className="touch-target-mobile"
                      size="lg"
                    >
                      <Icon name="Calendar" className="mr-2" />
                      Generate Full Schedule
                    </Button>
                  )}
                </div>
              )}
              
              {isPaired && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={onUnpairRound}
                    className="touch-target-mobile"
                    size="lg"
                  >
                    <Icon name="RotateCcw" className="mr-2" />
                    Unpair Round
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Pairings - Hidden for best-of-league with generated schedule */}
      {isPaired && currentPairings.length > 0 && !(tournamentInfo?.type === 'best_of_league' && matches.length > 0) && (
        <div className="bg-card/90 backdrop-blur-sm border border-border/10 rounded-xl p-6">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-6">
            Round {tournamentInfo?.currentRound || 1} Pairings
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {currentPairings.map((pairing, index) => (
              <motion.div
                key={index}
                className="bg-muted/10 rounded-xl p-4 lg:p-6 border border-border/10 hover:border-border/30 transition-all duration-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono text-muted-foreground">Table {pairing.table}</span>
                  {pairing.player1.starts && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                      {pairing.player1.name} starts
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <span className="font-medium text-foreground truncate flex-1">
                      {pairing.player1.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {pairing.player1.starts && (
                        <Icon name="Play" size={14} className="text-primary" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEnterScore(pairing)}
                        className="touch-target"
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-center text-muted-foreground">
                    <Icon name="Minus" size={16} />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <span className="font-medium text-foreground truncate flex-1">
                      {pairing.player2.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {pairing.player2.starts && (
                        <Icon name="Play" size={14} className="text-primary" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEnterScore(pairing)}
                        className="touch-target"
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Best of League Matches */}
      {tournamentInfo?.type === 'best_of_league' && matches.length > 0 && (
        <div className="glass-card p-6 lg:p-8">
          <h3 className="text-lg lg:text-xl font-heading font-semibold text-foreground mb-6">
            Best of League Matches
          </h3>
          
          <div className="space-y-6 lg:space-y-8">
            {(() => {
              // Group matches by round
              const matchesByRound = matches.reduce((acc, match) => {
                if (!acc[match.round]) {
                  acc[match.round] = [];
                }
                acc[match.round].push(match);
                return acc;
              }, {});
              
              return Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b)).map((roundNum, roundIndex) => (
                <motion.div
                  key={roundNum}
                  className="bg-muted/10 rounded-xl p-4 lg:p-6 border border-border/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: roundIndex * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h4 className="text-lg lg:text-xl font-semibold text-foreground">
                      Round {roundNum}
                    </h4>
                    <span className="text-sm text-muted-foreground">
                      {matchesByRound[roundNum].length} matches
                    </span>
                  </div>
                  
                  <div className="space-y-3 lg:space-y-4">
                    {matchesByRound[roundNum].map((match, matchIndex) => {
                      const p1Wins = getGameWins(match, match.player1_id);
                      const p2Wins = getGameWins(match, match.player2_id);
                      const player1 = players.find(p => p.player_id === match.player1_id);
                      const player2 = players.find(p => p.player_id === match.player2_id);
                      
                      if (!player1 || !player2) return null;
                      
                      return (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-3 lg:p-4 bg-background/50 rounded-lg border border-border/10"
                        >
                                                     <div className="flex items-center gap-3 flex-1">
                             <span className="text-sm font-mono text-muted-foreground min-w-[60px]">
                               Match {matchIndex + 1}
                             </span>
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-medium text-foreground truncate">
                                {player1.name}
                              </span>
                              <span className="font-mono font-bold text-primary">
                                {p1Wins}
                              </span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="font-mono font-bold text-primary">
                                {p2Wins}
                              </span>
                              <span className="font-medium text-foreground truncate">
                                {player2.name}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              isMatchCompleted(match)
                                ? "bg-success/20 text-success" 
                                : "bg-warning/20 text-warning"
                            )}>
                              {isMatchCompleted(match) ? 'Complete' : 'In Progress'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEnterScore(match)}
                              className="touch-target"
                            >
                              <Icon name="Edit" size={16} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ));
            })()}
          </div>
        </div>
      )}
      
      {/* Manual Pairing Modal */}
      <ManualPairingModal
        isOpen={showManualPairing}
        onClose={() => setShowManualPairing(false)}
        players={players}
        currentRound={tournamentInfo?.currentRound || 1}
        onSavePairings={handleSaveManualPairings}
        existingPairings={currentPairings}
        tournamentInfo={tournamentInfo}
      />
    </div>
  );
};

export default TournamentControl;