import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardSidebar from './tournament-command-center-dashboard/components/DashboardSidebar';
import TournamentConfigSection from '../components/settings/TournamentConfigSection';
import PlayerManagementSection from '../components/settings/PlayerManagementSection';
import ScoringParametersSection from '../components/settings/ScoringParametersSection';
import SystemPreferencesSection from '../components/settings/SystemPreferencesSection';
import EmergencyControlsSection from '../components/settings/EmergencyControlsSection';
import PrizeManager from '../components/settings/PrizeManager';
import ConfirmationModal from '../components/ConfirmationModal';
import ResetTournamentModal from '../components/settings/ResetTournamentModal';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import useMediaQuery from '../hooks/useMediaQuery';

const ShareSection = ({ tournamentSlug }) => {
    const publicUrl = `https://direktorapp.netlify.app/tournaments/${tournamentSlug}/live`;

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

const TournamentSettingsAdministration = () => {
    const { tournamentSlug } = useParams();
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
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
            
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('slug', tournamentSlug)
                .single();
            if (error) {
                toast.error("Failed to load tournament settings.");
            } else {
                // Security check: Ensure user owns this tournament
                if (data.user_id !== user.id) {
                    toast.error("You don't have permission to access this tournament's settings.");
                    navigate('/lobby');
                    return;
                }
                setSettings(data);
            }
            setLoading(false);
        };
        fetchTournament();
    }, [tournamentSlug, navigate]);

    const handleSettingsChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };
    
    const handleBannerFileChange = (file) => {
        setBannerFile(file);
        setHasUnsavedChanges(true);
    }

    const handleSaveSettings = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || settings.user_id !== user.id) {
            toast.error("You don't have permission to modify this tournament.");
            return;
        }
        
        let updateData = { ...settings };

        if (bannerFile) {
            const filePath = `public/${settings.id}/banner-${bannerFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('tournament-banners')
                .upload(filePath, bannerFile, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) {
                toast.error(`Banner upload failed: ${uploadError.message}`);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('tournament-banners')
                .getPublicUrl(filePath);
            
            updateData.banner_url = publicUrl;
        }
        
        const { id, created_at, ...finalUpdateData } = updateData;

        const { error } = await supabase
            .from('tournaments')
            .update(finalUpdateData)
            .eq('id', settings.id)
            .eq('user_id', user.id);
        
        if (error) {
            toast.error(`Failed to save settings: ${error.message}`);
        } else {
            toast.success("Settings saved successfully!");
            setSettings(updateData);
            setBannerFile(null);
            setHasUnsavedChanges(false);
        }
    };
    
    const handleDeleteTournament = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || settings.user_id !== user.id) {
            toast.error("You don't have permission to delete this tournament.");
            return;
        }
        
        const { error } = await supabase.from('tournaments').delete().eq('id', settings.id).eq('user_id', user.id);
        if (error) {
            toast.error(`Failed to delete tournament: ${error.message}`);
        } else {
            toast.success("Tournament has been permanently deleted.");
            navigate('/');
        }
        setShowDeleteModal(false);
    };

    const handleResetTournament = async (resetType) => {
        if (!settings) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || settings.user_id !== user.id) {
            toast.error("You don't have permission to reset this tournament.");
            return;
        }
        
        toast.info("Resetting tournament...");
        setShowResetModal(false);

        try {
            if (resetType === 'results_only') {
                const { error: resultsError } = await supabase.from('results').delete().eq('tournament_id', settings.id);
                if (resultsError) throw resultsError;
                // Also reset player stats
                await supabase.from('tournament_players').update({ wins: 0, losses: 0, ties: 0, spread: 0, match_wins: 0 }).eq('tournament_id', settings.id);
            } else if (resetType === 'full_reset') {
                const { error: resultsError } = await supabase.from('results').delete().eq('tournament_id', settings.id);
                const { error: matchesError } = await supabase.from('matches').delete().eq('tournament_id', settings.id);
                if (resultsError || matchesError) throw new Error("Failed to clear old data.");
                
                await supabase.from('tournaments').update({ pairing_schedule: null, status: 'setup', currentRound: 1 }).eq('id', settings.id).eq('user_id', user.id);
                await supabase.from('tournament_players').update({ wins: 0, losses: 0, ties: 0, spread: 0, match_wins: 0 }).eq('tournament_id', settings.id);
            }
            toast.success("Tournament has been successfully reset.");
        } catch (error) {
            toast.error(`Failed to reset tournament: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <ConfirmationModal
                isOpen={showDeleteModal}
                title="Delete Tournament"
                message={`Are you sure you want to permanently delete "${settings?.name}"? This action cannot be undone.`}
                onConfirm={handleDeleteTournament}
                onCancel={() => setShowDeleteModal(false)}
                confirmText="Yes, Delete It"
            />
            <ResetTournamentModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={handleResetTournament}
            />
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-20 pb-8">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {isDesktop && (
                            <div className="md:col-span-1">
                                <DashboardSidebar tournamentSlug={tournamentSlug} />
                            </div>
                        )}
                        <div className={isDesktop ? "md:col-span-3 space-y-8" : "col-span-1 space-y-8"}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-heading font-bold text-gradient mb-2">Settings</h1>
                                    <p className="text-muted-foreground">Manage tournament rules, permissions, and system preferences.</p>
                                </div>
                                {hasUnsavedChanges && (
                                    <Button onClick={handleSaveSettings} iconName="Save" iconPosition="left">
                                        Save Changes
                                    </Button>
                                )}
                            </div>
                            {loading || !settings ? (
                                <p className="text-muted-foreground">Loading settings...</p>
                            ) : (
                                <>
                                    <ShareSection tournamentSlug={settings.slug} />
                                    <TournamentConfigSection settings={settings} onSettingsChange={handleSettingsChange} onBannerFileChange={handleBannerFileChange} />
                                    <PrizeManager currency={settings.currency} tournamentId={settings.id} />
                                    <PlayerManagementSection settings={settings} onSettingsChange={handleSettingsChange} />
                                    <ScoringParametersSection settings={settings} onSettingsChange={handleSettingsChange} />
                                    <SystemPreferencesSection />
                                    <EmergencyControlsSection onDeleteTournament={() => setShowDeleteModal(true)} onResetTournament={() => setShowResetModal(true)} />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TournamentSettingsAdministration;