import React, { useMemo } from 'react';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

const ClassicalStandingsTable = ({
    players,
    results = [],
    pairingSchedule = {},
    currentRound
}) => {

    const formatName = (name) => {
        if (!name) return 'Unknown';
        if (name.includes(',')) return name;

        // Convert "First Last" to "Last, First"
        const parts = name.trim().split(' ');
        if (parts.length < 2) return name;

        const last = parts.pop();
        const first = parts.join(' ');
        return `${last}, ${first}`;
    };

    // Helper: format record with fractions
    const formatRecord = (w, l, t) => {
        const wins = w + (t * 0.5);
        const losses = l + (t * 0.5);

        const formatNum = (num) => {
            const floor = Math.floor(num);
            const hasHalf = num % 1 !== 0;
            if (hasHalf) {
                return floor === 0 ? '½' : `${floor}½`;
            }
            return floor.toString();
        };

        return `${formatNum(wins)}-${formatNum(losses)}`;
    };

    const getPlayerDetails = (player) => {
        // Fallback for seed: seed -> initial_seed -> 'Unseeded' (or -)
        // If we want to mimic CLI, we can use rank if seed is missing, but usually seed is static.
        // Let's use seed or initial_seed.
        const displaySeed = player.seed || player.initial_seed || '-';
        return {
            name: formatName(player.name),
            seed: displaySeed,
            rank: player.rank || '-',
            id: player.player_id
        };
    };

    const getLastGameString = (playerId) => {
        if (!results || results.length === 0) return '';

        const playerResults = results.filter(r =>
            String(r.player1_id) === String(playerId) || String(r.player2_id) === String(playerId)
        );

        if (playerResults.length === 0) return '';

        playerResults.sort((a, b) => b.round - a.round);
        const lastGame = playerResults[0];

        const isP1 = String(lastGame.player1_id) === String(playerId);
        const myScore = isP1 ? lastGame.score1 : lastGame.score2;
        const oppScore = isP1 ? lastGame.score2 : lastGame.score1;
        const oppId = isP1 ? lastGame.player2_id : lastGame.player1_id;

        const opponent = players.find(p => String(p.player_id) === String(oppId));
        const oppSeed = opponent ? opponent.seed : '?';

        let resultChar = 'T';
        if (myScore > oppScore) resultChar = 'W';
        else if (myScore < oppScore) resultChar = 'L';

        const order = isP1 ? '1' : '2';

        return `${order}${resultChar}:${myScore}-${oppScore}:#${oppSeed}`;
    };

    return (
        <div className="w-full max-w-4xl mx-auto font-sans">
            <div className="overflow-hidden bg-white border border-gray-200 rounded-sm shadow-sm">
                <table className="min-w-full w-full border-collapse table-auto">
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-300 text-left text-black text-xs sm:text-sm md:text-base font-bold">
                            <th className="px-2 sm:px-4 py-3 text-right w-[45px] sm:w-[70px]">Rank</th>
                            <th className="px-2 sm:px-4 py-3 text-center w-[70px] sm:w-[110px]">
                                <span className="hidden sm:inline">Won-Lost</span>
                                <span className="sm:hidden">W-L</span>
                            </th>
                            <th className="px-2 sm:px-4 py-3 text-right w-[60px] sm:w-[90px]">
                                <span className="hidden sm:inline">Spread</span>
                                <span className="sm:hidden">Spr</span>
                            </th>
                            <th className="px-4 py-3 pl-4 sm:pl-8 text-left">Player</th>
                            <th className="hidden lg:table-cell px-4 py-3 text-left">Last Game</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {players.map((player, index) => {
                            const p = getPlayerDetails(player);
                            const wl = formatRecord(player.wins || 0, player.losses || 0, player.ties || 0);
                            const spread = player.spread > 0 ? `+${player.spread}` : player.spread;
                            const lastGame = getLastGameString(player.player_id);

                            const isOdd = index % 2 === 0;
                            const bgColor = isOdd ? 'bg-gray-50' : 'bg-white';

                            return (
                                <React.Fragment key={player.player_id}>
                                    <tr
                                        className={`${bgColor} text-black text-sm md:text-base font-medium hover:bg-blue-50/30 transition-colors`}
                                    >
                                        <td className="px-2 sm:px-4 py-2 text-right font-bold tabular-nums">
                                            {p.rank}
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 text-center tabular-nums text-xs sm:text-sm md:text-base">
                                            {wl}
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 text-right tabular-nums text-xs sm:text-sm md:text-base">
                                            {spread}
                                        </td>
                                        <td className="px-4 py-2 pl-4 sm:pl-8">
                                            <div className="flex flex-col">
                                                <div className="flex items-center flex-wrap">
                                                    <a href={`/players/${player.slug}`} className="text-blue-700 hover:underline font-semibold leading-tight">
                                                        {p.name}
                                                    </a>
                                                    <span className="text-blue-700/70 ml-1 text-xs sm:text-sm font-normal">(#{p.seed})</span>
                                                    {player.class && (
                                                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-gray-200 text-gray-600 uppercase tracking-widest border border-gray-300">
                                                            {player.class}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Mobile-only Last Game info Stacked */}
                                                <div className="lg:hidden mt-0.5 text-[10px] sm:text-xs text-gray-500 tabular-nums font-normal">
                                                    <span className="font-bold uppercase mr-1 text-[9px] text-gray-400">Last:</span>
                                                    {lastGame || 'None'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell px-4 py-2 tabular-nums text-gray-700 text-sm">
                                            {lastGame}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClassicalStandingsTable;
