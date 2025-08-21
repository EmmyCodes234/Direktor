import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tournamentSlug } = useParams();

  const navItems = [
    { label: 'Dashboard', path: `/tournament/${tournamentSlug}/dashboard`, icon: 'LayoutDashboard' },
    { label: 'Player Roster', path: `/tournament/${tournamentSlug}/players`, icon: 'Users' },
    { label: 'Pairings', path: `/tournament/${tournamentSlug}/pairings`, icon: 'Swords' },
    { label: 'Settings', path: `/tournament/${tournamentSlug}/settings`, icon: 'Settings' },
    { label: 'Reports', path: `/tournament/${tournamentSlug}/reports`, icon: 'FileText' },
    { label: 'Wall Chart', path: `/tournament/${tournamentSlug}/wall-chart`, icon: 'Table' },
  ];

  return (
    <aside className="md:col-span-1 md:sticky top-24 self-start">
      <div className="bg-muted/10 backdrop-blur-sm border border-border/10 rounded-xl p-4">
        <h3 className="font-semibold text-muted-foreground text-sm mb-4 px-1">Manage Tournament</h3>
        
        <div className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 touch-target",
                location.pathname === item.path 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-foreground hover:bg-muted/20"
              )}
              onClick={() => navigate(item.path)}
            >
              <Icon 
                name={item.icon} 
                className={cn(
                  "mr-3 transition-colors duration-200",
                  location.pathname === item.path ? "text-white" : "text-foreground"
                )}
              />
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="border-t border-border/10 mt-4 pt-4">
          <button 
            className="w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted/20 transition-all duration-200 touch-target" 
            onClick={() => navigate('/lobby')}
          >
            <Icon name="Home" className="mr-3 text-foreground"/>
            Lobby
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;