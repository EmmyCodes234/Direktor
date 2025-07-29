import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
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
import RegistrationPage from "./pages/RegistrationPage";
import NotFound from "pages/NotFound";
import PlayerManagementRosterControl from "./pages/PlayerManagementRosterControl";
import TournamentSettingsAdministration from "./pages/TournamentSettingsAdministration";
import ReportsPage from "./pages/ReportsPage";
import PairingManagementPage from "./pages/PairingManagementPage";

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
        
        {/* Public Tournament Routes */}
        <Route path="/tournaments/:tournamentId/register" element={<RegistrationPage />} />
        <Route path="/tournaments/:tournamentId/live" element={<PublicTournamentPage />} />
        
        {/* Admin/Dashboard Routes */}
        <Route path="/tournament/:tournamentId/dashboard" element={<TournamentCommandCenterDashboard />} />
        <Route path="/tournament/:tournamentId/players" element={<PlayerManagementRosterControl />} />
        <Route path="/tournament/:tournamentId/settings" element={<TournamentSettingsAdministration />} />
        <Route path="/tournament/:tournamentId/reports" element={<ReportsPage />} />
        <Route path="/tournament/:tournamentId/pairings" element={<PairingManagementPage />} />

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;