
import { assignStarts, generateSwissPairings, generateRoundRobinSchedule, generateKingOfTheHillPairings } from './pairingLogic.js';

// --- Mock Data ---
const players = [
    { player_id: '1', name: 'Alice', seed: 1, rating: 1200, starts: 0, wins: 0, division: 'A' },
    { player_id: '2', name: 'Bob', seed: 2, rating: 1100, starts: 1, wins: 0, division: 'A' },
    { player_id: '3', name: 'Charlie', seed: 3, rating: 1000, starts: 0, wins: 0, division: 'C' }, // Diff Division for Offset Test
    { player_id: '4', name: 'David', seed: 4, rating: 900, starts: 0, wins: 0, division: 'A' }
];

const unratedPlayers = [
    { player_id: '1', name: 'Alice', rating: 1200, rank: 1 },
    { player_id: '2', name: 'Bob', rating: 0, rank: 2 },
    { player_id: '3', name: 'Charlie', rating: 0, rank: 3 }
];

const results = []; // Empty for now

// --- Assertion Helper ---
const assert = (desc, condition) => {
    if (condition) {
        console.log(`✅ PASS: ${desc}`);
    } else {
        console.error(`❌ FAIL: ${desc}`);
        process.exitCode = 1;
    }
};

console.log('--- Running Unit Tests for Pairing Logic ---\n');

// --- Test 1: Assign Starts ---
console.log('Testing assignStarts...');

// Scenario 1: Bob has 1 start, Alice has 0. Alice should start.
const pair1 = [{ player1: { ...players[0] }, player2: { ...players[1] } }];
const res1 = assignStarts(pair1, players, []);
assert('Alice (0 starts) vs Bob (1 start) -> Alice starts', res1[0].player1.starts === true);

// Scenario 2: Tie in starts (both 0), No history. Higher Seed (Alice #1) vs Charlie (#3). Alice is lower seed number -> Alice starts
const pair2 = [{ player1: { ...players[0] }, player2: { ...players[2] } }];
const res2 = assignStarts(pair2, players, []);
assert('Tie starts: Seed 1 vs Seed 3 -> Seed 1 starts', res2[0].player1.starts === true);

// Scenario 3: Head-to-Head starts
const playersWithStarts = [
    { ...players[0], starts: 1 },
    { ...players[1], starts: 1 }
];
const h2hResults = [
    { player1_id: '1', player2_id: '2', player1_starts: true, player2_starts: false } // Alice started
];
const pair3 = [{ player1: { ...playersWithStarts[0] }, player2: { ...playersWithStarts[1] } }];
const res3 = assignStarts(pair3, playersWithStarts, h2hResults);
assert('H2H Balance: Alice started before -> Bob starts now', res3[0].player2.starts === true);


// --- Test 2: Swiss Pairing with Max Consecutive ---
console.log('\nTesting generateSwissPairings (Max Consecutive)...');
const prevMatchups = new Set(['1-2', '2-1']);
const p1p2 = [players[0], players[1]];
// MaxConsecutive 0 -> Should Fail or look for other (Empty result implies failed to pair within group if strictly limited, but logic usually forces if no choice)
// In logic, if forced, it might pair. But let's see if it avoids it when choice exists.
const fourPlayers = [...players];
const swRes2 = generateSwissPairings(fourPlayers, prevMatchups, [], 2, 0); // Round 2
const p1Opponent = swRes2.find(p => p.player1.player_id === '1' || p.player2.player_id === '1');
const oppId = p1Opponent.player1.player_id === '1' ? p1Opponent.player2.player_id : p1Opponent.player1.player_id;
assert('Standard Swiss avoids rematch (1 vs 2) when others avail', oppId !== '2');

// Allow Consecutive
const twoPlayers = [players[0], players[1]];
const prevMatchups3 = new Set(['1-2', '2-1']);
const resultsForConsec = [{ round: 1, player1_id: '1', player2_id: '2', score1: 1, score2: 0 }];
const swRes3 = generateSwissPairings(twoPlayers, prevMatchups3, resultsForConsec, 2, 2);
assert('MaxConsecutive=2 allows rematch in Round 2', swRes3.length === 1 && (swRes3[0].player1.player_id === '1' || swRes3[0].player2.player_id === '1'));

// Block Consecutive
const swRes4 = generateSwissPairings(fourPlayers, prevMatchups3, resultsForConsec, 2, 1);
const p1Opp3 = swRes4.find(p => p.player1.player_id === '1' || p.player2.player_id === '1');
const oppId3 = p1Opp3.player1.player_id === '1' ? p1Opp3.player2.player_id : p1Opp3.player1.player_id;
assert('MaxConsecutive=1 blocking rematch 1 vs 2', oppId3 !== '2');


// --- Test 3: Reserved Tables ---
console.log('\nTesting Reserved Tables...');
const reserved = { '1': 10 }; // Alice on Table 10
const swResReserved = generateSwissPairings(players, new Set(), [], 1, 0, reserved);
const aliceTable = swResReserved.find(p => p.player1.player_id === '1' || p.player2.player_id === '1').table;
assert('Alice gets Reserved Table 10', aliceTable === 10);

const otherTable = swResReserved.find(p => p.player1.player_id !== '1' && p.player2.player_id !== '1').table;
assert('Other players do NOT get Table 10', otherTable !== 10);


// --- Test 4: Unrated Bye Logic (Round 1) ---
console.log('\nTesting Unrated Bye Logic...');
// 3 players: 1 Rated, 2 Unrated. Odd number -> 1 Bye.
// Logic: If Round 1, Unrated should NOT get Bye (unless necessary).
// So Rated player (Alice) needs to get the Bye if strictly enforcing "Unrated NO Bye".
// Wait, typically we want Unrated players to PLAY to get a rating.
// So giving Bye to Rated player is preferred in Round 1 if odd? Yes.
const byeRes = generateSwissPairings(unratedPlayers, new Set(), [], 1, 0);
const byePair = byeRes.find(p => p.player2.name === 'BYE');
assert('Round 1: Rated Player (Alice) takes Bye prefers over Unrated', byePair && byePair.player1.player_id === '1');

// Round 2: Standard Logic (Lowest Rank/Score gets Bye)
const byeRes2 = generateSwissPairings(unratedPlayers, new Set(), [], 2, 0);
const byePair2 = byeRes2.find(p => p.player2.name === 'BYE');
// Rank 3 (Charlie) is worst. Should get Bye.
assert('Round 2: Lowest Rank (Charlie) gets Bye', byePair2 && byePair2.player1.player_id === '3');


// --- Test 5: Round Robin Schedule & Offsets ---
console.log('\nTesting Round Robin & Offsets...');

const rr1 = generateRoundRobinSchedule(players, 1);
const rounds = Object.keys(rr1).length;
assert('RR (4 players) generates 3 rounds', rounds === 3);

// Test Offset
// Players have division 'A'. Hash of 'A' = 65. Rounds = 3. 65 % 3 = 2.
// Offset by 2 rounds?
// Round 1 pairings should look like Round 3 of non-offset schedule?
// Hard to verify exact pairing without generating reference.
// Let's just verify it runs without error and produces valid schedule.
assert('RR generates valid object', typeof rr1 === 'object');
const r1Pairs = rr1[1];
assert('RR Round 1 has 2 pairings', r1Pairs.length === 2);

console.log('\n--- Tests Complete ---');
