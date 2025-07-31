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
import WallChartPage from "./pages/WallChartPage";

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
        <Route path="/tournaments/:tournamentSlug/register" element={<RegistrationPage />} />
        <Route path="/tournaments/:tournamentSlug/live" element={<PublicTournamentPage />} />
        
        {/* Admin/Dashboard Routes */}
        <Route path="/tournament/:tournamentSlug/dashboard" element={<TournamentCommandCenterDashboard />} />
        <Route path="/tournament/:tournamentSlug/players" element={<PlayerManagementRosterControl />} />
        <Route path="/tournament/:tournamentSlug/settings" element={<TournamentSettingsAdministration />} />
        <Route path="/tournament/:tournamentSlug/reports" element={<ReportsPage />} />
        <Route path="/tournament/:tournamentSlug/pairings" element={<PairingManagementPage />} />
        <Route path="/tournament/:tournamentSlug/wall-chart" element={<WallChartPage />} />

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;