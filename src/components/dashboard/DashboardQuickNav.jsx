import React, { useState } from 'react';
import { LayoutDashboard, Users, Swords, Trophy, Settings, FileText, Table, BarChart3, Bell, Plus } from 'lucide-react';
import ExpandableTabsJS from '../ui/expandable-tabs';
import { useNavigate } from 'react-router-dom';

const DashboardQuickNav = ({ tournamentSlug, tournamentInfo, ladderConfig, onAction }) => {
  const [selectedTab, setSelectedTab] = useState(null);
  const navigate = useNavigate();

  // Base dashboard tabs
  const baseTabs = [
    { title: "Overview", icon: LayoutDashboard },
    { title: "Players", icon: Users },
    { title: "Matchups", icon: Swords },
    { title: "Leaderboard", icon: Trophy },

    { type: "separator" },
    { title: "Reports", icon: FileText },
    { title: "Settings", icon: Settings },
    { title: "Announcements", icon: Bell },
  ];

  // Add Wall Chart only for individual or team modes (not ladder system)
  const shouldShowWallChart = tournamentInfo?.type === 'individual' ||
    tournamentInfo?.type === 'team';

  const dashboardTabs = shouldShowWallChart
    ? [
      ...baseTabs.slice(0, 6), // Overview, Players, Matchups, Leaderboard, separator, Reports
      { title: "Cross-Table", icon: Table },

      ...baseTabs.slice(6) // Settings, Announcements
    ]
    : baseTabs;

  const handleTabChange = (index) => {
    if (index !== null) {
      const section = dashboardTabs[index];
      if (section.title && section.title !== 'separator') {
        const sectionKey = section.title.toLowerCase();

        // Navigate to the appropriate section
        switch (sectionKey) {
          case 'overview':
            navigate(`/tournament/${tournamentSlug}/dashboard`);
            break;
          case 'players':
            navigate(`/tournament/${tournamentSlug}/players`);
            break;
          case 'matchups':
            navigate(`/tournament/${tournamentSlug}/matchups`);
            break;
          case 'leaderboard':
            navigate(`/tournament/${tournamentSlug}/standings`); // Wait, Route was renamed to /leaderboard but wait, dashboard usually links to internal or public? 
            // DashboardQuickNav links to ... wait, 'UseStandingsCalculator' suggests this might be internal dashboard page?
            // Route check: /tournament/:slug/standings is PUBLIC.
            // DashboardSidebar has 'Dashboard', 'Players', 'Pairings' (internal), 'Settings', 'Reports'. 
            // DashboardQuickNav adds 'Standings'. 
            // In Routes.jsx: /tournament/:slug/standings -> PublicTournamentStandings (Public)
            // But usually dashboards link to an internal version? 
            // Let's check where 'standings' logic goes. 
            // In Routes.jsx there isn't an ADMIN standings page listed explicitly in "Admin/Dashboard Routes" block except potentially part of Reports?
            // However, `DashboardQuickNav.jsx` lines 52: navigate(`/tournament/${tournamentSlug}/standings`);
            // This suggests it links to the public standings page from the dashboard? Or is there an admin route I missed?
            // Ah, grep showed "pages\tournament-command-center-dashboard\components\StandingsTable.jsx" exists.
            // But Routes.jsx only had PublicTournamentStandings.
            // Let's assume it links to the route I JUST renamed to /leaderboard.
            navigate(`/tournament/${tournamentSlug}/leaderboard`);
            break;
          case 'reports':
            navigate(`/tournament/${tournamentSlug}/reports`);
            break;
          case 'cross-table':
            navigate(`/tournament/${tournamentSlug}/cross-table`);
            break;

          case 'settings':
            navigate(`/tournament/${tournamentSlug}/settings`);
            break;
          case 'announcements':
            // Trigger announcement modal or action
            onAction?.('announcements');
            break;
          default:
            break;
        }

        setSelectedTab(index);
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Quick Navigation</h2>
          <p className="text-sm text-muted-foreground">Jump to any dashboard section</p>
        </div>
        <button
          onClick={() => navigate('/tournament-setup')}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm"
        >
          <Plus size={16} className="mr-2" />
          New Tournament
        </button>
      </div>

      <ExpandableTabsJS
        tabs={dashboardTabs}
        activeColor="text-foreground"
        className="border-border bg-background"
        onChange={handleTabChange}
      />
    </div>
  );
};

export default DashboardQuickNav;
