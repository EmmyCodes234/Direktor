import React, { useState, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import { assignStarts, generateSwissPairings, generateEnhancedSwissPairings, generateKingOfTheHillPairings, generateTeamSwissPairings, generateRoundRobinSchedule, generateQuartilePairings, generateInitFontesPairings, generateTSHQuartilePairings } from '../../../utils/pairingLogic';
import { roundRobinSchedules } from '../../../utils/pairingSchedules';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { toast } from 'sonner';
import { calculateStandings } from '../../../hooks/dashboard/useStandingsCalculator';
import { supabase } from '../../../supabaseClient';


// Mock data helpers (replace with hooks later)
import { resolveCommand } from '../../../utils/commandAliaser';
import { generateTouExport } from '../../../utils/tshExport';

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
    const [mode, setMode] = useState('COMMAND'); // 'COMMAND', 'SCORES', 'EDIT_SINGLE', 'MANUAL_PAIRING'
    const [activeRound, setActiveRound] = useState(null);
    const [editingMatchId, setEditingMatchId] = useState(null);
    const [roundMatches, setRoundMatches] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const inputRef = useRef(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const confirmationResolver = useRef(null);
    const cliSettings = useRef({ max_consecutive: 0, rr_consecutive: 1 });

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

        if (mode === 'MANUAL_PAIRING') {
            if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'done') {
                setMode('COMMAND');
                setActiveRound(null);
                addToHistory('Exited Manual Pairing Mode.', 'system');
                return;
            }

            // Parse Manual Pairing Input: "PlayerA PlayerB"
            // Support formats: "P1, P2" or "P1 vs P2" or "P1 P2"
            let p1Query = '';
            let p2Query = '';

            // 1. Check for Comma
            if (trimmed.includes(',')) {
                const parts = trimmed.split(',');
                if (parts.length >= 2) {
                    p1Query = parts[0].trim();
                    p2Query = parts[1].trim();
                }
            }
            // 2. Check for " vs "
            else if (trimmed.toLowerCase().includes(' vs ')) {
                const parts = trimmed.split(/\s+vs\s+/i);
                if (parts.length >= 2) {
                    p1Query = parts[0].trim();
                    p2Query = parts[1].trim();
                }
            }
            // 3. Space separated (heuristic: split at valid name boundaries? Hard.)
            // Assumption: User entered "Name1 Name2". 
            // If Names have spaces (e.g. "Van Damme"), this breaks.
            // fallback: Split by first space if 2 words? 
            // Or try to match longest prefix from start?
            else {
                const parts = trimmed.split(/\s+/);
                if (parts.length === 2) {
                    p1Query = parts[0];
                    p2Query = parts[1];
                } else {
                    // Try to see if we can fuzzy match the whole string against 2 names? No.
                    // Let's assume for now 2 words = 2 names if no comma.
                    // If > 2 words, we can't guess easily without commas.
                    addToHistory('Ambiguous input. Please use comma for multi-word names (e.g. "John Doe, Jane").', 'warning');
                    return;
                }
            }

            if (!p1Query || !p2Query) {
                addToHistory('Invalid format. Use: "Player1, Player2" or "P1 P2"', 'error');
                return;
            }

            // Fuzzy resolve
            const findFuzzy = (query) => {
                const q = normalizeStrict(query);
                if (!q) return null;

                // 1. Exact/Strict
                const exact = players.find(p => normalizeStrict(p.name) === q || normalizeStrict(p.first_name) === q);
                if (exact) return exact;

                // 2. StartsWith
                const starts = players.find(p => normalizeStrict(p.name).startsWith(q) || normalizeStrict(p.first_name).startsWith(q));
                if (starts) return starts;

                // 3. Jaro/Includes
                // Sort candidates by match quality
                const candidates = players.map(p => {
                    const n = normalizeStrict(p.name);
                    const fn = normalizeStrict(p.first_name);
                    let score = 0;
                    if (n.includes(q)) score += 0.5;
                    if (fn.includes(q)) score += 0.5;
                    // Jaro
                    const j1 = jaroWinkler(n, q);
                    const j2 = jaroWinkler(fn, q);
                    score += Math.max(j1, j2);
                    return { p, score };
                }).filter(x => x.score > 0.6).sort((a, b) => b.score - a.score);

                return candidates.length > 0 ? candidates[0].p : null;
            };

            const p1 = findFuzzy(p1Query);
            const p2 = findFuzzy(p2Query);

            if (!p1) {
                addToHistory(`Player not found: "${p1Query}"`, 'error');
                return;
            }
            if (!p2) {
                addToHistory(`Player not found: "${p2Query}"`, 'error');
                return;
            }

            if (p1.player_id === p2.player_id) {
                addToHistory('Cannot pair player with themselves.', 'error');
                return;
            }

            // Check if already paired in THIS round
            const existing = tournamentInfo.pairing_schedule?.[activeRound] || [];
            const isP1Paired = existing.some(m => m.player1?.player_id === p1.player_id || m.player2?.player_id === p1.player_id);
            const isP2Paired = existing.some(m => m.player1?.player_id === p2.player_id || m.player2?.player_id === p2.player_id);

            if (isP1Paired) {
                addToHistory(`${p1.name} is already paired in Round ${activeRound}.`, 'error');
                return;
            }
            if (isP2Paired) {
                addToHistory(`${p2.name} is already paired in Round ${activeRound}.`, 'error');
                return;
            }

            // Add Pairing
            addToHistory(`Paired: ${p1.name} vs ${p2.name}`, 'success');

            // Update State & DB
            const oldRound = tournamentInfo.pairing_schedule?.[activeRound] || [];

            // 1. Identify Used Tables
            const usedTables = new Set();
            oldRound.forEach(m => {
                if (m.table_number) usedTables.add(m.table_number);
                if (m.table) usedTables.add(m.table);
            });

            // 2. Determine Target Table
            const reserved = cliSettings.current.reserved_tables || {};
            let targetTable = null;

            if (reserved[p1.player_id]) targetTable = reserved[p1.player_id];
            else if (reserved[p2.player_id]) targetTable = reserved[p2.player_id];

            // Helper to find lowest free table
            const findFreeTable = () => {
                let t = 1;
                while (usedTables.has(t)) t++;
                return t;
            };

            let matchesToUpdate = [...oldRound];

            if (targetTable) {
                // Check collision
                if (usedTables.has(targetTable)) {
                    // Collision! Find who is there
                    const collisionIndex = matchesToUpdate.findIndex(m => m.table === targetTable || m.table_number === targetTable);
                    if (collisionIndex !== -1) {
                        const newTableForExisting = findFreeTable();
                        usedTables.add(newTableForExisting); // Mark used

                        // Update existing match
                        const existingMatch = { ...matchesToUpdate[collisionIndex] };
                        existingMatch.table = newTableForExisting;
                        existingMatch.table_number = newTableForExisting;
                        matchesToUpdate[collisionIndex] = existingMatch;

                        addToHistory(`[SWAP] Table ${targetTable} is reserved. Moved existing match to Table ${newTableForExisting}.`, 'warning');
                    }
                }
                // Assign
            } else {
                // No reservation, find next free
                targetTable = findFreeTable();
            }

            // 3. Create New Match
            let tempMatch = {
                table: targetTable,
                round: activeRound,
                player1: p1,
                player2: p2,
                player1_id: p1.player_id, // Ensure flattened IDs exist
                player2_id: p2.player_id
            };

            // Apply 'assignStarts' logic to determine who goes first based on H2H/Stats
            const [finalMatch] = assignStarts([tempMatch], players, results || []);

            // Add to list
            matchesToUpdate.push(finalMatch);

            onUpdateTournament(prev => {
                const newSchedule = {
                    ...(prev.pairing_schedule || {}),
                    [activeRound]: matchesToUpdate
                };

                // DB Sync
                supabase.from('tournaments')
                    .update({ pairing_schedule: newSchedule })
                    .eq('id', tournamentInfo.id)
                    .then(res => {
                        if (res.error) toast.error('Failed to save manual pairing');

                        else toast.success('Manual Pairing Saved');
                    });

                return { ...prev, pairing_schedule: newSchedule };
            });
            return;
            return;
        }

        const { command, args } = resolveCommand(trimmed);


        switch (command) {
            case 'help':
                addToHistory('Available commands:', 'system');
                addToHistory('  scores <round>                - Enter result entry mode', 'info');
                addToHistory('  man <round>                   - Manual Pairing Mode', 'info');
                addToHistory('  miss                          - List pending matches (in SCORES mode)', 'info');
                addToHistory('  missing <round>               - List pending matches (in COMMAND mode)', 'info');
                addToHistory('  rosters                       - View player roster', 'info');
                addToHistory('  withdraw <player>             - Withdraw player (Alias: off)', 'info');
                addToHistory('  rejoin <player>               - Rejoin player (Alias: on)', 'info');
                addToHistory('  floss <round> <player>        - Assign Forfeit Loss to player', 'info');
                addToHistory('  dry <round>                   - Simulate remaining rounds (Dry Run)', 'info');
                addToHistory('  ns [repeats] [base]           - National Swiss (TSH style)', 'info');
                addToHistory('  sw <round> <base> <repeats>   - Standard Swiss Pairings', 'info');
                addToHistory('  q [round]                     - Quartile / Fontes Swiss (Single Round)', 'info');
                addToHistory('  pq <target> [rep] [base]      - TSH Quartile Pairings (e.g. pq 4 0 12)', 'info');
                addToHistory('  initfontes [rounds]           - Initialize Fontes cycle (Multi-round)', 'info');
                addToHistory('  koth <repeats> <base>         - King of the Hill Pairings', 'info');
                addToHistory('  rr <repeats>                  - Generate Round Robin', 'info');
                addToHistory('  abs                           - Assign BYEs to all unpaired players', 'info');
                addToHistory('  delpair <table>               - Delete pairing at specific table (Current Round)', 'info');
                addToHistory('  set <param> <val>             - Update CLI settings (max_consecutive, rr_consecutive)', 'info');
                addToHistory('  sp <round>                    - Show Pairings for round', 'info');
                addToHistory('  upr <round>                   - Unpair a round', 'info');
                addToHistory('  st                            - Show Standings (Current)', 'info');
                addToHistory('  rs <round>                    - Show Standings for Round', 'info');
                addToHistory('  sc                            - Show Scorecards', 'info');
                addToHistory('  stats                         - Update/Recalc Stats', 'info');
                addToHistory('  ratings <round>               - Calculate Glicko ratings', 'info');
                addToHistory('  clear                         - Clear screen', 'info');
                addToHistory('  export                        - Export .TOU file', 'info');
                addToHistory('  exit                          - Close console', 'info');
                break;

            case 'set':
                if (args.length < 2) {
                    addToHistory('Usage: set <param> <value>', 'error');
                    addToHistory('Params: max_consecutive (int), rr_consecutive (int)', 'info');
                    break;
                }
                const param = args[0].toLowerCase();
                const val = parseInt(args[1]);
                if (isNaN(val)) {
                    addToHistory('Value must be a number.', 'error');
                    break;
                }

                if (param === 'max_consecutive') {
                    cliSettings.current.max_consecutive = val;
                    addToHistory(`Setting updated: max_consecutive = ${val}`, 'success');
                } else if (param === 'rr_consecutive') {
                    cliSettings.current.rr_consecutive = val;
                    addToHistory(`Setting updated: rr_consecutive = ${val}`, 'success');
                } else {
                    addToHistory(`Unknown parameter: ${param}`, 'error');
                }
                break;

            case 'abs': // Assign Byes to Singles
                // Logic: Find all active players NOT present in pairing_schedule[currentRound]
                // Assign them a BYE pairing (350-0)
                const absRound = tournamentInfo.current_round;
                if (!absRound) {
                    addToHistory('No active round found.', 'error');
                    break;
                }
                addToHistory(`Assigning Byes to unpaired players in Round ${absRound}...`, 'system');

                const currentSched = tournamentInfo.pairing_schedule?.[absRound] || [];
                const pairedIds = new Set();
                currentSched.forEach(m => {
                    if (m.player1?.player_id) pairedIds.add(m.player1.player_id);
                    if (m.player2?.player_id) pairedIds.add(m.player2.player_id);
                });

                const unpaired = players.filter(p =>
                    !p.withdrawn &&
                    p.status !== 'withdrawn' &&
                    p.status !== 'paused' &&
                    !pairedIds.has(p.player_id)
                );

                if (unpaired.length === 0) {
                    addToHistory('No unpaired players found.', 'warning');
                    break;
                }

                const newByes = [];
                let maxTbl = Math.max(0, ...currentSched.map(m => typeof m.table === 'number' ? m.table : 0));

                unpaired.forEach(p => {
                    newByes.push({
                        table: 'BYE',
                        round: absRound,
                        player1: p,
                        player2: { name: 'BYE', player_id: null, isBye: true }
                    });
                    addToHistory(`Assigned BYE to ${p.name}`, 'info');
                });

                // Confirm with user? No, direct action.

                onUpdateTournament(prev => {
                    const existing = prev.pairing_schedule?.[absRound] || [];
                    const updatedSched = {
                        ...(prev.pairing_schedule || {}),
                        [absRound]: [...existing, ...newByes]
                    };

                    supabase.from('tournaments')
                        .update({ pairing_schedule: updatedSched })
                        .eq('id', tournamentInfo.id)
                        .then(); // fire and forget

                    return { ...prev, pairing_schedule: updatedSched };
                });
                addToHistory(`Assigned ${newByes.length} Byes.`, 'success');
                break;

            case 'delpair': // delpair [round] <table>
                if (!args[0]) {
                    addToHistory('Usage: delpair [round] <table>', 'error');
                    break;
                }

                let dpRound, dpTable;
                if (args.length === 1) {
                    dpRound = tournamentInfo.current_round;
                    dpTable = args[0];
                } else {
                    dpRound = parseInt(args[0]);
                    dpTable = args[1];
                }

                if (isNaN(dpRound)) {
                    addToHistory('Invalid round.', 'error');
                    break;
                }

                const dpSched = tournamentInfo.pairing_schedule?.[dpRound] || [];
                const dpIndex = dpSched.findIndex(m => String(m.table) === String(dpTable) || String(m.table_number) === String(dpTable));

                if (dpIndex === -1) {
                    addToHistory(`Table ${dpTable} not found in Round ${dpRound}.`, 'error');
                    break;
                }

                const dpMatch = dpSched[dpIndex];
                addToHistory(`Deleting pairing: ${dpMatch.player1?.name} vs ${dpMatch.player2?.name}`, 'warning');

                const newDpSched = [...dpSched];
                newDpSched.splice(dpIndex, 1);

                onUpdateTournament(prev => {
                    const updated = {
                        ...(prev.pairing_schedule || {}),
                        [dpRound]: newDpSched
                    };
                    supabase.from('tournaments')
                        .update({ pairing_schedule: updated })
                        .eq('id', tournamentInfo.id)
                        .then();
                    return { ...prev, pairing_schedule: updated };
                });
                addToHistory('Pairing deleted.', 'success');
                break;

            case 'dry':
                // Usage: dry [start_round]
                const dryStartArg = parseInt(args[0]);
                let dryStartRound = (tournamentInfo.current_round || 0);

                if (!isNaN(dryStartArg) && dryStartArg > 0) {
                    dryStartRound = dryStartArg;
                }

                const totalRounds = tournamentInfo.settings?.rounds || tournamentInfo.rounds || 10;

                if (dryStartRound >= totalRounds) {
                    addToHistory(`Tournament finished or invalid start round (${dryStartRound} >= ${totalRounds}).`, 'warning');
                    break;
                }

                addToHistory(`Starting Dry Run Simulation from Round ${dryStartRound + 1} to ${totalRounds}...`, 'system');
                addToHistory('WARNING: This generates random data. Type "clear" to clear logs if needed.', 'warning');

                try {
                    // Clone data for simulation
                    let simResults = [...(results || [])];
                    const simPlayers = players.map(p => ({ ...p, wins: 0, ties: 0, spread: 0 }));

                    for (let r = dryStartRound + 1; r <= totalRounds; r++) {
                        addToHistory(`Simulating Round ${r}...`, 'info');

                        // 1. Calculate Stats based on CURRENT simResults
                        const simStandings = calculateStandings(players, simResults, [], tournamentInfo);
                        // Filter for active players
                        const activeSimPlayers = simStandings.filter(p => !p.withdrawn && p.status !== 'withdrawn' && p.status !== 'paused');

                        // 2. Generate Pairings
                        const previousMatchups = new Set();
                        simResults.forEach(res => {
                            previousMatchups.add(`${res.player1_id}-${res.player2_id}`);
                            previousMatchups.add(`${res.player2_id}-${res.player1_id}`);
                        });

                        const pairings = generateSwissPairings(activeSimPlayers, previousMatchups, simResults, r, 0, {});

                        // 3. Generate Random Results
                        const roundResults = [];

                        for (const p of pairings) {
                            if (p.table === 'BYE' || p.player2.name === 'BYE') {
                                const p1 = p.player1;
                                roundResults.push({
                                    tournament_id: tournamentInfo.id,
                                    round: r,
                                    player1_id: p1.player_id || p1.id,
                                    player2_id: null,
                                    score1: 350,
                                    score2: 0,
                                    player1_name: p1.name,
                                    player2_name: 'BYE',
                                    verified: true
                                });
                            } else {
                                const p1 = p.player1;
                                const p2 = p.player2;

                                const rating1 = p1.rating || 1200;
                                const rating2 = p2.rating || 1200;
                                const p1WinProb = 0.5 + ((rating1 - rating2) / 2000); // 100 diff = 0.55

                                const rand = Math.random();
                                let s1, s2;

                                if (rand < p1WinProb) {
                                    s1 = 300 + Math.floor(Math.random() * 150);
                                    s2 = s1 - (10 + Math.floor(Math.random() * 100));
                                } else {
                                    s2 = 300 + Math.floor(Math.random() * 150);
                                    s1 = s2 - (10 + Math.floor(Math.random() * 100));
                                }

                                roundResults.push({
                                    tournament_id: tournamentInfo.id,
                                    round: r,
                                    player1_id: p1.player_id || p1.id,
                                    player2_id: p2.player_id || p2.id,
                                    score1: s1,
                                    score2: s2,
                                    player1_name: p1.name,
                                    player2_name: p2.name,
                                    verified: true
                                });
                            }
                        }

                        simResults.push(...roundResults);

                        // Batch insert
                        const { error: resErr } = await supabase.from('results').insert(roundResults);
                        if (resErr) {
                            addToHistory(`Error saving Round ${r}: ${resErr.message}`, 'error');
                            break;
                        }
                    }

                    addToHistory('Simulation Complete. Updating Tournament State...', 'system');

                    // Update Tournament Current Round to Final
                    await supabase.from('tournaments')
                        .update({ current_round: totalRounds })
                        .eq('id', tournamentInfo.id);

                    onUpdateTournament(prev => ({ ...prev, current_round: totalRounds })); // Trigger refresh

                } catch (e) {
                    addToHistory(`Simulation Failed: ${e.message}`, 'error');
                }
                break;


            case 'off':
            case 'withdraw':
                // Usage: withdraw <player_id_or_name>
                if (!args[0]) {
                    addToHistory('Usage: withdraw <player>', 'error');
                    break;
                }
                const wPlayer = players.find(p =>
                    String(p.id) === args[0] ||
                    String(p.player_id) === args[0] ||
                    normalizeStrict(p.name).includes(normalizeStrict(args.join(' ')))
                );

                if (!wPlayer) {
                    addToHistory(`Player not found: ${args.join(' ')}`, 'error');
                } else {
                    addToHistory(`Withdrawing ${wPlayer.name}...`, 'info');
                    const { error } = await supabase
                        .from('tournament_players')
                        .update({ status: 'withdrawn' })
                        .eq('tournament_id', tournamentInfo.id)
                        .eq('player_id', wPlayer.player_id || wPlayer.id); // Handle both id fields

                    if (error) {
                        addToHistory(`Failed: ${error.message}`, 'error');
                    } else {
                        addToHistory('Player updated to Withdrawn.', 'success');
                        onUpdateTournament(prev => ({ ...prev })); // Force refresh trigger
                    }
                }
                break;

            case 'on':
            case 'rejoin':
                // Usage: rejoin <player_id_or_name>
                if (!args[0]) {
                    addToHistory('Usage: rejoin <player>', 'error');
                    break;
                }
                const rPlayer = players.find(p =>
                    String(p.id) === args[0] ||
                    String(p.player_id) === args[0] ||
                    normalizeStrict(p.name).includes(normalizeStrict(args.join(' ')))
                );

                if (!rPlayer) {
                    addToHistory(`Player not found: ${args.join(' ')}`, 'error');
                } else {
                    addToHistory(`Rejoining ${rPlayer.name}...`, 'info');
                    const { error } = await supabase
                        .from('tournament_players')
                        .update({ status: 'active' })
                        .eq('tournament_id', tournamentInfo.id)
                        .eq('player_id', rPlayer.player_id || rPlayer.id);

                    if (error) {
                        addToHistory(`Failed: ${error.message}`, 'error');
                    } else {
                        addToHistory('Player updated to Active.', 'success');
                        onUpdateTournament(prev => ({ ...prev }));
                    }
                }
                break;

            case 'floss':
                // Usage: floss <round> <player> [spread]
                // Example: floss 3 105 50
                // Logic: Find match in round 3 where player 105 is playing. Mark 105 as Loser (score 0?), Opponent as Winner (score 50?).
                if (args.length < 2) {
                    addToHistory('Usage: floss <round> <player> [spread]', 'error');
                    break;
                }

                const fRound = parseInt(args[0]);
                const fTargetArg = args[1];
                const fSpread = parseInt(args[2]) || 50; // Default spread 50?

                if (isNaN(fRound)) {
                    addToHistory('Invalid round.', 'error');
                    break;
                }

                const fPlayer = players.find(p =>
                    String(p.id) === fTargetArg ||
                    String(p.player_id) === fTargetArg ||
                    normalizeStrict(p.name).includes(normalizeStrict(fTargetArg))
                );

                if (!fPlayer) {
                    addToHistory(`Player not found: ${fTargetArg}`, 'error');
                    break;
                }

                // Find Match
                // Matches are in 'results' for past rounds OR 'matches' (if not finalized?)
                // Actually 'results' usually stores confirmed round outcomes.
                // 'tournamentInfo.pairing_schedule[round]' holds the pairing.

                const roundSchedule = tournamentInfo.pairing_schedule?.[fRound] || [];
                const targetMatch = roundSchedule.find(m =>
                    (m.player1?.player_id === fPlayer.player_id || m.player1?.player_id === fPlayer.id) ||
                    (m.player2?.player_id === fPlayer.player_id || m.player2?.player_id === fPlayer.id)
                );

                if (!targetMatch) {
                    addToHistory(`No match found for ${fPlayer.name} in Round ${fRound}.`, 'warning');
                    break;
                }

                // Determine P1/P2 roles
                const isP1 = (targetMatch.player1?.player_id === fPlayer.player_id || targetMatch.player1?.player_id === fPlayer.id);
                // Assign Scores: Loser = 0 (or -spread?), Winner = spread?
                // TSH "Forfeit Loss" usually means 0-X? Or user said "appropriate spreads".
                // Let's assume Winner gets +Spread, Loser gets 0? Or Winner=Spread, Loser=-Spread?
                // Standard: Winner = +Spread, Loser = 0.

                // If it's a Bye?
                if (targetMatch.player2?.isBye || targetMatch.player1?.isBye) {
                    addToHistory(`${fPlayer.name} has a BYE in Round ${fRound}.`, 'warning');
                    break;
                }

                const score1 = isP1 ? 0 : fSpread;
                const score2 = isP1 ? fSpread : 0;

                // Submit Result
                // We use onResultSubmit logic reuse? Or direct DB?
                // onResultSubmit expects { matchId (if exists), round, scores... }
                // But pairing_schedule doesn't always have DB match IDs until results are saved.
                // We better use direct result insertion/upsert like the ScoreEntryModal.

                try {
                    const resultPayload = {
                        tournament_id: tournamentInfo.id,
                        round: fRound,
                        player1_id: targetMatch.player1.player_id || targetMatch.player1.id,
                        player2_id: targetMatch.player2.player_id || targetMatch.player2.id,
                        score1: score1,
                        score2: score2,
                        verified: true,
                        is_forfeit: true // maybe add metadata?
                    };

                    addToHistory(`Assigning Forfeit: ${fPlayer.name} (L) vs ${isP1 ? targetMatch.player2.name : targetMatch.player1.name} (W)`, 'info');

                    // Check if result exists to update
                    const existingRes = results.find(r =>
                        r.round === fRound &&
                        r.player1_id === resultPayload.player1_id &&
                        r.player2_id === resultPayload.player2_id
                    );

                    if (existingRes) {
                        const { error } = await supabase.from('results').update(resultPayload).eq('id', existingRes.id);
                        if (error) throw error;
                    } else {
                        const { error } = await supabase.from('results').insert(resultPayload);
                        if (error) throw error;
                    }

                    addToHistory(`Result recorded: ${score1}-${score2}`, 'success');
                    // Refresh
                    onUpdateTournament(prev => ({ ...prev }));
                } catch (e) {
                    addToHistory(`Error saving result: ${e.message}`, 'error');
                }

                break;

            case 'ratings':
                // Check if admin capability exists later or assume accessible for dashboard user
                if (!args[0]) {
                    addToHistory('Usage: ratings <round_number> or <start>-<end>', 'error');
                    break;
                }

                let startRound, endRound;
                if (args[0].includes('-')) {
                    const parts = args[0].split('-');
                    startRound = parseInt(parts[0]);
                    endRound = parseInt(parts[1]);
                } else {
                    startRound = parseInt(args[0]);
                    endRound = startRound;
                }

                if (isNaN(startRound) || isNaN(endRound)) {
                    addToHistory('Invalid round number(s).', 'error');
                    break;
                }

                setIsProcessing(true);

                try {
                    const { processRoundRatings } = await import('../../../services/ratingService');

                    for (let r = startRound; r <= endRound; r++) {
                        addToHistory(`Processing Round ${r}...`, 'info');
                        const result = await processRoundRatings(tournamentInfo.id, r);

                        // Show verbose logs if available
                        if (result.logs && result.logs.length > 0) {
                            result.logs.forEach(log => {
                                let type = 'info';
                                if (log.startsWith('[Error]')) type = 'error';
                                if (log.startsWith('[Success]')) type = 'success';
                                if (log.startsWith('[Debug]')) type = 'warning';
                                addToHistory(log, type);
                            });
                        }

                        if (result.success) {
                            addToHistory(`Round ${r}: Updated ${result.updated} players.`, 'success');
                        } else {
                            addToHistory(`Round ${r} Failed: ${result.message || 'Unknown error'}`, 'error');
                            // If a round fails in a chain, we should probably stop to preserve integrity
                            addToHistory('Batch processing stopped due to error.', 'error');
                            break;
                        }
                    }
                    addToHistory('Batch processing complete.', 'success');

                } catch (err) {
                    addToHistory(`Error: ${err.message}`, 'error');
                } finally {
                    setIsProcessing(false);
                }
                break;



            case 'export':
                addToHistory('Generating tournament file (.tou)...', 'system');

                await generateTouExport(tournamentInfo, players, results, addToHistory);







                break;

            case 'clear':
                setHistory([]);
                break;

            case 'exit':
                onClose();
                break;

            case 'field':
            case 'rosters':
                const divisions = tournamentInfo.divisions && tournamentInfo.divisions.length > 0 ? tournamentInfo.divisions : [{ name: 'Open' }];
                let totalPlayers = 0;

                divisions.forEach(div => {
                    const divPlayers = players
                        .filter(p => (p.division || 'Open') === div.name)
                        .sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Sort by rating descending

                    if (divPlayers.length > 0) {
                        addToHistory(`Division: ${div.name.toUpperCase()} (${divPlayers.length})`, 'highlight');
                        addToHistory(`  ID  | NAME                          | RATING | TEAM`, 'info');
                        addToHistory(`  --- | ----------------------------- | ------ | ----`, 'info');
                        divPlayers.forEach(p => {
                            const teamName = p.team_id ? (teams?.find(t => t.id === p.team_id)?.name || '-') : '-';
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

            case 'leaderboard': // was st
            case 'rs': // Round Standings (not mapped, kept as is)

                if (!args[0] && command === 'rs') {
                    addToHistory('Usage: rs <round> or <start>-<end>', 'error');
                    break;
                }

                // Parse Range or Single Round
                let stStart, stEnd;
                if (command === 'st' || command === 'leaderboard') {
                    stStart = tournamentInfo.current_round || 1;
                    stEnd = stStart;
                } else {
                    if (args[0].includes('-')) {
                        const parts = args[0].split('-');
                        stStart = parseInt(parts[0]);
                        stEnd = parseInt(parts[1]);
                    } else {
                        stStart = parseInt(args[0]);
                        stEnd = stStart;
                    }
                }

                if (isNaN(stStart) || isNaN(stEnd)) {
                    addToHistory('Invalid round number(s).', 'error');
                    break;
                }

                for (let r = stStart; r <= stEnd; r++) {
                    const targetRound = r;
                    addToHistory(`Round ${targetRound} Standings`, 'system');
                    addToHistory('', 'info');
                    addToHistory('Rnk Won-Lost Sprd Player                   Last Game', 'info');

                    // Calculate standings for the specific round or use live ranked players
                    let sortedStandings;
                    if (command === 'rs') {
                        const filteredResults = results.filter(res => res.round <= targetRound);
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
                    addToHistory('----------------------------------------', 'info');
                }
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
                    addToHistory('Usage: sp <round> or <start>-<end>', 'error');
                    break;
                }

                let spStart, spEnd;
                if (args[0].includes('-')) {
                    const parts = args[0].split('-');
                    spStart = parseInt(parts[0]);
                    spEnd = parseInt(parts[1]);
                } else {
                    spStart = parseInt(args[0]);
                    spEnd = spStart;
                }

                if (isNaN(spStart) || isNaN(spEnd)) {
                    addToHistory('Invalid round number(s).', 'error');
                    break;
                }

                for (let r = spStart; r <= spEnd; r++) {
                    const showMatches = getMatchesForRound(r);
                    if (showMatches.length === 0) {
                        addToHistory(`No pairings found for Round ${r}.`, 'warning');
                    } else {
                        addToHistory(`Round ${r} Ranked Pairings`, 'system');
                        addToHistory('', 'info');
                        addToHistory('Table Who Plays Whom', 'info');
                        showMatches.forEach((m, idx) => {
                            const p1Name = getPlayerName(m.player1_id);
                            const p2Name = getPlayerName(m.player2_id);
                            const p1Seed = getPlayerSeed(m.player1_id);
                            const p2Seed = getPlayerSeed(m.player2_id);
                            const table = String(idx + 1).padStart(4);

                            addToHistory(`${table}  ${p1Name} (#${p1Seed}) *first* vs. ${p2Name} (#${p2Seed}).`, 'info');
                        });
                        addToHistory('----------------------------------------', 'info');
                    }
                }
                break;

            case 'trr': // Team Round Robin: trr [round]
            case 'ts':
            case 'ns': // National Swiss: ns <repeats> <base>


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

            case 'commentary':
            case 'comm': // Alias
                if (args.length === 0) {
                    addToHistory('Usage: commentary <round>', 'error');
                    return;
                }
                const commRound = parseInt(args[0]);
                if (isNaN(commRound)) {
                    addToHistory('Invalid round number.', 'error');
                    return;
                }

                // 1. Gather Data
                addToHistory(`[AI] Gathering data for Round ${commRound}...`, 'system');

                // Get results UP TO this round for standings context
                const resultsSoFar = results.filter(r => r.round <= commRound);
                if (resultsSoFar.length === 0) {
                    addToHistory(`No results found up to Round ${commRound}.`, 'error');
                    return;
                }

                // Calculate standings at that point
                const commStandings = calculateStandings(players, resultsSoFar, [], tournamentInfo);

                // Get specific round results for "Key Matchups" usage
                const commRoundResults = resultsSoFar.filter(r => r.round === commRound);

                // Format top matches for the service
                // Find top 10 logic or just grab the ones played by top ranked players?
                // The service expects [{ p1, p2, winner, score }]
                // Let's grab pairings involving top 10 seeds or top 10 current ranks
                const topRankIds = new Set(commStandings.slice(0, 8).map(p => p.player_id));
                const highlightMatches = commRoundResults.filter(r =>
                    topRankIds.has(r.player1_id) || topRankIds.has(r.player2_id)
                ).map(r => {
                    const p1 = players.find(p => p.player_id === r.player1_id)?.name || 'Unknown';
                    const p2 = players.find(p => p.player_id === r.player2_id)?.name || 'Unknown';
                    const w = r.score1 > r.score2 ? p1 : p2;
                    return { p1, p2, winner: w, score: `${r.score1}-${r.score2}` };
                });

                // 2. Call AI
                addToHistory(`[AI] Generating commentary with Cerebras...`, 'info');
                try {
                    const report = await CerebrasService.generateDetailedRoundReport(commStandings, commRound, highlightMatches);

                    if (report && !report.error && report.summary !== 'No content generated') {
                        // 3. Save to DB
                        const { error: dbError } = await supabase
                            .from('round_commentaries')
                            .upsert({
                                tournament_id: tournamentInfo.id,
                                round: commRound,
                                content: report,
                                created_at: new Date()
                            }, { onConflict: 'tournament_id, round' });

                        if (dbError) throw dbError;

                        addToHistory(`[SUCCESS] Commentary for Round ${commRound} generated and saved!`, 'success');
                        addToHistory(`Summary: ${report.summary}`, 'info');
                    } else {
                        addToHistory(`[AI] Generation failed or returned empty.`, 'error');
                    }
                } catch (err) {
                    console.error(err);
                    addToHistory(`[ERR] Failed: ${err.message}`, 'error');
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

            case 'reserve': // reserve <table> <player>
                if (args.length < 2) {
                    addToHistory('Usage: reserve <table> <player>', 'error');
                    break;
                }
                const resTable = parseInt(args[0]);
                const resPlayerName = args.slice(1).join(' ');

                if (isNaN(resTable)) {
                    addToHistory('Invalid table number.', 'error');
                    break;
                }

                const resPlayer = players.find(p =>
                    normalizeStrict(p.name).includes(normalizeStrict(resPlayerName))
                );

                if (!resPlayer) {
                    addToHistory(`Player "${resPlayerName}" not found.`, 'error');
                    break;
                }

                if (!cliSettings.current.reserved_tables) cliSettings.current.reserved_tables = {};
                cliSettings.current.reserved_tables[resPlayer.player_id] = resTable;

                addToHistory(`Reserved Table ${resTable} for ${resPlayer.name}.`, 'success');
                break;

            case 'movediv': // movediv <player> <new_div>
                if (args.length < 2) {
                    addToHistory('Usage: movediv <player> <new_division>', 'error');
                    break;
                }
                const newDiv = args[args.length - 1];
                const movePlayerName = args.slice(0, args.length - 1).join(' ');

                const movePlayer = players.find(p =>
                    normalizeStrict(p.name).includes(normalizeStrict(movePlayerName))
                );

                if (!movePlayer) {
                    addToHistory(`Player "${movePlayerName}" not found.`, 'error');
                    break;
                }

                // Update Player
                const updatedDivPlayers = players.map(p =>
                    p.player_id === movePlayer.player_id ? { ...p, division: newDiv } : p
                );

                // Assuming onUpdateMatches or similar up-prop exists, but mostly we treat 'players' as prop.
                // We need to update DB.
                supabase.from('tournament_players')
                    .update({ division: newDiv })
                    .eq('player_id', movePlayer.player_id)
                    .eq('tournament_id', tournamentInfo.id)
                    .then(({ error }) => {
                        if (error) addToHistory(`Failed to move division: ${error.message}`, 'error');
                        else {
                            addToHistory(`Moved ${movePlayer.name} to division "${newDiv}".`, 'success');
                            // We can't easily force-refresh parents here without a reload trigger, 
                            // but if 'players' prop updates from subscription it will reflect.
                        }
                    });
                break;


            case 'upr': // unpair round <round>
                if (args.length < 1) {
                    addToHistory('Usage: upr <round>', 'error');
                    break;
                }
                const uprRoundStr = args[0];
                const uprRound = parseInt(uprRoundStr);

                if (isNaN(uprRound)) {
                    addToHistory('Invalid round number.', 'error');
                    break;
                }

                // Check if round has ANY completed results
                const hasResults = results.some(r => r.round === uprRound);
                if (hasResults) {
                    addToHistory(`Cannot unpair Round ${uprRound}. Results exist. Delete them first using 'delete' command or clear the round.`, 'error');
                    break;
                }

                // Check if round exists in schedule
                const currentSchedule = tournamentInfo.pairing_schedule || {};
                // Note: pairing_schedule keys are strings in JSON, but we use integer access usually.
                // Let's check if there are matches for this round in the schedule map
                if (!currentSchedule[uprRound]) {
                    addToHistory(`Round ${uprRound} is not paired or not found in schedule.`, 'warning');
                    // Continue anyway? Use force? No, just return.
                    break;
                }

                // Proceed to unpair
                // We update local state via onUpdateTournament which will merge the changes
                onUpdateTournament(prev => {
                    const newSchedule = { ...prev.pairing_schedule };
                    delete newSchedule[uprRound];

                    // Determine new current round.
                    // If we unpair the CURRENT round, we step back.
                    // If we unpair a FUTURE round, current round stays same.
                    // If we unpair a PAST round (but no results?), we stay same?
                    // Safe bet: If uprRound == prev.current_round, step back.
                    let newCurrentRound = prev.current_round;
                    if (prev.current_round === uprRound) {
                        newCurrentRound = Math.max(0, uprRound - 1);
                    }

                    // Async Update DB
                    supabase.from('tournaments')
                        .update({
                            pairing_schedule: newSchedule,
                            current_round: newCurrentRound
                        })
                        .eq('id', tournamentInfo.id)
                        .then(res => {
                            if (res.error) {
                                toast.error("Unpair Failed");
                                addToHistory(`[ERR] Database update failed: ${res.error.message}`, 'error');
                            } else {
                                toast.success(`Round ${uprRound} Unpaired`);
                            }
                        });

                    return {
                        ...prev,
                        pairing_schedule: newSchedule,
                        current_round: newCurrentRound
                    };
                });

                addToHistory(`Round ${uprRound} pairings removed.`, 'success');
                break;

            case 'man': // manual pairing
                if (args.length < 1) {
                    addToHistory('Usage: man <round>', 'error');
                    break;
                }
                const manRound = parseInt(args[0]);
                if (isNaN(manRound)) {
                    addToHistory('Invalid round number.', 'error');
                    break;
                }

                setActiveRound(manRound);
                setMode('MANUAL_PAIRING');
                addToHistory(`ENTERING MANUAL PAIRING MODE FOR ROUND ${manRound}`, 'success');
                addToHistory('Enter pairings as: "Player1, Player2" (use comma)', 'system');
                addToHistory('Type "exit" or "done" to finish.', 'system');

                // Show existing
                const existingMan = (tournamentInfo.pairing_schedule?.[manRound] || []).length;

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

        // Find max round with results to check validity
        const maxResultRound = results.reduce((max, r) => Math.max(max, r.round || 0), 0);

        try {
            if (command === 'ns' || command === 'sw' || command === 'ts') {
                // TSH Signature: ns repeats based-on-round division
                // Fallback for sw: sw target_round base_round repeats
                if (command === 'ns' || command === 'ts') {
                    repeats = args.length > 0 ? parseInt(args[0]) : 0;
                    baseRound = args.length > 1 ? parseInt(args[1]) : maxResultRound;
                    targetRound = (tournamentInfo.current_round || 0) + 1;
                } else {
                    if (args.length < 3) throw new Error("Usage: sw <target_round> <base_round> <repeats>");
                    targetRound = parseInt(args[0]);
                    baseRound = parseInt(args[1]);
                    repeats = parseInt(args[2]);
                }

                if (baseRound < maxResultRound && baseRound !== 0) {
                    if (!window.confirm(`WARNING: You are generating pairings based on Round ${baseRound}, but Round ${maxResultRound} has results. Continue?`)) {
                        addToHistory('Operation cancelled by user.', 'warning');
                        return;
                    }
                }

            } else if (command === 'initfontes') {
                const numRounds = args.length > 0 ? parseInt(args[0]) : 3;
                addToHistory(`[SYSTEM] Initializing Fontes Swiss for ${numRounds} rounds...`, 'system');

                const activePool = players.filter(p => !p.withdrawn && p.status !== 'paused');
                const fontesSchedules = generateInitFontesPairings(activePool, numRounds);

                let newSched = { ...(tournamentInfo.pairing_schedule || {}) };
                let applyRound = 1;

                Object.keys(fontesSchedules).forEach(rKey => {
                    const r = parseInt(rKey);
                    const finalizedPairs = assignStarts(fontesSchedules[r], players, results);
                    newSched[applyRound] = finalizedPairs.map((p, i) => ({
                        ...p,
                        round: applyRound,
                        table_number: p.table || i + 1,
                        player1_id: p.player1.player_id,
                        player2_id: p.player2?.player_id
                    }));
                    addToHistory(`Generated Round ${applyRound} (InitFontes)`, 'info');
                    applyRound++;
                });

                onUpdateTournament(prev => {
                    supabase.from('tournaments')
                        .update({ pairing_schedule: newSched, current_round: 1 })
                        .eq('id', tournamentInfo.id).then();
                    return { ...prev, pairing_schedule: newSched, current_round: 1 };
                });
                return;

            } else if (command === 'koth') {
                if (args.length < 2) throw new Error("Usage: koth <repeats> <base>");
                repeats = parseInt(args[0]);
                baseRound = parseInt(args[1]);
                targetRound = baseRound + 1;

                if (baseRound < maxResultRound) {
                    if (!window.confirm(`WARNING: Base Round ${baseRound} is older than Latest Result (Round ${maxResultRound}). Continue?`)) {
                        addToHistory('Operation cancelled.', 'warning');
                        return;
                    }
                }

            } else if (command === 'pq' || command === 'pairquartiles') {
                targetRound = (tournamentInfo.current_round || 0) + 1;
                repeats = args.length > 1 ? parseInt(args[1]) : 0;
                baseRound = args.length > 2 ? parseInt(args[2]) : maxResultRound;

            } else if (command === 'q' || command === 'quartile' || command === 'quart') {
                targetRound = args.length > 0 ? parseInt(args[0]) : (tournamentInfo.current_round || 0) + 1;
                baseRound = targetRound - 1; // Standard base for quartile

            } else if (command === 'trr') {
                targetRound = args.length > 0 ? parseInt(args[0]) : (tournamentInfo.current_round || 0) + 1;
            } else if (command === 'rr') {
                targetRound = tournamentInfo.current_round || 1;
                repeats = args.length > 0 ? parseInt(args[0]) : 1;
            }

            if (isNaN(targetRound)) throw new Error("Invalid round number.");

            const totalRounds = tournamentInfo.total_rounds || 100;
            if (targetRound > totalRounds) {
                addToHistory(`Cannot generate Round ${targetRound}. Max rounds is ${totalRounds}.`, 'error');
                return;
            }

            addToHistory(`[SYSTEM] Generating ${command.toUpperCase()} Pairings for Round ${targetRound}...`, 'system');

            // --- Pairing Logic ---
            const previousMatchups = new Set();
            results.forEach(res => {
                previousMatchups.add(`${res.player1_id}-${res.player2_id}`);
                previousMatchups.add(`${res.player2_id}-${res.player1_id}`);
            });

            const activePool = players.filter(p => !p.withdrawn && p.status !== 'withdrawn' && p.status !== 'paused');
            const reservedTables = cliSettings.current.reserved_tables || {};

            if (command === 'rr') {
                const rrConsecutive = cliSettings.current.rr_consecutive || 1;
                const rrSchedules = generateRoundRobinSchedule(activePool, repeats, rrConsecutive, reservedTables);
                let applyRound = targetRound;
                const generatedRoundKeys = Object.keys(rrSchedules).sort((a, b) => a - b);
                let newSched = { ...(tournamentInfo.pairing_schedule || {}) };
                let maxR = 0;

                generatedRoundKeys.forEach(rKey => {
                    if (applyRound > totalRounds) return;
                    const roundPairs = rrSchedules[rKey];
                    const finalizedPairs = assignStarts(roundPairs, players, results);
                    newSched[applyRound] = finalizedPairs.map((p, i) => ({
                        ...p,
                        round: applyRound,
                        table_number: typeof p.table === 'number' ? p.table : i + 1,
                        player1_id: p.player1.player_id,
                        player2_id: p.player2?.player_id
                    }));
                    addToHistory(`Generated Round ${applyRound} (RR)`, 'info');
                    maxR = applyRound;
                    applyRound++;
                });

                onUpdateTournament(prev => {
                    supabase.from('tournaments')
                        .update({ pairing_schedule: newSched, current_round: maxR })
                        .eq('id', tournamentInfo.id).then();
                    return { ...prev, pairing_schedule: newSched, current_round: maxR };
                });
                return;

            } else if (command === 'ns' || command === 'sw' || command === 'ts') {
                // Standings Logic
                let simPlayers;
                let baseResults = [];

                if (baseRound === 0) {
                    // Round 0: By Pre-tournament ranking
                    simPlayers = activePool.map(p => ({ ...p, wins: 0, ties: 0, spread: 0 }));
                    // Sort by initial seed or rating
                    simPlayers.sort((a, b) => (a.initial_seed || 999) - (b.initial_seed || 999));
                } else {
                    baseResults = results.filter(r => r.round <= baseRound);
                    const standings = calculateStandings(players, baseResults, [], tournamentInfo);
                    simPlayers = standings.filter(p => !p.withdrawn && p.status !== 'paused');
                }

                pairings = generateSwissPairings(simPlayers, previousMatchups, baseResults, targetRound, repeats, reservedTables);

            } else if (command === 'q' || command === 'quartile' || command === 'quart') {
                pairings = generateQuartilePairings(activePool, targetRound, results, reservedTables);

            } else if (command === 'pq' || command === 'pairquartiles') {
                const targetQ = args.length > 0 ? parseInt(args[0]) : 4;
                const divArg = args.length > 3 ? args[3].toLowerCase() : null;

                const pqResults = results.filter(r => r.round <= baseRound);
                const pqStandings = calculateStandings(players, pqResults, [], tournamentInfo);
                let pqActive = pqStandings.filter(p => !p.withdrawn && p.status !== 'paused');

                if (divArg) {
                    pqActive = pqActive.filter(p => (p.division || 'a').toLowerCase() === divArg);
                    if (pqActive.length === 0) throw new Error(`No active players found in division ${divArg}`);
                }

                pairings = generateTSHQuartilePairings(pqActive, targetQ, repeats, previousMatchups, results, reservedTables);

            } else if (command === 'trr') {
                // Team Round Robin
                const teamMap = new Map();
                const trrPlayers = players.filter(p => !p.withdrawn && p.status !== 'paused');

                trrPlayers.forEach(p => {
                    let teamName = 'Unattached';
                    if (p.team_id && tournamentInfo.teams) {
                        const t = tournamentInfo.teams.find(tm => tm.id === p.team_id);
                        if (t) teamName = t.name;
                    } else {
                        teamName = (p.club || p.team || 'Unattached').trim();
                    }
                    if (!teamMap.has(teamName)) teamMap.set(teamName, []);
                    teamMap.get(teamName).push(p);
                });

                const teamsList = Array.from(teamMap.keys()).sort();
                if (teamsList.length < 2) throw new Error(`Not enough teams found (Found: ${teamsList.length})`);

                const teamObjList = teamsList.map((name, i) => ({ id: i, name }));
                // Berger rotation via utility on team names as dummy players
                const teamRRSchedule = generateRoundRobinSchedule(teamObjList.map(t => ({ player_id: t.id, name: t.name })), 1, 1, {});
                // Calculate cycle index for the specific target round
                const numTeams = teamObjList.length % 2 === 0 ? teamObjList.length : teamObjList.length + 1;
                const cycleRounds = numTeams - 1;
                const rIndex = ((targetRound - 1) % cycleRounds) + 1;
                const teamRRPairs = teamRRSchedule[rIndex] || teamRRSchedule[1];

                pairings = [];
                let tableOffset = 1;

                teamRRPairs.forEach(tp => {
                    const t1Name = tp.player1.name;
                    const t2Name = tp.player2.name;

                    if (t1Name === 'BYE' || t2Name === 'BYE') {
                        const realTeam = t1Name === 'BYE' ? t2Name : t1Name;
                        if (realTeam !== 'BYE') {
                            teamMap.get(realTeam).forEach(p => {
                                pairings.push({ table: 'BYE', player1: p, player2: { name: 'BYE', player_id: null, isBye: true } });
                            });
                        }
                        return;
                    }

                    const roster1 = [...teamMap.get(t1Name)].sort((a, b) => (a.rank || 999) - (b.rank || 999));
                    const roster2 = [...teamMap.get(t2Name)].sort((a, b) => (a.rank || 999) - (b.rank || 999));
                    const maxB = Math.max(roster1.length, roster2.length);

                    for (let b = 0; b < maxB; b++) {
                        const p1 = roster1[b];
                        const p2 = roster2[b];
                        if (p1 && p2) pairings.push({ table: tableOffset++, player1: p1, player2: p2 });
                        else if (p1) pairings.push({ table: 'BYE', player1: p1, player2: { name: 'BYE', player_id: null, isBye: true } });
                        else if (p2) pairings.push({ table: 'BYE', player1: p2, player2: { name: 'BYE', player_id: null, isBye: true } });
                    }
                });
            }

            // Finalize and Save
            pairings.forEach((p, i) => { if (!p.table || p.table === 0) p.table = i + 1; });
            pairings = assignStarts(pairings, players, results);

            onUpdateTournament(prev => {
                const newSched = { ...(prev.pairing_schedule || {}) };
                newSched[targetRound] = pairings.map(p => ({
                    ...p,
                    round: targetRound,
                    table_number: p.table,
                    player1_id: p.player1.player_id,
                    player2_id: p.player2?.player_id
                }));

                supabase.from('tournaments')
                    .update({ pairing_schedule: newSched, current_round: targetRound })
                    .eq('id', tournamentInfo.id).then(res => {
                        if (res.error) toast.error('Save Failed');
                        else toast.success(`Round ${targetRound} Generated`);
                    });

                return { ...prev, pairing_schedule: newSched, current_round: targetRound };
            });

            addToHistory(`Round ${targetRound} Pairings Generated.`, 'success');
            pairings.forEach(p => { if (p.note) addToHistory(`> Table ${p.table}: ${p.note}`, 'warning'); });

        } catch (e) {
            addToHistory(`Error: ${e.message}`, 'error');
            console.error(e);
        }
    };



    // Helper to persist (Mocking the requirement -> Real app needs this passed down)
    const savePairingsToDB = async (updatedTournament) => {
        try {
            const { error } = await supabase
                .from('tournaments')
                .update({
                    pairing_schedule: updatedTournament.pairing_schedule,
                    current_round: updatedTournament.current_round
                })
                .eq('slug', tournamentInfo.slug || tournamentInfo.url_slug);

            if (error) throw error;

            toast.success(`Pairings Generated & Saved for Round ${updatedTournament.current_round}`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save pairings to database.');
            addToHistory('Failed to save pairings to DB. Please check connection.', 'error');
        }
    };
    // Helper to update player stats (stats command)
    const updatePlayerStats = async () => {
        try {
            const standings = calculateStandings(players, results, [], tournamentInfo);

            let count = 0;
            for (const s of standings) {
                const { error } = await supabase
                    .from('tournament_players')
                    .update({
                        wins: s.wins,
                        losses: s.losses,
                        spread: s.spread,
                        solkoff: s.solkoff // Include solkoff in DB update
                    })
                    .eq('tournament_id', tournamentInfo.id)
                    .eq('player_id', s.player_id);
                if (!error) count++;
            }

            addToHistory(`Updated stats (including Solkoff) for ${count} players in database.`, 'success');
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

        // Regex: ^(.+)\s+(\d+)\s+(.+)\s+(\d+)$
        // Handles "Anne Marie 400 John Doe 300"
        const scoreRegex = /^(.+?)\s+(\d+)\s+(.+?)\s+(\d+)$/;
        const regexMatch = trimmed.match(scoreRegex);

        if (!regexMatch) {
            addToHistory('Invalid format. Expected: Name1 Score1 Name2 Score2', 'error');
            return;
        }

        const n1 = regexMatch[1].trim();
        const score1 = parseInt(regexMatch[2]);
        const n2 = regexMatch[3].trim();
        const score2 = parseInt(regexMatch[4]);

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
            if (mode === 'COMMAND' || mode === 'MANUAL_PAIRING') {
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
