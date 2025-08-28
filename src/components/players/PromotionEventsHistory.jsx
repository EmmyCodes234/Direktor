import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import Table from '../ui/Table';
import Icon from '../AppIcon';
import Loading from '../ui/Loading';
import { cn } from '../../utils/cn';

const PromotionEventsHistory = ({ tournamentId, isOpen, onClose }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && tournamentId) {
            fetchEvents();
        }
    }, [isOpen, tournamentId]);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('promotion_events')
                .select(`
                    *,
                    players(name),
                    tournaments(name)
                `)
                .eq('tournament_id', parseInt(tournamentId))
                .order('created_at', { ascending: false });

            if (error) throw error;

            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching promotion events:', error);
            toast.error('Failed to load promotion events history');
        } finally {
            setLoading(false);
        }
    };

    const formatSpread = (spread) => {
        if (spread === 0) return '0';
        return spread > 0 ? `+${spread}` : spread.toString();
    };

    const formatWins = (wins) => {
        return typeof wins === 'number' ? wins.toFixed(2) : wins;
    };

    const getEventTypeIcon = (eventType) => {
        switch (eventType) {
            case 'promotion':
                return <Icon name="ArrowUp" size={16} className="text-green-600" />;
            case 'demotion':
                return <Icon name="ArrowDown" size={16} className="text-red-600" />;
            case 'initial_placement':
                return <Icon name="UserPlus" size={16} className="text-blue-600" />;
            default:
                return <Icon name="ArrowUpDown" size={16} className="text-muted-foreground" />;
        }
    };

    const getEventTypeLabel = (eventType) => {
        switch (eventType) {
            case 'promotion':
                return 'Promotion';
            case 'demotion':
                return 'Demotion';
            case 'initial_placement':
                return 'Initial Placement';
            default:
                return eventType;
        }
    };

    const getPolicyDescription = (policy, config) => {
        switch (policy) {
            case 'none':
                return 'No carry-over';
            case 'full':
                return 'Full carry-over';
            case 'partial':
                const percentage = config?.percentage || 0;
                return `${percentage}% carry-over`;
            case 'capped':
                const cap = config?.spread_cap || 0;
                return `Capped (${cap}/game)`;
            case 'seedingOnly':
                return 'Seeding only';
            default:
                return policy;
        }
    };

    const columns = [
        {
            key: 'created_at',
            label: 'Date & Time',
            render: (value) => (
                <div className="text-sm">
                    <div className="font-medium">
                        {new Date(value).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {new Date(value).toLocaleTimeString()}
                    </div>
                </div>
            )
        },
        {
            key: 'event_type',
            label: 'Event',
            render: (value) => (
                <div className="flex items-center space-x-2">
                    {getEventTypeIcon(value)}
                    <span className="font-medium">{getEventTypeLabel(value)}</span>
                </div>
            )
        },
        {
            key: 'players.name',
            label: 'Player',
            render: (value) => (
                <div className="font-medium">{value}</div>
            )
        },
        {
            key: 'from_group_id',
            label: 'From Group',
            render: (value) => (
                <div className="text-sm">
                    {value ? `Group ${value.slice(0, 8)}...` : 'Initial'}
                </div>
            )
        },
        {
            key: 'to_group_id',
            label: 'To Group',
            render: (value) => (
                <div className="text-sm font-medium">
                    Group {value.slice(0, 8)}...
                </div>
            )
        },
        {
            key: 'applied_policy',
            label: 'Policy Applied',
            render: (value, event) => (
                <div className="text-sm">
                    <div className="font-medium">
                        {getPolicyDescription(value, event.policy_config)}
                    </div>
                </div>
            )
        },
        {
            key: 'carryover_wins',
            label: 'Carry-Over',
            render: (value, event) => (
                <div className="text-sm">
                    <div className="font-mono">
                        {formatWins(value)} wins
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {formatSpread(event.carryover_spread)} spread
                    </div>
                </div>
            )
        },
        {
            key: 'previous_wins',
            label: 'Previous Stats',
            render: (value, event) => (
                <div className="text-sm">
                    <div className="font-mono">
                        {event.previous_wins}W/{event.previous_losses}L/{event.previous_ties}T
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {formatSpread(event.previous_spread)} spread
                    </div>
                </div>
            )
        }
    ];

    const mobileCardView = (event) => (
        <div className="bg-muted/10 rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {getEventTypeIcon(event.event_type)}
                    <span className="font-medium">{getEventTypeLabel(event.event_type)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleDateString()}
                </div>
            </div>

            {/* Player Info */}
            <div>
                <div className="font-medium">{event.players?.name}</div>
                <div className="text-sm text-muted-foreground">
                    {event.from_group_id ? `Group ${event.from_group_id.slice(0, 8)}...` : 'Initial'} → Group {event.to_group_id.slice(0, 8)}...
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/10 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Previous Stats</div>
                    <div className="font-mono text-sm">
                        {event.previous_wins}W/{event.previous_losses}L/{event.previous_ties}T
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {formatSpread(event.previous_spread)} spread
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Carry-Over</div>
                    <div className="font-mono text-sm">
                        {formatWins(event.carryover_wins)} wins
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                        {formatSpread(event.carryover_spread)} spread
                    </div>
                </div>
            </div>

            {/* Policy Info */}
            <div className="bg-muted/20 rounded-lg p-2">
                <div className="text-xs text-muted-foreground">
                    Policy: {getPolicyDescription(event.applied_policy, event.policy_config)}
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="glass-card w-full max-w-6xl max-h-[90vh] m-4 p-6 overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-shrink-0">
                        <div>
                            <h3 className="text-lg font-heading font-semibold">Promotion Events History</h3>
                            <p className="text-sm text-muted-foreground">
                                Track all player movements and carry-over applications
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Icon name="X" size={20} />
                        </button>
                    </div>

                    {loading ? (
                        <Loading 
                            text="Loading promotion history..." 
                            className="py-12 flex-1"
                        />
                    ) : (
                        <>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-shrink-0">
                        <div className="bg-muted/10 rounded-lg p-4">
                            <div className="text-2xl font-bold text-green-600">
                                {events.filter(e => e.event_type === 'promotion').length}
                            </div>
                            <div className="text-sm text-muted-foreground">Promotions</div>
                        </div>
                        <div className="bg-muted/10 rounded-lg p-4">
                            <div className="text-2xl font-bold text-red-600">
                                {events.filter(e => e.event_type === 'demotion').length}
                            </div>
                            <div className="text-sm text-muted-foreground">Demotions</div>
                        </div>
                        <div className="bg-muted/10 rounded-lg p-4">
                            <div className="text-2xl font-bold text-blue-600">
                                {events.filter(e => e.event_type === 'initial_placement').length}
                            </div>
                            <div className="text-sm text-muted-foreground">Initial Placements</div>
                        </div>
                    </div>

                        {/* Events Table */}
                        <div className="flex-1 overflow-hidden">
                            <Table
                                data={events}
                                columns={columns}
                                mobileCardView={mobileCardView}
                                emptyMessage="No promotion events found"
                                className="w-full h-full"
                            />
                        </div>
                    </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PromotionEventsHistory;
