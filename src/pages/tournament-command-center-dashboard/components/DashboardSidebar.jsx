import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const DashboardSidebar = ({ tournamentInfo, ladderConfig }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tournamentSlug } = useParams();

  // Base navigation items
  const baseNavItems = [
    { label: 'Dashboard', path: `/tournament/${tournamentSlug}/dashboard`, icon: 'LayoutDashboard' },
    { label: 'Player Roster', path: `/tournament/${tournamentSlug}/players`, icon: 'Users' },
    { label: 'Pairings', path: `/tournament/${tournamentSlug}/pairings`, icon: 'Swords' },
    { label: 'Settings', path: `/tournament/${tournamentSlug}/settings`, icon: 'Settings' },
    { label: 'Reports', path: `/tournament/${tournamentSlug}/reports`, icon: 'FileText' },
  ];

  // Add Wall Chart only for individual or team modes (not ladder system)
  const shouldShowWallChart = tournamentInfo?.type === 'individual' || 
                             tournamentInfo?.type === 'team';
  
  const navItems = shouldShowWallChart 
    ? [...baseNavItems, { label: 'Wall Chart', path: `/tournament/${tournamentSlug}/wall-chart`, icon: 'Table' }]
    : baseNavItems;

  return (
    <aside className="md:col-span-1 md:sticky top-24 self-start">
      <div className="hero-card bg-hero-purple/95 backdrop-blur-sm border border-hero-purple/30 rounded-xl p-4 shadow-xl">
        <h3 className="font-semibold text-hero-primary text-sm mb-4 px-1">Manage Tournament</h3>
        
        <div className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 touch-target",
                location.pathname === item.path 
                  ? "bg-hero-gradient text-white shadow-lg shadow-hero-purple/25" 
                  : "text-hero-primary hover:bg-hero-purple/20 dark:hover:bg-hero-purple/30"
              )}
              onClick={() => navigate(item.path)}
            >
              <Icon 
                name={item.icon} 
                className={cn(
                  "mr-3 transition-colors duration-200",
                  location.pathname === item.path ? "text-white" : "text-hero-primary"
                )}
              />
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="border-t border-hero-purple/30 mt-4 pt-4">
          <button 
            className="w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium text-hero-primary hover:bg-hero-purple/20 dark:hover:bg-hero-purple/30 transition-all duration-200 touch-target" 
            onClick={() => navigate('/lobby')}
          >
            <Icon name="Home" className="mr-3 text-hero-primary"/>
            Lobby
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;