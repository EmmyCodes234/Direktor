import JSZip from 'jszip';

// Helper to format date as YYYY-MM-DD
const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    return new Date(dateStr).toISOString().split('T')[0];
};

// Helper to generate content for a single division
const generateTouContent = (tournamentInfo, divisionLabel, divPlayers, divResults) => {
    const lines = [];
    const dateStr = formatDate(tournamentInfo.start_date || new Date());
    const tName = tournamentInfo.name || 'Tournament';

    // 1. Header
    lines.push(`*M${dateStr} + ${tName}`);
    lines.push(`*${divisionLabel}`);
    // Magic padding line: 39 spaces + "0"
    lines.push("                                       0");

    // 2. Prep Players (Sorted by Rank/Placement)
    // User requested Post-Tournament Rank. If no rank, fallback to seed/rating.
    const sortedPlayers = [...divPlayers].sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        return (a.seed || 999) - (b.seed || 999);
    });

    // Map Player ID -> Sequence ID (1-based index in this specific file)
    const seqMap = new Map();
    sortedPlayers.forEach((p, idx) => {
        seqMap.set(p.player_id || p.id, idx + 1);
    });

    // 3. Player Rows
    sortedPlayers.forEach(p => {
        const parts = [];

        // Name & Rating
        const fullName = p.name || `${p.first_name} ${p.last_name}`;
        parts.push(fullName);
        const rating = p.initial_rating || p.rating || "0";
        parts.push(String(rating));

        // Round Data
        // Iterate 1..currentRound (or max round found in results)
        const maxRound = Math.max(0, ...divResults.map(r => r.round), tournamentInfo.current_round || 0);

        for (let r = 1; r <= maxRound; r++) {
            // Find specific game for this round
            const game = divResults.find(res =>
                res.round === r &&
                (res.player1_id === (p.player_id || p.id) || res.player2_id === (p.player_id || p.id))
            );

            if (!game) {
                // Treat as Bye with 0 spread -> Encoded 1300. PToken: OwnID.
                const mySeq = seqMap.get(p.player_id || p.id);
                parts.push(String(mySeq)); // Opponent Token (Self)
                parts.push("1300"); // Encoded Score (Bye + 0)
                continue;
            }

            const pId = p.player_id || p.id;
            const isP1 = (game.player1_id === pId);
            const isBye = (!game.player2_id && isP1) || (!game.player1_id && !isP1) || (game.player2_id === null);

            if (isBye) {
                const mySeq = seqMap.get(pId);
                // For Bye, spec says "1300 + Spread". Usually score contains the bye points (e.g. 50).
                const score = isP1 ? (game.score1 || 0) : (game.score2 || 0);
                parts.push(String(mySeq));
                parts.push(String(1300 + Number(score)));
            } else {
                // Regular Game
                const oppId = isP1 ? game.player2_id : game.player1_id;
                const oppSeq = seqMap.get(oppId);

                // Opponent Token
                // If FIRST -> "+" prefix. Assuming P1 went first.
                const wentFirst = isP1; // Assumption: P1 in DB is First Actor
                const oppToken = wentFirst ? `+${oppSeq}` : `${oppSeq}`;
                parts.push(oppToken);

                // Encoded Score
                const myScore = isP1 ? Number(game.score1) : Number(game.score2);
                const oppScore = isP1 ? Number(game.score2) : Number(game.score1);

                let encoded = 0;
                if (myScore > oppScore) { // WIN
                    encoded = myScore + 2000;
                } else if (myScore < oppScore) { // LOSS
                    encoded = myScore; // +0
                } else { // TIE
                    encoded = myScore + 1000;
                }
                parts.push(String(encoded));
            }
        }

        lines.push(parts.join(" "));
    });

    // 4. Footer
    lines.push("*** END OF FILE ***");

    return lines.join("\n");
};

export const generateTouExport = async (tournamentInfo, players, results, addToHistory) => {
    addToHistory('Generating tournament file (.tou)...', 'system');

    try {
        // Group by Division (or default to 'A')
        const divisions = {};
        players.forEach(p => {
            const d = p.division || 'A';
            if (!divisions[d]) divisions[d] = [];
            divisions[d].push(p);
        });

        const divKeys = Object.keys(divisions);

        if (divKeys.length === 1) {
            // Single Division -> Single .TOU File
            const divLabel = divKeys[0];
            const content = generateTouContent(tournamentInfo, divLabel, divisions[divLabel], results || []);

            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${divLabel}.TOU`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToHistory(`Downloaded ${a.download}`, 'success');

        } else if (divKeys.length > 1) {
            // Multiple Divisions -> ZIP
            addToHistory('Multiple divisions detected. Creating ZIP...', 'info');
            const zip = new JSZip();

            divKeys.forEach(divLabel => {
                const content = generateTouContent(tournamentInfo, divLabel, divisions[divLabel], results || []);
                zip.file(`${divLabel}.TOU`, content);
            });

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tournamentInfo.slug || 'tournament'}_tou_files.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToHistory(`Downloaded ${a.download}`, 'success');
        } else {
            addToHistory('No players found to export.', 'warning');
        }

    } catch (e) {
        console.error(e);
        addToHistory('Export failed: ' + e.message, 'error');
    }
};
