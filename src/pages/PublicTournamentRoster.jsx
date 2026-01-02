import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { supabase } from 'supabaseClient';
import Button from 'components/ui/Button';
import ShareButton from 'components/ui/ShareButton';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import PublicTournamentBanner from 'components/public/PublicTournamentBanner';
import ReportFooter from 'components/public/ReportFooter';
import PublicLoadingScreen from 'components/public/PublicLoadingScreen';
import { Avatar, AvatarImage, AvatarFallback } from 'components/ui/Avatar';
import { User } from 'lucide-react';

const PublicTournamentRoster = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('seed'); // 'seed', 'name', 'rating'

    const fetchPublicData = useCallback(async () => {
        if (!tournamentSlug) return;

        try {
            // Fetch tournament data
            const { data: tournamentData, error: tError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('slug', tournamentSlug)
                .single();

            if (tError) throw tError;
            setTournament(tournamentData);

            // Fetch players with photos
            const { data: playersData, error: pError } = await supabase
                .from('tournament_players')
                .select(`
                    *,
                    players (*)
                `)
                .eq('tournament_id', tournamentData.id)
                .order('seed', { ascending: true });

            if (pError) throw pError;

            // If no players found, try to find the correct tournament ID
            let finalPlayersData = playersData;

            if (!playersData || playersData.length === 0) {
                const { data: allTournaments, error: tournamentsError } = await supabase
                    .from('tournaments')
                    .select('id, name, slug')
                    .eq('slug', tournamentData.slug);

                if (!tournamentsError && allTournaments) {
                    for (const tournament of allTournaments) {
                        if (tournament.id !== tournamentData.id) {
                            const { data: testPlayers, error: testError } = await supabase
                                .from('tournament_players')
                                .select(`*, players (*)`)
                                .eq('tournament_id', tournament.id)
                                .limit(1);

                            if (!testError && testPlayers && testPlayers.length > 0) {
                                const { data: correctPlayers, error: correctError } = await supabase
                                    .from('tournament_players')
                                    .select(`*, players (*)`)
                                    .eq('tournament_id', tournament.id)
                                    .order('seed', { ascending: true });

                                if (!correctError) {
                                    finalPlayersData = correctPlayers;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            const enrichedPlayers = finalPlayersData.map(tp => ({
                ...tp.players,
                player_id: tp.players.id,
                seed: tp.seed,
                team_id: tp.team_id,
                status: tp.status,
                photo_url: tp.players.photo_url
            }));
            setPlayers(enrichedPlayers);

            // Fetch teams if team tournament
            if (tournamentData.type === 'team') {
                const { data: teamsData, error: teamsError } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('tournament_id', tournamentData.id);

                if (!teamsError) {
                    setTeams(teamsData);
                }
            }

        } catch (error) {
            console.error('Error fetching public data:', error);
        } finally {
            setLoading(false);
        }
    }, [tournamentSlug]);

    useEffect(() => {
        fetchPublicData();
    }, [fetchPublicData]);

    // Add real-time updates for player roster
    useEffect(() => {
        if (!tournament) return;

        const channel = supabase
            .channel(`public-tournament-roster-${tournament.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tournament_players',
                filter: `tournament_id=eq.${tournament.id}`
            }, fetchPublicData)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tournaments',
                filter: `id=eq.${tournament.id}`
            }, fetchPublicData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tournament, fetchPublicData]);

    const teamMap = React.useMemo(() => new Map(teams.map(team => [team.id, team.name])), [teams]);

    const filteredAndSortedPlayers = React.useMemo(() => {
        let filtered = players;

        // Filter by search term
        if (searchTerm) {
            filtered = players.filter(player =>
                player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (player.team_id && teamMap.get(player.team_id)?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Sort by selected criteria
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'seed':
                default:
                    return (a.seed || 999) - (b.seed || 999);
            }
        });
    }, [players, searchTerm, sortBy, teamMap]);

    const formatName = (name) => {
        if (!name) return "";
        const parts = name.trim().split(" ");
        if (parts.length < 2) return name;
        const lastName = parts.pop();
        const firstName = parts.join(" ");
        return `${lastName}, ${firstName}`;
    };

    if (loading) {
        return <PublicLoadingScreen />;
    }

    if (!tournament) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">Tournament Not Found</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black font-serif">
            <PublicTournamentBanner tournament={tournament} />
            <main className="w-full px-4 sm:px-6 lg:px-8 py-8 text-center max-w-5xl mx-auto">
                {/* Navigation Row */}
                <div className="relative flex flex-col md:flex-row items-center justify-center mb-8">
                    <button
                        onClick={() => navigate(`/tournament/${tournamentSlug}`)}
                        className="static md:absolute md:left-0 text-blue-700 hover:underline flex items-center gap-1 text-sm font-medium mb-2 md:mb-0"
                    >
                        <Icon name="ArrowLeft" size={16} />
                        Back to Tournament
                    </button>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-900 font-heading">Player Rosters</h2>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 font-sans">List of all registered players and their details.</p>
                    </div>
                    <div className="md:absolute md:right-0 mt-4 md:mt-0">
                        <div className="relative">
                            <Icon name="Search" className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1 bg-gray-50 border border-gray-200 rounded text-sm w-48 transition-all focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="inline-block text-left w-full shadow-sm rounded-lg overflow-hidden border border-gray-200"
                >

                    <div className="overflow-visible">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-2 px-2 md:py-3 md:px-4 font-bold text-gray-600 w-12 md:w-16 text-center text-xs md:text-sm uppercase tracking-wider">#</th>
                                    <th className="py-2 px-2 md:py-3 md:px-4 font-bold text-gray-600 text-left text-xs md:text-sm uppercase tracking-wider">Player</th>
                                    <th className="py-2 px-2 md:py-3 md:px-4 font-bold text-gray-600 w-16 md:w-24 text-right text-xs md:text-sm uppercase tracking-wider">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredAndSortedPlayers.map((player, index) => (
                                    <tr key={player.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-500 font-medium text-xs md:text-sm">
                                            {player.seed || index + 1}
                                        </td>
                                        <td className="py-2 px-2 md:py-3 md:px-4">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <Avatar className="h-8 w-8 md:h-10 md:w-10 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shadow-sm flex-shrink-0 transition-transform duration-300 ease-in-out hover:scale-[3] hover:z-50 hover:rounded-sm hover:shadow-xl cursor-pointer origin-left">
                                                    {player?.photo_url ? (
                                                        <AvatarImage
                                                            src={player.photo_url}
                                                            alt={player.name}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : null}
                                                    <AvatarFallback className="bg-gray-100 text-gray-400">
                                                        <User size={16} className="md:w-5 md:h-5" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm md:text-lg text-gray-900 font-medium break-words leading-tight">
                                                    {formatName(player.name)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 md:py-3 md:px-4 text-right text-gray-700 font-mono font-medium text-xs md:text-base">
                                            {player.rating || 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredAndSortedPlayers.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No players found matching your search.
                        </div>
                    )}
                </motion.div>

                <ReportFooter />
            </main>
        </div>
    );
};

export default PublicTournamentRoster;
