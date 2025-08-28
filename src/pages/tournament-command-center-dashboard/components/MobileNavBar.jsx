import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';

const MobileNavBar = ({ tournamentInfo, ladderConfig }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { tournamentSlug } = useParams();
    const { toggleTheme, isDark } = useTheme();

    // Base navigation items
    const baseNavItems = [
        { label: 'Dashboard', path: `/tournament/${tournamentSlug}/dashboard`, icon: 'LayoutDashboard' },
        { label: 'Players', path: `/tournament/${tournamentSlug}/players`, icon: 'Users' },
        { label: 'Pairings', path: `/tournament/${tournamentSlug}/pairings`, icon: 'Swords' },
        { label: 'Settings', path: `/tournament/${tournamentSlug}/settings`, icon: 'Settings' },
        { label: 'Theme', action: toggleTheme, icon: isDark ? 'Sun' : 'Moon', isThemeToggle: true },
    ];

    // Add Wall Chart only for individual or team modes (not ladder system)
    const shouldShowWallChart = tournamentInfo?.type === 'individual' || 
                               tournamentInfo?.type === 'team';
    
    const navItems = shouldShowWallChart 
        ? [
            ...baseNavItems.slice(0, 4), // Dashboard, Players, Pairings, Settings
            { label: 'Wall Chart', path: `/tournament/${tournamentSlug}/wall-chart`, icon: 'Table' },
            baseNavItems[4] // Theme toggle
          ]
        : baseNavItems;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-xl border-t border-hero-purple/20 z-40 safe-area-inset-bottom">
            {/* Top border with subtle gradient */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-hero-purple/20 to-transparent" />
            
            <div className="grid grid-cols-5 h-full px-3">
                {navItems.map((item, index) => {
                    const isActive = !item.isThemeToggle && location.pathname === item.path;
                    return (
                        <motion.button
                            key={item.label}
                            onClick={() => item.isThemeToggle ? item.action() : navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-all duration-200 touch-target relative group",
                                isActive 
                                    ? "text-hero-primary" 
                                    : "text-hero-secondary hover:text-hero-primary"
                            )}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-active"
                                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-hero-gradient rounded-full"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            
                            {/* Icon with enhanced visual feedback */}
                            <div className={cn(
                                "relative p-2 rounded-xl transition-all duration-200",
                                isActive 
                                    ? "bg-hero-purple/20 text-hero-primary" 
                                    : "group-hover:bg-hero-purple/10"
                            )}>
                                <Icon 
                                    name={item.icon} 
                                    size={22} 
                                    className={cn(
                                        "transition-all duration-200",
                                        isActive ? "scale-110" : "group-hover:scale-105"
                                    )}
                                />
                            </div>
                            
                            {/* Label with better typography */}
                            <span className={cn(
                                "text-xs font-medium transition-colors duration-200",
                                isActive ? "text-hero-primary font-semibold" : "text-hero-secondary"
                            )}>
                                {item.label}
                            </span>
                            
                            {/* Ripple effect on tap */}
                            <motion.div
                                className="absolute inset-0 rounded-lg bg-hero-purple/20"
                                initial={{ scale: 0, opacity: 0 }}
                                whileTap={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            />
                        </motion.button>
                    );
                })}
            </div>
            
            {/* Bottom safe area for devices with home indicators */}
            <div className="h-1 bg-background/95" />
        </div>
    );
};

export default MobileNavBar;