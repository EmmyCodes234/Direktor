import React, { useState, useMemo } from 'react';
import { supabase } from '../../../supabaseClient';
import { toast } from 'sonner';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';

const TournamentPlayerManager = ({ tournamentId, players = [], divisions = [], onUpdate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDivision, setFilterDivision] = useState('All');
    const [filterStatus, setFilterStatus] = useState('active'); // active, paused, withdrawn, all
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);

    // Filtered Players
    const filteredPlayers = useMemo(() => {
        let result = players;

        if (filterDivision !== 'All') {
            result = result.filter(p => (p.division || 'Open') === filterDivision);
        }

        if (filterStatus !== 'all') {
            result = result.filter(p => (p.status || 'active') === filterStatus);
        }

        if (searchTerm) {
            const lowerInfo = searchTerm.toLowerCase();
            result = result.filter(p =>
                (p.name || '').toLowerCase().includes(lowerInfo) ||
                (p.first_name || '').toLowerCase().includes(lowerInfo) ||
                (p.last_name || '').toLowerCase().includes(lowerInfo)
            );
        }

        return result.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    }, [players, searchTerm, filterDivision, filterStatus]);

    // Stats
    const stats = useMemo(() => ({
        total: players.length,
        active: players.filter(p => p.status === 'active').length,
        paused: players.filter(p => p.status === 'paused').length,
        withdrawn: players.filter(p => p.status === 'withdrawn').length,
    }), [players]);

    const handleDeletePlayer = async (playerId) => {
        if (!window.confirm("Are you sure? This will remove the player from the tournament.")) return;

        try {
            const { error } = await supabase
                .from('tournament_players')
                .delete()
                .eq('tournament_id', tournamentId)
                .eq('player_id', playerId);

            if (error) throw error;
            toast.success("Player removed");
            if (onUpdate) onUpdate();
        } catch (err) {
            toast.error("Failed to remove player: " + err.message);
        }
    };

    const handleUpdatePlayer = async (updates) => {
        if (!editingPlayer) return;
        try {
            const { error } = await supabase
                .from('tournament_players')
                .update(updates)
                .eq('tournament_id', tournamentId)
                .eq('player_id', editingPlayer.player_id);

            if (error) throw error;
            toast.success("Player updated");
            setEditingPlayer(null);
            if (onUpdate) onUpdate();
        } catch (err) {
            toast.error("Failed to update: " + err.message);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-950/50 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            {/* Toolbar */}
            <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5">
                <div className="flex items-center space-x-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search players..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900/50 border border-white/10 rounded-lg text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-500"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <select
                            value={filterDivision}
                            onChange={(e) => setFilterDivision(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg text-sm px-3 py-2 text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            <option value="All">All Divisions</option>
                            {divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg text-sm px-3 py-2 text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="withdrawn">Withdrawn</option>
                            <option value="all">All Status</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {divisions.length === 1 && players.some(p => !p.division || p.division === 'Unassigned') && (
                        <Button
                            onClick={async () => {
                                if (!confirm(`Assign all ${players.filter(p => !p.division || p.division === 'Unassigned').length} unassigned players to ${divisions[0].name}?`)) return;
                                try {
                                    const { error } = await supabase
                                        .from('tournament_players')
                                        .update({ division: divisions[0].name })
                                        .eq('tournament_id', tournamentId)
                                        .or('division.is.null,division.eq.Unassigned');

                                    if (error) throw error;
                                    toast.success("Players assigned");
                                    if (onUpdate) onUpdate();
                                } catch (e) { toast.error(e.message) }
                            }}
                            size="sm"
                            className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-600/30"
                        >
                            <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                            Assign All to {divisions[0].name}
                        </Button>
                    )}
                    <Button onClick={() => setIsBulkModalOpen(true)} size="sm" variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700">
                        <Icon name="Upload" className="mr-2 h-4 w-4" />
                        Bulk Import
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                        <Icon name="Plus" className="mr-2 h-4 w-4" />
                        Add Player
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="px-6 py-2 bg-slate-900/30 border-b border-white/5 text-xs flex gap-6 font-mono">
                <span className="text-slate-400">Total: <strong className="text-slate-200">{stats.total}</strong></span>
                <span className="text-slate-400">Active: <strong className="text-emerald-400">{stats.active}</strong></span>
                <span className="text-slate-400">Paused: <strong className="text-yellow-400">{stats.paused}</strong></span>
                <span className="text-slate-400">Withdrawn: <strong className="text-rose-400">{stats.withdrawn}</strong></span>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[10%]">Rank</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[40%]">Player</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[15%]">Division</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[15%]">Rating</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[10%]">Status</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[10%] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPlayers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <Icon name="Users" size={40} className="opacity-20" />
                                        <p>No players found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredPlayers.map((p, idx) => (
                                <tr key={p.player_id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <span className={cn(
                                            "font-mono font-bold text-sm",
                                            p.rank <= 3 ? "text-emerald-400" : "text-slate-500"
                                        )}>
                                            {p.rank || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                                                p.photo_url ? "bg-slate-800" : "bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400 border border-white/5"
                                            )}>
                                                {p.photo_url ? (
                                                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    (p.name?.[0] || '?')
                                                )}
                                            </div>
                                            <div>
                                                <div className={cn(
                                                    "font-medium text-sm text-slate-200",
                                                    p.status === 'withdrawn' && "line-through text-slate-500"
                                                )}>
                                                    {p.name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-slate-300 border border-white/5">
                                            {p.division || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-sm text-slate-400">
                                        {p.rating || '-'}
                                    </td>
                                    <td className="p-4">
                                        <StatusBadge status={p.status} />
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingPlayer(p)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                                title="Edit"
                                            >
                                                <Icon name="Edit2" size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlayer(p.player_id)}
                                                className="p-1.5 rounded-lg text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                title="Remove"
                                            >
                                                <Icon name="Trash2" size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Player Modal */}
            <AddPlayerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                tournamentId={tournamentId}
                divisions={divisions}
                onAdd={onUpdate}
            />

            {/* Bulk Add Modal */}
            <BulkAddModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                tournamentId={tournamentId}
                divisions={divisions}
                onAdd={onUpdate}
            />

            {/* Edit Player Modal */}
            {editingPlayer && (
                <EditPlayerModal
                    player={editingPlayer}
                    onClose={() => setEditingPlayer(null)}
                    divisions={divisions}
                    onSave={handleUpdatePlayer}
                />
            )}
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        paused: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        withdrawn: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        disqualified: "bg-rose-950 text-rose-500 border-rose-500/50"
    };

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border",
            styles[status] || styles.active
        )}>
            {status}
        </span>
    );
};

const AddPlayerModal = ({ isOpen, onClose, tournamentId, divisions, onAdd }) => {
    const [mode, setMode] = useState('create');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [newPlayer, setNewPlayer] = useState({ name: '', rating: 0, division: '' });

    // Set default division when divisions load
    React.useEffect(() => {
        if (divisions.length > 0 && !newPlayer.division) {
            setNewPlayer(prev => ({ ...prev, division: divisions[0].name }));
        }
    }, [divisions]);

    // Global Search Logic
    const handleGlobalSearch = async () => {
        if (searchQuery.length < 2) return;
        const { data } = await supabase.from('players').select('*').ilike('name', `%${searchQuery}%`).limit(5);
        setSearchResults(data || []);
    };

    const handleAddExisting = async (player) => {
        try {
            await supabase.from('tournament_players').insert({
                tournament_id: tournamentId,
                player_id: player.id,
                division: newPlayer.division,
            });
            toast.success("Player Added");
            onAdd();
            onClose();
        } catch (e) { toast.error(e.message) }
    };

    const handleCreateNew = async () => {
        try {
            // 1. Create global player
            const slug = newPlayer.name.toLowerCase().replace(/\s+/g, '-');
            const { data: pData, error: pError } = await supabase.from('players').insert({
                name: newPlayer.name,
                rating: newPlayer.rating,
                slug: slug + '-' + Math.floor(Math.random() * 1000)
            }).select().single();

            if (pError) throw pError;

            // 2. Add to tournament
            await supabase.from('tournament_players').insert({
                tournament_id: tournamentId,
                player_id: pData.id,
                division: newPlayer.division,
            });

            toast.success("New Player Created & Added");
            onAdd();
            onClose();
        } catch (e) { toast.error(e.message) }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl ring-1 ring-white/5">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Add Player</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <Icon name="X" size={20} />
                    </button>
                </div>

                <div className="flex p-1 bg-slate-800 rounded-lg mb-6">
                    <button
                        onClick={() => setMode('create')}
                        className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-all", mode === 'create' ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-300")}
                    >
                        Create New
                    </button>
                    <button
                        onClick={() => setMode('search')}
                        className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-all", mode === 'search' ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-300")}
                    >
                        Search Existing
                    </button>
                </div>

                {mode === 'create' ? (
                    <div className="space-y-4">
                        <Input
                            label="Full Name"
                            value={newPlayer.name}
                            onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                            className="bg-slate-950 border-white/10 focus:border-emerald-500/50"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Rating"
                                type="number"
                                value={newPlayer.rating}
                                onChange={(e) => setNewPlayer({ ...newPlayer, rating: parseInt(e.target.value) || 0 })}
                                className="bg-slate-950 border-white/10 focus:border-emerald-500/50"
                            />
                            <div>
                                <label className="text-sm font-medium text-slate-400 mb-1.5 block">Division</label>
                                <select
                                    value={newPlayer.division}
                                    onChange={(e) => setNewPlayer({ ...newPlayer, division: e.target.value })}
                                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                                >
                                    {divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <Button onClick={handleCreateNew} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500">Create & Add</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Search database..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-950 border-white/10"
                            />
                            <Button onClick={handleGlobalSearch} variant="secondary">Search</Button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 border border-white/5 rounded-lg p-2 bg-slate-950/50">
                            {searchResults.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg cursor-pointer group" onClick={() => handleAddExisting(p)}>
                                    <span className="text-slate-300 group-hover:text-white">{p.name} <span className="text-slate-500 text-xs">({p.rating})</span></span>
                                    <Icon name="Plus" size={14} className="text-emerald-500" />
                                </div>
                            ))}
                            {searchResults.length === 0 && <p className="text-center text-slate-500 text-xs py-4">No results</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const EditPlayerModal = ({ player, onClose, divisions, onSave }) => {
    const [formData, setFormData] = useState({
        division: player.division || '',
        status: player.status || 'active'
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl ring-1 ring-white/5">
                <h2 className="text-lg font-bold text-white mb-4">Edit {player.name}</h2>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-400 mb-1.5 block">Division</label>
                        <select
                            value={formData.division}
                            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-emerald-500/50"
                        >
                            {divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400 mb-1.5 block">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-emerald-500/50"
                        >
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="withdrawn">Withdrawn</option>
                            <option value="disqualified">Disqualified</option>
                        </select>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <Button variant="ghost" onClick={onClose} className="flex-1 text-slate-400 hover:text-white">Cancel</Button>
                        <Button onClick={() => onSave(formData)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">Save Changes</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BulkAddModal = ({ isOpen, onClose, tournamentId, divisions, onAdd }) => {
    const [rawText, setRawText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleBulkImport = async () => {
        setIsProcessing(true);
        // Format: "Name Rating Division" per line
        const lines = rawText.split('\n').filter(l => l.trim());
        let successCount = 0;
        let errors = [];

        for (const line of lines) {
            try {
                // Heuristic parsing
                const parts = line.trim().split(/\s+/);
                const rating = parseInt(parts.find(p => /^\d{3,4}$/.test(p))) || 0;
                // Assume division is single letter or specific word at end, or default
                // For now, simple Name extraction
                const name = parts.filter(p => !/^\d+$/.test(p)).join(' ');

                // Default Division Logic
                let division = 'Unassigned';
                if (divisions.length === 1) {
                    division = divisions[0].name;
                } else if (divisions.length > 1) {
                    // If multiple, default to first for now, or 'Unassigned' if preferred. 
                    // User request specifically targeted the "only one division" case.
                    // But good UX is to default to the first one available.
                    division = divisions[0].name;
                } else {
                    division = 'Open';
                }

                // Check global first
                const { data: existingPlayer } = await supabase.from('players').select('id').ilike('name', name).maybeSingle();
                let playerId = existingPlayer?.id;

                if (!playerId) {
                    const slug = name.toLowerCase().replace(/\s+/g, '-');
                    const { data: newP } = await supabase.from('players').insert({
                        name, rating, slug: slug + '-' + Math.floor(Math.random() * 10000)
                    }).select().single();
                    playerId = newP.id;
                }

                // Add to tournament
                const { error } = await supabase.from('tournament_players').insert({
                    tournament_id: tournamentId,
                    player_id: playerId,
                    division,
                    // Team removed
                });

                if (error) {
                    // If duplicate, try update
                    if (error.code === '23505') { // Unique violation
                        await supabase.from('tournament_players').update({ division }).eq('tournament_id', tournamentId).eq('player_id', playerId);
                    } else {
                        throw error;
                    }
                }
                successCount++;
            } catch (err) {
                errors.push(`${line}: ${err.message}`);
            }
        }

        setIsProcessing(false);
        if (successCount > 0) {
            toast.success(`Processed ${successCount} players`);
            onAdd();
            onClose();
        }
        if (errors.length > 0) {
            console.error(errors);
            toast.error(`Failed to process ${errors.length} lines`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl ring-1 ring-white/5">
                <h2 className="text-xl font-bold text-white mb-2">Bulk Player Import</h2>
                <p className="text-sm text-slate-400 mb-4">Paste player list. Format: <code>FirstName LastName Rating</code></p>

                <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={"John Doe 1500\nJane Smith 1200\n..."}
                    className="w-full h-48 bg-slate-950 border border-white/10 rounded-lg p-3 text-sm font-mono text-slate-300 focus:ring-1 focus:ring-emerald-500/50 outline-none resize-none"
                />

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
                    <Button onClick={handleBulkImport} loading={isProcessing} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        <Icon name="Upload" className="mr-2 h-4 w-4" /> Import Players
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TournamentPlayerManager;
