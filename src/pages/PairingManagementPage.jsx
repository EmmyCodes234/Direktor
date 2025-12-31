import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '../components/ui/Header';
import { useParams } from 'react-router-dom';

import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';
import Icon from '../components/AppIcon';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Button from '../components/ui/Button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import { Checkbox } from '../components/ui/Checkbox';

const allPairingSystems = [
    { id: 'swiss', name: 'Swiss', type: 'individual' },
    { id: 'enhanced_swiss', name: 'Enhanced Swiss (Prize Protection)', type: 'individual' },
    { id: 'king_of_the_hill', name: 'King of the Hill (KOTH)', type: 'individual' },
    { id: 'round_robin', name: 'Round Robin', type: 'individual' },
    { id: 'random', name: 'Random', type: 'individual' },
    { id: 'team_swiss', name: 'Team Swiss', type: 'team' },
    { id: 'team_round_robin', name: 'Team Round Robin', type: 'team' },
    { id: 'team_random', name: 'Team Random', type: 'team' },
];

const PairingManagementPage = () => {
    const { tournamentSlug } = useParams();
    const [tournament, setTournament] = useState(null);
    const [settings, setSettings] = useState({
        pairing_system: 'lito',
        gibson_rule_enabled: false,
        advanced_pairing_enabled: false,
        advanced_pairing_modes: {}
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tournaments')
            .select('id, pairing_system, rounds, advanced_pairing_modes, gibson_rule_enabled, type')
            .eq('slug', tournamentSlug)
            .single();

        if (error) {
            toast.error("Failed to load pairing settings.");
        } else if (data) {
            setTournament(data);

            const advanced_modes = data.advanced_pairing_modes || {};
            if (data.advanced_pairing_modes) {
                for (let i = 1; i <= data.rounds; i++) {
                    if (!advanced_modes[i]) {
                        advanced_modes[i] = { system: 'enhanced_swiss', base_round: i - 1, allow_rematches: true };
                    }
                }
            }

            setSettings({
                pairing_system: data.pairing_system || 'enhanced_swiss',
                gibson_rule_enabled: data.gibson_rule_enabled || false,
                advanced_pairing_enabled: !!data.advanced_pairing_modes,
                advanced_pairing_modes: advanced_modes
            });
        }
        setLoading(false);
    }, [tournamentSlug]);

    const availablePairingSystems = useMemo(() => {
        if (!tournament) return [];
        if (tournament.type === 'team') {
            return allPairingSystems.filter(s => s.type === 'team' || s.id === 'random');
        }
        return allPairingSystems.filter(s => s.type === 'individual');
    }, [tournament]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async () => {
        const updatePayload = {
            pairing_system: settings.pairing_system,
            gibson_rule_enabled: settings.gibson_rule_enabled,
            advanced_pairing_modes: settings.advanced_pairing_enabled ? settings.advanced_pairing_modes : null
        };

        const { error } = await supabase
            .from('tournaments')
            .update(updatePayload)
            .eq('id', tournament.id);

        if (error) {
            toast.error("Failed to save settings.");
        } else {
            toast.success("Pairing settings updated successfully!");
        }
    };

    const handleAdvancedModeSettingChange = (round, field, value) => {
        setSettings(prev => ({
            ...prev,
            advanced_pairing_modes: {
                ...prev.advanced_pairing_modes,
                [round]: {
                    ...(prev.advanced_pairing_modes[round] || { system: 'enhanced_swiss', base_round: round - 1, allow_rematches: true }),
                    [field]: value
                }
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <DashboardLayout tournamentSlug={tournamentSlug}>
            <Toaster position="top-center" richColors />

            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pairings Strategy</h1>
                        <p className="text-muted-foreground mt-1">Configure pairing algorithms and rematch rules.</p>
                    </div>
                    <Button onClick={handleSave} iconName="Save" iconPosition="left">Save Changes</Button>
                </div>

                <Accordion type="multiple" defaultValue={['advanced']} className="w-full space-y-4">
                    <AccordionItem value="default" className="border border-border rounded-lg bg-card overflow-hidden">
                        <AccordionTrigger className="px-6 py-4 hover:bg-secondary/10 transition-colors">Default Pairing System</AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 pt-2">
                            <p className="text-muted-foreground mb-4">Select the primary pairing system. This is used if Advanced Mode is disabled.</p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {availablePairingSystems.map(system => (
                                    <div
                                        key={system.id}
                                        className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${settings.pairing_system === system.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                        onClick={() => setSettings({ ...settings, pairing_system: system.id })}
                                    >
                                        <h3 className="font-semibold text-foreground">{system.name}</h3>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="advanced" className="border border-border rounded-lg bg-card overflow-hidden">
                        <AccordionTrigger className="px-6 py-4 hover:bg-secondary/10 transition-colors">Advanced Mode (Round-by-Round)</AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 pt-2">
                            <div className="p-4 bg-secondary/20 rounded-lg mb-6">
                                <Checkbox
                                    label="Enable Advanced Pairing Mode"
                                    checked={settings.advanced_pairing_enabled}
                                    onCheckedChange={(checked) => setSettings({ ...settings, advanced_pairing_enabled: checked })}
                                    description="Set a different pairing system and rule for each specific round."
                                />
                            </div>
                            {settings.advanced_pairing_enabled && (
                                <div className="space-y-1">
                                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-2">Round</span>
                                        <span className="col-span-4">Pairing System</span>
                                        <span className="col-span-4">Base Standings On</span>
                                        <span className="col-span-2 text-right">Allow Rematches</span>
                                    </div>
                                    <div className="space-y-2">
                                        {Array.from({ length: tournament?.rounds || 0 }, (_, i) => i + 1).map(roundNum => (
                                            <div key={roundNum} className="grid grid-cols-12 gap-4 items-center p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
                                                <span className="col-span-2 font-semibold text-foreground">Round {roundNum}</span>
                                                <div className="col-span-4">
                                                    <select
                                                        value={settings.advanced_pairing_modes[roundNum]?.system || 'swiss'}
                                                        onChange={(e) => handleAdvancedModeSettingChange(roundNum, 'system', e.target.value)}
                                                        className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    >
                                                        {availablePairingSystems.map(system => (<option key={system.id} value={system.id}>{system.name}</option>))}
                                                    </select>
                                                </div>
                                                <div className="col-span-4">
                                                    <select
                                                        value={settings.advanced_pairing_modes[roundNum]?.base_round ?? roundNum - 1}
                                                        onChange={(e) => handleAdvancedModeSettingChange(roundNum, 'base_round', parseInt(e.target.value))}
                                                        className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    >
                                                        <option value={0}>Round 0 (Seeding)</option>
                                                        {Array.from({ length: roundNum - 1 }, (_, i) => i + 1).map(baseRound => (
                                                            <option key={baseRound} value={baseRound}>Round {baseRound} Standings</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-span-2 flex justify-end">
                                                    <Checkbox
                                                        checked={settings.advanced_pairing_modes[roundNum]?.allow_rematches ?? true}
                                                        onCheckedChange={(checked) => handleAdvancedModeSettingChange(roundNum, 'allow_rematches', checked)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="special" className="border border-border rounded-lg bg-card overflow-hidden">
                        <AccordionTrigger className="px-6 py-4 hover:bg-secondary/10 transition-colors">Special Pairing Rules</AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 pt-2">
                            <div className="p-4 bg-secondary/20 rounded-lg">
                                <Checkbox
                                    label="Enable Gibson Rule"
                                    checked={settings.gibson_rule_enabled}
                                    onCheckedChange={(checked) => setSettings({ ...settings, gibson_rule_enabled: checked })}
                                    description="For later rounds, automatically pair a player who has clinched first place against the highest-ranked non-prizewinner. (Individual events only)"
                                    disabled={tournament?.type === 'team'}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </DashboardLayout>
    );
};

export default PairingManagementPage;