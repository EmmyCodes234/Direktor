import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import Table from '../ui/Table';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';
import useMediaQuery from '../../hooks/useMediaQuery';

const LadderStandingsTable = ({ 
    tournamentId, 
    players, 
    ladderConfig,
    onPlayerSelect 
}) => {
    const [standings, setStandings] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeDivision, setActiveDivision] = useState(null);
    const isMobile = useMediaQuery('(max-width: 767px)');

    useEffect(() => {
        if (tournamentId && ladderConfig?.isLadderMode) {
            fetchLadderStandings();
        }
    }, [tournamentId, ladderConfig]);

    const fetchLadderStandings = async () => {
        try {
            // Fetch standings with carry-over information
            const { data, error } = await supabase.rpc('get_player_standings_with_carryover', {
                p_tournament_id: parseInt(tournamentId)
            });

            if (error) {
                // If function doesn't exist (table not migrated), show appropriate message
                if (error.code === '42883') {
                    console.warn('Ladder system functions not available yet. Run database migration to enable ladder features.');
                    setLoading(false);
                    return;
                }
                throw error;
            }

            // Group players by division
            const divisionStandings = {};
            ladderConfig.divisions.forEach(division => {
                divisionStandings[division.name] = [];
            });

            // Add players to their divisions
            data?.forEach(player => {
                const division = getPlayerDivision(player, ladderConfig.divisions);
                if (division) {
                    divisionStandings[division.name].push({
                        ...player,
                        division: division.name,
                        divisionColor: division.color
                    });
                }
            });

            // Sort each division by rank
            Object.keys(divisionStandings).forEach(divisionName => {
                divisionStandings[divisionName].sort((a, b) => a.rank - b.rank);
            });

            setStandings(divisionStandings);
            
            // Set first division as active
            if (ladderConfig.divisions.length > 0 && !activeDivision) {
                setActiveDivision(ladderConfig.divisions[0].name);
            }
        } catch (error) {
            console.error('Failed to fetch ladder standings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPlayerDivision = (player, divisions) => {
        const playerRating = player.rating || 1500;
        return divisions.find(div => 
            playerRating >= div.minRating && playerRating <= div.maxRating
        );
    };

    const getPromotionStatus = (player, divisionName, divisionIndex) => {
        const division = ladderConfig.divisions[divisionIndex];
        const divisionPlayers = standings[divisionName] || [];
        const playerRank = player.rank;
        const totalPlayers = divisionPlayers.length;

        // Check for promotion
        if (divisionIndex > 0 && playerRank <= ladderConfig.promotionRules.topPromote) {
            return { type: 'promote', text: '↑ Promote' };
        }

        // Check for relegation
        if (divisionIndex < ladderConfig.divisions.length - 1 && 
            playerRank > totalPlayers - ladderConfig.promotionRules.bottomRelegate) {
            return { type: 'relegate', text: '↓ Relegate' };
        }

        // Check for auto-promotion by rating
        if (player.rating >= ladderConfig.promotionRules.autoPromoteRating) {
            return { type: 'auto-promote', text: '↑ Auto-Promote' };
        }

        // Check for auto-relegation by rating
        if (player.rating <= ladderConfig.promotionRules.autoRelegateRating) {
            return { type: 'auto-relegate', text: '↓ Auto-Relegate' };
        }

        return null;
    };

    const formatSpread = (spread) => {
        if (spread === null || spread === undefined) return '0';
        return spread > 0 ? `+${spread}` : spread.toString();
    };

    const formatWins = (wins) => {
        if (wins === null || wins === undefined) return '0';
        return wins.toFixed(2);
    };

    const getStatusBadge = (player) => {
        const status = player.status || 'active';
        switch (status) {
            case 'active':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</span>;
            case 'withdrawn':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Withdrawn</span>;
            case 'disqualified':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Disqualified</span>;
            default:
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">Unknown</span>;
        }
    };

    const shouldShowCarryover = ladderConfig?.show_carryover_in_standings;

    const buildColumns = (divisionName) => {
        const baseColumns = [
            {
                header: 'Rank',
                accessorKey: 'rank',
                cell: ({ row }) => (
                    <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">#{row.original.rank}</span>
                        {getPromotionStatus(row.original, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName)) && (
                            <span className={cn(
                                "text-xs px-2 py-1 rounded-full font-medium",
                                getPromotionStatus(row.original, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName))?.type === 'promote' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                                getPromotionStatus(row.original, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName))?.type === 'relegate' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                                getPromotionStatus(row.original, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName))?.type === 'auto-promote' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                                getPromotionStatus(row.original, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName))?.type === 'auto-relegate' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            )}>
                                {getPromotionStatus(row.original, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName))?.text}
                            </span>
                        )}
                    </div>
                )
            },
            {
                header: 'Player',
                accessorKey: 'player_name',
                cell: ({ row }) => (
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: row.original.divisionColor }}
                            />
                        </div>
                        <div>
                            <div className="font-medium text-sm">{row.original.player_name}</div>
                            <div className="text-xs text-muted-foreground">Rating: {row.original.rating || 1500}</div>
                        </div>
                    </div>
                )
            },
            {
                header: 'Record',
                accessorKey: 'record',
                cell: ({ row }) => (
                    <div className="text-sm">
                        {row.original.current_wins || 0}-{row.original.current_losses || 0}-{row.original.current_ties || 0}
                    </div>
                )
            }
        ];

        if (shouldShowCarryover) {
            baseColumns.push(
                {
                    header: 'Carryover',
                    accessorKey: 'carryover',
                    cell: ({ row }) => (
                        <div className="text-sm">
                            <div>{formatWins(row.original.carryover_wins)} wins</div>
                            <div className="text-muted-foreground">{formatSpread(row.original.carryover_spread)} spread</div>
                        </div>
                    )
                },
                {
                    header: 'Current',
                    accessorKey: 'current',
                    cell: ({ row }) => (
                        <div className="text-sm">
                            <div>{row.original.current_wins || 0} wins</div>
                            <div className="text-muted-foreground">{formatSpread(row.original.current_spread)} spread</div>
                        </div>
                    )
                },
                {
                    header: 'Total',
                    accessorKey: 'total',
                    cell: ({ row }) => (
                        <div className="text-sm font-semibold">
                            <div>{formatWins(row.original.total_wins)} wins</div>
                            <div className="text-muted-foreground">{formatSpread(row.original.total_spread)} spread</div>
                        </div>
                    )
                }
            );
        } else {
            baseColumns.push({
                header: 'Spread',
                accessorKey: 'total_spread',
                cell: ({ row }) => (
                    <div className="text-sm font-semibold">
                        {formatSpread(row.original.total_spread)}
                    </div>
                )
            });
        }

        baseColumns.push({
            header: 'Status',
            accessorKey: 'status',
            cell: ({ row }) => getStatusBadge(row.original)
        });

        baseColumns.push({
            header: 'Actions',
            accessorKey: 'actions',
            cell: ({ row }) => (
                <button
                    onClick={() => onPlayerSelect && onPlayerSelect(row.original)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="View player details"
                >
                    <Icon name="Eye" size={16} />
                </button>
            )
        });

        return baseColumns;
    };

    const mobileCardView = (player, divisionName) => (
        <div className="p-4 bg-card rounded-lg border border-border space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: player.divisionColor }}
                    />
                    <div>
                        <div className="font-medium">{player.player_name}</div>
                        <div className="text-xs text-muted-foreground">Rating: {player.rating || 1500}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-semibold">#{player.rank}</div>
                    {getPromotionStatus(player, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName)) && (
                        <div className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium mt-1",
                            getPromotionStatus(player, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName))?.type === 'promote' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                            getPromotionStatus(player, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName))?.type === 'relegate' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                            getPromotionStatus(player, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName))?.type === 'auto-promote' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                            getPromotionStatus(player, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName))?.type === 'auto-relegate' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        )}>
                            {getPromotionStatus(player, divisionName, ladderConfig.divisions.findIndex(d => d.name === divisionName))?.text}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="text-muted-foreground">Record</div>
                    <div>{player.current_wins || 0}-{player.current_losses || 0}-{player.current_ties || 0}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">Spread</div>
                    <div className="font-semibold">{formatSpread(player.total_spread)}</div>
                </div>
            </div>

            {shouldShowCarryover && (
                <div className="grid grid-cols-3 gap-2 text-xs bg-muted/20 p-2 rounded">
                    <div>
                        <div className="text-muted-foreground">Carryover</div>
                        <div>{formatWins(player.carryover_wins)} wins</div>
                        <div>{formatSpread(player.carryover_spread)} spread</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">Current</div>
                        <div>{player.current_wins || 0} wins</div>
                        <div>{formatSpread(player.current_spread)} spread</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-semibold">{formatWins(player.total_wins)} wins</div>
                        <div className="font-semibold">{formatSpread(player.total_spread)} spread</div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                {getStatusBadge(player)}
                <button
                    onClick={() => onPlayerSelect && onPlayerSelect(player)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="View player details"
                >
                    <Icon name="Eye" size={16} />
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-64 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    if (!ladderConfig?.isLadderMode) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Icon name="TrendingUp" size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">Ladder System Not Enabled</h3>
                <p>Enable Ladder System Mode in tournament settings to view enhanced standings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Division Navigation */}
            <div className="flex flex-wrap gap-2">
                {ladderConfig.divisions.map((division) => (
                    <button
                        key={division.name}
                        onClick={() => setActiveDivision(division.name)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeDivision === division.name
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                        style={{
                            borderLeft: `4px solid ${division.color}`
                        }}
                    >
                        {division.name}
                        <span className="ml-2 text-xs opacity-75">
                            ({standings[division.name]?.length || 0})
                        </span>
                    </button>
                ))}
            </div>

            {/* Policy Information */}
            <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <Icon name="Info" size={16} />
                    <span>Ladder System Policy</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <div className="text-muted-foreground">Carry-Over Policy</div>
                        <div className="font-medium capitalize">{ladderConfig.carryoverPolicy}</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">Promotion Rules</div>
                        <div className="font-medium">Top {ladderConfig.promotionRules.topPromote} promote</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">Relegation Rules</div>
                        <div className="font-medium">Bottom {ladderConfig.promotionRules.bottomRelegate} relegate</div>
                    </div>
                </div>
            </div>

            {/* Active Division Standings */}
            {activeDivision && standings[activeDivision] && (
                <motion.div
                    key={activeDivision}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: ladderConfig.divisions.find(d => d.name === activeDivision)?.color }}
                        />
                        <h3 className="text-xl font-semibold">{activeDivision} Division</h3>
                    </div>
                    
                    <Table
                        data={standings[activeDivision]}
                        columns={buildColumns(activeDivision)}
                        mobileCardView={(player) => mobileCardView(player, activeDivision)}
                        emptyMessage={`No players in ${activeDivision} division`}
                        className="w-full"
                    />
                </motion.div>
            )}

            {/* All Divisions Overview (Desktop) */}
            {!isMobile && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {ladderConfig.divisions.map((division) => (
                        <div key={division.name} className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: division.color }}
                                />
                                <h4 className="font-semibold">{division.name}</h4>
                                <span className="text-sm text-muted-foreground">
                                    ({standings[division.name]?.length || 0} players)
                                </span>
                            </div>
                            
                            <div className="space-y-2">
                                {standings[division.name]?.slice(0, 5).map((player, index) => (
                                    <div key={player.player_id} className="flex items-center justify-between p-2 bg-muted/20 rounded text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium">#{player.rank}</span>
                                            <span>{player.player_name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div>{formatWins(player.total_wins)} wins</div>
                                            <div className="text-muted-foreground">{formatSpread(player.total_spread)} spread</div>
                                        </div>
                                    </div>
                                ))}
                                {standings[division.name]?.length > 5 && (
                                    <div className="text-center text-sm text-muted-foreground py-2">
                                        +{standings[division.name].length - 5} more players
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LadderStandingsTable;
