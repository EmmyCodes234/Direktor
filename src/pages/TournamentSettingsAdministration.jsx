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
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';

const ShareSection = ({ tournamentId }) => {
    const publicUrl = `https://direktorapp.netlify.app/tournaments/${tournamentId}/live`;

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
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const fetchTournament = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('id', tournamentId)
                .single();
            if (error) {
                toast.error("Failed to load tournament settings.");
            } else {
                setSettings(data);
            }
            setLoading(false);
        };
        fetchTournament();
    }, [tournamentId]);

    const handleSettingsChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };
    
    const handleBannerFileChange = (file) => {
        setBannerFile(file);
        setHasUnsavedChanges(true);
    }

    const handleSaveSettings = async () => {
        let updateData = { ...settings };

        if (bannerFile) {
            const filePath = `public/${tournamentId}/banner-${bannerFile.name}`;
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
            .eq('id', tournamentId);
        
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
        const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
        if (error) {
            toast.error(`Failed to delete tournament: ${error.message}`);
        } else {
            toast.success("Tournament has been permanently deleted.");
            navigate('/');
        }
        setShowDeleteModal(false);
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
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-20 pb-8">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <DashboardSidebar tournamentId={tournamentId} />
                        <div className="md:col-span-3 space-y-8">
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
                                    <ShareSection tournamentId={tournamentId} />
                                    <TournamentConfigSection settings={settings} onSettingsChange={handleSettingsChange} onBannerFileChange={handleBannerFileChange} />
                                    <PrizeManager currency={settings.currency} />
                                    <PlayerManagementSection settings={settings} onSettingsChange={handleSettingsChange} />
                                    <ScoringParametersSection settings={settings} onSettingsChange={handleSettingsChange} />
                                    <SystemPreferencesSection />
                                    <EmergencyControlsSection onDeleteTournament={() => setShowDeleteModal(true)} />
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