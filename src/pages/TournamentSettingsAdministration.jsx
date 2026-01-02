import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import TournamentConfigSection from '../components/settings/TournamentConfigSection';
import PlayerManagementSection from '../components/settings/PlayerManagementSection';
import ScoringParametersSection from '../components/settings/ScoringParametersSection';
import SystemPreferencesSection from '../components/settings/SystemPreferencesSection';
import EmergencyControlsSection from '../components/settings/EmergencyControlsSection';
import PrizeManager from '../components/settings/PrizeManager';
import ConfirmationModal from '../components/ConfirmationModal';
import ResetTournamentModal from '../components/settings/ResetTournamentModal';
import PhotoDatabaseManager from '../components/PhotoDatabaseManager';
import PhotoMatcherUtility from '../components/admin/PhotoMatcherUtility';
import CarryoverConfigSection from '../components/settings/CarryoverConfigSection';
import PromotionEventsHistory from '../components/players/PromotionEventsHistory';
import LadderSystemConfigSection from '../components/settings/LadderSystemConfigSection';
import SettingsNavigation from '../components/settings/SettingsNavigation';
import ClassConfigurationSection from '../components/settings/ClassConfigurationSection';
import CollaboratorManager from '../components/tournament/CollaboratorManager';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import useMediaQuery from '../hooks/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';

