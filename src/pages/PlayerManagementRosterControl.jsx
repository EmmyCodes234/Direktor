import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import PlayerListItem from '../components/players/PlayerListItem';
import { Toaster, toast } from 'sonner';
import { supabase } from '../supabaseClient';
import Icon from '../components/AppIcon';
import PlayerStatsSummary from '../components/players/PlayerStatsSummary';
import ConfirmationModal from '../components/ConfirmationModal';
import PlayerEditModal from '../components/players/PlayerEditModal';
import AddPlayer from '../components/players/AddPlayer';
import PlayerPromotionManager from '../components/players/PlayerPromotionManager';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Modal from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';

const PlayerManagementRosterControl = () => {
    const { tournamentSlug } = useParams();
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playerToRemove, setPlayerToRemove] = useState(null);
    const [playerToWithdraw, setPlayerToWithdraw] = useState(null);
    const [playerToEdit, setPlayerToEdit] = useState(null);
    const [tournamentInfo, setTournamentInfo] = useState(null);
    const [showPromotionManager, setShowPromotionManager] = useState(false);
    const [groups, setGroups] = useState([]);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', rating: '', division: '', club: '' });

    // --- 1. Independent Helpers & Data Fetching ---

    const fetchPlayers = useCallback(async (tournamentId) => {
        if (!tournamentId) return;

        const { data, error } = await supabase
            .from('tournament_players')
            .select(`
                status, wins, losses, ties, spread, seed, rank, team_id, class,
                players (*)
            `)
            .eq('tournament_id', tournamentId);

        if (error) {
            toast.error("Failed to load player data.");
        } else {
            const { data: teamsData } = await supabase
                .from('teams')
                .select('id, name')
                .eq('tournament_id', tournamentId);

            setTeams(teamsData || []);
            const combinedPlayers = data
                .map(tp => ({
                    ...tp.players,
                    ...tp,
                    status: tp.status || 'active',
                    withdrawn: tp.status === 'withdrawn'
                }))
                .filter(p => p.name);
            setPlayers(combinedPlayers);
        }
    }, []);

    const updatePairingsAfterPlayerRemoval = async (removedPlayerId) => {
        try {
            if (!tournamentInfo?.id) return;

            // Get current pairing schedule
            const { data: tournament } = await supabase
                .from('tournaments')
                .select('pairing_schedule')
                .eq('id', tournamentInfo.id)
                .single();

            if (!tournament?.pairing_schedule) return;

            const updatedSchedule = {};

            // Process each round in the pairing schedule
            Object.entries(tournament.pairing_schedule).forEach(([roundNum, roundPairings]) => {
                const filteredPairings = roundPairings.filter(pairing => {
                    const player1Id = pairing.player1?.player_id || pairing.player1_id;
                    const player2Id = pairing.player2?.player_id || pairing.player2_id;
                    return player1Id !== removedPlayerId && player2Id !== removedPlayerId;
                });

                if (filteredPairings.length > 0) {
                    updatedSchedule[roundNum] = filteredPairings;
                }
            });

            // Update the tournament with the cleaned pairing schedule
            const { error: updateError } = await supabase
                .from('tournaments')
                .update({ pairing_schedule: updatedSchedule })
                .eq('id', tournamentInfo.id);

            if (updateError) {
                console.error('Error updating pairings after player removal:', updateError);
            }
        } catch (error) {
            console.error('Error updating pairings:', error);
        }
    };

    // --- 2. Core Logic Handlers ---

    const handleManualPlayerRemoval = async () => {
        if (!playerToRemove || !tournamentInfo?.id) return;

        try {
            // Step 1: Delete all results involving this player
            const { error: resultsError } = await supabase
                .from('results')
                .delete()
                .or(`player1_id.eq.${playerToRemove.id},player2_id.eq.${playerToRemove.id}`)
                .eq('tournament_id', tournamentInfo.id);

            if (resultsError) throw new Error(`Results removal failed: ${resultsError.message}`);

            // Step 2: Delete all matches involving this player
            const { error: matchesError } = await supabase
                .from('matches')
                .delete()
                .or(`player1_id.eq.${playerToRemove.id},player2_id.eq.${playerToRemove.id}`)
                .eq('tournament_id', tournamentInfo.id);

            if (matchesError) throw new Error(`Matches removal failed: ${matchesError.message}`);

            // Step 3: Remove player from tournament_players
            const { error: tournamentPlayerError } = await supabase
                .from('tournament_players')
                .delete()
                .match({ tournament_id: tournamentInfo.id, player_id: playerToRemove.id });

            if (tournamentPlayerError) throw new Error(`Roster removal failed: ${tournamentPlayerError.message}`);

            // Step 4: Update tournament pairings
            await updatePairingsAfterPlayerRemoval(playerToRemove.id);

            toast.success(`Player "${playerToRemove.name}" has been removed.`);
            setPlayerToRemove(null);
            fetchPlayers(tournamentInfo.id);

            window.dispatchEvent(new CustomEvent('tournamentDataChanged', {
                detail: { type: 'playerRemoved', playerId: playerToRemove.id }
            }));

        } catch (error) {
            console.error('Manual player removal error:', error);
            toast.error(error.message);
        }
    };

    const handleRemovePlayer = async () => {
        if (!playerToRemove || !tournamentInfo?.id) return;

        try {
            // Try stored procedure first
            const { error: transactionError } = await supabase.rpc('remove_player_from_tournament', {
                p_tournament_id: tournamentInfo.id,
                p_player_id: playerToRemove.id
            });

            if (transactionError) {
                // Return to manual if RPC fails (e.g. not exists)
                await handleManualPlayerRemoval();
            } else {
                toast.success(`Player "${playerToRemove.name}" has been removed.`);
                setPlayerToRemove(null);
                fetchPlayers(tournamentInfo.id);
                window.dispatchEvent(new CustomEvent('tournamentDataChanged', {
                    detail: { type: 'playerRemoved', playerId: playerToRemove.id }
                }));
            }
        } catch (error) {
            console.error('Player removal error:', error);
            await handleManualPlayerRemoval();
        }
    };

    const handleWithdrawPlayer = async () => {
        if (!playerToWithdraw || !tournamentInfo?.id) return;

        const { error } = await supabase
            .from('tournament_players')
            .update({ status: 'withdrawn' })
            .match({ tournament_id: tournamentInfo.id, player_id: playerToWithdraw.id });

        if (error) {
            toast.error(`Failed to withdraw player: ${error.message}`);
        } else {
            toast.success(`Player "${playerToWithdraw.name}" withdrawn.`);
            fetchPlayers(tournamentInfo.id);
        }
        setPlayerToWithdraw(null);
    };

    const handleSaveChanges = async (updatedPlayerData, photoFile) => {
        let photoUrl = updatedPlayerData.photo_url;

        if (photoFile) {
            const filePath = `${tournamentInfo.id}/player-avatars/${updatedPlayerData.id}/${photoFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('tournament-photos')
                .upload(filePath, photoFile, { upsert: true });

            if (uploadError) {
                toast.error(`Photo upload failed: ${uploadError.message}`);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('tournament-photos')
                .getPublicUrl(filePath);
            photoUrl = publicUrl;
        }

        const { error: updateError } = await supabase
            .from('players')
            .update({
                name: updatedPlayerData.name,
                email: updatedPlayerData.email,
                rating: updatedPlayerData.rating,
                photo_url: photoUrl,
                gender: updatedPlayerData.gender
            })
            .eq('id', updatedPlayerData.id);

        if (updateError) {
            toast.error(`Failed to save changes: ${updateError.message}`);
        } else {
            toast.success("Player details updated.");
            fetchPlayers(tournamentInfo.id);
        }
    };

    const handleAddPlayer = async (name, rating) => {
        const playerName = name;
        if (!playerName) return;

        const { data: existingPlayer } = await supabase
            .from('players')
            .select('id')
            .eq('name', playerName)
            .single();

        let playerId;
        if (existingPlayer) {
            playerId = existingPlayer.id;
        } else {
            const { data: newPlayer, error: newPlayerError } = await supabase
                .from('players')
                .insert({ name: playerName, rating: rating || null })
                .select('id')
                .single();
            if (newPlayerError) {
                toast.error(`Failed to create new player: ${newPlayerError.message}`);
                return;
            }
            playerId = newPlayer.id;
        }

        // Auto-determine class
        let assignedClass = null;
        if (rating && tournamentInfo.class_definitions) {
            const numRating = parseInt(rating);
            const def = tournamentInfo.class_definitions.find(d => numRating >= d.min && numRating <= d.max);
            if (def) assignedClass = def.name;
        }

        const { error: joinError } = await supabase
            .from('tournament_players')
            .insert({
                tournament_id: tournamentInfo.id,
                player_id: playerId,
                seed: players.length + 1,
                rank: players.length + 1,
                division: formData.division || null,
                class: assignedClass,
                match_wins: 0,
                match_losses: 0
            });

        if (joinError) {
            toast.error(`Failed to add player: ${joinError.message}`);
        } else {
            toast.success(`Player "${playerName}" added.`);
            fetchPlayers(tournamentInfo.id);
            setIsAddModalOpen(false);
            resetForm();
        }
    };

    // --- 3. UI Event Handlers ---

    const resetForm = () => setFormData({ name: '', rating: '', division: '', club: '', gender: '' });

    const openEditModal = (player) => {
        setPlayerToEdit(player);
        setFormData({
            id: player.id,
            name: player.name,
            rating: player.rating || '',
            division: player.division || '',
            club: player.club || '',
            gender: player.gender || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleToggleWithdraw = (player) => {
        if (player.withdrawn) {
            // Rejoin logic
            supabase.from('tournament_players')
                .update({ status: 'active' })
                .match({ tournament_id: tournamentInfo.id, player_id: player.id })
                .then(({ error }) => {
                    if (error) toast.error("Failed to rejoin");
                    else {
                        toast.success("Player rejoined");
                        fetchPlayers(tournamentInfo.id);
                    }
                });
        } else {
            setPlayerToWithdraw(player);
            // Modal will trigger handleWithdrawPlayer
        }
    };


    const handleTogglePause = (player) => {
        const newStatus = player.status === 'paused' ? 'active' : 'paused';
        const action = newStatus === 'paused' ? 'Paused' : 'Resumed';

        supabase.from('tournament_players')
            .update({ status: newStatus })
            .match({ tournament_id: tournamentInfo.id, player_id: player.id })
            .then(({ error }) => {
                if (error) {
                    toast.error(`Failed to ${action.toLowerCase()} player: ${error.message}`);
                } else {
                    toast.success(`Player ${action}`);
                    fetchPlayers(tournamentInfo.id);
                }
            });
    };

    const handleDeletePlayer = (playerId) => {
        const player = players.find(p => p.id === playerId);
        setPlayerToRemove(player);
        // Modal will trigger handleRemovePlayer
    };

    const handleUpdatePlayer = async (e) => {
        e.preventDefault();
        if (!playerToEdit) return;

        await handleSaveChanges({
            ...playerToEdit,
            name: formData.name,
            rating: formData.rating,
            division: formData.division,
            club: formData.club,
            gender: formData.gender
        }, null);
        setIsEditModalOpen(false);
    };

    // ... (retaining the Effects and UI but focusing on the Edit Modal render below)

    // Inside Edit Modal render:
    /*
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">Gender (AI Pronouns)</label>
                <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                    <option value="">Unknown</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
            <div>
                 <label className="block text-sm font-medium mb-1">Rating</label>
                 ...
            </div>
        </div>
    */


    // --- 4. Effects & Computing ---

    useEffect(() => {
        const fetchTournament = async () => {
            if (!tournamentSlug) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('tournaments')
                .select('id, pairing_schedule, slug, divisions, class_definitions')
                .eq('slug', tournamentSlug)
                .single();

            if (error) {
                toast.error("Failed to load tournament data.");
                setLoading(false);
            } else {
                setTournamentInfo(data);
                await fetchPlayers(data.id);
                if (data.divisions && Array.isArray(data.divisions)) {
                    setGroups(data.divisions);
                }
                setLoading(false);
            }
        };
        fetchTournament();
    }, [tournamentSlug, fetchPlayers]);

    // Filter Logic
    const filteredPlayers = useMemo(() => {
        let result = players;
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(p =>
                (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
                (p.club && p.club.toLowerCase().includes(lowerQuery))
            );
        }

        if (sortField) {
            result = [...result].sort((a, b) => {
                let aValue = a[sortField];
                let bValue = b[sortField];

                if (sortField === 'rating') {
                    aValue = parseInt(aValue) || 0;
                    bValue = parseInt(bValue) || 0;
                }

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [players, searchQuery, sortField, sortDirection]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <DashboardLayout tournamentInfo={tournamentInfo}>
            <Toaster position="top-center" richColors />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Player Roster</h1>
                    <p className="text-muted-foreground mt-1">Manage registration, divisions, and player details.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search players..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 h-10 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                        />
                    </div>
                    <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }} iconName="Plus" className="shadow-sm">
                        Add Player
                    </Button>
                </div>
            </div>

            {/* Roster Table Card */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-foreground cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">Player Name {sortField === 'name' && <Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />}</div>
                                </th>
                                <th className="px-6 py-3 font-semibold text-foreground cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort('rating')}>
                                    <div className="flex items-center gap-2">Rating {sortField === 'rating' && <Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />}</div>
                                </th>
                                <th className="px-6 py-3 font-semibold text-foreground cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort('division')}>
                                    <div className="flex items-center gap-2">Division {sortField === 'division' && <Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />}</div>
                                </th>
                                <th className="px-6 py-3 font-semibold text-foreground">Status</th>
                                <th className="px-6 py-3 font-semibold text-right text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPlayers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                                        No players found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredPlayers.map((player) => (
                                    <tr key={player.id} className="hover:bg-secondary/30 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {player.name}
                                            {player.club && <span className="ml-2 text-xs text-muted-foreground">({player.club})</span>}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-muted-foreground">{player.rating || 'Unrated'}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="bg-background">{player.division}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${player.status === 'paused' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                                !player.withdrawn
                                                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-600 border-red-500/20'
                                                }`}>
                                                {player.status === 'paused' ? 'Paused' : (!player.withdrawn ? 'Active' : 'Withdrawn')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" onClick={() => openEditModal(player)}>
                                                <Icon name="Edit2" size={16} />
                                            </Button>

                                            {/* Pause/Resume Button */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                                onClick={() => handleTogglePause(player)}
                                                title={player.status === 'paused' ? "Resume Player" : "Pause Player"}
                                            >
                                                <Icon name={player.status === 'paused' ? "PlayCircle" : "PauseCircle"} size={16} />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={player.withdrawn ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-red-600 hover:text-red-700 hover:bg-red-50"}
                                                onClick={() => handleToggleWithdraw(player)}
                                                title={player.withdrawn ? "Rejoin Tournament" : "Withdraw Player"}
                                            >
                                                <Icon name={player.withdrawn ? "RefreshCw" : "UserX"} size={16} />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeletePlayer(player.id)}>
                                                <Icon name="Trash2" size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-border bg-secondary/30 text-xs text-muted-foreground flex justify-between items-center">
                    <span>Showing {filteredPlayers.length} players</span>
                    <span>Total Registered: {players.length}</span>
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                }}
                title="Add Player"
            >
                <form onSubmit={handleAddPlayer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Rating</label>
                            <input
                                type="number"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.rating}
                                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Division</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.division}
                                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Club (Optional)</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={formData.club}
                            onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Add Player</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    resetForm();
                }}
                title="Edit Player"
            >
                <form onSubmit={handleUpdatePlayer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Gender (AI Pronouns)</label>
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <option value="">Unknown</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Rating</label>
                            <input
                                type="number"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.rating}
                                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Division</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.division}
                                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Club (Optional)</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={formData.club}
                            onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={!!playerToRemove}
                title="Remove Player"
                message={`Are you sure you want to remove ${playerToRemove?.name}? This action cannot be undone and will delete all their matches.`}
                confirmText="Remove"
                cancelText="Cancel"
                onConfirm={handleRemovePlayer}
                onCancel={() => setPlayerToRemove(null)}
            />

            <ConfirmationModal
                isOpen={!!playerToWithdraw}
                title="Withdraw Player"
                message={`Are you sure you want to withdraw ${playerToWithdraw?.name}? They will remain in history but won't be paired.`}
                confirmText="Withdraw"
                onConfirm={handleWithdrawPlayer}
                onCancel={() => setPlayerToWithdraw(null)}
            />

        </DashboardLayout>
    );
};

export default PlayerManagementRosterControl;
