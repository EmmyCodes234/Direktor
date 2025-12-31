import React from 'react';
import { motion } from 'framer-motion';
import TournamentStats from './TournamentStats';
import StandingsTable from './StandingsTable';
import PendingResults from './PendingResults';

const LiveContextPanel = ({ tournamentInfo, players, results, pendingResults, matches, onSelectPlayer, onApproveResult, onRejectResult, teamStandings }) => {
    return (
        <div className="flex flex-col h-full space-y-3 overflow-hidden">
            {/* Top Stats - High Density */}
            <div className="flex-shrink-0">
                <TournamentStats
                    players={players}
                    recentResults={results}
                    tournamentInfo={tournamentInfo}
                    compact={true}
                />
            </div>

            {/* Pending Results (if any) - High Density */}
            {pendingResults && pendingResults.length > 0 && (
                <div className="flex-shrink-0 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-2.5 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-1.5 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold text-yellow-500/90">Pending Submission</h3>
                    </div>
                    <PendingResults
                        pending={pendingResults}
                        onApprove={onApproveResult}
                        onReject={onRejectResult}
                        compact={true}
                    />
                </div>
            )}

            {/* Standings - HUD Style */}
            <div className="flex-1 min-h-0 bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Live Standings</h3>
                    <div className="flex space-x-1">
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <StandingsTable
                        players={players}
                        teamStandings={teamStandings}
                        recentResults={results}
                        onSelectPlayer={onSelectPlayer}
                        tournamentType={tournamentInfo?.type}
                        isLoading={false}
                        compact={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default LiveContextPanel;
