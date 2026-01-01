import React from 'react';
import { motion } from 'framer-motion';

const ClassicalPairingsTable = ({ pairings, players = [], selectedRound }) => {
    // Helper to format player name as "Last, First"
    const formatName = (name) => {
        if (!name) return 'Unknown';
        if (name === 'BYE') return 'Bye';

        // If name already contains a comma, assume it's already Last, First
        if (name.includes(',')) return name;

        // Otherwise try to split and reverse
        const parts = name.trim().split(' ');
        if (parts.length < 2) return name;

        const last = parts.pop();
        const first = parts.join(' ');
        return `${last}, ${first}`;
    };

    const getPlayerDetails = (playerId, playerName) => {
        const player = players.find(p => p.player_id === playerId || p.id === playerId);
        return {
            name: player ? player.name : playerName,
            rank: player?.initial_seed || player?.seed || player?.rank || player?.id || '-',
            rating: player?.rating,
            class: player?.class,
        };
    };

    // Group pairings by round if we are showing all rounds
    const roundsToRender = selectedRound
        ? [selectedRound]
        : [...new Set(pairings.map(p => p.round))].sort((a, b) => b - a);

    if (pairings.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                No pairings available.
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans w-full max-w-4xl mx-auto">
            {roundsToRender.map(round => {
                const roundPairings = pairings
                    .filter(p => p.round === round)
                    .sort((a, b) => (a.table || 0) - (b.table || 0));

                if (roundPairings.length === 0) return null;

                return (
                    <motion.div
                        key={round}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full flex flex-col items-center"
                    >
                        <h2 className="text-center text-xl md:text-2xl font-bold text-black mb-4 font-heading">
                            Round {round} Matchups
                        </h2>

                        <div className="overflow-hidden bg-white border border-gray-200 rounded-sm shadow-sm inline-block">
                            {/* Table Header */}
                            <div className="grid grid-cols-[50px_1fr] bg-gray-100 border-b border-gray-300 font-bold text-sm md:text-base">
                                <div className="p-2 text-center text-black border-r border-gray-300">Board</div>
                                <div className="p-2 pl-3 text-black">Matchup</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-gray-200">
                                {roundPairings.map((pairing, index) => {
                                    const p1 = getPlayerDetails(pairing.player1_id, pairing.player1_name);
                                    const p2 = getPlayerDetails(pairing.player2_id, pairing.player2_name);

                                    const isOdd = (index + 1) % 2 !== 0; // 1-based index for visual striping usually
                                    // TSH often stripes green/white. User requested neutral.
                                    // Let's use subtle gray for alternate rows.
                                    // Actually, standard is usually white/gray-50.
                                    const bgColor = isOdd ? 'bg-green-50/50' : 'bg-white'; // Slight green tint to nod to TSH but kept very subtle/neutral? User said "nah we are not changing colors" so assume NO green.
                                    const neutralBgColor = isOdd ? 'bg-gray-50' : 'bg-white';

                                    // Determine display order based on who starts
                                    const p1Starts = pairing.player1?.starts;
                                    const p2Starts = pairing.player2?.starts;
                                    const shouldSwap = p2Starts && !p1Starts;

                                    const leftPlayer = shouldSwap ? p2 : p1;
                                    const rightPlayer = shouldSwap ? p1 : p2;

                                    const leftStarts = shouldSwap ? p2Starts : p1Starts;
                                    const rightStarts = shouldSwap ? p1Starts : p2Starts;

                                    return (
                                        <div
                                            key={pairing.id || index}
                                            className={`grid grid-cols-[50px_1fr] ${neutralBgColor} text-sm md:text-base`}
                                        >
                                            <div className="p-2 text-center text-black font-semibold border-r border-gray-200 flex items-center justify-center">
                                                {pairing.table || index + 1}
                                            </div>

                                            <div className="p-2 pl-3 text-black whitespace-nowrap text-base">
                                                <span className="mr-1">
                                                    {formatName(leftPlayer.name)} (#{leftPlayer.rank})
                                                    {leftPlayer.class && <span className="ml-1 inline-flex items-center px-1 rounded-sm text-[10px] font-bold bg-gray-200 text-gray-600 uppercase tracking-widest border border-gray-300">{leftPlayer.class}</span>}
                                                    {leftStarts && <span className="font-bold italic text-black/60 ml-1 text-xs">*first*</span>}
                                                </span>
                                                <span className="font-normal text-black/60 mx-1">vs.</span>
                                                <span>
                                                    {formatName(rightPlayer.name)} (#{rightPlayer.rank})
                                                    {rightPlayer.class && <span className="ml-1 inline-flex items-center px-1 rounded-sm text-[10px] font-bold bg-gray-200 text-gray-600 uppercase tracking-widest border border-gray-300">{rightPlayer.class}</span>}
                                                    {rightStarts && <span className="font-bold italic text-black/60 ml-1 text-xs">*first*</span>}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ClassicalPairingsTable;