const AuditLogModal = ({ isOpen, onClose, log }) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                    aria-modal="true"
                    role="dialog"
                >
                    <motion.div
                        initial={isDesktop ? { x: 300, opacity: 0 } : { y: 300, opacity: 0 }}
                        animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
                        exit={isDesktop ? { x: 300, opacity: 0 } : { y: 300, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={
                            isDesktop
                                ? 'glass-card w-full max-w-md h-full md:h-auto md:max-h-[90vh] md:rounded-l-xl shadow-xl p-6 md:mr-0 md:mt-0 md:mb-0 md:ml-0 md:rounded-none border-l border-border flex flex-col'
                                : 'glass-card w-full max-w-lg mx-auto rounded-t-xl shadow-xl p-6 pb-8 mb-0 border-t border-border flex flex-col'
                        }
                        style={isDesktop ? { height: '100vh', maxHeight: '90vh', marginRight: 0 } : {}}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-heading font-semibold">Audit Log</h2>
                            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close audit log"><Icon name="X" /></Button>
                        </div>
                        <div className="overflow-y-auto flex-1 min-h-0 max-h-[60vh] md:max-h-[70vh]">
                            {log.length === 0 ? <p className="text-muted-foreground">No actions logged yet.</p> : (
                                <ul className="space-y-2">
                                    {log.map((entry, i) => (
                                        <li key={i} className="p-2 bg-muted/10 rounded text-sm">
                                            <span className="font-mono text-xs text-muted-foreground">{entry.time}</span><br />
                                            <span>{entry.action}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ShareSection = ({ tournamentSlug }) => {
    const publicUrl = `https://direktorapp.netlify.app/tournament/${tournamentSlug}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl).then(() => {
            toast.success("Public link copied to clipboard!");
        });
    };

    return (
        <div className="glass-card p-6">
            <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2">
                <Icon name="Share2" size={20} className="text-primary" />
                <span>Share Tournament</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-3">Use this link to share the public-facing tournament page with players and spectators.</p>
            <div className="flex items-center space-x-2 p-2 bg-input rounded-lg">
                <input type="text" readOnly value={publicUrl} className="flex-1 bg-transparent text-muted-foreground text-sm focus:outline-none" />
                <Button onClick={handleCopy} size="sm">Copy Link</Button>
            </div>
        </div>
    );
};

const BannerUploadSection = ({ currentBanner, onFileChange }) => {
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            // Strict Dimension Check
            const REQUIRED_WIDTH = 1500;
            const REQUIRED_HEIGHT = 375;

            if (img.width !== REQUIRED_WIDTH || img.height !== REQUIRED_HEIGHT) {
                toast.error(`Invalid Banner Size! Required: ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px. Your image: ${img.width}x${img.height}px.`);
                e.target.value = null; // Clear input
                onFileChange(null);
            } else {
                onFileChange(file);
                toast.success("Banner dimensions verified.");
            }
        };
    };

    return (
        <Card className="bg-slate-900/40 border border-slate-800 shadow-none">
            <CardHeader className="pb-4 border-b border-slate-800">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <Icon name="Image" size={18} className="text-emerald-500" /> Public Page Banner
                </h3>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {currentBanner && (
                        <div className="w-full h-32 md:h-48 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative">
                            <img src={currentBanner} alt="Current Banner" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">Current</div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload New Banner</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="block w-full text-sm text-slate-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-xs file:font-semibold
                                  file:bg-emerald-500/10 file:text-emerald-500
                                  hover:file:bg-emerald-500/20
                                  cursor-pointer
                                "
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Required dimensions: <strong className="text-slate-300">1500x375 pixels</strong>.
                            Images with different dimensions will be rejected.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const TournamentSettingsAdministration = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const [tournamentInfo, setTournamentInfo] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showAuditLog, setShowAuditLog] = useState(false);
    const [showPhotoDatabase, setShowPhotoDatabase] = useState(false);
    const [showPromotionHistory, setShowPromotionHistory] = useState(false);
    const [auditLog, setAuditLog] = useState([]);
    const [players, setPlayers] = useState([]);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    useEffect(() => {
        const fetchTournament = async () => {
            setLoading(true);

            // Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in to access this page.");
                navigate('/login');
                return;
            }
            setCurrentUser(user);

            const { data, error } = await supabase
                .rpc('get_managed_tournaments')
                .eq('slug', tournamentSlug)
                .single();

            if (error) {
                console.error("Settings Load Error:", error);
                toast.error("Tournament not found or access denied.");
                navigate('/lobby');
                return;
            } else {
                setTournamentInfo(data);

                // Fetch players for photo database
                const { data: playersData, error: playersError } = await supabase
                    .from('tournament_players')
                    .select('*, players(id, name, rating, photo_url, slug)')
                    .eq('tournament_id', data.id);

                if (!playersError && playersData) {
                    const combinedPlayers = playersData.map(tp => ({
                        ...tp.players,
                        ...tp
                    }));
                    setPlayers(combinedPlayers);
                }

                // Fetch audit log (you might want to implement this based on your needs)
                // For now, we'll set an empty array
                setAuditLog([]);
            }
            setLoading(false);
        };
        fetchTournament();
    }, [tournamentSlug, navigate]);

    const handleSettingsChange = (field, value) => {
        setTournamentInfo(prev => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };

    const handleBannerFileChange = (file) => {
        setBannerFile(file);
        if (file) setHasUnsavedChanges(true);
    };

    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || tournamentInfo.user_id !== user.id) {
            toast.error("You don't have permission to modify this tournament.");
            setSaving(false);
            return;
        }

        let updateData = { ...tournamentInfo };

        if (bannerFile) {
            const filePath = `public/${tournamentInfo.id}/banner-${bannerFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('tournament-banners')
                .upload(filePath, bannerFile, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) {
                toast.error(`Banner upload failed: ${uploadError.message}`);
                setSaving(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('tournament-banners')
                .getPublicUrl(filePath);

            updateData.banner_url = publicUrl;
        }

        const { id, created_at, ...finalUpdateData } = updateData;

        // Fetch latest version to check for status updates based on changes
        const { data: currentDbTournament } = await supabase
            .from('tournaments')
            .select('status, rounds, current_round')
            .eq('id', tournamentInfo.id)
            .single();

        // LOGIC: If tournament was completed, check if the new round count exceeds the ACTUAL progress (current_round).
        // If so, we must reactivate it.
        // We use (currentDbTournament.current_round || 0) because it might be null/0.
        // We compare against finalUpdateData.rounds.
        if (currentDbTournament &&
            currentDbTournament.status === 'completed' &&
            finalUpdateData.rounds > (currentDbTournament.current_round || 0)) {
            finalUpdateData.status = 'in_progress';
            toast.info("Tournament reactivated due to added rounds.");
        }

        const { error } = await supabase
            .from('tournaments')
            .update(finalUpdateData)
            .eq('id', tournamentInfo.id)
            .eq('user_id', user.id);

        if (error) {
            toast.error(`Failed to save settings: ${error.message}`);
        } else {
            toast.success("Settings saved successfully!");
            setTournamentInfo(updateData);
            setBannerFile(null);
            setHasUnsavedChanges(false);
        }
        setSaving(false);
    };

    const handleDeleteTournament = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || tournamentInfo.user_id !== user.id) {
            toast.error("You don't have permission to delete this tournament.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this tournament? This action cannot be undone.")) return;

        try {
            const { error } = await supabase
                .from('tournaments')
                .delete()
                .eq('id', tournamentInfo.id);

            if (error) throw error;
            toast.success('Tournament deleted');
            navigate('/lobby');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete tournament');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-mono selection:bg-emerald-500/30 selection:text-emerald-200">
            <Toaster position="top-center" richColors theme="dark" />

            {/* Standalone Header */}
            <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
                <div className="container flex h-14 items-center max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-2 mr-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/tournament/${tournamentSlug}/dashboard`)}
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <Icon name="ArrowLeft" size={18} />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <h1 className="font-bold text-lg sm:text-lg text-slate-100 tracking-tight">Settings</h1>
                        <span className="text-slate-700 hidden sm:inline-block">/</span>
                        <span className="text-sm text-slate-500 font-bold uppercase tracking-wider hidden sm:inline-block">{tournamentInfo?.name}</span>
                    </div>
                    <div className="ml-auto flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/tournament/${tournamentSlug}/dashboard`)}
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            Exit
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
                {/* Header Info */}
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Configuration</h2>
                    <p className="text-slate-500">Manage rules, visibility, and tournament details.</p>
                </div>

                <form id="settings-form" onSubmit={handleSaveSettings} className="space-y-6">
                    {/* General Settings */}
                    <Card className="bg-slate-900/40 border border-slate-800 shadow-none">
                        <CardHeader className="pb-4 border-b border-slate-800">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2">
                                <Icon name="Settings" size={18} className="text-emerald-500" /> General Information
                            </h3>
                        </CardHeader>
                        <CardContent className="pt-6 grid gap-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tournament Name</label>
                                    <input
                                        type="text"
                                        className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-700"
                                        value={tournamentInfo?.name || ''}
                                        onChange={e => handleSettingsChange('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Date</label>
                                    <input
                                        type="date"
                                        className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all [&::-webkit-calendar-picker-indicator]:invert"
                                        value={tournamentInfo?.date || ''}
                                        onChange={e => handleSettingsChange('date', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Location</label>
                                <input
                                    type="text"
                                    className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-700"
                                    value={tournamentInfo?.location || ''}
                                    onChange={e => handleSettingsChange('location', e.target.value)}
                                    placeholder="Venue or Online URL"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                                <textarea
                                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all min-h-[100px] placeholder:text-slate-700"
                                    value={tournamentInfo?.description || ''}
                                    onChange={e => handleSettingsChange('description', e.target.value)}
                                    placeholder="Event details..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Share Section - Styling Wrapper only, inner content assumes compatibility or needs update. 
                        Let's update ShareSection manually in next step if needed, or inline styling here if possible. 
                        Wait, ShareSection is defined above. I need to update it too. I'll stick to replacing the main component structure first.
                    */}
                    {/* Share Section - Public URL (Re-implemented inline for styling control if component doesn't support props, but checking above... ShareSection returns glass-card. glass-card might need CSS update or override)
                        Actually, let's wrap it or hope glass-card adapts. Dashboard uses Tailwind classes. 
                        I will assume ShareSection needs update. I'll replace it with inline code for perfect match.
                    */}
                    <Card className="bg-slate-900/40 border border-slate-800 shadow-none">
                        <CardHeader className="pb-4 border-b border-slate-800">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2">
                                <Icon name="Share2" size={18} className="text-emerald-500" /> Share Tournament
                            </h3>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-400 mb-4">Use this link to share the public-facing tournament page.</p>
                            <div className="flex items-center space-x-2 p-1.5 bg-slate-950 border border-slate-800 rounded-lg">
                                <input
                                    type="text"
                                    readOnly
                                    value={`https://direktorapp.netlify.app/tournament/${tournamentSlug}`}
                                    className="flex-1 bg-transparent text-slate-400 text-xs font-mono px-2 focus:outline-none"
                                />
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`https://direktorapp.netlify.app/tournament/${tournamentSlug}`);
                                        toast.success("Public link copied!");
                                    }}
                                    size="sm"
                                    variant="ghost"
                                    className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 h-7 text-xs"
                                >
                                    Copy Link
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Banner Configuration */}
                    <BannerUploadSection
                        currentBanner={tournamentInfo?.banner_url || tournamentInfo?.banner_path || null}
                        onFileChange={handleBannerFileChange}
                    // Passing className or style might not verify inner classes. 
                    // I will rely on BannerUploadSection being updated separately if it looks off.
                    // Actually I can update BannerUploadSection in the same file if I use multi_replace? 
                    // No, let's stick to this big block replacement for the main render.
                    />

                    {/* Photo Management Section */}
                    {tournamentInfo && players.length > 0 && (
                        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                            <PhotoMatcherUtility
                                tournamentId={tournamentInfo.id}
                                players={players}
                                onComplete={() => toast.success("Photos updated!")}
                            />
                        </div>
                    )}

                    {/* Rules & Format */}
                    <Card className="bg-slate-900/40 border border-slate-800 shadow-none">
                        <CardHeader className="pb-4 border-b border-slate-800">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2">
                                <Icon name="List" size={18} className="text-emerald-500" /> Format & Rules
                            </h3>
                        </CardHeader>
                        <CardContent className="pt-6 grid gap-6">
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Total Rounds</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                        value={tournamentInfo?.rounds || ''}
                                        onChange={e => handleSettingsChange('rounds', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Pairing System</label>
                                    <select
                                        className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                        value={tournamentInfo?.pairing_system || 'swiss'}
                                        onChange={e => handleSettingsChange('pairing_system', e.target.value)}
                                    >
                                        <option value="swiss">Swiss System</option>
                                        <option value="round_robin">Round Robin</option>
                                        <option value="random">Random</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Scoring</label>
                                    <select
                                        className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                        value={tournamentInfo?.scoring_system || 'standard'}
                                        onChange={e => handleSettingsChange('scoring_system', e.target.value)}
                                    >
                                        <option value="standard">Standard (W/L/T)</option>
                                        <option value="handicap">Handicap</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-200">Public Visibility</h4>
                                    <p className="text-xs text-slate-500">Allow anyone with the link to view standings and pairings.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={tournamentInfo?.is_public || false}
                                        onChange={e => handleSettingsChange('is_public', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-200">Remote Submission</h4>
                                    <p className="text-xs text-slate-500">Allow players to submit results remotely.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={tournamentInfo?.remote_submission_enabled || false}
                                        onChange={e => handleSettingsChange('remote_submission_enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Class Configuration */}
                    <ClassConfigurationSection
                        classDefinitions={tournamentInfo?.class_definitions || []}
                        onChange={(newDefs) => handleSettingsChange('class_definitions', newDefs)}
                    />

                </form>

                {/* Collaborators - Outside the main form to avoid nesting */}
                <CollaboratorManager
                    tournamentId={tournamentInfo?.id}
                    isOwner={tournamentInfo?.user_id === (supabase.auth.currentUser?.id || currentUser?.id)}
                />

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 pb-12">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleDeleteTournament}
                        className="text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50"
                    >
                        Delete Tournament
                    </Button>
                    <Button
                        type="submit"
                        form="settings-form"
                        className="w-32 bg-emerald-600 hover:bg-emerald-500 text-white"
                        loading={saving}
                    >
                        Save Changes
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default TournamentSettingsAdministration;