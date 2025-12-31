import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../../supabaseClient';
import { roundRobinSchedules } from '../../../utils/pairingSchedules';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';
import ManualPairingModal from '../../../components/ManualPairingModal';
import { assignStarts, generateSwissPairings, generateEnhancedSwissPairings, generateKingOfTheHillPairings, generateTeamSwissPairings } from '../../../utils/pairingLogic';




const TournamentControl = ({ tournamentInfo, onRoundPaired, onManualPairingsSaved, players, onEnterScore, recentResults, onUnpairRound, matches }) => {
  const [currentPairings, setCurrentPairings] = useState([]);
  const [isPaired, setIsPaired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showManualPairing, setShowManualPairing] = useState(false);
  const [viewRound, setViewRound] = useState(tournamentInfo?.currentRound || 1);

  // Sync viewRound when currentRound updates (e.g. tournament advances)
  useEffect(() => {
    if (tournamentInfo?.currentRound) {
      setViewRound(tournamentInfo.currentRound);
    }
  }, [tournamentInfo?.currentRound]);

  useEffect(() => {
    const roundToDisplay = viewRound || tournamentInfo?.currentRound || 1;

    // Debug logging for pairing data
    console.log('🔍 TournamentControl Debug:', {
      tournamentId: tournamentInfo?.id,
      viewRound: roundToDisplay,
      currentRound: tournamentInfo?.currentRound,
      pairingSystem: tournamentInfo?.pairing_system,
      pairingSchedule: tournamentInfo?.pairing_schedule,
      scheduleKeys: tournamentInfo?.pairing_schedule ? Object.keys(tournamentInfo.pairing_schedule) : [],
      roundPairings: tournamentInfo?.pairing_schedule?.[roundToDisplay] || []
    });

    // Check if there are any pairings in the schedule
    if (tournamentInfo?.pairing_schedule && Object.keys(tournamentInfo.pairing_schedule).length > 0) {
      // For round robin or scheduled tournaments, show pairings from the schedule for the SELECTED round
      if (tournamentInfo.pairing_schedule[roundToDisplay]) {
        console.log(`🎯 Schedule - Setting pairings for Round ${roundToDisplay}:`, tournamentInfo.pairing_schedule[roundToDisplay]);
        setCurrentPairings(tournamentInfo.pairing_schedule[roundToDisplay]);
        setIsPaired(true);
      } else {
        console.log(`⚠️ No pairings found for Round ${roundToDisplay}`);
        setIsPaired(false);
        setCurrentPairings([]);
      }
    } else {
      console.log('⚠️ No pairing schedule found');
      // For best_of_league tournaments, check if we have matches for the VIEWED round
      if (tournamentInfo?.type === 'best_of_league' && matches.length > 0) {
        console.log('🔄 Best of League: Converting matches to pairings for display');
        // Convert matches to pairings format for display
        const roundMatches = matches.filter(m => m.round === roundToDisplay);
        const pairingsFromMatches = roundMatches.map(match => ({
          id: `match-${match.id}`,
          table: match.table || 1,
          player1: players.find(p => p.player_id === match.player1_id),
          player2: players.find(p => p.player_id === match.player2_id),
          player1_id: match.player1_id,
          player2_id: match.player2_id,
          division: 'Open'
        }));
        console.log(`🎯 Best of League - Setting pairings from matches for Round ${roundToDisplay}:`, pairingsFromMatches);
        setCurrentPairings(pairingsFromMatches);
        setIsPaired(pairingsFromMatches.length > 0);
      } else {
        setIsPaired(false);
        setCurrentPairings([]);
      }
    }
  }, [tournamentInfo, matches, players, viewRound]);







  const handlePairCurrentRound = async () => {
    setIsLoading(true);
    try {
      const currentRound = tournamentInfo.currentRound || 1;

      let schedule = { ...(tournamentInfo.pairing_schedule || {}) };
      let fullRoundPairings = [];
      let tableNumber = 1;

      const divisions = tournamentInfo.divisions && tournamentInfo.divisions.length > 0 ?
        tournamentInfo.divisions :
        [{ name: 'Open' }];

      const { data: allResultsSoFar, error: resultsError } = await supabase.from('results').select('*').eq('tournament_id', tournamentInfo.id);

      if (resultsError) {
        throw new Error(`Failed to fetch results: ${resultsError.message}`);
      }

      // Get pairing system for current round
      const advancedSettings = tournamentInfo.advanced_pairing_modes?.[currentRound];
      const pairingSystem = advancedSettings?.system || tournamentInfo.pairing_system;

      // Flag to track if round robin was handled
      let roundRobinHandled = false;

      for (const division of divisions) {
        const divisionPlayers = players.filter(p =>
          (p.division === division.name || (divisions.length === 1 && division.name === 'Open')) &&
          !p.withdrawn &&
          p.status !== 'paused'
        );

        let divisionPairings;

        if (pairingSystem === 'enhanced_swiss') {
          // Enhanced Swiss logic (previously Lito)
          let playersToPair = [...divisionPlayers];
          const baseRound = advancedSettings?.base_round ?? currentRound - 1;

          // Calculate standings based on the specified base round
          if (baseRound >= 0) {
            const historicalResults = allResultsSoFar.filter(r => r.round <= baseRound);
            const statsMap = new Map();

            // Initialize stats for all players
            playersToPair.forEach(p => {
              statsMap.set(p.player_id, {
                ...p,
                wins: 0,
                losses: 0,
                ties: 0,
                spread: 0,
                rank: 0
              });
            });

            // Calculate stats from historical results
            for (const res of historicalResults) {
              const p1Stats = statsMap.get(res.player1_id);
              const p2Stats = statsMap.get(res.player2_id);
              if (!p1Stats || !p2Stats) continue;

              if (res.score1 > res.score2) {
                p1Stats.wins++;
                p2Stats.losses++;
              } else if (res.score2 > res.score1) {
                p2Stats.wins++;
                p1Stats.losses++;
              } else {
                p1Stats.ties++;
                p2Stats.ties++;
              }

              p1Stats.spread += (res.score1 - res.score2);
              p2Stats.spread += (res.score2 - res.score1);
            }

            // Sort players by standings
            const sortedPlayers = Array.from(statsMap.values()).sort((a, b) => {
              const aScore = (a.wins || 0) + (a.ties || 0) * 0.5;
              const bScore = (b.wins || 0) + (b.ties || 0) * 0.5;
              if (aScore !== bScore) return bScore - aScore;
              return (b.spread || 0) - (a.spread || 0);
            });

            // Assign ranks
            sortedPlayers.forEach((player, index) => {
              player.rank = index + 1;
            });

            playersToPair = sortedPlayers;
          }

          let previousMatchups = new Set();
          const allowRematches = advancedSettings?.allow_rematches ?? false;
          if (!allowRematches) {
            allResultsSoFar.forEach(res => {
              previousMatchups.add(`${res.player1_id}-${res.player2_id}`);
              previousMatchups.add(`${res.player2_id}-${res.player1_id}`);
            });
          }

          // Pass Gibson rule setting to the pairing function
          const isGibsonEnabled = tournamentInfo.gibson_rule_enabled || false;
          const prizeCount = tournamentInfo.prizes?.length || 3;
          divisionPairings = generateEnhancedSwissPairings(
            playersToPair,
            previousMatchups,
            allResultsSoFar,
            currentRound,
            tournamentInfo.rounds,
            isGibsonEnabled,
            prizeCount
          );
        } else if (pairingSystem === 'king_of_the_hill') {
          // King of the Hill logic
          let playersToPair = [...divisionPlayers];
          const baseRound = advancedSettings?.base_round ?? currentRound - 1;

          // Calculate standings based on the specified base round
          if (baseRound >= 0) {
            const historicalResults = allResultsSoFar.filter(r => r.round <= baseRound);
            const statsMap = new Map();

            // Initialize stats for all players
            playersToPair.forEach(p => {
              statsMap.set(p.player_id, {
                ...p,
                wins: 0,
                losses: 0,
                ties: 0,
                spread: 0,
                rank: 0
              });
            });

            // Calculate stats from historical results
            for (const res of historicalResults) {
              const p1Stats = statsMap.get(res.player1_id);
              const p2Stats = statsMap.get(res.player2_id);
              if (!p1Stats || !p2Stats) continue;

              if (res.score1 > res.score2) {
                p1Stats.wins++;
                p2Stats.losses++;
              } else if (res.score2 > res.score1) {
                p2Stats.wins++;
                p1Stats.losses++;
              } else {
                p1Stats.ties++;
                p2Stats.ties++;
              }

              p1Stats.spread += (res.score1 - res.score2);
              p2Stats.spread += (res.score2 - res.score1);
            }

            // Sort players by standings
            const sortedPlayers = Array.from(statsMap.values()).sort((a, b) => {
              const aScore = (a.wins || 0) + (a.ties || 0) * 0.5;
              const bScore = (b.wins || 0) + (b.ties || 0) * 0.5;
              if (aScore !== bScore) return bScore - aScore;
              return (b.spread || 0) - (a.spread || 0);
            });

            // Assign ranks
            sortedPlayers.forEach((player, index) => {
              player.rank = index + 1;
            });

            playersToPair = sortedPlayers;
          }

          let previousMatchups = new Set();
          const allowRematches = advancedSettings?.allow_rematches ?? false;
          if (!allowRematches) {
            allResultsSoFar.forEach(res => {
              previousMatchups.add(`${res.player1_id}-${res.player2_id}`);
              previousMatchups.add(`${res.player2_id}-${res.player1_id}`);
            });
          }

          divisionPairings = generateKingOfTheHillPairings(playersToPair, previousMatchups, allResultsSoFar, currentRound);
        } else if (pairingSystem === 'team_swiss') {
          // Team Swiss logic
          const teams = Array.from(new Set(divisionPlayers.map(p => p.team_id))).map(teamId => {
            const teamPlayers = divisionPlayers.filter(p => p.team_id === teamId);
            const teamName = teamPlayers[0]?.team_name || `Team ${teamId}`;
            return {
              id: teamId,
              name: teamName,
              players: teamPlayers,
              teamWins: 0,
              teamTies: 0,
              rank: 0
            };
          });

          // Calculate team standings
          allResultsSoFar.forEach(res => {
            const team1 = teams.find(t => t.players.some(p => p.player_id === res.player1_id));
            const team2 = teams.find(t => t.players.some(p => p.player_id === res.player2_id));
            if (team1 && team2 && team1.id !== team2.id) {
              if (res.score1 > res.score2) {
                team1.teamWins++;
              } else if (res.score2 > res.score1) {
                team2.teamWins++;
              } else {
                team1.teamTies++;
                team2.teamTies++;
              }
            }
          });

          teams.sort((a, b) => (b.teamWins + b.teamTies * 0.5) - (a.teamWins + a.teamTies * 0.5));
          teams.forEach((team, index) => { team.rank = index + 1; });

          const previousTeamMatchups = new Set();
          allResultsSoFar.forEach(res => {
            const team1 = teams.find(t => t.players.some(p => p.player_id === res.player1_id));
            const team2 = teams.find(t => t.players.some(p => p.player_id === res.player2_id));
            if (team1 && team2) {
              previousTeamMatchups.add(`${team1.id}-${team2.id}`);
              previousTeamMatchups.add(`${team2.id}-${team1.id}`);
            }
          });

          const teamPairings = generateTeamSwissPairings(teams, previousTeamMatchups, allResultsSoFar);

          divisionPairings = [];
          for (const teamPairing of teamPairings) {
            if (teamPairing.team2.name === 'BYE') {
              const team1Players = players.filter(p => p.team_id === teamPairing.team1.id);
              team1Players.forEach(player => {
                divisionPairings.push({
                  table: 'BYE',
                  player1: { name: player.name },
                  player2: { name: 'BYE' }
                });
              });
            } else {
              const team1Players = players.filter(p => p.team_id === teamPairing.team1.id);
              const team2Players = players.filter(p => p.team_id === teamPairing.team2.id);

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
        } else if (pairingSystem === 'round_robin') {
          // Round Robin pairing logic - Generate complete schedule if first round
          if (currentRound === 1) {
            // Generate complete round robin schedule for all rounds
            let playersToPair = [...divisionPlayers];
            const hasOddPlayers = playersToPair.length % 2 !== 0;

            // If odd number, add bye handling
            if (hasOddPlayers) {
              playersToPair = playersToPair.slice(0, -1); // Remove last player for pairing, handle bye separately
            }

            const playerCount = playersToPair.length;
            const completeSchedule = {};

            if (playerCount >= 2 && playerCount <= 10) {
              // Generate proper round robin schedule algorithmically
              const generateRoundRobinSchedule = (numPlayers) => {
                const schedule = [];
                const players = Array.from({ length: numPlayers }, (_, i) => i);

                // For odd number of players, add a "bye" player
                if (numPlayers % 2 !== 0) {
                  players.push(-1); // -1 represents bye
                }

                const n = players.length;
                const rounds = n - 1;
                const halfSize = n / 2;

                for (let round = 0; round < rounds; round++) {
                  const roundPairings = [];

                  for (let i = 0; i < halfSize; i++) {
                    const player1 = players[i];
                    const player2 = players[n - 1 - i];

                    // Skip if either player is bye
                    if (player1 !== -1 && player2 !== -1) {
                      roundPairings.push([player1, player2]);
                    }
                  }

                  schedule.push(roundPairings);

                  // Rotate players (keep first player fixed, rotate others)
                  players.splice(1, 0, players.pop());
                }

                return schedule;
              };

              const schedule = generateRoundRobinSchedule(playerCount);
              if (schedule) {
                // Generate pairings for all rounds
                schedule.forEach((roundPairings, roundIndex) => {
                  const roundNumber = roundIndex + 1;
                  const roundPairingsList = [];
                  let table = 1;

                  // Handle bye player for odd number tournaments
                  if (hasOddPlayers) {
                    const totalPlayers = divisionPlayers.length;
                    const byePlayerIndex = (roundIndex) % totalPlayers; // Rotate bye
                    const byePlayer = divisionPlayers[byePlayerIndex];

                    roundPairingsList.push({
                      table: 'BYE',
                      player1: {
                        player_id: byePlayer.player_id,
                        name: byePlayer.name,
                        rating: byePlayer.rating,
                        division: byePlayer.division
                      },
                      player2: { name: 'BYE' }
                    });
                  }

                  // Create all pairings for this round
                  roundPairings.forEach(([index1, index2]) => {
                    const player1 = playersToPair[index1];
                    const player2 = playersToPair[index2];

                    if (player1 && player2) {
                      roundPairingsList.push({
                        table: table++,
                        player1: {
                          player_id: player1.player_id,
                          name: player1.name,
                          rating: player1.rating,
                          division: player1.division
                        },
                        player2: {
                          player_id: player2.player_id,
                          name: player2.name,
                          rating: player2.rating,
                          division: player2.division
                        }
                      });
                    }
                  });

                  completeSchedule[roundNumber] = assignStarts(roundPairingsList, players, allResultsSoFar);
                });

                // Store complete schedule to be updated later
                const completeRoundRobinSchedule = completeSchedule;

                // Update tournament with complete schedule immediately
                const { error: updateError } = await supabase
                  .from('tournaments')
                  .update({
                    pairing_schedule: completeSchedule
                  })
                  .eq('id', tournamentInfo.id);

                if (updateError) {
                  throw new Error(`Failed to update tournament with complete schedule: ${updateError.message}`);
                }

                // Return only round 1 pairings for immediate display
                divisionPairings = completeSchedule[1] || [];

                // Set the current pairings state to show Round 1
                setCurrentPairings(divisionPairings);
                setIsPaired(true);

                // Mark round robin as handled and break out of division loop
                roundRobinHandled = true;

                toast.success(`Complete Round Robin schedule generated for ${Object.keys(completeSchedule).length} rounds!`);

                // Exit early since we've handled the complete schedule
                break;
              }
            }
          }

          // For round robin, get pairings from the complete schedule
          if (tournamentInfo.pairing_schedule && tournamentInfo.pairing_schedule[currentRound]) {
            divisionPairings = tournamentInfo.pairing_schedule[currentRound].filter(p =>
              !division.name || division.name === 'Open' || p.player1?.division === division.name
            );
          } else {
            // Fallback for unsupported player counts or other cases
            divisionPairings = [];
          }
        } else if (pairingSystem === 'random') {
          // Random pairing logic
          let playersToPair = [...divisionPlayers];
          const newPairings = [];
          let table = 1;

          // Handle odd number of players with bye
          if (playersToPair.length % 2 !== 0) {
            const byePlayer = playersToPair[Math.floor(Math.random() * playersToPair.length)];
            newPairings.push({
              table: 'BYE',
              player1: {
                player_id: byePlayer.player_id,
                name: byePlayer.name,
                rating: byePlayer.rating,
                division: byePlayer.division
              },
              player2: { name: 'BYE' }
            });
            playersToPair = playersToPair.filter(p => p.player_id !== byePlayer.player_id);
          }

          // Randomly shuffle and pair
          while (playersToPair.length >= 2) {
            const randomIndex1 = Math.floor(Math.random() * playersToPair.length);
            const player1 = playersToPair.splice(randomIndex1, 1)[0];
            const randomIndex2 = Math.floor(Math.random() * playersToPair.length);
            const player2 = playersToPair.splice(randomIndex2, 1)[0];

            newPairings.push({
              table: table++,
              player1: {
                player_id: player1.player_id,
                name: player1.name,
                rating: player1.rating,
                division: player1.division
              },
              player2: {
                player_id: player2.player_id,
                name: player2.name,
                rating: player2.rating,
                division: player2.division
              }
            });
          }

          divisionPairings = assignStarts(newPairings, players, allResultsSoFar);
        } else { // Fallback to Swiss
          let playersToPair = [...divisionPlayers];
          const baseRound = advancedSettings?.base_round ?? currentRound - 1;

          // Calculate standings based on the specified base round
          if (baseRound >= 0) {
            const historicalResults = allResultsSoFar.filter(r => r.round <= baseRound);
            const statsMap = new Map();

            // Initialize stats for all players
            playersToPair.forEach(p => {
              statsMap.set(p.player_id, {
                ...p,
                wins: 0,
                losses: 0,
                ties: 0,
                spread: 0,
                rank: 0
              });
            });

            // Calculate stats from historical results
            for (const res of historicalResults) {
              const p1Stats = statsMap.get(res.player1_id);
              const p2Stats = statsMap.get(res.player2_id);
              if (!p1Stats || !p2Stats) continue;

              if (res.score1 > res.score2) {
                p1Stats.wins++;
                p2Stats.losses++;
              } else if (res.score2 > res.score1) {
                p2Stats.wins++;
                p1Stats.losses++;
              } else {
                p1Stats.ties++;
                p2Stats.ties++;
              }

              p1Stats.spread += (res.score1 - res.score2);
              p2Stats.spread += (res.score2 - res.score1);
            }

            // Sort players by standings
            const sortedPlayers = Array.from(statsMap.values()).sort((a, b) => {
              const aScore = (a.wins || 0) + (a.ties || 0) * 0.5;
              const bScore = (b.wins || 0) + (b.ties || 0) * 0.5;
              if (aScore !== bScore) return bScore - aScore;
              return (b.spread || 0) - (a.spread || 0);
            });

            // Assign ranks
            sortedPlayers.forEach((player, index) => {
              player.rank = index + 1;
            });

            playersToPair = sortedPlayers;
          }

          let previousMatchups = new Set();
          const allowRematches = advancedSettings?.allow_rematches ?? false;
          if (!allowRematches) {
            allResultsSoFar.forEach(res => {
              previousMatchups.add(`${res.player1_id}-${res.player2_id}`);
              previousMatchups.add(`${res.player2_id}-${res.player1_id}`);
            });
          }

          divisionPairings = generateSwissPairings(playersToPair, previousMatchups, allResultsSoFar);
        }

        // Assign table numbers
        divisionPairings.forEach(pairing => {
          if (pairing.table !== 'BYE') {
            pairing.table = tableNumber++;
          }
        });

        fullRoundPairings.push(...divisionPairings);
      }

      // If round robin was handled, exit early
      if (roundRobinHandled) {
        setIsLoading(false);
        return;
      }

      // Update tournament with new pairings
      // For round robin, preserve the complete schedule; for others, update current round
      if (pairingSystem === 'round_robin' && currentRound === 1) {
        // Round robin already has complete schedule, just update current round
        schedule[currentRound] = fullRoundPairings;
      } else {
        // Regular pairing system, update current round
        schedule[currentRound] = fullRoundPairings;
      }

      // For round robin, don't increment current round since we want to show round 1 pairings
      const shouldIncrementRound = pairingSystem !== 'round_robin' || currentRound > 1;

      // Ensure the pairing schedule is properly formatted
      const formattedSchedule = {};
      Object.keys(schedule).forEach(roundNum => {
        const roundPairings = schedule[roundNum];
        formattedSchedule[roundNum] = roundPairings.map(pairing => ({
          ...pairing,
          // Ensure player objects have the correct structure
          player1: pairing.player1 ? {
            player_id: pairing.player1.player_id || pairing.player1.id,
            name: pairing.player1.name,
            rating: pairing.player1.rating,
            division: pairing.player1.division
          } : pairing.player1,
          player2: pairing.player2 ? {
            player_id: pairing.player2.player_id || pairing.player2.id || (pairing.player2.name === 'BYE' ? null : pairing.player2.player_id),
            name: pairing.player2.name,
            rating: pairing.player2.rating,
            division: pairing.player2.division
          } : pairing.player2
        }));
      });

      const { data: updatedTournament, error: updateError } = await supabase
        .from('tournaments')
        .update({
          pairing_schedule: formattedSchedule,
          current_round: shouldIncrementRound ? currentRound + 1 : currentRound
        })
        .eq('id', tournamentInfo.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update tournament: ${updateError.message}`);
      }

      onRoundPaired(updatedTournament);

      // Handle Auto-Losses for Paused Players
      // Logic:
      // 1. If player was scheduled (Round Robin), forfeited match goes to opponent.
      // 2. If player was NOT scheduled (Swiss/skipped), they get a generic loss against 'Absent'.
      const pausedPlayers = players.filter(p => p.status === 'paused');

      if (pausedPlayers.length > 0) {
        const penaltyResults = [];

        for (const p of pausedPlayers) {
          // Check if this player ended up in the generated pairings (e.g. Round Robin schedule)
          const existingPairing = fullRoundPairings.find(pair =>
            pair.player1?.player_id === p.player_id ||
            pair.player2?.player_id === p.player_id
          );

          if (existingPairing) {
            // ROUND ROBIN / SCHEDULED SCENARIO
            // The player is in the schedule. We must award the win to their opponent.
            const isPlayer1 = existingPairing.player1?.player_id === p.player_id;
            const opponent = isPlayer1 ? existingPairing.player2 : existingPairing.player1;

            // If opponent is also BYE or null, just log generic loss
            if (!opponent || opponent.name === 'BYE') {
              penaltyResults.push({
                tournament_id: tournamentInfo.id,
                round: currentRound,
                player1_id: p.player_id,
                player2_id: null,
                player1_name: p.name,
                player2_name: 'BYE',
                score1: 0,
                score2: 0,
                is_forfeit: true
              });
            } else {
              // Award win to opponent
              penaltyResults.push({
                tournament_id: tournamentInfo.id,
                round: currentRound,
                player1_id: isPlayer1 ? p.player_id : opponent.player_id, // maintain pairing order if possible, or normalize
                player2_id: isPlayer1 ? opponent.player_id : p.player_id,
                player1_name: isPlayer1 ? p.name : opponent.name,
                player2_name: isPlayer1 ? opponent.name : p.name,
                score1: isPlayer1 ? 0 : 50, // Player gets 0, Opponent gets 50
                score2: isPlayer1 ? 50 : 0,
                is_forfeit: true,
                forfeit_player: isPlayer1 ? 'player1' : 'player2'
              });
            }

          } else {
            // SWISS / UNSCHEDULED SCENARIO
            // Player was excluded from pairings. Just add a penalty record.
            penaltyResults.push({
              tournament_id: tournamentInfo.id,
              round: currentRound,
              player1_id: p.player_id,
              player2_id: null,
              player1_name: p.name,
              player2_name: 'Absent',
              score1: 0,
              score2: 50, // Default penalty spread
              is_forfeit: true
            });
          }
        }

        if (penaltyResults.length > 0) {
          const { error: penaltyError } = await supabase.from('results').insert(penaltyResults);
          if (penaltyError) {
            console.error("Failed to insert penalty results:", penaltyError);
            toast.error("Failed to generate penalties for paused players.");
          } else {
            toast.info(`Generated ${penaltyResults.length} forfeit/penalty results.`);
          }
        }
      }

      toast.success(`Round ${currentRound} pairings generated successfully!`);
    } catch (error) {
      console.error('Error generating pairings:', error);
      toast.error(`Failed to generate pairings: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAllLeagueMatches = async () => {
    setIsLoading(true);
    toast.info("Generating all league matches...");

    console.log('🔍 DEBUG: Generating league matches for:', {
      playerCount: players.length,
      tournamentType: tournamentInfo?.type,
      availableSchedules: Object.keys(roundRobinSchedules),
      players: players.map(p => ({ id: p.player_id, name: p.name, seed: p.seed }))
    });

    const playersBySeed = [...players].sort((a, b) => a.seed - b.seed);
    const scheduleTemplate = roundRobinSchedules[players.length];

    console.log('🔍 DEBUG: Schedule template:', {
      playerCount: players.length,
      scheduleTemplate,
      playersBySeed: playersBySeed.map(p => ({ id: p.player_id, name: p.name, seed: p.seed }))
    });

    if (!scheduleTemplate) {
      toast.error(`Round Robin is not supported for ${players.length} players. Please use 3-15 players.`);
      setIsLoading(false);
      return;
    }

    const allMatches = [];
    console.log('🔍 DEBUG: Starting match generation loop');

    for (let round = 1; round <= scheduleTemplate.length; round++) {
      const roundSchedule = scheduleTemplate[round - 1];
      const pairedPlayers = new Set();

      console.log(`🔍 DEBUG: Round ${round}:`, {
        roundSchedule,
        roundScheduleLength: roundSchedule.length,
        playerCount: players.length
      });

      // For odd numbers, the last player gets a bye
      if (players.length % 2 !== 0 && roundSchedule.length < players.length - 1) {
        const byePlayer = playersBySeed[playersBySeed.length - 1];
        console.log(`🔍 DEBUG: Adding bye for player:`, byePlayer);
        allMatches.push({
          tournament_id: tournamentInfo.id,
          round: round,
          player1_id: byePlayer.player_id,
          player2_id: null, // BYE
          status: 'complete'
        });
      }

      // Process regular pairings
      for (let i = 0; i < roundSchedule.length; i += 2) {
        if (i + 1 < roundSchedule.length) {
          const player1Seed = roundSchedule[i];
          const player2Seed = roundSchedule[i + 1];

          const player1 = playersBySeed.find(p => p.seed === player1Seed);
          const player2 = playersBySeed.find(p => p.seed === player2Seed);

          console.log(`🔍 DEBUG: Pairing ${i}:`, {
            player1Seed,
            player2Seed,
            player1: player1 ? { id: player1.player_id, name: player1.name, seed: player1.seed } : null,
            player2: player2 ? { id: player2.player_id, name: player2.name, seed: player2.seed } : null
          });

          if (player1 && player2 && !pairedPlayers.has(player1.player_id) && !pairedPlayers.has(player2.player_id)) {
            allMatches.push({
              tournament_id: tournamentInfo.id,
              round: round,
              player1_id: player1.player_id,
              player2_id: player2.player_id,
              status: 'pending'
            });
            pairedPlayers.add(player1.player_id);
            pairedPlayers.add(player2.player_id);
            console.log(`🔍 DEBUG: Added match: ${player1.name} vs ${player2.name} on round ${round}`);
          }
        }
      }
    }

    console.log('🔍 DEBUG: Generated matches:', {
      totalMatches: allMatches.length,
      matches: allMatches.map(m => ({
        round: m.round,
        player1: m.player1_id,
        player2: m.player2_id,
        table: m.table,
        status: m.status
      }))
    });

    // Insert all matches
    console.log('🔍 DEBUG: Attempting to insert matches into database:', {
      tournamentId: tournamentInfo.id,
      matchCount: allMatches.length,
      firstMatch: allMatches[0]
    });

    const { error: insertError } = await supabase
      .from('matches')
      .insert(allMatches);

    if (insertError) {
      console.error('❌ Error inserting matches:', insertError);
      console.error('❌ Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      toast.error('Failed to generate league matches.');
    } else {
      console.log('✅ Successfully inserted matches into database');
      toast.success(`Generated ${allMatches.length} league matches successfully!`);
      // Note: Parent component should refresh matches data if needed
      console.log('✅ Generated matches:', allMatches.length, 'matches for tournament');
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

  // Function to auto-pair remaining players using tournament pairing logic
  const handleAutoPairRemaining = async (availablePlayers, existingPairings) => {
    try {
      // Ensure existingPairings is an array
      const safeExistingPairings = existingPairings || [];

      // Get previous matchups to avoid rematches
      const previousMatchups = new Set();
      if (recentResults && Array.isArray(recentResults)) {
        recentResults.forEach(result => {
          if (result.player1_name && result.player2_name && result.player2_name !== 'BYE') {
            const player1 = players.find(p => p.name === result.player1_name);
            const player2 = players.find(p => p.name === result.player2_name);
            if (player1 && player2) {
              previousMatchups.add(`${player1.player_id}-${player2.player_id}`);
              previousMatchups.add(`${player2.player_id}-${player1.player_id}`);
            }
          }
        });
      }

      // Filter out players who are already paired in existingPairings
      const alreadyPairedPlayerIds = new Set();
      safeExistingPairings.forEach(pairing => {
        if (pairing.player1?.player_id) {
          alreadyPairedPlayerIds.add(pairing.player1.player_id);
        }
        if (pairing.player2?.player_id && pairing.player2.name !== 'BYE') {
          alreadyPairedPlayerIds.add(pairing.player2.player_id);
        }
      });

      // Only pair players who are truly available (not already paired)
      const trulyAvailablePlayers = availablePlayers.filter(p => !alreadyPairedPlayerIds.has(p.player_id));

      if (trulyAvailablePlayers.length < 2) {
        return []; // No players to auto-pair
      }

      // Use the existing Swiss pairing logic for remaining players
      const autoPairings = generateSwissPairings(trulyAvailablePlayers, previousMatchups, recentResults || []);

      // Process the auto-generated pairings to match the expected format
      // Ensure each pairing has complete player data with player_id
      const processedAutoPairings = autoPairings.map((pairing, index) => {
        // Ensure both players have complete data
        const player1 = players.find(p => p.player_id === pairing.player1?.player_id) || pairing.player1;
        const player2 = players.find(p => p.player_id === pairing.player2?.player_id) || pairing.player2;

        return {
          ...pairing,
          id: `auto-${Date.now()}-${index}`,
          player1: player1,
          player2: player2,
          division: player1?.division || 'Open',
          table: pairing.table || (index + 1)
        };
      });

      // Validate that all auto-generated pairings are complete
      const validAutoPairings = processedAutoPairings.filter(pairing => {
        const isValid = pairing.player1?.player_id &&
          (pairing.player2?.player_id || pairing.player2?.name === 'BYE');

        if (!isValid) {
          console.warn('Filtering out invalid auto-pairing:', pairing);
        }

        return isValid;
      });

      console.log('Auto-pairing results:', {
        input: { availablePlayers: trulyAvailablePlayers.length, existingPairings: safeExistingPairings.length },
        generated: autoPairings.length,
        processed: processedAutoPairings.length,
        valid: validAutoPairings.length
      });

      return validAutoPairings;
    } catch (error) {
      console.error('Auto-pairing error:', error);
      throw error;
    }
  };

  const isLeagueGenerated = useMemo(() => {
    return tournamentInfo?.type === 'best_of_league' && matches.length > 0;
  }, [tournamentInfo, matches]);

  const getGameWins = (match, playerId) => {
    let wins = 0;
    if (recentResults && Array.isArray(recentResults)) {
      recentResults.filter(r => r.match_id === match.id).forEach(r => {
        // Handle both string and number comparisons for player IDs
        const player1Id = typeof r.player1_id === 'string' ? parseInt(r.player1_id) : r.player1_id;
        const player2Id = typeof r.player2_id === 'string' ? parseInt(r.player2_id) : r.player2_id;
        const targetPlayerId = typeof playerId === 'string' ? parseInt(playerId) : playerId;

        if (r.score1 > r.score2 && player1Id === targetPlayerId) wins++;
        else if (r.score2 > r.score1 && player2Id === targetPlayerId) wins++;
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
    // Also check if match was explicitly marked as complete
    return match.status === 'complete' || p1Wins >= winsNeeded || p2Wins >= winsNeeded;
  };

  const handleEnterScore = (match) => {
    onEnterScore(match);
  };


  // --- Render Logic ---

  return (
    <div className="space-y-6">
      {/* Tournament Status & Controls - Hidden for best-of-league with generated schedule */}
      {!(tournamentInfo?.type === 'best_of_league' && matches.length > 0) && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground">
                Round {tournamentInfo?.currentRound || 1} Control
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {isPaired ? `${currentPairings.length} pairings generated` : 'No pairings for current round'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {!isPaired && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handlePairCurrentRound}
                    loading={isLoading}
                    variant="primary"
                    className="touch-target shadow-sm"
                    size="lg"
                  >
                    <Icon name="Swords" className="mr-2" />
                    Auto Pair Round
                  </Button>
                  {tournamentInfo?.type !== 'best_of_league' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowManualPairing(true)}
                      className="touch-target"
                      size="lg"
                    >
                      <Icon name="Hand" className="mr-2" />
                      Manual Pair
                    </Button>
                  )}
                  {tournamentInfo?.type === 'best_of_league' && (
                    <Button
                      variant="outline"
                      onClick={handleGenerateAllLeagueMatches}
                      loading={isLoading}
                      className="touch-target"
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
                    className="touch-target"
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
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-6 gap-4">
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Round {viewRound} Pairings
            </h3>

            {/* Round Selector for Schedule */}
            {tournamentInfo?.pairing_schedule && Object.keys(tournamentInfo.pairing_schedule).length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 noscrollbar">
                {Object.keys(tournamentInfo.pairing_schedule).sort((a, b) => parseInt(a) - parseInt(b)).map((round) => (
                  <Button
                    key={round}
                    variant={parseInt(round) === viewRound ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setViewRound(parseInt(round))}
                    className={cn("whitespace-nowrap transition-all", parseInt(round) === viewRound ? "shadow-sm" : "opacity-70 hover:opacity-100")}
                  >
                    Round {round}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {currentPairings.map((pairing, index) => (
              <motion.div
                key={index}
                className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 touch-target"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono text-muted-foreground">Table {pairing.table}</span>
                  {pairing.player1.starts && (
                    <span className="text-xs bg-secondary text-foreground border border-border px-2 py-1 rounded-full whitespace-nowrap">
                      {pairing.player1.name} starts
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col p-3 bg-secondary/30 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm sm:text-base break-words">
                        {pairing.player1.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
                  </div>

                  <div className="text-center text-muted-foreground">
                    <Icon name="Minus" size={16} />
                  </div>

                  <div className="flex flex-col p-3 bg-secondary/30 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm sm:text-base break-words">
                        {pairing.player2.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}





      {/* Best of League Matches */}
      {
        tournamentInfo?.type === 'best_of_league' && matches.length > 0 && (
          <div className="bg-card/90 backdrop-blur-sm border border-border/10 rounded-xl p-4 sm:p-6 lg:p-8">
            <h3 className="text-lg lg:text-xl font-heading font-semibold text-foreground mb-4 sm:mb-6">
              Best of League Matches
            </h3>

            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
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
                    className="bg-muted/10 rounded-xl p-4 sm:p-5 lg:p-6 border border-border/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: roundIndex * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
                      <h4 className="text-lg lg:text-xl font-semibold text-foreground">
                        Round {roundNum}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {matchesByRound[roundNum].length} matches
                      </span>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {matchesByRound[roundNum].map((match, matchIndex) => {
                        const p1Wins = getGameWins(match, match.player1_id);
                        const p2Wins = getGameWins(match, match.player2_id);
                        const player1 = players.find(p => p.player_id === match.player1_id);
                        const player2 = players.find(p => p.player_id === match.player2_id);

                        if (!player1 || !player2) return null;

                        return (
                          <div
                            key={match.id}
                            className="flex items-center justify-between p-3 sm:p-4 bg-background/50 rounded-lg border border-border/10 touch-target"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <span className="text-xs sm:text-sm font-mono text-muted-foreground flex-shrink-0">
                                Match {matchIndex + 1}
                              </span>
                              <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                <span className="font-medium text-foreground truncate text-sm sm:text-base">
                                  {player1.name}
                                </span>
                                <span className="font-mono font-bold text-primary text-sm sm:text-base">
                                  {p1Wins}
                                </span>
                                <span className="text-muted-foreground text-xs sm:text-sm">vs</span>
                                <span className="font-mono font-bold text-primary text-sm sm:text-base">
                                  {p2Wins}
                                </span>
                                <span className="font-medium text-foreground truncate text-sm sm:text-base">
                                  {player2.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
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
        )
      }

      {/* Manual Pairing Modal */}
      <ManualPairingModal
        isOpen={showManualPairing}
        onClose={() => setShowManualPairing(false)}
        players={players}
        currentRound={tournamentInfo?.currentRound || 1}
        onSavePairings={handleSaveManualPairings}
        existingPairings={currentPairings}
        tournamentInfo={tournamentInfo}
        onAutoPairRemaining={handleAutoPairRemaining}
      />
    </div >
  );
};

export default TournamentControl;