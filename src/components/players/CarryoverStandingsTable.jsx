import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import Table from '../ui/Table';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const CarryoverStandingsTable = ({ 
    tournamentId, 
    players, 
    groups, 
    showCarryover = true,
    onPlayerSelect 
}) => {
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [carryoverConfig, setCarryoverConfig] = useState(null);

    useEffect(() => {
        fetchStandings();
        fetchCarryoverConfig();
    }, [tournamentId, players]);

    const fetchStandings = async () => {
        try {
            const { data, error } = await supabase.rpc('get_player_standings_with_carryover', {
                p_tournament_id: parseInt(tournamentId)
            });

            if (error) throw error;

            setStandings(data || []);
        } catch (error) {
            console.error('Error fetching standings:', error);
            // Fallback to basic standings if function fails
            const basicStandings = players.map((player, index) => ({
                player_id: player.player_id,
                player_name: player.name,
                group_id: player.group_id,
                carryover_wins: player.carryover_wins || 0,
                carryover_spread: player.carryover_spread || 0,
                current_wins: player.current_wins || player.wins || 0,
                current_losses: player.current_losses || player.losses || 0,
                current_ties: player.current_ties || player.ties || 0,
                current_spread: player.current_spread || player.spread || 0,
                total_wins: player.total_wins || player.wins || 0,
                total_spread: player.total_spread || player.spread || 0,
                games_played: (player.current_wins || player.wins || 0) + (player.current_losses || player.losses || 0) + (player.current_ties || player.ties || 0),
                rank: index + 1
            }));
            setStandings(basicStandings);
        } finally {
            setLoading(false);
        }
    };

    const fetchCarryoverConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('carryover_config')
                .select('*')
                .eq('tournament_id', parseInt(tournamentId))
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            setCarryoverConfig(data);
        } catch (error) {
            console.error('Error fetching carry-over config:', error);
        }
    };

    const formatSpread = (spread) => {
        if (spread === 0) return '0';
        return spread > 0 ? `+${spread}` : spread.toString();
    };

    const formatWins = (wins) => {
        return typeof wins === 'number' ? wins.toFixed(2) : wins;
    };

    const getStatusBadge = (player) => {
        const status = player.status || 'active';
        switch (status) {
            case 'withdrawn':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Withdrawn</span>;
            case 'disqualified':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Disqualified</span>;
            case 'active':
            default:
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</span>;
        }
    };

    const getGroupName = (groupId) => {
        const group = groups?.find(g => g.id === groupId);
        return group?.name || 'No Group';
    };

    const shouldShowCarryover = showCarryover && carryoverConfig?.show_carryover_in_standings;

    const columns = [
        {
            key: 'rank',
            label: 'Rank',
            render: (value, player) => (
                <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm">{value}</span>
                    {player.carryover_wins > 0 && (
                        <Icon name="ArrowUpDown" size={12} className="text-muted-foreground" title="Has carry-over" />
                    )}
                </div>
            )
        },
        {
            key: 'player_name',
            label: 'Player',
            render: (value, player) => (
                <div className="flex items-center space-x-2">
                    <span className="font-medium">{value}</span>
                    {getStatusBadge(player)}
                </div>
            )
        },
        {
            key: 'group_id',
            label: 'Group',
            render: (value) => getGroupName(value)
        }
    ];

    // Add carry-over columns if enabled
    if (shouldShowCarryover) {
        columns.push(
            {
                key: 'carryover_wins',
                label: 'Carry-Over Wins',
                render: (value) => (
                    <span className={cn(
                        "font-mono text-sm",
                        value > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                    )}>
                        {formatWins(value)}
                    </span>
                )
            },
            {
                key: 'carryover_spread',
                label: 'Carry-Over Spread',
                render: (value) => (
                    <span className={cn(
                        "font-mono text-sm",
                        value > 0 ? "text-green-600 dark:text-green-400" : value < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                    )}>
                        {formatSpread(value)}
                    </span>
                )
            },
            {
                key: 'current_wins',
                label: 'Current Wins',
                render: (value, player) => (
                    <div className="text-center">
                        <div className="font-mono font-bold text-sm">{value}</div>
                        <div className="text-xs text-muted-foreground">
                            {player.current_losses}L {player.current_ties}T
                        </div>
                    </div>
                )
            },
            {
                key: 'current_spread',
                label: 'Current Spread',
                render: (value) => (
                    <span className={cn(
                        "font-mono text-sm",
                        value > 0 ? "text-green-600 dark:text-green-400" : value < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                    )}>
                        {formatSpread(value)}
                    </span>
                )
            }
        );
    }

    // Add total columns
    columns.push(
        {
            key: 'total_wins',
            label: shouldShowCarryover ? 'Total Wins' : 'Wins',
            render: (value, player) => (
                <div className="text-center">
                    <div className="font-mono font-bold text-sm">{formatWins(value)}</div>
                    {shouldShowCarryover && player.carryover_wins > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                            +{formatWins(player.carryover_wins)} carry-over
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'total_spread',
            label: shouldShowCarryover ? 'Total Spread' : 'Spread',
            render: (value, player) => (
                <div className="text-center">
                    <span className={cn(
                        "font-mono font-bold text-sm",
                        value > 0 ? "text-green-600 dark:text-green-400" : value < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                    )}>
                        {formatSpread(value)}
                    </span>
                    {shouldShowCarryover && player.carryover_spread !== 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                            {player.carryover_spread > 0 ? '+' : ''}{formatSpread(player.carryover_spread)} carry-over
                        </div>
                    )}
                </div>
            )
        }
    );

    // Add actions column
    columns.push({
        key: 'actions',
        label: 'Actions',
        render: (value, player) => (
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onPlayerSelect && onPlayerSelect(player)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors touch-target"
                    title="View player details"
                    aria-label={`View details for ${player.player_name}`}
                >
                    <Icon name="Eye" size={16} />
                </button>
            </div>
        )
    });

    const mobileCardView = (player) => (
        <div className="bg-muted/10 rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-lg">{player.rank}</span>
                    <div>
                        <div className="font-medium">{player.player_name}</div>
                        <div className="text-sm text-muted-foreground">{getGroupName(player.group_id)}</div>
                    </div>
                </div>
                {getStatusBadge(player)}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {shouldShowCarryover && (
                    <>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Carry-Over</div>
                            <div className="font-mono font-bold text-sm">
                                {formatWins(player.carryover_wins)} wins, {formatSpread(player.carryover_spread)}
                            </div>
                        </div>
                        <div className="bg-muted/10 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground font-medium mb-1">Current</div>
                            <div className="font-mono font-bold text-sm">
                                {player.current_wins}W/{player.current_losses}L/{player.current_ties}T
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {formatSpread(player.current_spread)} spread
                            </div>
                        </div>
                    </>
                )}
                <div className="bg-muted/10 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground font-medium mb-1">
                        {shouldShowCarryover ? 'Total' : 'Record'}
                    </div>
                    <div className="font-mono font-bold text-lg">
                        {formatWins(player.total_wins)} wins
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {formatSpread(player.total_spread)} spread
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
                <button
                    onClick={() => onPlayerSelect && onPlayerSelect(player)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors touch-target"
                    title="View player details"
                >
                    <Icon name="Eye" size={16} />
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading carryover standings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Policy Info */}
            {carryoverConfig && (
                <div className="bg-muted/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Icon name="Info" size={16} className="text-primary" />
                        <span className="font-medium text-sm">Carry-Over Policy: {carryoverConfig.policy}</span>
                    </div>
                    {carryoverConfig.policy === 'partial' && (
                        <p className="text-xs text-muted-foreground">
                            {carryoverConfig.percentage}% of wins and spread are carried over
                        </p>
                    )}
                    {carryoverConfig.policy === 'capped' && (
                        <p className="text-xs text-muted-foreground">
                            Spread capped at {carryoverConfig.spread_cap} points per game
                        </p>
                    )}
                    {carryoverConfig.policy === 'seedingOnly' && (
                        <p className="text-xs text-muted-foreground">
                            Carry-over values used for seeding only, not counted in official totals
                        </p>
                    )}
                </div>
            )}

            {/* Standings Table */}
            <Table
                data={standings}
                columns={columns}
                mobileCardView={mobileCardView}
                emptyMessage="No players found"
                className="w-full"
            />
        </div>
    );
};

export default CarryoverStandingsTable;
