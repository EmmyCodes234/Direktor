import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/ui/Header';
import DashboardSidebar from './tournament-command-center-dashboard/components/DashboardSidebar';
import PlayerListItem from '../components/players/PlayerListItem';
import { Toaster, toast } from 'sonner';
import { supabase } from '../supabaseClient';
import Icon from '../components/AppIcon';
import PlayerStatsSummary from '../components/players/PlayerStatsSummary';
import ConfirmationModal from '../components/ConfirmationModal';
import PlayerEditModal from '../components/players/PlayerEditModal';
import AddPlayer from '../components/players/AddPlayer';

const PlayerManagementRosterControl = () => {
    const { tournamentSlug } = useParams();
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playerToRemove, setPlayerToRemove] = useState(null);
    const [playerToWithdraw, setPlayerToWithdraw] = useState(null);
    const [playerToEdit, setPlayerToEdit] = useState(null);
    const [tournamentInfo, setTournamentInfo] = useState(null);

    const fetchPlayers = useCallback(async (tournamentId) => {
        if (!tournamentId) return;
        
        const { data, error } = await supabase
            .from('tournament_players')
            .select(`
                status, wins, losses, ties, spread, seed, rank, team_id,
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
                .map(tp => ({ ...tp.players, ...tp, status: tp.status || 'active' }))
                .filter(p => p.name);
            setPlayers(combinedPlayers);
        }
    }, []);
    
    useEffect(() => {
        const fetchTournamentAndPlayers = async () => {
            if (!tournamentSlug) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('tournaments')
                .select('id, pairing_schedule, slug')
                .eq('slug', tournamentSlug)
                .single();

            if (error) {
                toast.error("Failed to load tournament data.");
                setLoading(false);
            } else {
                setTournamentInfo(data);
                await fetchPlayers(data.id);
                setLoading(false);
            }
        };
        fetchTournamentAndPlayers();
    }, [tournamentSlug, fetchPlayers]);
    
    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => {
            if (a.team_id < b.team_id) return -1;
            if (a.team_id > b.team_id) return 1;
            return (a.seed || 0) - (b.seed || 0);
        });
    }, [players]);

    const teamMap = useMemo(() => new Map(teams.map(team => [team.id, team.name])), [teams]);

    const playerStats = useMemo(() => {
        if (!players) return { total: 0, active: 0, inactive: 0, removed: 0, withdrawn: 0 };
        return { 
            total: players.length, 
            active: players.filter(p => p.status === 'active').length,
            withdrawn: players.filter(p => p.status === 'withdrawn').length,
            inactive: 0, 
            removed: 0 
        };
    }, [players]);

    const handleRemovePlayer = async () => {
        if (!playerToRemove) return;
        
        const { error } = await supabase
            .from('tournament_players')
      .select('*')
            .delete()
            .match({ tournament_id: tournamentInfo.id, player_id: playerToRemove.id });

        if (error) {
            toast.error(`Failed to remove player: ${error.message}`);
        } else {
            toast.success(`Player "${playerToRemove.name}" has been removed from the tournament.`);
            fetchPlayers(tournamentInfo.id);
        }
        setPlayerToRemove(null);
    };

    const handleWithdrawPlayer = async () => {
        if (!playerToWithdraw) return;

        const { error } = await supabase
            .from('tournament_players')
            .update({ status: 'withdrawn' })
            .match({ tournament_id: tournamentInfo.id, player_id: playerToWithdraw.id });

        if (error) {
            toast.error(`Failed to withdraw player: ${error.message}`);
        } else {
            toast.success(`Player "${playerToWithdraw.name}" has been withdrawn from the tournament.`);
            fetchPlayers(tournamentInfo.id);
        }
        setPlayerToWithdraw(null);
    };

    const handleSaveChanges = async (updatedPlayerData, photoFile) => {
        let photoUrl = updatedPlayerData.photo_url;

        if (photoFile) {
            const filePath = `public/${updatedPlayerData.id}/${photoFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('player-avatars')
                .upload(filePath, photoFile, { upsert: true });

            if (uploadError) {
                toast.error(`Photo upload failed: ${uploadError.message}`);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('player-avatars')
                .getPublicUrl(filePath);
            photoUrl = publicUrl;
        }

        const { error: updateError } = await supabase
            .from('players')
            .update({
                name: updatedPlayerData.name,
                email: updatedPlayerData.email,
                rating: updatedPlayerData.rating,
                photo_url: photoUrl
            })
            .eq('id', updatedPlayerData.id);

        if (updateError) {
            toast.error(`Failed to save changes: ${updateError.message}`);
        } else {
            toast.success("Player details updated successfully.");
            setPlayerToEdit(null);
            fetchPlayers(tournamentInfo.id);
        }
    };

    const handleAddPlayer = async (playerName) => {
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
                .insert({ name: playerName })
                .select('id')
                .single();
            if (newPlayerError) {
                toast.error(`Failed to create new player: ${newPlayerError.message}`);
                return;
            }
            playerId = newPlayer.id;
        }

        const { error: joinError } = await supabase
            .from('tournament_players')
            .insert({
                tournament_id: tournamentInfo.id,
                player_id: playerId,
                seed: players.length + 1,
                rank: players.length + 1
            });
        
        if (joinError) {
            toast.error(`Failed to add player to tournament: ${joinError.message}`);
        } else {
            toast.success(`Player "${playerName}" has been added to the tournament.`);
            fetchPlayers(tournamentInfo.id);
        }
    };

    const canAddPlayers = !tournamentInfo?.pairing_schedule || Object.keys(tournamentInfo.pairing_schedule).length === 0;

    return (
        <div className="min-h-screen bg-background">
            <PlayerEditModal
                isOpen={!!playerToEdit}
                player={playerToEdit}
                onClose={() => setPlayerToEdit(null)}
                onSave={handleSaveChanges}
            />
            <ConfirmationModal
                isOpen={!!playerToRemove}
                title="Remove Player"
                message={`Are you sure you want to remove "${playerToRemove?.name}" from this tournament?`}
                onConfirm={handleRemovePlayer}
                onCancel={() => setPlayerToRemove(null)}
                confirmText="Yes, Remove"
            />
            <ConfirmationModal
                isOpen={!!playerToWithdraw}
                title="Withdraw Player"
                message={`Are you sure you want to withdraw "${playerToWithdraw?.name}"? They will receive designated losses for all remaining rounds.`}
                onConfirm={handleWithdrawPlayer}
                onCancel={() => setPlayerToWithdraw(null)}
                confirmText="Yes, Withdraw"
            />
            <Toaster position="top-right" richColors />
            <Header />
            <main className="pt-20 pb-8">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <DashboardSidebar tournamentSlug={tournamentSlug} />
                        <div className="md:col-span-3">
                            <div className="mb-8">
                                <h1 className="text-3xl font-heading font-bold text-gradient mb-2">Player Roster</h1>
                                <p className="text-muted-foreground">Manage all participants in this tournament.</p>
                            </div>

                            {canAddPlayers && <AddPlayer onAddPlayer={handleAddPlayer} />}

                            <PlayerStatsSummary stats={playerStats} />
                            
                            <div className="glass-card mt-6">
                                <div className="divide-y divide-border">
                                    {loading ? <p className="p-12 text-center text-muted-foreground">Loading Roster...</p> :
                                     sortedPlayers.length > 0 ? (
                                        sortedPlayers.map((player) => (
                                            <PlayerListItem 
                                                key={player.id} 
                                                player={player}
                                                teamName={player.team_id ? teamMap.get(player.team_id) : null}
                                                onRemove={() => setPlayerToRemove(player)}
                                                onWithdraw={() => setPlayerToWithdraw(player)}
                                                onEdit={() => setPlayerToEdit(player)}
                                            />
                                        ))
                                     ) : (
                                        <div className="p-12 text-center text-muted-foreground">
                                            <Icon name="Users" size={48} className="mx-auto opacity-50 mb-4"/>
                                            <h4 className="font-heading font-semibold text-lg">No Players in Roster</h4>
                                            <p className="text-sm">Players added during setup will appear here.</p>
                                        </div>
                                     )
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlayerManagementRosterControl;