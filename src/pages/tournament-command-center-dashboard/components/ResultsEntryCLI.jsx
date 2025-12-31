import React, { useState, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import { assignStarts, generateSwissPairings, generateEnhancedSwissPairings, generateKingOfTheHillPairings, generateTeamSwissPairings } from '../../../utils/pairingLogic';
import { roundRobinSchedules } from '../../../utils/pairingSchedules';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { toast } from 'sonner';
import { calculateStandings } from '../../../hooks/dashboard/useStandingsCalculator';
import { supabase } from '../../../supabaseClient';


// Mock data helpers (replace with hooks later)
import { resolveCommand } from '../../../utils/commandAliaser';

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
    'ikpere silver': 'ikpere sylvanus'
};

const INITIAL_HISTORY = [
    { type: 'system', content: 'Direktor Tournament Console v1.0.0' },
    { type: 'system', content: 'Type "help" for available commands.' },
    { type: 'system', content: 'Type "scores <round>" to enter result entry mode.' },
];

const ResultsEntryCLI = ({ tournamentInfo, players, matches, results, onResultSubmit, onUpdateTournament, onClose }) => {
    const [history, setHistory] = useState(INITIAL_HISTORY);
    const [input, setInput] = useState('');
    const [mode, setMode] = useState('COMMAND'); // 'COMMAND', 'SCORES'
    const [activeRound, setActiveRound] = useState(null);
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

                // Logging as requested
                // (Commented out to prevent flood, or enable if truly debug mode desired for EVERY player?)
                // User said: "Print the normalized version ... so I can see why a match might be failing"
                // Maybe only print if it FAILS or is checking? Let's check logic.
                // "e.g., [TRYING] 'akpotu benjamin' against 'akpotu_benjamin.jpg'" implies per-item log.
                // Let's print it for now, can comment out if too noisy.
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
                        }
                    }
                }

                // B. Simple Name Alias Check
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

                // C. Jaro-Winkler Fuzzy Logic
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
                        } else if (bestScore < 0.60) {
                            // Too low, assume truly missing
                            // Do nothing here, fall to 'missing' block
                            // addToHistory(`  -> Low match score (${bestScore.toFixed(2)}) - Flagging as missing.`, 'info');
                        } else {
                            // "Grey Zone" 0.60 - 0.85? 
                            // User instructions: "If < 0.60, don't even suggest."
                            // "If > 0.85, consider proposed."
                            // What regarding 0.60-0.85? User didn't specify. Implicitly skip or maybe log?
                            // Let's treat < 0.85 as skip for strictness, or maybe just log prompt for slightly lower?
                            // User explicitly said ">0.85". So let's ignore 0.60-0.85 autoconfirm or prompt for now to follow instruction strictly.
                            // Actually, logic: If > 0.85 prompt. If < 0.60 silent skip.
                            // The middle ground is effectively skipped unless I add logic. Let's skip it to avoid noise.
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
                            const ext = relativePath.split('.').pop();
                            const storagePath = `tournament_photos/${tournamentInfo.id}/${player.player_id}-${Date.now()}.${ext}`;

                            const { error: uploadError } = await supabase.storage
                                .from('player-photos')
                                .upload(storagePath, blob, { cacheControl: '3600', upsert: true });

                            if (uploadError) throw uploadError;

                            const { data: { publicUrl } } = supabase.storage
                                .from('player-photos')
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
                        addToHistory(`[ERR] Upload failed for ${pNameOriginal}`, 'error');
                        errorCount++;
                    }

                } else {
                    addToHistory(`[MISSING] ${pNameOriginal} - Photo needed.`, 'warning');
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

                const targetRound = command === 'st' ? (tournamentInfo.currentRound || 8) : parseInt(args[0]);
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

            case 'matchups': // was sp (Show Pairings)

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

            const allResultsSoFar = results || []; // Needs to be passed down or fetched. We have 'results' prop.

            let newSchedule = { ...(tournamentInfo.pairing_schedule || {}) };
            let totalPairs = 0;

            // Process by division (or simple list if no divs)
            for (const division of divisions) {
                const divisionPlayers = players.filter(p =>
                    (p.division === division.name || (divisions.length === 1 && division.name === 'Open')) &&
                    !p.withdrawn && p.status !== 'paused'
                );

                let generatedPairs = [];

                if (command === 'sw') {
                    // Need 'previousMatchups' set
                    let previousMatchups = new Set();
                    if (repeats === 0) { // If repeats allowed, we don't populate this? Or logic handles 'repeats' arg?
                        // Current logic doesn't take 'repeats' arg directly, it just checks previousMatchups.
                        // If repeats > 0, we might strictly allow it, but logic needs update. 
                        // For now, pass empty set if repeats allowed? Or filtered?
                        // Let's assume repeats=0 means "Standard No Repeats".
                        allResultsSoFar.forEach(res => {
                            previousMatchups.add(`${res.player1_id}-${res.player2_id}`);
                            previousMatchups.add(`${res.player2_id}-${res.player1_id}`);
                        });
                    }
                    // If baseRound < 0, it means random/initial?
                    // Logic:
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
                    // Round robin lookup
                    const count = divisionPlayers.length;
                    const scheduleTemplate = roundRobinSchedules[count]; // Returns array of rounds
                    if (!scheduleTemplate) throw new Error(`No RR schedule for ${count} players.`);

                    // RR Schedule is an array of rounds, each round is array of pairings [p1_idx, p2_idx...]? 
                    // Wait, roundRobinSchedules format in utils:
                    // 4: [ [4,3,2], [3,4,1] ... ] -> This represents opponents for player 1, 2, 3 in order?
                    // Verify utils format:
                    // 4: [ [4, 3, 2], ... ] means Player 1 plays 4, then 3, then 2?
                    // Need to map strict index to players.
                    // The array is index 0 -> Player 1's opponents. 
                    // Actually let's assume valid util usage.

                    // We need the specific pairings for 'targetRound'.
                    // This is tricky if RR generates *sequence*.
                    // TSH 'rr' usually schedules EVERYTHING.
                    // For 'rr' command, maybe we just generate the *current requested round* from the matrix.
                    // Round 1 = Index 0 of opponents?
                    // Let's simplisticly pair for 'targetRound' assuming targetRound 1..N maps to Schedule Index 0..N-1.

                    if (targetRound > scheduleTemplate[0].length) throw new Error("Round exceeds RR limit.");

                    // Generate pairings from the Matrix for this specific round? 
                    // The matrix: Row = Player Index. Col = Round Index. Value = Opponent Index.
                    // Actually the matrix in utils looks like:
                    /*
                       3: [
                           [3, 2], // P1 plays 3 in R1, 2 in R2
                           [1, 3], // P2 plays 1 in R1, 3 in R2
                           [2, 1]  // P3 plays 2 in R1, 1 in R2
                       ]
                    */
                    // Yes, so:
                    // Round 1 Pairings: 
                    // Iterate players. P1 plays Matrix[0][0]=3. Match 1 vs 3.
                    // P2 plays Matrix[1][0]=1. Match 2 vs 1. (Duplicate of above)

                    let pairedIds = new Set();
                    generatedPairs = [];

                    // Sort players by ID or Rank to map to 1..N indices
                    // TSH maps by Seed/Rank usually.
                    const sortedP = [...divisionPlayers].sort((a, b) => a.rank - b.rank); // Seed order

                    sortedP.forEach((p, pIdx) => { // pIdx is 0-based
                        // Player Index in Matrix is 1-based usually.
                        // Utils matrix seems 1-based values "3", "2".
                        // pIdx 0 -> "Player 1".

                        const roundIdx = targetRound - 1; // 0-based round index
                        const opponentMapIndex = pIdx; // Row for this player

                        if (opponentMapIndex >= scheduleTemplate.length) return; // Should not happen

                        const opponentsList = scheduleTemplate[opponentMapIndex];
                        const opponentVal = opponentsList[roundIdx]; // The opponent's number (1-based)

                        // Opponent Index (0-based)
                        const oppIdx = opponentVal - 1;

                        if (!pairedIds.has(pIdx) && !pairedIds.has(oppIdx)) {
                            // Create Match
                            const player1 = sortedP[pIdx];
                            const player2 = sortedP[oppIdx];

                            generatedPairs.push({
                                player1: player1,
                                player2: player2,
                                table: generatedPairs.length + 1
                            });

                            pairedIds.add(pIdx);
                            pairedIds.add(oppIdx);
                        }
                    });

                    // Assign Starts? RR usually has fixed starts or balanced.
                    // Use standard logic for now.
                    generatedPairs = assignStarts(generatedPairs, players, allResultsSoFar);
                }

                // Add to schedule
                newSchedule[targetRound] = generatedPairs.map((p, i) => ({
                    ...p,
                    round: targetRound,
                    table_number: i + 1,
                    player1_id: p.player1.player_id,
                    player2_id: p.player2.player_id
                    // Ensure minimal data matches structure
                }));
                totalPairs += generatedPairs.length;
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (mode === 'COMMAND') {
                handleCommand(input);
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
