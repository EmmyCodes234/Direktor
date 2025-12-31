import React, { useState, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import { assignStarts, generateSwissPairings, generateEnhancedSwissPairings, generateKingOfTheHillPairings, generateTeamSwissPairings, generateRoundRobinSchedule } from '../../../utils/pairingLogic';
import { roundRobinSchedules } from '../../../utils/pairingSchedules';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { toast } from 'sonner';
import { calculateStandings } from '../../../hooks/dashboard/useStandingsCalculator';
import { supabase } from '../../../supabaseClient';


// Mock data helpers (replace with hooks later)
import { resolveCommand } from '../../../utils/commandAliaser';
import CerebrasService from '../../../services/cerebrasInsightService';

// --- String Helpers ---
const normalizeStrict = (str) => {
    if (!str) return '';
    // Lowercase, replace non-alphanumeric (including underscores/dashes) with space, trim, collapse spaces
    return str.toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

// Simple Jaro-Winkler implementation
const jaroWinkler = (s1, s2) => {
    let m = 0;

    // Exit early if either string is empty
    if (s1.length === 0 || s2.length === 0) return 0;

    // Match window size
    const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;

    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, s2.length);

        for (let j = start; j < end; j++) {
            if (s2Matches[j]) continue;
            if (s1[i] !== s2[j]) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }

    const m_dist = m = matches;
    const t = transpositions / 2;
    const jaro = ((m / s1.length) + (m / s2.length) + ((m - t) / m)) / 3;

    // Winkler scaling
    let p = 0.1; // scaling factor
    let l = 0; // length of common prefix
    while (s1[l] === s2[l] && l < 4) l++;

    return jaro + l * p * (1 - jaro);
};

const NAME_ALIASES = {
    'chris': 'christopher',
    'mike': 'michael',
    'lex': 'alexander',
    'ben': 'benjamin',
    'dan': 'daniel',
    'nathan': 'nathaniel',
    'josh': 'joshua',
    'matt': 'matthew',
    'tim': 'timothy',
    'tom': 'thomas',
    'dave': 'david',
    'will': 'william',
    'steve': 'steven',
    'jim': 'james',
    'rob': 'robert',
    'sam': 'samuel',
    'alex': 'alexander'
};

const FULL_NAME_ALIASES = {
    'ikpere silver': 'sylvanus ikpere'
};

const INITIAL_HISTORY = [
    { type: 'system', content: 'Direktor Tournament Console v1.0.0' },
    { type: 'system', content: 'Type "help" for available commands.' },
    { type: 'system', content: 'Type "scores <round>" to enter result entry mode.' },
];

const ResultsEntryCLI = ({ tournamentInfo, players, matches, results, teams, onResultSubmit, onUpdateTournament, onClose }) => {
    const [history, setHistory] = useState(INITIAL_HISTORY);
    const [input, setInput] = useState('');
    const [mode, setMode] = useState('COMMAND'); // 'COMMAND', 'SCORES', 'EDIT_SINGLE'
    const [activeRound, setActiveRound] = useState(null);
    const [editingMatchId, setEditingMatchId] = useState(null);
    const [roundMatches, setRoundMatches] = useState([]);
    const inputRef = useRef(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const confirmationResolver = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    // Focus input on click
    const focusInput = () => {
        inputRef.current?.focus();
    };

    const addToHistory = (content, type = 'info') => {
        setHistory(prev => [...prev, { content, type, timestamp: new Date() }]);
    };

    const getPlayerName = (id) => {
        if (!id) return 'BYE';
        const p = players.find(x => String(x.player_id) === String(id) || String(x.id) === String(id));
        if (!p) return `Unknown (${id})`;
        return p.name || `${p.first_name} ${p.last_name}`;
    };

    const getPlayerSeed = (id) => {
        if (!id) return '-';
        const p = players.find(x => String(x.player_id) === String(id) || String(x.id) === String(id));
        return p ? (p.seed || p.initial_seed || p.rank || '?') : '?';
    };

    const getLastGame = (playerId, currentRound) => {
        if (!results || results.length === 0) return '';

        // Find the most recent result for this player up to currentRound
        const myResults = results.filter(r =>
            (r.player1_id === playerId || r.player2_id === playerId) &&
            r.round <= currentRound
        ).sort((a, b) => b.round - a.round);

        if (myResults.length === 0) return '';

        const r = myResults[0];
        const isP1 = r.player1_id === playerId;
        const myScore = isP1 ? r.score1 : r.score2;
        const oppScore = isP1 ? r.score2 : r.score1;
        const oppId = isP1 ? r.player2_id : r.player1_id;
        const win = myScore > oppScore;

        // We need the rank of the opponent AT THAT TIME or current rank?
        // Let's use current rank for simplicity, or whatever we have.
        const opponent = players.find(p => String(p.player_id) === String(oppId));
        const oppRank = opponent?.rank || '?';
        const oppSeed = opponent?.seed || opponent?.initial_seed || '?';

        return `${oppRank}${win ? 'W' : (myScore === oppScore ? 'T' : 'L')}:${myScore}-${oppScore}:#${oppSeed}`;
    };

    // ... (existing helper functions)

    // --- TSH Photo Importer Logic (Expert Mode) ---
    const handlePixFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        addToHistory(`> pix import ${file.name}`, 'user');
        addToHistory(`[SCANNING] Reading photos.txt...`, 'system');

        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);

            let photosFile = contents.file("photos.txt") || contents.file("PHOTOS.TXT");
            if (!photosFile) {
                const foundPath = Object.keys(contents.files).find(path => path.toLowerCase().endsWith('photos.txt'));
                if (foundPath) photosFile = contents.file(foundPath);
            }

            if (!photosFile) {
                addToHistory(`[ERR] photos.txt not found in zip.`, 'error');
                return;
            }

            const textContent = await photosFile.async("string");
            const lines = textContent.split(/\r?\n/).filter(line => line.trim().length > 0);

            addToHistory(`[DEBUG] Found photos.txt with ${lines.length} lines.`, 'system');

            // 1. Index photos with Strict Normalization
            const photoMap = new Map();
            const photoNamesList = [];

            lines.forEach((line, idx) => {
                const parts = line.split('\t');

                // Debug first line to verify format
                if (idx === 0) {
                    addToHistory(`[DEBUG] Line 1 Raw: "${line}"`, 'system');
                    addToHistory(`[DEBUG] Line 1 Parts: [${parts.join(', ')}] (Len: ${parts.length})`, 'system');
                }

                if (parts.length >= 3) {
                    const [firstName, lastName, relativePath] = parts;
                    const fullName = `${firstName} ${lastName}`;
                    const normName = normalizeStrict(fullName);

                    photoMap.set(normName, relativePath);
                    photoNamesList.push({ name: normName, original: fullName, path: relativePath });
                }
            });

            if (photoMap.size === 0) {
                addToHistory(`[CRITICAL] No photos mapped! Check photos.txt format.`, 'error');
                addToHistory(`Expected: First<TAB>Last<TAB>Path`, 'info');
                return;
            }

            addToHistory(`[INDEX] mapped ${photoMap.size} photos.`, 'system');
            addToHistory(`[MATCHING] Checking ${players.length} players...`, 'system');
            addToHistory('----------------------------------------', 'info');

            let importedCount = 0;
            let missingPlayers = [];
            let errorCount = 0;

            // 2. Roster-Driven Loop
            for (const player of players) {
                const pNameOriginal = (player.name || `${player.first_name} ${player.last_name}`).trim();
                const pNameNorm = normalizeStrict(pNameOriginal);

                // Logging
                addToHistory(`[TRYING] ${pNameNorm}`, 'info');

                let relativePath = photoMap.get(pNameNorm);
                let matchMethod = 'EXACT';

                // A. Specific Alias Table (Full Name)
                if (!relativePath) {
                    if (FULL_NAME_ALIASES[pNameNorm]) {
                        const alias = FULL_NAME_ALIASES[pNameNorm];
                        if (photoMap.has(alias)) {
                            relativePath = photoMap.get(alias);
                            matchMethod = 'ALIAS (FULL)';
                            addToHistory(`  -> Matched via Alias: ${alias}`, 'system');
                        } else {
                            addToHistory(`  -> [DEBUG] Alias target '${alias}' NOT found in index.`, 'warning');
                        }
                    }
                }

                // B. Reverse Name Check (New Strategy)
                if (!relativePath) {
                    const parts = pNameNorm.split(' ');
                    if (parts.length === 2) {
                        const reversed = `${parts[1]} ${parts[0]}`;
                        if (photoMap.has(reversed)) {
                            relativePath = photoMap.get(reversed);
                            matchMethod = 'REVERSED';
                            addToHistory(`  -> Matched via Reverse: ${reversed}`, 'system');
                        }
                    }
                }

                // C. Simple Name Alias Check
                if (!relativePath) {
                    const parts = pNameNorm.split(' ');
                    if (parts.length >= 2) {
                        const first = parts[0];
                        const last = parts.slice(1).join(' ');

                        if (NAME_ALIASES[first]) {
                            const aliasName = `${NAME_ALIASES[first]} ${last}`;
                            if (photoMap.has(aliasName)) {
                                relativePath = photoMap.get(aliasName);
                                matchMethod = 'ALIAS (FIRST)';
                            }
                        }
                    }
                }

                // D. Jaro-Winkler Fuzzy Logic
                if (!relativePath) {
                    let bestMatch = null;
                    let bestScore = 0;

                    // Scan all photo names
                    for (const item of photoNamesList) {
                        const score = jaroWinkler(pNameNorm, item.name);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMatch = item;
                        }
                    }

                    // Score Logic
                    if (bestMatch) {
                        if (bestScore > 0.85) {
                            // Proposed Match - Prompt User
                            addToHistory(`[?] Match "${pNameOriginal}" with "${bestMatch.original}"? (Score: ${bestScore.toFixed(2)}) (y/n)`, 'warning');

                            const userResponse = await new Promise(resolve => {
                                confirmationResolver.current = resolve;
                            });

                            if (userResponse === 'y' || userResponse === 'yes') {
                                relativePath = bestMatch.path;
                                matchMethod = `FUZZY (${bestScore.toFixed(2)})`;
                            } else {
                                addToHistory(`> Skipped match.`, 'system');
                            }
                        } else {
                            // Debug logging for "Why did it fail?"
                            if (bestScore > 0.60) {
                                addToHistory(`  -> Best fuzzy: "${bestMatch.name}" (${bestScore.toFixed(2)}) - Below 0.85 threshold.`, 'warning');
                            }
                        }
                    }
                }

                if (relativePath) {
                    addToHistory(`[FOUND] ${pNameOriginal}${matchMethod !== 'EXACT' ? ` (${matchMethod})` : ''} - Importing...`, 'success');

                    try {
                        let imageFile = contents.file(relativePath);
                        if (!imageFile) {
                            const justName = relativePath.split(/[/\\]/).pop();
                            const foundPath = Object.keys(contents.files).find(path => path.endsWith(justName));
                            if (foundPath) imageFile = contents.file(foundPath);
                        }

                        if (imageFile) {
                            const blob = await imageFile.async('blob');
                            // DEBUG: Check file size
                            addToHistory(`  -> Extracted img: ${(blob.size / 1024).toFixed(2)} KB`, 'system');
                            addToHistory(`  -> Target Bucket: 'tournament-photos'`, 'system');
                            addToHistory(`  -> Tournament ID: ${tournamentInfo.id}`, 'system');

                            if (blob.size === 0) {
                                throw new Error("File is empty (0 bytes)");
                            }

                            const ext = relativePath.split('.').pop();
                            // Fix: Remove 'tournament_photos' prefix to satisfy RLS (Expects [0] to be bigint ID)
                            const storagePath = `${tournamentInfo.id}/${player.player_id}-${Date.now()}.${ext}`;

                            // Fix: Use 'tournament-photos' bucket which has correct policies
                            const { error: uploadError } = await supabase.storage
                                .from('tournament-photos')
                                .upload(storagePath, blob, { cacheControl: '3600', upsert: true });

                            if (uploadError) throw uploadError;

                            const { data: { publicUrl } } = supabase.storage
                                .from('tournament-photos')
                                .getPublicUrl(storagePath);

                            // Update DB
                            const { error: dbError } = await supabase
                                .from('players')
                                .update({ photo_url: publicUrl })
                                .eq('id', player.player_id);

                            if (dbError) throw dbError;

                            importedCount++;
                        } else {
                            addToHistory(`[ERR] File missing in zip: ${relativePath}`, 'error');
                            errorCount++;
                        }

                    } catch (err) {
                        console.error(err);
                        // ENHANCED ERROR LOGGING
                        addToHistory(`[ERR] Upload failed: ${err.message || JSON.stringify(err)}`, 'error');
                        errorCount++;
                    }

                } else {
                    addToHistory(`[MISSING] ${pNameOriginal} - Photo needed.`, 'warning');

                    // SMART HINT: Search for partial matches
                    const parts = pNameNorm.split(' ');
                    if (parts.length > 0) {
                        const searchPart = parts[0]; // e.g., "ikpere"
                        if (searchPart.length > 3) {
                            const hints = Array.from(photoMap.keys())
                                .filter(k => k.includes(searchPart))
                                .slice(0, 3); // Top 3

                            if (hints.length > 0) {
                                addToHistory(`  -> Did you mean? ${hints.join(', ')}`, 'info');
                            }
                        }
                    }

                    missingPlayers.push(pNameOriginal);
                }

                // Visual Yield & Throttle
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            addToHistory('----------------------------------------', 'info');
            addToHistory(`Import Complete: ${importedCount} imported.`, 'success');

            if (missingPlayers.length > 0) {
                addToHistory(`Unmatched Players (${missingPlayers.length}):`, 'warning');
                missingPlayers.slice(0, 10).forEach(name => addToHistory(` - ${name}`, 'info'));
                if (missingPlayers.length > 10) addToHistory(` ... and ${missingPlayers.length - 10} more.`, 'info');
            }

        } catch (err) {
            console.error(err);
            addToHistory(`[ERR] Failed to process zip: ${err.message}`, 'error');
        }
    };

    const handleCommand = async (cmd) => {
        const trimmed = cmd.trim();
        addToHistory(`> ${trimmed}`, 'user');

        if (!trimmed) return;

        // Check for pending confirmation (Interactive CLI)
        if (confirmationResolver.current) {
            confirmationResolver.current(trimmed.toLowerCase());
            confirmationResolver.current = null;
            return;
        }

        const { command, args } = resolveCommand(trimmed);


        switch (command) {
            case 'help':
                addToHistory('Available commands:', 'system');
                addToHistory('  scores <round>                - Enter result entry mode', 'info');
                addToHistory('  miss                          - List pending matches (in SCORES mode)', 'info');
                addToHistory('  missing <round>               - List pending matches (in COMMAND mode)', 'info');
                addToHistory('  rosters                       - View player roster', 'info');
                addToHistory('  sw <round> <base> <repeats>   - Generate Swiss Pairings', 'info');
                addToHistory('  koth <repeats> <base>         - Generate KOTH Pairings', 'info');
                addToHistory('  rr <repeats>                  - Generate Round Robin', 'info');
                addToHistory('  sp <round>                    - Show Pairings for round', 'info');
                addToHistory('  st                            - Show Standings (Current)', 'info');
                addToHistory('  rs <round>                    - Show Standings for Round', 'info');
                addToHistory('  sc                            - Show Scorecards', 'info');
                addToHistory('  stats                         - Update/Recalc Stats', 'info');
                addToHistory('  clear                         - Clear screen', 'info');
                addToHistory('  exit                          - Close console', 'info');
                break;

            case 'clear':
                setHistory([]);
                break;

            case 'exit':
                onClose();
                break;

            case 'field': // was rosters

                addToHistory('Player Rosters', 'system');
                addToHistory('', 'info');
                const playersByDiv = players.reduce((acc, p) => {
                    const div = p.division || 'Open';
                    if (!acc[div]) acc[div] = [];
                    acc[div].push(p);
                    return acc;
                }, {});

                Object.keys(playersByDiv).sort().forEach(div => {
                    addToHistory(`         Division ${div}`, 'info');
                    addToHistory(' # Rtng  Player', 'info');
                    const sorted = [...playersByDiv[div]].sort((a, b) => (a.seed || a.rank || 999) - (b.seed || b.rank || 999));
                    sorted.forEach((p, idx) => {
                        const seed = String(p.seed || p.initial_seed || idx + 1).padStart(2);
                        const rtng = String(p.rating || 0).padStart(4);
                        addToHistory(`${seed}  ${rtng}  ${p.name}`, 'info');
                    });
                    addToHistory('', 'info');
                });
                break;

            case 'leaderboard': // was st
            case 'rs': // Round Standings (not mapped, kept as is)

                const targetRound = (command === 'st' || command === 'leaderboard')
                    ? (tournamentInfo.currentRound || 1)
                    : parseInt(args[0]);
                if (command === 'rs' && isNaN(targetRound)) {
                    addToHistory('Usage: rs <round>', 'error');
                    break;
                }

                addToHistory(`Round ${targetRound} Standings`, 'system');
                addToHistory('', 'info');
                addToHistory('Rnk Won-Lost Sprd Player                   Last Game', 'info');

                // Calculate standings for the specific round or use live ranked players
                let sortedStandings;
                if (command === 'rs') {
                    const filteredResults = results.filter(r => r.round <= targetRound);
                    // We need to use the original players list for calculation, not the already ranked one to avoid seed confusion
                    // But 'players' here is actually rankedPlayers from index.jsx. 
                    // Let's assume we want to recalculate based on the results.
                    sortedStandings = calculateStandings(players, filteredResults, matches, tournamentInfo);
                } else {
                    // st command uses the already ranked players passed from parent
                    sortedStandings = [...players].sort((a, b) => a.rank - b.rank);
                }

                sortedStandings.forEach((p, idx) => {
                    const rnk = String(idx + 1).padStart(3);
                    const w = p.wins || 0;
                    const l = p.losses || 0;
                    const t = p.ties || 0;
                    const adjWins = w + (t * 0.5);
                    const adjLosses = l + (t * 0.5);
                    const record = (t > 0
                        ? `${adjWins.toFixed(1)}-${adjLosses.toFixed(1)}`
                        : `${adjWins}-${adjLosses}`).padEnd(8);
                    const sprd = (p.spread >= 0 ? '+' : '') + String(p.spread).padStart(4);
                    const playerStr = `${p.name} (#${p.rank})`.padEnd(25);
                    const lastGame = getLastGame(p.player_id, targetRound);

                    addToHistory(`${rnk} ${record} ${sprd} ${playerStr} ${lastGame}`, 'info');
                });
                break;

            case 'matchlog': // was sc

                const scArgs = args[0];
                let playersToProcess = [];

                if (scArgs) {
                    // Try to find player by rank/seed or name
                    const targetIdx = parseInt(scArgs);
                    if (!isNaN(targetIdx)) {
                        playersToProcess = players.filter(p => p.rank === targetIdx || p.seed === targetIdx);
                    } else {
                        // Fuzzy name match
                        playersToProcess = players.filter(p => p.name.toLowerCase().includes(scArgs.toLowerCase()));
                    }
                } else {
                    playersToProcess = [...players].sort((a, b) => (a.rank || 0) - (b.rank || 0));
                }

                if (playersToProcess.length === 0) {
                    addToHistory(`No players found matching "${scArgs}"`, 'error');
                    break;
                }

                addToHistory(`Generating Scorecards for ${playersToProcess.length} player(s)...`, 'system');
                addToHistory('', 'info');

                playersToProcess.forEach(p => {
                    const pId = String(p.player_id);
                    addToHistory(`Player: ${p.name.toUpperCase()} (#${p.seed || p.rank})`, 'system');
                    addToHistory('Rnd  Opponent               Order  Result  Score   Spread', 'info');

                    const pResults = results.filter(r => String(r.player1_id) === pId || String(r.player2_id) === pId)
                        .sort((a, b) => a.round - b.round);

                    let totalWinPoints = 0;
                    let totalSpread = 0;
                    let totalScore = 0;
                    let totalOppScore = 0;

                    if (pResults.length === 0) {
                        addToHistory('  (No games recorded yet)', 'warning');
                    }

                    pResults.forEach(r => {
                        const isP1 = String(r.player1_id) === pId;
                        const oppId = isP1 ? r.player2_id : r.player1_id;

                        // Handle BYE
                        if (r.is_bye || !oppId) {
                            const rnd = String(r.round).padStart(2);
                            const oppStr = "BYE".padEnd(25);
                            const resChar = 'W';
                            const scoreStr = `${r.score1 || 0}-0`.padEnd(8);
                            const sprdStr = `+${r.score1 || 0}`.padStart(5);
                            addToHistory(`${rnd}   ${oppStr}  ---      ${resChar}     ${scoreStr} ${sprdStr}`, 'info');
                            totalWinPoints += 1;
                            totalSpread += (r.score1 || 0);
                            totalScore += (r.score1 || 0);
                            return;
                        }

                        const oppName = getPlayerName(oppId);
                        const oppSeed = getPlayerSeed(oppId);
                        const myScore = isP1 ? r.score1 : r.score2;
                        const oppScore = isP1 ? r.score2 : r.score1;

                        const win = myScore > oppScore;
                        const tie = myScore === oppScore;
                        const sprd = myScore - oppScore;

                        if (win) totalWinPoints += 1;
                        else if (tie) totalWinPoints += 0.5;
                        totalSpread += sprd;
                        totalScore += myScore;
                        totalOppScore += oppScore;

                        const rnd = String(r.round).padStart(2);
                        const oppStr = `${oppName.substring(0, 20)} (#${oppSeed})`.padEnd(25);
                        const order = isP1 ? '1st' : '2nd';
                        const resChar = win ? 'W' : (tie ? 'T' : 'L');
                        const scoreStr = `${myScore}-${oppScore}`.padEnd(8);
                        const sprdStr = (sprd >= 0 ? '+' : '') + String(sprd).padStart(4);

                        addToHistory(`${rnd}   ${oppStr}  ${order}     ${resChar}     ${scoreStr} ${sprdStr}`, 'info');
                    });

                    if (pResults.length > 0) {
                        const winRec = totalWinPoints.toFixed(1);
                        const lossRec = (pResults.length - totalWinPoints).toFixed(1);
                        const totalSprdStr = (totalSpread >= 0 ? '+' : '') + totalSpread;
                        addToHistory(`------------------------------------------------------------`, 'info');
                        const totalLabel = "TOTAL".padEnd(35);
                        const recStr = `${winRec}-${lossRec}`.padEnd(10);
                        const totalScoreStr = `${totalScore}-${totalOppScore}`.padEnd(8);
                        addToHistory(`${totalLabel}        ${recStr} ${totalScoreStr} ${totalSprdStr}`, 'success');
                    }
                    addToHistory('', 'info');
                });
                break;

            case 'stats': // Update Stats
                addToHistory('Updating player statistics...', 'system');
                // Trigger a re-calc and save to DB
                await updatePlayerStats();
                break;

            case 'matchups':
            case 'sp': // Show Pairings

                if (args.length === 0) {
                    addToHistory('Usage: sp <round>', 'error');
                    return;
                }
                const spRound = parseInt(args[0]);
                if (isNaN(spRound)) {
                    addToHistory('Invalid round number.', 'error');
                    return;
                }
                const showMatches = getMatchesForRound(spRound);
                if (showMatches.length === 0) {
                    addToHistory(`No pairings found for Round ${spRound}.`, 'warning');
                } else {
                    addToHistory(`Round ${spRound} Ranked Pairings`, 'system');
                    addToHistory('', 'info');
                    addToHistory('Board Who Plays Whom', 'info');
                    showMatches.forEach((m, idx) => {
                        const p1Name = getPlayerName(m.player1_id);
                        const p2Name = getPlayerName(m.player2_id);
                        const p1Seed = getPlayerSeed(m.player1_id);
                        const p2Seed = getPlayerSeed(m.player2_id);
                        const board = String(idx + 1).padStart(4);

                        addToHistory(`${board}  ${p1Name} (#${p1Seed}) *first* vs. ${p2Name} (#${p2Seed}).`, 'info');
                    });
                }
                break;

            case 'sw': // Swiss Pairings: sw <round> <base> <repeats>
            case 'koth': // KOTH: koth <repeats> <base>
            case 'rr': // Round Robin: rr <repeats>
                handlePairingCommand(command, args);
                break;

            case 'trr': // Team Round Robin: trr [round]
                // 1. Parse Round
                const trrRound = args.length > 0 ? parseInt(args[0]) : (tournamentInfo.currentRound || 0) + 1;

                if (isNaN(trrRound)) {
                    addToHistory('Invalid round number.', 'error');
                    return;
                }

                addToHistory(`[SYSTEM] Generating Team Round Robin for Round ${trrRound}...`, 'system');

                // 2. Group Players by Team (Club)
                const teamMap = new Map();
                const trrPlayers = players.filter(p => !p.withdrawn && p.status !== 'paused');

                trrPlayers.forEach(p => {
                    let teamName = 'Unattached';
                    if (p.team_id && teams) {
                        const t = teams.find(tm => tm.id === p.team_id);
                        if (t) teamName = t.name;
                    } else {
                        teamName = (p.club || p.team || 'Unattached').trim();
                    }

                    if (!teamMap.has(teamName)) {
                        teamMap.set(teamName, []);
                    }
                    teamMap.get(teamName).push(p);
                });

                const teamsList = Array.from(teamMap.keys()).sort(); // Sort teams alphabetically
                if (teamsList.length < 2) {
                    addToHistory(`Error: Not enough teams found (Found: ${teamsList.length}). Check 'club' field.`, 'error');
                    return;
                }

                addToHistory(`Found ${teamsList.length} Teams: ${teamsList.join(', ')}`, 'info');

                // 3. Generate RR Schedule for TEAMS
                // Using generic Round Robin algorithm for N teams
                // Round 1 logic: 
                // Fix first team, rotate others.
                // We need specific matchups for *this* round (trrRound).
                // Cycle index = (trrRound - 1) % (NumRoundsInCycle).
                // NumRoundsInCycle = N - 1 (if N even) or N (if N odd).

                const teamObjList = teamsList.map((name, i) => ({ id: i, name }));
                let scheduleTeams = [...teamObjList];

                // Add Bye Team if odd
                if (scheduleTeams.length % 2 !== 0) {
                    scheduleTeams.push({ id: -1, name: 'BYE' });
                }

                const numTeams = scheduleTeams.length;
                const roundsInCycle = numTeams - 1;
                const cycleIndex = (trrRound - 1) % roundsInCycle;

                // Berger Table / Circle Method Rotation
                // Fixed: index 0.
                // Rotating: indices 1 to N-1.
                // Rotation amount = cycleIndex.

                // Current order for this round:
                // [0, ...rotatedRest]
                const fixed = scheduleTeams[0];
                const rest = scheduleTeams.slice(1);

                // Rotate 'rest' array by 'cycleIndex'
                // Note: Standard RR rotates clockwise or counter. 
                // Let's standard rotation: last becomes first.
                // Or simplified: Just slicing.
                // rotated = rest.slice(-cycleIndex) concat rest.slice(0, -cycleIndex)

                // Correct rotation for Round R (1-based):
                // Rotate (R-1) times.
                // One rotation: [Last] + [0..SecondLast]

                let rotatedRest = [...rest];
                for (let i = 0; i < cycleIndex; i++) {
                    const last = rotatedRest.pop();
                    rotatedRest.unshift(last);
                }

                const roundTeamsOrder = [fixed, ...rotatedRest];

                // Pair: 0 vs N-1, 1 vs N-2, ...
                // Standard visual:
                // T0  T1  T2
                // T5  T4  T3
                // Matches: (T0,T5), (T1,T4), (T2,T3).

                const half = numTeams / 2;
                const teamPairings = [];

                for (let i = 0; i < half; i++) {
                    const t1 = roundTeamsOrder[i];
                    const t2 = roundTeamsOrder[numTeams - 1 - i];
                    teamPairings.push({ team1: t1, team2: t2 });
                }

                // 4. Expand to Individual Pairings
                let individualPairings = [];
                let tableOffset = 1;

                teamPairings.forEach(tp => {
                    const t1Name = tp.team1.name;
                    const t2Name = tp.team2.name;

                    if (t1Name === 'BYE' || t2Name === 'BYE') {
                        // All players in valid team get Bye
                        const realTeam = t1Name === 'BYE' ? t2Name : t1Name;
                        if (realTeam !== 'BYE') { // Safety
                            const teamPlayers = teamMap.get(realTeam);
                            teamPlayers.forEach(p => {
                                individualPairings.push({
                                    table: 'BYE',
                                    player1: p,
                                    player2: { name: 'BYE', player_id: null, isBye: true }
                                });
                            });
                            addToHistory(`[TEAM BYE] ${realTeam}`, 'info');
                        }
                        return;
                    }

                    addToHistory(`[TEAM MATCH] ${t1Name} vs ${t2Name}`, 'success');

                    // Fixed Board Pairing: Sort by Rank/Seed
                    const roster1 = [...teamMap.get(t1Name)].sort((a, b) => (a.rank || 999) - (b.rank || 999));
                    const roster2 = [...teamMap.get(t2Name)].sort((a, b) => (a.rank || 999) - (b.rank || 999));

                    const maxBoards = Math.max(roster1.length, roster2.length);

                    for (let b = 0; b < maxBoards; b++) {
                        const p1 = roster1[b];
                        const p2 = roster2[b];

                        if (p1 && p2) {
                            individualPairings.push({ table: tableOffset++, player1: p1, player2: p2 });
                        } else if (p1) {
                            // P1 has no opponent in Team B -> Bye or Forfeit Win?
                            // Standard TSH: Bye/Walkover.
                            individualPairings.push({ table: 'BYE', player1: p1, player2: { name: 'BYE (No Opponent in Team)', isBye: true } });
                        } else if (p2) {
                            // P2 has no opponent in Team A
                            individualPairings.push({ table: 'BYE', player1: p2, player2: { name: 'BYE (No Opponent in Team)', isBye: true } });
                        }
                    }
                });

                // 5. Save (Assign Starts & Persist)
                individualPairings = assignStarts(individualPairings, players, results);

                // ... Save Logic (Duplicated from Q/SW) ...
                let newScheduleTRR = { ...(tournamentInfo.pairing_schedule || {}) };
                newScheduleTRR[trrRound] = individualPairings.map((p, i) => ({
                    ...p,
                    round: trrRound,
                    table_number: typeof p.table === 'number' ? p.table : i + 1,
                    player1_id: p.player1.player_id,
                    player2_id: p.player2?.player_id
                }));

                onUpdateTournament(prev => {
                    const updated = {
                        ...prev,
                        pairing_schedule: newScheduleTRR,
                        currentRound: trrRound
                    };
                    supabase.from('tournaments')
                        .update({ pairing_schedule: newScheduleTRR, current_round: trrRound })
                        .eq('id', tournamentInfo.id)
                        .then(res => {
                            if (res.error) toast.error("DB Save Failed");
                            else toast.success(`Round ${trrRound} Team Pairings Saved`);
                        });
                    return updated;
                });

                addToHistory(`[OK] Generated ${individualPairings.length} matches for Round ${trrRound}.`, 'success');
                break;

            case 'q': // Quartile Pairing: q [type] [repeats] [source]
                // Parse Args
                if (args.length < 3) {
                    addToHistory('Usage: q <type> <repeats> <source_round>', 'error');
                    addToHistory('Type: 1 (Q1-Q2), 2 (Q1-Q4), 3 (Q1-Q3)', 'info');
                    addToHistory('Source: 0 (Rating), >0 (Round Snapshot)', 'info');
                    return;
                }

                const qType = parseInt(args[0]);
                const qRepeats = parseInt(args[1]);
                const qSourceArg = args[2];
                const qSource = qSourceArg === 'current' ? (tournamentInfo.currentRound || 0) : parseInt(qSourceArg);

                if (isNaN(qType) || isNaN(qRepeats) || isNaN(qSource)) {
                    addToHistory('Invalid arguments. Must be integers.', 'error');
                    return;
                }

                addToHistory(`[SYSTEM] Generating Quartile Pairings (Type ${qType})...`, 'system');

                // --- Helpers ---
                const getMatchCount = (p1Id, p2Id) => {
                    let count = 0;
                    results.forEach(r => {
                        if ((r.player1_id === p1Id && r.player2_id === p2Id) ||
                            (r.player1_id === p2Id && r.player2_id === p1Id)) {
                            count++;
                        }
                    });
                    return count;
                };

                const findValidOpponent = (player, targetPool, maxRepeats, poolName) => {
                    for (let i = 0; i < targetPool.length; i++) {
                        const potentialOpponent = targetPool[i];
                        const timesPlayed = getMatchCount(player.player_id, potentialOpponent.player_id);

                        if (timesPlayed <= maxRepeats) {
                            // Found validd match
                            // Log swap if it wasn't the first option
                            if (i > 0) {
                                addToHistory(`[SWAP] ${player.name} vs ${targetPool[0].name} (Repeat). Swapping index 0 with ${i}.`, 'warning');
                                addToHistory(`[FIX] Matching with ${potentialOpponent.name} instead.`, 'success');
                            }
                            return targetPool.splice(i, 1)[0];
                        }
                    }

                    // Fallback
                    addToHistory(`[!] Forced Repeat or No Valid Match: ${player.name}. Searching remainder...`, 'warning');
                    return targetPool.splice(0, 1)[0];
                };

                // 1. Get Snapshot
                let rankingPool = [];
                const activeP = players.filter(p => !p.withdrawn && p.status !== 'paused');

                if (qSource === 0) {
                    rankingPool = [...activeP].sort((a, b) => {
                        if ((a.rating || 0) !== (b.rating || 0)) return (b.rating || 0) - (a.rating || 0);
                        return (a.initial_seed || 999) - (b.initial_seed || 999);
                    });
                } else {
                    const snapshotResults = results.filter(r => r.round <= qSource);
                    const allStandings = calculateStandings(players, snapshotResults, matches, tournamentInfo);
                    rankingPool = allStandings.filter(p => !p.withdrawn && p.status !== 'paused');
                }

                // 2. Handle Bye
                // Check past byes
                const pastByes = new Set();
                results.forEach(r => {
                    if (r.player2_name === 'BYE') pastByes.add(r.player1_id);
                });

                let qPairings = [];

                if (rankingPool.length % 2 !== 0) {
                    let byeCandidateIndex = -1;
                    // Lowest ranked who hasn't had bye
                    for (let i = rankingPool.length - 1; i >= 0; i--) {
                        if (!pastByes.has(rankingPool[i].player_id)) {
                            byeCandidateIndex = i;
                            break;
                        }
                    }
                    if (byeCandidateIndex === -1) byeCandidateIndex = rankingPool.length - 1; // Repeat bye if everyone had one

                    const byeP = rankingPool.splice(byeCandidateIndex, 1)[0];
                    qPairings.push({
                        table: 'BYE',
                        player1: byeP,
                        player2: { name: 'BYE', player_id: null, isBye: true }
                    });
                    addToHistory(`[BYE] Assigned to ${byeP.name}`, 'info');
                }

                // 3. Create Quartiles
                const N = rankingPool.length;
                const base = Math.floor(N / 4);
                const rem = N % 4;

                const s1 = base + (rem > 0 ? 1 : 0);
                const s2 = base + (rem > 1 ? 1 : 0);
                const s3 = base + (rem > 2 ? 1 : 0);

                const Q1 = rankingPool.slice(0, s1);
                const Q2 = rankingPool.slice(s1, s1 + s2);
                const Q3 = rankingPool.slice(s1 + s2, s1 + s2 + s3);
                const Q4 = rankingPool.slice(s1 + s2 + s3);

                addToHistory(`Quartiles: Q1(${Q1.length}) Q2(${Q2.length}) Q3(${Q3.length}) Q4(${Q4.length})`, 'info');

                // 4. Match
                // Type 3: Q1-Q3, Q2-Q4
                // Type 2: Q1-Q4, Q2-Q3
                // Type 1: Q1-Q2, Q3-Q4

                const processPairing = (sourceGroup, targetGroup, label) => {
                    // We iterate sourceGroup. 
                    // Note: Groups might have uneven sizes.
                    // If Source > Target, we have leftovers.
                    // If Source < Target, we consume part of Target.

                    const pairs = [];
                    // Clone source to safe iterate?
                    // actually we consume targetGroup. we iterate source.

                    for (let i = 0; i < sourceGroup.length; i++) {
                        const p1 = sourceGroup[i];

                        let p2;
                        if (targetGroup.length > 0) {
                            p2 = findValidOpponent(p1, targetGroup, qRepeats, label);
                        } else {
                            // No target available (uneven sizes)
                            // Fallback? 
                            // Wait, if Q1 has 3 and Q3 has 2.
                            // 3rd person in Q1 has no one in Q3.
                            // They should become a "floater".
                            addToHistory(`[WARN] ${p1.name} has no opponent in group ${label}. Moving to floaters.`, 'warning');
                            // We'll handle leftovers later.
                            // Return p1 as leftover
                            continue;
                        }

                        if (p2) {
                            pairs.push({ player1: p1, player2: p2 });
                            addToHistory(`[MATCH] ${p1.name} vs ${p2.name}`, 'info');
                        }
                    }
                    return pairs;
                };

                let generatedMatches = [];
                let leftovers = []; // To track unmatchable due to size diffs

                /* 
                   Wait, findValidOpponent SPLICES the target group. 
                   So we destructively consume target pools.
                   Leftovers in Source are implicit if loop finishes and p2 was null?
                   Actually my loop structure above skips if target empty.
                   Those source players need to be collected.
                */

                const runMatching = (S, T, Lb) => {
                    const matched = [];
                    const unmatchedS = [];

                    S.forEach(p1 => {
                        if (T.length > 0) {
                            const p2 = findValidOpponent(p1, T, qRepeats, Lb);
                            matched.push({ player1: p1, player2: p2 });
                            addToHistory(`[MATCH] ${p1.name} (${p1.rank || '-'}) vs ${p2.name} (${p2.rank || '-'})`, 'info');
                        } else {
                            unmatchedS.push(p1);
                        }
                    });

                    return { matched, unmatchedS, remainingT: T };
                };

                if (qType === 3) {
                    const r1 = runMatching(Q1, Q3, 'Q3');
                    const r2 = runMatching(Q2, Q4, 'Q4');
                    generatedMatches.push(...r1.matched, ...r2.matched);
                    leftovers.push(...r1.unmatchedS, ...r1.remainingT, ...r2.unmatchedS, ...r2.remainingT);

                } else if (qType === 2) {
                    const r1 = runMatching(Q1, Q4, 'Q4');
                    const r2 = runMatching(Q2, Q3, 'Q3');
                    generatedMatches.push(...r1.matched, ...r2.matched);
                    leftovers.push(...r1.unmatchedS, ...r1.remainingT, ...r2.unmatchedS, ...r2.remainingT);

                } else { // Type 1
                    const r1 = runMatching(Q1, Q2, 'Q2');
                    const r2 = runMatching(Q3, Q4, 'Q4');
                    generatedMatches.push(...r1.matched, ...r2.matched);
                    leftovers.push(...r1.unmatchedS, ...r1.remainingT, ...r2.unmatchedS, ...r2.remainingT);
                }

                // Pair Leftovers
                if (leftovers.length > 0) {
                    addToHistory(`[SYSTEM] Pairing ${leftovers.length} leftovers...`, 'system');
                    // Sort leftovers by rank to keep it sensible?
                    // They are likely mixed from different quartiles.
                    // Just pair them top-down.
                    leftovers.sort((a, b) => (a.rank || 0) - (b.rank || 0)); // simple sort

                    while (leftovers.length >= 2) {
                        const p1 = leftovers.shift();
                        // Find opponent in remaining
                        const p2 = findValidOpponent(p1, leftovers, qRepeats, 'Leftovers');
                        generatedMatches.push({ player1: p1, player2: p2 });
                        addToHistory(`[MATCH-L] ${p1.name} vs ${p2.name}`, 'info');
                    }
                    if (leftovers.length === 1) {
                        addToHistory(`[ERR] ${leftovers[0].name} remains unpaired! (Odd number?)`, 'error');
                    }
                }

                addToHistory(`[OK] ${generatedMatches.length} Matchups generated.`, 'success');

                // 5. Save
                const qTargetRound = (tournamentInfo.currentRound || 0) + 1;
                let tableCnt = 1;
                qPairings.forEach(p => p.table = tableCnt++); // Byes first

                generatedMatches.forEach(m => {
                    qPairings.push({
                        table: tableCnt++,
                        player1: m.player1,
                        player2: m.player2
                    });
                });

                qPairings = assignStarts(qPairings, players, results);

                // Persist
                let newSchedule = { ...(tournamentInfo.pairing_schedule || {}) };
                newSchedule[qTargetRound] = qPairings.map((p, i) => ({
                    ...p,
                    round: qTargetRound,
                    table_number: p.table,
                    player1_id: p.player1.player_id,
                    player2_id: p.player2?.player_id
                }));

                onUpdateTournament(prev => {
                    const updated = {
                        ...prev,
                        pairing_schedule: newSchedule,
                        currentRound: qTargetRound
                    };

                    supabase.from('tournaments')
                        .update({ pairing_schedule: newSchedule, current_round: qTargetRound })
                        .eq('id', tournamentInfo.id)
                        .then(res => {
                            if (res.error) toast.error("DB Save Failed");
                            else toast.success(`Round ${qTargetRound} Pairings Saved`);
                        });

                    return updated;
                });
                break;

            case 'scores':
                if (args.length === 0) {
                    addToHistory('Usage: scores <round_number>', 'error');
                    return;
                }
                const scoreRound = parseInt(args[0]);
                if (isNaN(scoreRound)) {
                    addToHistory('Invalid round number.', 'error');
                    return;
                }

                // Validate round exists in matches or config
                if (scoreRound > (tournamentInfo.total_rounds || 100)) {
                    addToHistory(`Round ${scoreRound} exceeds total rounds.`, 'warning');
                }

                const matchesResult = getMatchesForRound(scoreRound);
                if (matchesResult.length === 0) {
                    addToHistory(`No pairings found for Round ${scoreRound}.`, 'warning');
                    // We might still allow if utilizing manual entry?
                    // TSH usually requires pairings to exist.
                }

                setActiveRound(scoreRound);
                setRoundMatches(matchesResult);
                setMode('SCORES');
                addToHistory(`ENTERING SCORE MODE FOR ROUND ${scoreRound}`, 'success');
                addToHistory('Enter results as: "Name1 Score1 Name2 Score2" (e.g. "Toy 400 Har 300")', 'system');
                addToHistory('Type "pause" to return to command mode.', 'system');
                addToHistory('Type "miss" to see pending matches.', 'system');

                // Show remaining matches
                const pendingCount = matchesResult.filter(m => m.status !== 'completed').length;
                addToHistory(`${pendingCount} matches remaining in Round ${scoreRound}.`, 'info');
                break;

            case 'missing':
                if (args.length === 0) {
                    addToHistory('Usage: missing <round_number>', 'error');
                    return;
                }
                const missRound = parseInt(args[0]);
                if (isNaN(missRound)) {
                    addToHistory('Invalid round number.', 'error');
                    return;
                }

                // Validate round exists in matches or config
                if (missRound > (tournamentInfo.total_rounds || 100)) {
                    addToHistory(`Round ${missRound} exceeds total rounds.`, 'warning');
                }

                const pendingMatches = getMatchesForRound(missRound).filter(m => m.status !== 'completed');

                if (pendingMatches.length === 0) {
                    addToHistory(`No missing results for Round ${missRound}.`, 'success');
                } else {
                    addToHistory(`Missing Results for Round ${missRound}:`, 'warning');
                    pendingMatches.forEach(m => {
                        const p1 = getPlayerName(m.player1_id);
                        const p2 = getPlayerName(m.player2_id);
                        addToHistory(`  - ${p1} vs ${p2} (Table ${m.table_number || '?'})`, 'info');
                    });
                    addToHistory(`Total: ${pendingMatches.length} pending.`, 'info');
                }
                break;

            case 'pix':
                if (args[0] === 'import') {
                    // Trigger file selection
                    addToHistory('Please select the TSH zip file...', 'system');
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ''; // Reset
                        fileInputRef.current.click();
                    }
                } else {
                    addToHistory('Usage: pix import <filename.zip>', 'error');
                }
                break;

            case 'insights':
                if (args.length === 0) {
                    addToHistory('Usage: insights [round | player <name>]', 'info');
                    return;
                }
                const subCmd = args[0].toLowerCase();

                if (subCmd === 'round') {
                    addToHistory(`[CEREBRAS] Analyzing Round ${currentRound}...`, 'system');
                    const standings = calculateStandings(players, results);
                    const lines = await CerebrasService.generateRoundHeadlines(standings, currentRound);

                    if (lines.length === 0) {
                        addToHistory(`[CEREBRAS] No insights generated. check API key or connectivity.`, 'error');
                    } else {
                        lines.forEach(line => addToHistory(`> ${line}`, 'success'));
                    }
                } else if (subCmd === 'player') {
                    const pName = args.slice(1).join(' ');
                    if (!pName) {
                        addToHistory('Usage: insights player <name>', 'error');
                        return;
                    }

                    // Find player
                    const p = players.find(x =>
                        (x.name || '').toLowerCase().includes(pName.toLowerCase()) ||
                        (x.first_name || '').toLowerCase().includes(pName.toLowerCase())
                    );

                    if (!p) {
                        addToHistory(`Player "${pName}" not found.`, 'error');
                        return;
                    }

                    addToHistory(`[CEREBRAS] Strategizing for ${p.name || p.first_name}...`, 'system');
                    const standings = calculateStandings(players, results);
                    const pStats = standings.find(x => x.player_id === p.player_id);

                    if (!pStats) {
                        addToHistory(`Stats not found for ${pName}.`, 'error');
                        return;
                    }

                    const scenario = await CerebrasService.generateWinningScenario(pStats, standings, (tournamentInfo.total_rounds || 8) - currentRound);
                    addToHistory(`[STRATEGY] ${scenario}`, 'success');
                }
                break;

            case 'edit': // edit <player> <round>
                if (args.length < 2) {
                    addToHistory('Usage: edit <player> <round>', 'error');
                    return;
                }
                const editRoundStr = args[args.length - 1];
                const editRound = parseInt(editRoundStr);
                const editPlayerName = args.slice(0, args.length - 1).join(' ');

                if (isNaN(editRound)) {
                    addToHistory('Invalid round number. Usage: edit <player> <round>', 'error');
                    return;
                }

                // Find Player
                const targetP = players.find(p =>
                    normalizeStrict(p.name).includes(normalizeStrict(editPlayerName))
                );

                if (!targetP) {
                    addToHistory(`Player "${editPlayerName}" not found.`, 'error');
                    return;
                }

                // Find Result
                const targetResult = results.find(r =>
                    r.round === editRound &&
                    (r.player1_id === targetP.player_id || r.player2_id === targetP.player_id)
                );

                if (!targetResult) {
                    addToHistory(`No result found for ${targetP.name} in Round ${editRound}.`, 'error');
                    return;
                }

                // Enter Edit Mode
                const p1 = getPlayerName(targetResult.player1_id);
                const p2 = getPlayerName(targetResult.player2_id);
                addToHistory(`[EDIT] ${p1} (${targetResult.score1}) vs ${p2} (${targetResult.score2})`, 'highlight');
                addToHistory(`Enter new scores as: "${p1.split(' ')[0]} <Score> ${p2.split(' ')[0]} <Score>" OR just "<Score1> <Score2>"`, 'system');

                setEditingMatchId(targetResult.id);
                setActiveRound(editRound);
                setMode('EDIT_SINGLE');
                break;

            case 'delete': // delete <player> <round>
                if (args.length < 2) {
                    addToHistory('Usage: delete <player> <round>', 'error');
                    return;
                }
                const delRoundStr = args[args.length - 1];
                const delRound = parseInt(delRoundStr);
                const delPlayerName = args.slice(0, args.length - 1).join(' ');

                if (isNaN(delRound)) {
                    addToHistory('Invalid round number.', 'error');
                    return;
                }

                // Find Player
                const targetDelP = players.find(p =>
                    normalizeStrict(p.name).includes(normalizeStrict(delPlayerName))
                );

                if (!targetDelP) {
                    addToHistory(`Player "${delPlayerName}" not found.`, 'error');
                    return;
                }

                // Find Results (Allow multiple if duplicates exist)
                const targetResults = results.filter(r =>
                    r.round === delRound &&
                    (r.player1_id === targetDelP.player_id || r.player2_id === targetDelP.player_id)
                );

                if (targetResults.length === 0) {
                    addToHistory(`No result found for ${targetDelP.name} in Round ${delRound}.`, 'error');
                    return;
                }

                // Delete ALL matching results to clean up duplicates
                let delCount = 0;
                // Using for...of loop to handle async await properly if needed, though here we call hook action
                // Wait, handleCommand is async so we can use await? Yes.
                const performDeletes = async () => {
                    for (const res of targetResults) {
                        const p1 = getPlayerName(res.player1_id);
                        const p2 = getPlayerName(res.player2_id);
                        addToHistory(`Deleting result: ${p1} vs ${p2} (${res.score1}-${res.score2})...`, 'warning');

                        if (onDeleteResult) {
                            await onDeleteResult(res.id);
                            delCount++;
                        } else {
                            addToHistory('Delete capability not available.', 'error');
                        }
                    }

                    if (delCount > 0) {
                        addToHistory(`Deleted ${delCount} result(s).`, 'success');
                        // Update valid matches status?
                        const matchIds = targetResults.map(r => r.match_id).filter(Boolean);
                        if (matchIds.length > 0) {
                            setRoundMatches(prev => prev.map(m => matchIds.includes(m.id) ? { ...m, status: 'pending' } : m));
                        }
                    }
                };
                performDeletes(); // async call
                break;

            case 'rosters':
                const divisions = tournamentInfo.divisions && tournamentInfo.divisions.length > 0 ? tournamentInfo.divisions : [{ name: 'Open' }];
                let totalPlayers = 0;

                divisions.forEach(div => {
                    const divPlayers = players
                        .filter(p => (p.division || 'Open') === div.name)
                        .sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Sort by rating descending

                    if (divPlayers.length > 0) {
                        addToHistory(`Division: ${div.name.toUpperCase()} (${divPlayers.length})`, 'highlight');
                        // Print table header or simple list
                        // Use padded strings for alignment
                        addToHistory(`  ID  | NAME                          | RATING | TEAM`, 'info');
                        addToHistory(`  --- | ----------------------------- | ------ | ----`, 'info');
                        divPlayers.forEach(p => {
                            const teamName = p.team_id ? (tournamentInfo.teams.find(t => t.id === p.team_id)?.name || '-') : '-';
                            const idStr = String(p.player_id).padEnd(3);
                            const nameStr = p.name.padEnd(29);
                            const ratingStr = String(p.rating || 0).padEnd(6);
                            addToHistory(`  ${idStr} | ${nameStr} | ${ratingStr} | ${teamName}`, 'system');
                        });
                        addToHistory(' ', 'system'); // Spacer
                        totalPlayers += divPlayers.length;
                    }
                });

                if (totalPlayers === 0) {
                    addToHistory('No players found in any division.', 'warning');
                } else {
                    addToHistory(`Total Players: ${totalPlayers}`, 'success');
                }
                break;

            default:
                addToHistory(`Unknown command: "${command}". Type "help" for a list of commands.`, 'error');
        }
    };

    const handlePairingCommand = async (command, args) => {
        if (!onUpdateTournament) {
            addToHistory('Pairing capabilities not available in this context.', 'error');
            return;
        }

        let targetRound, baseRound, repeats;
        let pairings = [];

        try {
            if (command === 'sw') {
                if (args.length < 3) throw new Error("Usage: sw <target_round> <base_round> <repeats>");
                targetRound = parseInt(args[0]);
                baseRound = parseInt(args[1]);
                repeats = parseInt(args[2]); // Not heavily used in logic yet but parsed

            } else if (command === 'koth') {
                if (args.length < 2) throw new Error("Usage: koth <repeats> <base>");
                repeats = parseInt(args[0]);
                baseRound = parseInt(args[1]);
                targetRound = baseRound + 1; // Implied next round

            } else if (command === 'rr') {
                targetRound = tournamentInfo.currentRound || 1; // Default to current
                repeats = args.length > 0 ? parseInt(args[0]) : 1;
                // RR usually generates schedule for ALL rounds, or next X rounds.
                // Assuming standard RR generation for remaining? Or single round?
                // TSH 'rr' often generates the whole table. 
                // Let's assume it generates pairings for the valid next round(s).
                // For simplicity in this step, let's pair the *current* target round using RR logic/lookup.
            }

            if (isNaN(targetRound)) throw new Error("Invalid round number.");

            addToHistory(`Generating ${command.toUpperCase()} pairings for Round ${targetRound}...`, 'system');

            // --- Pairing Logic Wrapper ---
            // 1. Prepare Data
            const divisions = tournamentInfo.divisions && tournamentInfo.divisions.length > 0 ?
                tournamentInfo.divisions : [{ name: 'Open' }];

            const allResultsSoFar = results || [];

            let newSchedule = { ...(tournamentInfo.pairing_schedule || {}) };
            let totalPairs = 0;
            let allRoundPairings = []; // Accumulator
            let tableOffset = 1; // Running Table Counter

            // Process by division
            for (const division of divisions) {
                const divisionPlayers = players.filter(p =>
                    (p.division === division.name || (divisions.length === 1 && division.name === 'Open')) &&
                    !p.withdrawn && p.status !== 'paused'
                );

                if (divisionPlayers.length === 0) continue;

                addToHistory(`[SYSTEM] Pairing Division: ${division.name} (${divisionPlayers.length} players)...`, 'info');

                let generatedPairs = [];

                if (command === 'sw') {
                    // Need 'previousMatchups' set
                    let previousMatchups = new Set();
                    if (repeats === 0) {
                        allResultsSoFar.forEach(res => {
                            previousMatchups.add(`${res.player1_id}-${res.player2_id}`);
                            previousMatchups.add(`${res.player2_id}-${res.player1_id}`);
                        });
                    }
                    generatedPairs = generateSwissPairings(divisionPlayers, previousMatchups, allResultsSoFar);

                } else if (command === 'koth') {
                    let previousMatchups = new Set();
                    if (repeats === 0) {
                        allResultsSoFar.forEach(res => {
                            previousMatchups.add(`${res.player1_id}-${res.player2_id}`);
                            previousMatchups.add(`${res.player2_id}-${res.player1_id}`);
                        });
                    }
                    generatedPairs = generateKingOfTheHillPairings(divisionPlayers, previousMatchups, allResultsSoFar, targetRound);

                } else if (command === 'rr') {
                    // Full Round Robin Generation
                    // targetRound logic: RR usually starts from Round 1 or current?
                    // Let's assume we allow appending or overwriting.
                    // Ideally RR generates the COMPLETE schedule for the division.

                    const count = divisionPlayers.length;

                    try {
                        const rrMap = generateRoundRobinSchedule(divisionPlayers, repeats);

                        // Process the map
                        Object.entries(rrMap).forEach(([rndKey, pairs]) => {
                            const rNum = parseInt(rndKey);

                            // Assign Tables
                            pairs.forEach(p => {
                                p.table = tableOffset++;
                                p.division = division.name;
                            });

                            // Format
                            const formatted = pairs.map((p, i) => ({
                                ...p,
                                round: rNum, // Explicit round
                                table_number: p.table,
                                player1_id: p.player1.player_id,
                                player2_id: p.player2?.player_id
                            }));

                            // Save to newSchedule
                            // If multiple divisions, we append to existing checks
                            if (!newSchedule[rNum]) newSchedule[rNum] = [];

                            // We should ideally *clear* the round if it's the first division being processed? 
                            // But we lack context of "first division" here easily without index.
                            // Assuming we are building from 'prev' (which is passed in top).
                            // We should probably allow appending.

                            newSchedule[rNum] = [...(newSchedule[rNum] || []), ...formatted];
                            totalPairs += formatted.length;
                        });

                        generatedPairs = []; // Prevent standard save logic from intervening

                    } catch (e) {
                        addToHistory(`Error generating RR: ${e.message}`, 'error');
                    }
                }

                // Standard Save Accumulation (Skipped for RR if pairs cleared)
                if (generatedPairs.length > 0) {
                    // Re-assign Tables using global offset
                    generatedPairs.forEach(p => {
                        p.table = tableOffset++;
                        p.division = division.name;
                    });

                    allRoundPairings.push(...generatedPairs);
                    totalPairs += generatedPairs.length;
                }
            }

            // Save Logic
            if (command === 'rr') {
                // RR has already populated 'newSchedule' with multiple rounds.
                // We don't do the single-round assignment.
            } else {
                // Standard Single Round Assignment
                newSchedule[targetRound] = allRoundPairings.map((p, i) => ({
                    ...p,
                    round: targetRound,
                    table_number: p.table,
                    player1_id: p.player1.player_id,
                    player2_id: p.player2?.player_id
                }));
            }


            // Persist (Update Tournament Info -> Triggers Save in Dashboard/Hook)
            // We need to update `pairing_schedule`
            // NOTE: This updates LOCAL state. The Hook `useTournamentActions` or `TournamentControl` logic 
            // typically syncs this to DB. 
            // We called `onUpdateTournament(prev => ...)`
            onUpdateTournament(prev => {
                const updated = {
                    ...prev,
                    pairing_schedule: newSchedule,
                    currentRound: targetRound // Advance round? Or just set pairings?
                    // Usually generating pairings implies setting up that round.
                };
                // We should probably trigger a DB update here if onUpdateTournament doesn't auto-save.
                // In `TournamentCommandCenterDashboard`, `setTournamentInfo` just updates state.
                // We need to trigger a save.
                // Ideally `onUpdateTournament` handles persistence or we call a separate save.
                // CLI implies "Do It".
                savePairingsToDB(updated); // Helper to call generic save?
                // Wait, we don't have a direct save function passed.
                // We might rely on the side-effect or we need to pass `saveTournament`?
                // For now, updating context might reflect in UI, but likely won't persist to DB unless User clicks "Save" 
                // or we trigger it.
                // Let's assume for this task updating state is Step 1.
                // We might need to inject `savePairings` function.

                return updated;
            });

            addToHistory(`Success. Generated ${totalPairs} matches for Round ${targetRound}.`, 'success');
            addToHistory(`Type "sp ${targetRound}" to view.`, 'system');

        } catch (err) {
            addToHistory(`Error: ${err.message}`, 'error');
        }
    };

    // Helper to persist (Mocking the requirement -> Real app needs this passed down)
    const savePairingsToDB = async (updatedTournament) => {
        try {
            const { error } = await supabase
                .from('tournaments')
                .update({
                    pairing_schedule: updatedTournament.pairing_schedule,
                    current_round: updatedTournament.currentRound
                })
                .eq('slug', tournamentInfo.slug || tournamentInfo.url_slug);

            if (error) throw error;

            toast.success(`Pairings Generated & Saved for Round ${updatedTournament.currentRound}`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save pairings to database.');
            addToHistory('Failed to save pairings to DB. Please check connection.', 'error');
        }
    };
    // Helper to update player stats (stats command)
    const updatePlayerStats = async () => {
        try {
            // Calculate stats from 'results'
            const newStats = {};
            players.forEach(p => {
                newStats[p.player_id || p.id] = { wins: 0, spread: 0, losses: 0, ties: 0 };
            });

            results.forEach(r => {
                if (newStats[r.player1_id]) {
                    const s = newStats[r.player1_id];
                    s.spread += (r.score1 - r.score2);
                    if (r.score1 > r.score2) s.wins++;
                    else if (r.score1 < r.score2) s.losses++;
                    else s.ties++;
                }
                if (newStats[r.player2_id]) {
                    const s = newStats[r.player2_id];
                    s.spread += (r.score2 - r.score1);
                    if (r.score2 > r.score1) s.wins++;
                    else if (r.score2 < r.score1) s.losses++;
                    else s.ties++;
                }
            });

            // Batch update via Supabase (requires loop or rpc - doing loop for simplicity/prototype)
            // Ideally we create a backend function, but for now:
            // We can upsert if we map to correct table structure 'tournament_players'
            // Table 'tournament_players' has columns: wins, losses, spread?
            // Let's assume yes based on request.

            // Optimization: Prepare array
            const updates = Object.keys(newStats).map(pid => ({
                player_id: pid,
                tournament_id: tournamentInfo.id,
                wins: newStats[pid].wins,
                losses: newStats[pid].losses,
                spread: newStats[pid].spread
                // Assuming 'ties' handled or ignored for now
            }));

            // We can't batch update easily without UPSERT on primary key. PK is likely id of tournament_players row.
            // But we have player_id and tournament_id.
            // We'll iterate for safety in this CLI context.

            let count = 0;
            for (const u of updates) {
                const { error } = await supabase
                    .from('tournament_players')
                    .update({ wins: u.wins, losses: u.losses, spread: u.spread })
                    .eq('tournament_id', u.tournament_id)
                    .eq('player_id', u.player_id); // Assuming this composite key works or we find the row.
                if (!error) count++;
            }

            addToHistory(`Updated stats for ${count} players in database.`, 'success');
            toast.success("Player Stats Updated");

        } catch (err) {
            console.error(err);
            addToHistory(`Error updating stats: ${err.message}`, 'error');
        }
    };



    const handleScoreEntry = (cmd) => {
        addToHistory(`[R${activeRound}] ${cmd}`, 'user');
        const trimmed = cmd.trim();

        if (trimmed.toLowerCase() === 'pause') {
            setMode('COMMAND');
            setActiveRound(null);
            addToHistory('Paused score entry. Returned to command mode.', 'system');
            return;
        }

        if (trimmed.toLowerCase() === 'miss') {
            const pending = roundMatches.filter(m => m.status !== 'completed');
            if (pending.length === 0) {
                addToHistory('All matches completed!', 'success');
            } else {
                addToHistory('Pending Matches:', 'warning');
                pending.forEach(m => {
                    const p1 = getPlayerName(m.player1_id);
                    const p2 = getPlayerName(m.player2_id);
                    addToHistory(`  - ${p1} vs ${p2}`, 'info');
                });
            }
            return;
        }


        // Parse: Name1 Score1 Name2 Score2
        // Regex: ([a-zA-Z]{2,})\s+(\d+)\s+([a-zA-Z]{2,})\s+(\d+)
        // This is a simple regex, might need more robustness for names with spaces if user types full name?
        // User said: "Toyeme 400 Harold 300"

        // Let's try to split by spaces and flexible parsing
        const parts = trimmed.split(/\s+/);
        if (parts.length !== 4) {
            addToHistory('Invalid format. Expected: Name1 Score1 Name2 Score2', 'error');
            return;
        }

        const [n1, s1, n2, s2] = parts;
        const score1 = parseInt(s1);
        const score2 = parseInt(s2);

        if (isNaN(score1) || isNaN(score2)) {
            addToHistory('Scores must be numbers.', 'error');
            return;
        }

        // Fuzzy Match Names
        // We need to find the match that has these two players.
        // n1 matches player1 OR player2? n2 matches the other?
        // Actually, TSH usually matches the *Pairing*.

        // Find candidate matches
        const matchesWithPlayers = roundMatches.filter(m => {
            if (m.status === 'completed') return false; // Skip completed? Or allow overwrite? User didn't specify. Assume we filter pending first.
            const p1Name = getPlayerName(m.player1_id);
            const p2Name = getPlayerName(m.player2_id);

            return (matchName(n1, p1Name) && matchName(n2, p2Name)) || (matchName(n1, p2Name) && matchName(n2, p1Name));
        });

        if (matchesWithPlayers.length === 0) {
            // Try searching completed matches to allow overwrite
            const completedMatchesWithPlayers = roundMatches.filter(m => {
                if (m.status !== 'completed') return false;
                const p1Name = getPlayerName(m.player1_id);
                const p2Name = getPlayerName(m.player2_id);
                return (matchName(n1, p1Name) && matchName(n2, p2Name)) || (matchName(n1, p2Name) && matchName(n2, p1Name));
            });

            if (completedMatchesWithPlayers.length > 0) {
                addToHistory('Match already recorded. Overwrite? (Not implemented yet - re-enter via UI to edit)', 'warning');
                return;
            }

            addToHistory(`No match found for "${n1}" vs "${n2}" in Round ${activeRound}.`, 'error');
            addToHistory(`Available Matches:`, 'info');
            matchesWithPlayers = roundMatches.filter(m => m.status !== 'completed'); // Re-filter for list
            matchesWithPlayers.forEach(m => {
                const p1 = getPlayerName(m.player1_id);
                const p2 = getPlayerName(m.player2_id);
                addToHistory(`  - ${p1} vs ${p2}`, 'info');
            });
            return;
        }

        if (matchesWithPlayers.length > 1) {
            addToHistory(`Ambiguous names. "${n1}" vs "${n2}" matches multiple pairings. Be more specific.`, 'error');
            return;
        }

        const match = matchesWithPlayers[0];
        const p1Name = getPlayerName(match.player1_id);
        const p2Name = getPlayerName(match.player2_id);

        // Determine who is who in the input vs match
        // Input: n1 s1, n2 s2
        let realScore1, realScore2;

        if (matchName(n1, p1Name)) {
            // n1 is player1
            realScore1 = score1;
            realScore2 = score2;
        } else {
            // n1 must be player2
            realScore1 = score2;
            realScore2 = score1;
        }

        const spread = realScore1 - realScore2;
        const p1Spread = spread;
        const p2Spread = -spread;

        const p1Obj = players.find(p => p.player_id === match.player1_id || p.id === match.player1_id);
        const p2Obj = players.find(p => p.player_id === match.player2_id || p.id === match.player2_id);

        if (!p1Obj || !p2Obj) {
            addToHistory('Error: Could not find player details for submission.', 'error');
            return;
        }

        // Submit Result
        onResultSubmit({
            matchId: match.isVirtual ? null : match.id, // Don't pass virtual IDs to backend
            score1: realScore1,
            score2: realScore2,
            player1_id: match.player1_id, // Keep for reference
            player2_id: match.player2_id,
            player1: p1Obj, // Pass full object as required by useTournamentActions
            player2: p2Obj,
            round: activeRound,
            skipConfirmation: true // Skip confirmation modal for CLI
        });

        addToHistory(`Saved: ${p1Name} ${realScore1}, ${p2Name} ${realScore2}`, 'success');
        addToHistory(`Spread: ${Math.abs(spread)} (${spread > 0 ? p1Name : p2Name} +${Math.abs(spread)})`, 'info');

        // Update local state to reflect 'completed' so we don't match it again immediately?
        // Ideally we wait for prop update, but optimistic update is good for CLI feel.
        setRoundMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'completed' } : m));

        const remaining = roundMatches.filter(m => m.status !== 'completed' && m.id !== match.id).length;
        if (remaining === 0) {
            addToHistory(`Round ${activeRound} complete!`, 'success');
        } else {
            addToHistory(`${remaining} matches left.`, 'system');
        }
    };

    const getMatchesForRound = (round) => {
        // Check matches for this round (DB matches)
        let matchesForRound = matches.filter(m => m.round === round);

        // Fallback: Check pairing_schedule (JSON) if no DB matches found
        if (matchesForRound.length === 0 && tournamentInfo.pairing_schedule) {
            const scheduledPairings = tournamentInfo.pairing_schedule[round] || tournamentInfo.pairing_schedule[String(round)];
            if (scheduledPairings && scheduledPairings.length > 0) {
                matchesForRound = scheduledPairings
                    .filter(p => !p.player1?.isBye && !p.player2?.isBye)
                    .map((p, idx) => ({
                        id: `virtual-${round}-${idx}`, // Virtual ID
                        round: round,
                        player1_id: p.player1?.player_id || p.player1_id,
                        player2_id: p.player2?.player_id || p.player2_id,
                        status: 'pending', // Assume pending
                        isVirtual: true,
                        table_number: p.table_number // Pass table number if available
                    }));
            }
        }

        // Verify match status against existing results
        // A match is complete if it has 'status: completed' OR if a result exists for it
        // Note: Results in 'results' prop (passed from dashboard)
        // We need to pass results prop to this component in MainContent! (Wait, did I add it? Yes, MainContent has it, ensuring passthrough)
        const resultsForRound = (typeof results !== 'undefined') ? results.filter(r => r.round === round) : [];

        return matchesForRound.map(m => {
            const hasResult = resultsForRound.some(r =>
                (r.player1_id === m.player1_id && r.player2_id === m.player2_id) ||
                (r.player1_id === m.player2_id && r.player2_id === m.player1_id)
            );

            if (hasResult) {
                return { ...m, status: 'completed' };
            }
            return m;
        });
    };

    const matchName = (input, actual) => {
        if (!actual) return false;
        // return actual.toLowerCase().includes(input.toLowerCase()); // Changed to includes for more flexibility? or Keep startsWith
        // TSH usually does startsWith. "To" -> "Toyeme". "H" -> "Harold".
        // Let's stick to startsWith but ensure actual is valid
        return actual.toLowerCase().includes(input.toLowerCase());
    }

    const handleEditEntry = (cmd) => {
        addToHistory(`[EDIT] ${cmd}`, 'user');

        if (cmd.toLowerCase() === 'cancel' || cmd.toLowerCase() === 'c') {
            setMode('COMMAND');
            setEditingMatchId(null);
            addToHistory('Edit cancelled.', 'info');
            return;
        }

        const parts = cmd.split(' ').filter(x => x.trim());
        const numericParts = parts.filter(p => !isNaN(parseInt(p)));

        if (numericParts.length < 2) {
            addToHistory('Invalid format. Enter "<Score1> <Score2>" or "cancel".', 'error');
            return;
        }

        let s1 = parseInt(numericParts[0]);
        let s2 = parseInt(numericParts[1]);

        const targetMatch = results.find(r => r.id === editingMatchId);
        if (!targetMatch) {
            addToHistory('Error: Target match lost from state.', 'error');
            setMode('COMMAND');
            setEditingMatchId(null);
            return;
        }

        // Submit Update
        const p1 = { player_id: targetMatch.player1_id, name: targetMatch.player1_name };
        const p2 = { player_id: targetMatch.player2_id, name: targetMatch.player2_name };

        // Determine if we need to swap scores based on input names if provided?
        // For simplicity in CLI "edit", we assume strict P1 P2 order if names not provided.
        // If names provided, we could verify order, but let's stick to simple "Score1 Score2" based on the prompt shown.

        onResultSubmit({
            player1: p1,
            player2: p2,
            score1: s1,
            score2: s2,
            isEditing: true,
            existingId: editingMatchId,
            round: activeRound
        });

        setMode('COMMAND');
        setEditingMatchId(null);
        // Toast is handled by onResultSubmit, but add to CLI history
        addToHistory(`Updated match: ${p1.name} ${s1} - ${s2} ${p2.name}`, 'success');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (mode === 'COMMAND') {
                handleCommand(input);
            } else if (mode === 'EDIT_SINGLE') {
                handleEditEntry(input);
            } else {
                handleScoreEntry(input);
            }
            setInput('');
        }
    };

    // Focus on mount
    useEffect(() => {
        focusInput();
    }, []);

    const handleContainerClick = () => {
        if (window.getSelection().toString().length === 0) {
            focusInput();
        }
    }

    return (
        <div className="flex flex-col h-full max-h-full bg-[#000000]/60 text-green-400 font-mono text-sm p-4 rounded-none lg:rounded-xl border-0 lg:border border-slate-800/80 shadow-none overflow-hidden" onClick={handleContainerClick}>
            {/* Terminal Output */}
            <div className="flex-1 overflow-y-auto space-y-1 mb-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent" ref={scrollRef}>
                {history.map((line, i) => (
                    <div key={i} className={`${getLineColor(line.type)} break-words leading-tight`}>
                        <span className="opacity-50 mr-2 select-none">[{formatTime(line.timestamp)}]</span>
                        {line.content}
                    </div>
                ))}
            </div>

            {/* Input Line */}
            <div className="flex items-center space-x-2 border-t border-gray-800 pt-2 shrink-0">
                <span className="text-green-600 font-bold select-none">{mode === 'COMMAND' ? '>' : `DIR:R${activeRound}>`}</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-green-900 font-bold"
                    placeholder="Enter command..."
                    autoFocus
                    spellCheck="false"
                    autoComplete="off"
                />
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handlePixFileSelect}
                accept=".zip"
                style={{ display: 'none' }}
            />
        </div>
    );
};

const getLineColor = (type) => {
    switch (type) {
        case 'error': return 'text-red-500';
        case 'warning': return 'text-yellow-500';
        case 'success': return 'text-green-300';
        case 'user': return 'text-white font-bold opacity-90';
        case 'system': return 'text-blue-400';
        default: return 'text-green-400';
    }
};

const formatTime = (date) => {
    if (!date) return '00:00:00';
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default ResultsEntryCLI;
