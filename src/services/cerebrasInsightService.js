// Hardcoded for immediate stability
const API_KEY = "csk-9493my4k8rknv5t2e8c53w2c25666mnh45n3f338j4p2rcmc";

// Fallback mock if no key
const MOCK_MODE = !API_KEY;

/**
 * Cerebras AI Insight Service
 * "The Analyst" for Direktor
 */
const CerebrasService = {

    /**
     * Generates a "Ticker Tape" set of headlines for the current round.
     * @param {Array} standings - Current leaderboard
     * @param {Number} round - Current round number
     * @returns {Promise<Array<string>>} - Array of headline strings
     */
    async generateRoundHeadlines(standings, round) {
        if (MOCK_MODE) {
            console.warn("Cerebras API Key missing. Using mock insights.");
            return [
                "Cerebras AI Insights: Configure API Key to enable live analytics.",
                "Track the drama: Momentum, Upsets, and Stats."
            ];
        }

        try {
            // Context Preparation
            const top5 = standings.slice(0, 5).map(p => `${p.rank}. ${p.name} (Seed ${p.seed}, ${p.wins} wins)`).join('\n');
            const bigMovers = standings.filter(p => (p.seed - p.rank) > 5).slice(0, 3).map(p => `${p.name} (Seed ${p.seed} -> Rank ${p.rank})`).join(', ');

            const context = `
                Tournament Round: ${round}
                
                Top 5 Players:
                ${top5}
                
                Notable Overperformers (Seed vs Rank):
                ${bigMovers}
                
                Task: Generate 3 "Ticker Tape" style headlines.
                Categories required:
                1. "Momentum": Who is surging?
                2. "The Wall": Who is holding top ranks?
                3. "Upset Alert": Who is outperforming their seed?
                
                Output Format: Three lines of text only. No labels like "Momentum:". Just the story.
                Example: "Momentum: Silver jumps to 3rd place."
            `;

            const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama3.1-8b",
                    messages: [
                        { role: "system", content: "You are a live sports commentator for Scrabble. Be punchy, hype-driven, and analytical." },
                        { role: "user", content: context }
                    ],
                    max_tokens: 150,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            const text = data.choices[0]?.message?.content || "";
            return text.split('\n').filter(line => line.length > 10);

        } catch (err) {
            console.error("Cerebras Insight Error:", err);
            return [];
        }
    },

    /**
     * Calculates Win Probability for a match
     * @param {Object} p1 - Player 1 stats
     * @param {Object} p2 - Player 2 stats
     * @returns {Promise<Object>} { winner: 'p1'|'p2', probability: 85, reason: "..." }
     */
    async calculateWinProbability(p1, p2) {
        if (MOCK_MODE) return { probability: 50, reason: "Data unavailable" };

        const context = `
            Player 1: ${p1.name} (Rank ${p1.rank}, Spread: ${p1.spread}, Avg Score: ${p1.avg_score || 'N/A'})
            Player 2: ${p2.name} (Rank ${p2.rank}, Spread: ${p2.spread}, Avg Score: ${p2.avg_score || 'N/A'})
            
            Task: Calculate win probability for Player 1 based on stats.
            Return JSON only: { "probability": number (0-100), "reason": "15 words max explanation" }
         `;

        try {
            const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama3.1-8b",
                    messages: [
                        { role: "system", content: "You are a probability engine. Output JSON only." },
                        { role: "user", content: context }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            const data = await response.json();
            // Llama 3.1 JSON mode content parsing
            const content = data.choices[0]?.message?.content;
            return typeof content === 'string' ? JSON.parse(content) : content;
        } catch (e) {
            console.error("Win Prob Error", e);
            return { probability: 50, reason: "Calculation failed" };
        }
    },

    /**
     * Generates a "Permutation" scenario for a player to win.
     */
    async generateWinningScenario(player, standings, remainingRounds) {
        if (MOCK_MODE) return "Scenario generation unavailable.";

        const leader = standings[0];
        const pointsBehind = (leader.wins * 1000 + leader.spread) - (player.wins * 1000 + player.spread);

        const context = `
            Player: ${player.name} (Rank ${player.rank}, Wins ${player.wins}, Spread ${player.spread})
            Leader: ${leader.name} (Wins ${leader.wins}, Spread ${leader.spread})
            Remaining Rounds: ${remainingRounds}
            
            Task: Explain what ${player.name} needs to do to overtake ${leader.name}.
            Format: One sentence. fast-paced.
         `;

        try {
            const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama3.1-8b",
                    messages: [
                        { role: "system", content: "You are a strategy analyst." },
                        { role: "user", content: context }
                    ],
                    max_tokens: 60
                })
            });
            const data = await response.json();
            return data.choices[0]?.message?.content || "Win out and hope for leader loss.";
        } catch (e) {
            return "Win remaining games with high margin.";
        }
    },

    /**
     * Generates a detailed "Round Report" for the Insights Page.
     * @returns {Promise<Object>} { summary: "...", key_matchups: [], surprises: "..." }
     */
    async generateDetailedRoundReport(standings, round, topMatchResults) {
        if (MOCK_MODE) return { summary: "Mock Report", key_matchups: [], surprises: "None" };

        const top10 = standings.slice(0, 10).map(p =>
            `#${p.rank} ${p.name} (${p.wins} wins, ${p.spread} spr)`
        ).join('\n');

        const matchContext = topMatchResults.map(m =>
            `${m.p1} vs ${m.p2} -> Winner: ${m.winner} (${m.score})`
        ).join('\n');

        const context = `
            Round: ${round}
            
            Leaderboard Top 10:
            ${top10}
            
            Key Top Table Results:
            ${matchContext}

            Task: Generate a comprehensive Tournament Report for this round.
            
            Return JSON with 3 keys:
            1. "summary": A 2-3 sentence overview of the round. High energy, sports-center style.
            2. "key_matchups": An array of strings describing the most critical results (e.g. "Smith topples Jones to take 1st"). Max 3 items.
            3. "surprises": A short paragraph about unexpected storylines or dark horses.

            Format: JSON Object.
        `;

        try {
            // Using 70b but with explicit error check
            const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama3.1-8b",
                    messages: [
                        { role: "system", content: "You are a senior tournament analyst. Return pure JSON." },
                        { role: "user", content: context }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Cerebras API Error:", response.status, errText);
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            let content = data.choices?.[0]?.message?.content;

            if (typeof content === 'string') {
                // Remove markdown code blocks if present
                content = content.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(content);
            }
            return content || { summary: "No content generated", key_matchups: [], surprises: "" };

        } catch (e) {
            console.error("Report Gen Error", e);
            return {
                summary: "Analysis currently unavailable. Please check console for API Details.",
                key_matchups: ["Check leaderboard for details."],
                surprises: `Error: ${e.message}`
            };
        }
    }
};

export default CerebrasService;
