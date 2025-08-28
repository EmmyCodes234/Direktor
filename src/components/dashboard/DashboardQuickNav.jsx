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
    { title: "Pairings", icon: Swords },
    { title: "Standings", icon: Trophy },
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
        ...baseTabs.slice(0, 6), // Overview, Players, Pairings, Standings, separator, Reports
        { title: "Wall Chart", icon: Table },
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
          case 'pairings':
            navigate(`/tournament/${tournamentSlug}/pairings`);
            break;
          case 'standings':
            navigate(`/tournament/${tournamentSlug}/standings`);
            break;
          case 'reports':
            navigate(`/tournament/${tournamentSlug}/reports`);
            break;
          case 'wall chart':
            navigate(`/tournament/${tournamentSlug}/wall-chart`);
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
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25"
        >
          <Plus size={16} className="mr-2" />
          New Tournament
        </button>
      </div>
      
      <ExpandableTabsJS 
        tabs={dashboardTabs}
        activeColor="text-hero-primary"
        className="border-hero-purple/30 bg-hero-bg-gradient"
        onChange={handleTabChange}
      />
    </div>
  );
};

export default DashboardQuickNav;
