import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";

// Import All Pages
import LandingPage from "pages/LandingPage";
import LoginPage from "pages/LoginPage";
import SignupPage from "pages/SignupPage";
import DocumentationPage from "pages/DocumentationPage";
import ProfileSettings from "pages/ProfileSettings";
import TournamentPlannerPage from "pages/TournamentPlannerPage";
import TournamentLobby from "pages/TournamentLobby";
import TournamentSetupConfiguration from "pages/tournament-setup-configuration";
import TournamentCommandCenterDashboard from "pages/tournament-command-center-dashboard";
import PublicTournamentPage from "pages/PublicTournamentPage";
import PublicTournamentIndex from "pages/PublicTournamentIndex";
import PublicTournamentStandings from "pages/PublicTournamentStandings";
import PublicTournamentRoster from "pages/PublicTournamentRoster";
import PublicTournamentPairings from "pages/PublicTournamentPairings";
import PublicTournamentPrizes from "pages/PublicTournamentPrizes";
import PublicTournamentStats from "pages/PublicTournamentStats";
import PublicTournamentScorecards from "pages/PublicTournamentScorecards";
import RegistrationPage from "./pages/RegistrationPage";
import NotFound from "pages/NotFound";
import PlayerManagementRosterControl from "./pages/PlayerManagementRosterControl";
import TournamentSettingsAdministration from "./pages/TournamentSettingsAdministration";
import ReportsPage from "./pages/ReportsPage";
import PairingManagementPage from "./pages/PairingManagementPage";
import WallChartPage from "pages/WallChartPage";
import PublicTournamentPageNew from "pages/PublicTournamentPageNew";
import TestDataDisplay from "pages/TestDataDisplay";
import PublicEnhancedScoreboard from "pages/PublicEnhancedScoreboard";
import PublicRoundInsights from "pages/PublicRoundInsights";
import PublicCrossTable from "pages/PublicCrossTable";
import PublicAverageOpponentScores from "pages/PublicAverageOpponentScores";
import PublicAverageScores from "pages/PublicAverageScores";
import PublicHighCombinedScore from "pages/PublicHighCombinedScore";
import PublicToughBreak from "pages/PublicToughBreak";
import PublicBlowouts from "pages/PublicBlowouts";
import PublicPeakScores from "pages/PublicPeakScores";
import PublicLowScores from "pages/PublicLowScores";
import PublicLowLosses from "pages/PublicLowLosses";
import PublicLowSpreads from "pages/PublicLowSpreads";
import PublicGiantKillers from "pages/PublicGiantKillers";
import PublicRoundScores from "pages/PublicRoundScores";
import RemoteResultsSubmission from "pages/RemoteResultsSubmission";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Public Facing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/documentation" element={<DocumentationPage />} />

          {/* Core Application Routes (Post-Login) */}
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/lobby" element={<TournamentLobby />} />
          <Route path="/tournament-planner" element={<TournamentPlannerPage />} />
          <Route path="/tournament-setup-configuration" element={<TournamentSetupConfiguration />} />

          {/* Public Tournament & Player Routes */}
          <Route path="/tournaments/:tournamentSlug/register" element={<RegistrationPage />} />
          <Route path="/tournaments/:tournamentSlug/live" element={<Navigate to="/tournament/:tournamentSlug" replace />} />
          <Route path="/tournament/:tournamentSlug" element={<PublicTournamentIndex />} />
          <Route path="/tournament/:tournamentSlug/public" element={<PublicTournamentPage />} />
          <Route path="/tournament/:tournamentSlug/test" element={<TestDataDisplay />} />
          <Route path="/tournament/:tournamentSlug/submit-result" element={<RemoteResultsSubmission />} />
          <Route path="/tournament/:tournamentSlug/leaderboard" element={<PublicTournamentStandings />} />
          <Route path="/tournament/:tournamentSlug/field" element={<PublicTournamentRoster />} />
          <Route path="/tournament/:tournamentSlug/matchups" element={<PublicTournamentPairings />} />
          <Route path="/tournament/:tournamentSlug/prize-report" element={<PublicTournamentPrizes />} />
          <Route path="/tournament/:tournamentSlug/stats" element={<PublicTournamentStats />} />
          <Route path="/tournament/:tournamentSlug/match-log" element={<PublicTournamentScorecards />} />
          <Route path="/tournament/:tournamentSlug/live-streamboard" element={<PublicEnhancedScoreboard />} />
          <Route path="/tournament/:tournamentSlug/insights" element={<PublicRoundInsights />} />

          {/* Admin/Dashboard Routes */}
          <Route path="/tournament/:tournamentSlug/dashboard" element={<TournamentCommandCenterDashboard />} />
          <Route path="/tournament/:tournamentSlug/players" element={<PlayerManagementRosterControl />} />
          <Route path="/tournament/:tournamentSlug/settings" element={<TournamentSettingsAdministration />} />
          <Route path="/tournament/:tournamentSlug/reports" element={<ReportsPage />} />
          <Route path="/tournament/:tournamentSlug/matchups" element={<PairingManagementPage />} />
          <Route path="/tournament/:tournamentSlug/matchups" element={<PairingManagementPage />} />
          <Route path="/tournament/:tournamentSlug/cross-table" element={<PublicCrossTable />} />
          <Route path="/tournament/:tournamentSlug/avg-scores" element={<PublicAverageOpponentScores />} />
          <Route path="/tournament/:tournamentSlug/player-avg-scores" element={<PublicAverageScores />} />
          <Route path="/tournament/:tournamentSlug/high-combined" element={<PublicHighCombinedScore />} />
          <Route path="/tournament/:tournamentSlug/tough-break" element={<PublicToughBreak />} />
          <Route path="/tournament/:tournamentSlug/blowouts" element={<PublicBlowouts />} />
          <Route path="/tournament/:tournamentSlug/peak-scores" element={<PublicPeakScores />} />
          <Route path="/tournament/:tournamentSlug/low-scores" element={<PublicLowScores />} />
          <Route path="/tournament/:tournamentSlug/low-losses" element={<PublicLowLosses />} />
          <Route path="/tournament/:tournamentSlug/low-spreads" element={<PublicLowSpreads />} />
          <Route path="/tournament/:tournamentSlug/giant-killers" element={<PublicGiantKillers />} />
          <Route path="/tournament/:tournamentSlug/scores" element={<PublicRoundScores />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;