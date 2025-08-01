import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';

const MobileNavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { tournamentSlug } = useParams();

    const navItems = [
        { label: 'Dashboard', path: `/tournament/${tournamentSlug}/dashboard`, icon: 'LayoutDashboard' },
        { label: 'Players', path: `/tournament/${tournamentSlug}/players`, icon: 'Users' },
        { label: 'Pairings', path: `/tournament/${tournamentSlug}/pairings`, icon: 'Swords' },
        { label: 'Settings', path: `/tournament/${tournamentSlug}/settings`, icon: 'Settings' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t border-border z-40">
            <div className="grid grid-cols-4 h-full">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon name={item.icon} size={20} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileNavBar;