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
    { label: 'Field', path: `/tournament/${tournamentSlug}/players`, icon: 'Users' },
    { label: 'Matchups', path: `/tournament/${tournamentSlug}/matchups`, icon: 'Swords' },

    { label: 'Settings', path: `/tournament/${tournamentSlug}/settings`, icon: 'Settings' },
    { label: 'Reports', path: `/tournament/${tournamentSlug}/reports`, icon: 'FileText' },
  ];

  // Add Wall Chart only for individual or team modes (not ladder system)
  const shouldShowWallChart = tournamentInfo?.type === 'individual' ||
    tournamentInfo?.type === 'team';

  const navItems = shouldShowWallChart
    ? [...baseNavItems, { label: 'Cross-Table', path: `/tournament/${tournamentSlug}/cross-table`, icon: 'Table' }]

    : baseNavItems;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Brand Area */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center text-background">
            <Icon name="Command" size={16} />
          </div>
          <span>DIREKTOR</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Menu
        </div>
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
              location.pathname === item.path
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            onClick={() => navigate(item.path)}
          >
            <Icon
              name={item.icon}
              size={18}
              className={cn(
                "mr-3 transition-colors duration-200",
                location.pathname === item.path ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {item.label}

            {location.pathname === item.path && (
              <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-background/50" />
            )}
          </button>
        ))}
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-border">
        <button
          className="w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
          onClick={() => navigate('/lobby')}
        >
          <Icon name="LogOut" size={18} className="mr-3" />
          Exit Dashboard
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;