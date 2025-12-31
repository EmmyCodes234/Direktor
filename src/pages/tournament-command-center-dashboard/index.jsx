import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';

// Components
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import ResultsEntryCLI from './components/ResultsEntryCLI';
import LiveContextPanel from './components/LiveContextPanel';
import PlayerStatsModal from '../../components/PlayerStatsModal.jsx';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';
import AnnouncementsManager from './components/AnnouncementsManager';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

// Hooks
import useMediaQuery from '../../hooks/useMediaQuery';
import useTournamentData from '../../hooks/dashboard/useTournamentData';
import useStandingsCalculator from '../../hooks/dashboard/useStandingsCalculator';
import useTournamentActions from '../../hooks/dashboard/useTournamentActions';
import { cn } from '../../utils/cn';

const TournamentCommandCenterDashboard = () => {
  const { tournamentSlug } = useParams();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // 1. Data Fetching
  const { tournamentInfo, setTournamentInfo, players, setPlayers, results, setResults, matches, setMatches, teams, pendingResults, loading } = useTournamentData(tournamentSlug);

  // 2. Logic / Actions
  const { isSubmitting, submitResult, unpairRound, completeRound } = useTournamentActions(tournamentInfo, setTournamentInfo, players, setResults, setMatches);

  // 3. Derived State (Standings)
  const rankedPlayers = useStandingsCalculator(players, results, matches, tournamentInfo);

  // 4. UI State
  const [selectedPlayerModal, setSelectedPlayerModal] = useState(null);
  const [confirmationState, setConfirmationState] = useState(null);

  // --- Handlers ---
  const handleResultSubmit = useCallback((data) => {
    submitResult(data);
  }, [submitResult]);

  const executeConfirmation = useCallback(async () => {
    if (!confirmationState) return;
    setConfirmationState(null);
  }, [confirmationState]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#020617]"><div className="animate-spin h-8 w-8 border-2 border-slate-700 border-t-emerald-500 rounded-full" /></div>;
  }

  if (!tournamentInfo) return <div className="min-h-screen bg-[#020617] p-8 text-center text-slate-400">Tournament Not Found</div>;

  return (
    <div className="h-screen max-h-screen bg-[#020617] text-slate-200 flex flex-col font-mono selection:bg-emerald-500/30 selection:text-emerald-200 overflow-hidden">
      <Toaster position="top-right" theme="dark" richColors />

      {/* Global Modals */}
      <PlayerStatsModal
        player={selectedPlayerModal}
        results={results}
        matches={matches}
        onClose={() => setSelectedPlayerModal(null)}
      />
      <ConfirmationModal
        isOpen={!!confirmationState}
        title={confirmationState?.title}
        message={confirmationState?.message}
        onConfirm={executeConfirmation}
        onCancel={() => setConfirmationState(null)}
        isLoading={isSubmitting}
      />

      {/* HUD Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 z-30 shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <h1 className="font-bold text-sm uppercase tracking-[0.2em] text-slate-100">{tournamentInfo.name}</h1>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Live Operation Center</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-3 mr-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-800 pr-4">
            <span className="flex items-center space-x-1">
              <span className="text-slate-600">ID:</span>
              <span className="text-slate-300">TRN-{String(tournamentInfo.id || '').slice(0, 4)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-slate-600">STATUS:</span>
              <span className="text-emerald-500">OPTIMAL</span>
            </span>
          </div>
          <AnnouncementsManager compact />
          <Button variant="outline" size="sm" onClick={() => navigate(`/tournament/${tournamentSlug}`)} className="border-slate-800 hover:bg-slate-800 text-xs py-1">
            <Icon name="ExternalLink" size={14} className="mr-2" />
            Public View
          </Button>
        </div>
      </header>

      {/* Main HUD Layout */}
      <main className="flex-1 overflow-hidden relative min-h-0">
        <PanelGroup direction={isDesktop ? "horizontal" : "vertical"} className="h-full">
          {/* Primary CLI Area */}
          <Panel defaultSize={70} minSize={30} className="p-0 lg:p-4 flex flex-col min-h-0">
            <div className="flex-1 bg-black/40 backdrop-blur-sm rounded-none lg:rounded-2xl border-0 lg:border border-slate-800/50 overflow-hidden shadow-2xl relative min-h-0 flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.02] to-transparent pointer-events-none" />
              <ResultsEntryCLI
                tournamentInfo={tournamentInfo}
                players={rankedPlayers}
                matches={matches}
                results={results}
                onResultSubmit={handleResultSubmit}
                onUpdateTournament={setTournamentInfo}
                onClose={() => { }}
              />
            </div>
          </Panel>

          <PanelResizeHandle className={cn(
            "flex items-center justify-center bg-slate-800/50 hover:bg-emerald-500/30 transition-colors group",
            isDesktop ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"
          )}>
            <div className={cn("bg-slate-700 rounded-full group-hover:bg-emerald-400 transition-colors", isDesktop ? "w-0.5 h-8" : "w-8 h-0.5")} />
          </PanelResizeHandle>

          {/* Sidebar (Live Context) */}
          <Panel defaultSize={30} minSize={20} className="bg-slate-900/30 backdrop-blur-2xl flex flex-col z-20 overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-800 h-full min-h-0">
            <div className="flex-1 overflow-hidden p-4 h-full min-h-0">
              <LiveContextPanel
                tournamentInfo={tournamentInfo}
                players={rankedPlayers}
                results={results}
                pendingResults={pendingResults}
                matches={matches}
                onSelectPlayer={setSelectedPlayerModal}
                onApproveResult={() => { }}
                onRejectResult={() => { }}
              />
            </div>
          </Panel>
        </PanelGroup>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-6 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[10px] text-slate-500 font-bold tracking-[0.1em] uppercase">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>System Ready</span>
          </span>
          <span className="text-slate-700">|</span>
          <span>Vite Dev Environment</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>v1.2.4-stable</span>
          <span className="text-slate-700">|</span>
          <span>© 2026 DIREKTOR CORP</span>
        </div>
      </footer>
    </div>
  );
};

export default TournamentCommandCenterDashboard;