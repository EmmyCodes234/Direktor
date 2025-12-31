import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from 'supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import ReportFooter from 'components/public/ReportFooter';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from 'utils/cn';

const PublicTournamentScorecards = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPlayerId, setExpandedPlayerId] = useState(null);

    const fetchData = useCallback(async () => {
        if (!tournamentSlug) return;
        setLoading(true);
        try {
            const { data: tData, error: tError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('slug', tournamentSlug)
                .single();
            if (tError) throw tError;
            setTournament(tData);

            const { data: pData, error: pError } = await supabase
                .from('tournament_players')
                .select('*, players(*)')
                .eq('tournament_id', tData.id)
                .order('seed', { ascending: true });
            if (pError) throw pError;

            const enrichedPlayers = pData.map(tp => ({
                ...tp.players,
                player_id: tp.players.id,
                seed: tp.seed,
                status: tp.status
            }));
            setPlayers(enrichedPlayers);

            const { data: rData, error: rError } = await supabase
                .from('results')
                .select('*')
                .eq('tournament_id', tData.id)
                .order('round', { ascending: true });
            if (rError) throw rError;
            setResults(rData);

        } catch (err) {
            console.error('Error fetching scorecards data:', err);
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredPlayers = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return players.filter(p => p.name.toLowerCase().includes(query));
    }, [players, searchQuery]);

    const getPlayerScorecard = (playerId) => {
        return results.filter(r => r.player1_id === playerId || r.player2_id === playerId);
    };

    const calculateStats = (playerId, playerResults) => {
        let wins = 0, losses = 0, ties = 0, spread = 0;
        let scores = [];

        playerResults.forEach(r => {
            const isP1 = r.player1_id === playerId;
            const myScore = isP1 ? r.score1 : r.score2;
            const oppScore = isP1 ? r.score2 : r.score1;

            if (myScore > oppScore) wins++;
            else if (myScore < oppScore) losses++;
            else ties++;

            spread += (myScore - oppScore);
            scores.push(myScore);
        });

        const high = scores.length ? Math.max(...scores) : 0;
        const low = scores.length ? Math.min(...scores) : 0;
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        return { wins, losses, ties, spread, high, low, avg, games: scores.length };
    };

    const formatWL = (w, l, t) => {
        const winStr = t > 0 ? `${w + t * 0.5}`.replace('.5', '½') : `${w}`;
        const lossStr = t > 0 ? `${l + t * 0.5}`.replace('.5', '½') : `${l}`;
        return `${winStr}-${lossStr}`;
    };

    if (loading) {
        return <PublicLoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-background font-sans">
            <PublicTournamentBanner tournament={tournament} />

            <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center gap-4 mb-8">
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-6 no-print">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/tournament/${tournamentSlug}`)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Icon name="ArrowLeft" size={20} />
                            </Button>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-black mb-1 font-heading uppercase tracking-tight">
                            Player Scorecards
                        </h2>
                        <p className="text-muted-foreground text-lg font-medium">
                            {tournament?.name}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base"
                    />
                </div>

                {/* Scorecards List */}
                <div className="space-y-4">
                    {filteredPlayers.map((player) => {
                        const playerResults = getPlayerScorecard(player.player_id);
                        const stats = calculateStats(player.player_id, playerResults);
                        const isExpanded = expandedPlayerId === player.player_id;

                        return (
                            <div
                                key={player.player_id}
                                className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden transition-all duration-200"
                            >
                                <button
                                    onClick={() => setExpandedPlayerId(isExpanded ? null : player.player_id)}
                                    className={cn(
                                        "w-full text-left px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors",
                                        isExpanded && "bg-gray-50 border-b border-gray-100"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                            {player.photo_url ? (
                                                <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Icon name="User" className="w-full h-full p-2 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-blue-900 leading-tight">
                                                {player.name} <span className="text-xs font-normal text-gray-400 ml-1">(#{player.seed})</span>
                                            </div>
                                            <div className="text-xs text-gray-500 font-medium">
                                                {stats.games} Games Played
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pr-2">
                                        <div className="flex flex-col items-center sm:items-end">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Record</span>
                                            <span className="font-bold tabular-nums text-gray-900">{formatWL(stats.wins, stats.losses, stats.ties)}</span>
                                        </div>
                                        <div className="flex flex-col items-center sm:items-end">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Spread</span>
                                            <span className={cn(
                                                "font-bold tabular-nums",
                                                stats.spread > 0 ? "text-green-600" : stats.spread < 0 ? "text-red-600" : "text-gray-900"
                                            )}>
                                                {stats.spread > 0 ? `+${stats.spread}` : stats.spread}
                                            </span>
                                        </div>
                                        <Icon
                                            name="ChevronDown"
                                            className={cn("text-gray-400 transition-transform duration-200", isExpanded && "rotate-180")}
                                            size={20}
                                        />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="px-4 py-6 bg-white">
                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-3 gap-px bg-gray-100 border border-gray-100 rounded-sm mb-6 shadow-tiny">
                                                    <div className="bg-white p-3 text-center">
                                                        <div className="text-sm font-bold text-gray-900">{stats.high}</div>
                                                        <div className="text-[10px] uppercase text-gray-400 font-bold">High</div>
                                                    </div>
                                                    <div className="bg-white p-3 text-center">
                                                        <div className="text-sm font-bold text-gray-900">{stats.low}</div>
                                                        <div className="text-[10px] uppercase text-gray-400 font-bold">Low</div>
                                                    </div>
                                                    <div className="bg-white p-3 text-center">
                                                        <div className="text-sm font-bold text-gray-900">{stats.avg}</div>
                                                        <div className="text-[10px] uppercase text-gray-400 font-bold">Avg</div>
                                                    </div>
                                                </div>

                                                {/* History Table */}
                                                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-3 px-1">Game History</h4>
                                                <div className="border border-gray-200 rounded-sm overflow-hidden">
                                                    <table className="w-full text-left border-collapse table-auto">
                                                        <thead>
                                                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] sm:text-xs font-bold uppercase text-gray-500">
                                                                <th className="px-3 py-2 text-center w-[40px] sm:w-[60px]">Rnd</th>
                                                                <th className="px-3 py-2">Opponent</th>
                                                                <th className="px-3 py-2 text-center w-[70px] sm:w-[90px]">Score</th>
                                                                <th className="px-3 py-2 text-right w-[60px] sm:w-[80px]">Spr</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {playerResults.map((r, i) => {
                                                                const isP1 = r.player1_id === player.player_id;
                                                                const myScore = isP1 ? r.score1 : r.score2;
                                                                const oppScore = isP1 ? r.score2 : r.score1;
                                                                const oppName = isP1 ? r.player2_name : r.player1_name;
                                                                const oppId = isP1 ? r.player2_id : r.player1_id;
                                                                const opp = players.find(p => p.player_id === oppId);
                                                                const won = myScore > oppScore;
                                                                const tied = myScore === oppScore;
                                                                const spr = myScore - oppScore;

                                                                return (
                                                                    <tr key={i} className={cn(
                                                                        "text-xs sm:text-sm transition-colors",
                                                                        won ? "bg-green-50/20" : tied ? "bg-amber-50/20" : "bg-red-50/20"
                                                                    )}>
                                                                        <td className="px-3 py-2.5 text-center font-bold text-gray-400 tabular-nums">
                                                                            {r.round}
                                                                        </td>
                                                                        <td className="px-3 py-2.5">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-bold text-gray-800 leading-tight">
                                                                                    {oppName}
                                                                                </span>
                                                                                {opp && (
                                                                                    <span className="text-[10px] text-gray-400 font-medium">#{opp.seed}</span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center font-bold tabular-nums whitespace-nowrap">
                                                                            <span className={cn(won ? "text-green-700" : tied ? "text-amber-700" : "text-red-700")}>
                                                                                {myScore}-{oppScore}
                                                                            </span>
                                                                        </td>
                                                                        <td className={cn(
                                                                            "px-3 py-2.5 text-right font-bold tabular-nums whitespace-nowrap",
                                                                            spr > 0 ? "text-green-600" : spr < 0 ? "text-red-600" : "text-gray-400"
                                                                        )}>
                                                                            {spr > 0 ? `+${spr}` : spr}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {filteredPlayers.length === 0 && (
                    <div className="text-center py-20 px-4">
                        <Icon name="UserX" className="mx-auto text-gray-200 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-400">No players found</h3>
                        <p className="text-gray-400">Try searching for a different name</p>
                    </div>
                )}
                <ReportFooter />
            </div>
        </div>
    );
};

export default PublicTournamentScorecards;
