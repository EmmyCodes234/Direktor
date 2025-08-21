import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';
import { motion } from 'framer-motion';

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
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/95 backdrop-blur-xl border-t border-border/10 z-40 safe-area-inset-bottom">
            {/* Top border with subtle gradient */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />
            
            <div className="grid grid-cols-4 h-full px-3">
                {navItems.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <motion.button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-all duration-200 touch-target relative group",
                                isActive 
                                    ? "text-primary" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-active"
                                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            
                            {/* Icon with enhanced visual feedback */}
                            <div className={cn(
                                "relative p-2 rounded-xl transition-all duration-200",
                                isActive 
                                    ? "bg-primary/10 text-primary" 
                                    : "group-hover:bg-muted/20"
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
                                isActive ? "text-primary font-semibold" : "text-muted-foreground"
                            )}>
                                {item.label}
                            </span>
                            
                            {/* Ripple effect on tap */}
                            <motion.div
                                className="absolute inset-0 rounded-lg bg-primary/20"
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