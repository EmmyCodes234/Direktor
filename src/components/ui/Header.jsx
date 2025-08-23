import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import useMediaQuery from '../../hooks/useMediaQuery';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tournamentSlug } = useParams();
  const [activeTournamentSlug, setActiveTournamentSlug] = useState(null);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    setActiveTournamentSlug(tournamentSlug);
  }, [location, tournamentSlug]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setQuickMenuOpen(false);
      }
    };

    if (quickMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [quickMenuOpen]);

  const navigationTabs = [
    {
      label: 'Lobby',
      path: '/lobby',
      icon: 'Home',
      mobileIcon: 'Home'
    },
    {
      label: 'Dashboard',
      path: `/tournament/${tournamentSlug}/dashboard`,
      icon: 'LayoutDashboard',
      mobileIcon: 'LayoutDashboard',
      requiresTournament: true
    },
    {
      label: 'Players',
      path: `/tournament/${tournamentSlug}/players`,
      icon: 'Users',
      mobileIcon: 'Users',
      requiresTournament: true
    },
    {
      label: 'Pairings',
      path: `/tournament/${tournamentSlug}/pairings`,
      icon: 'Network',
      mobileIcon: 'Network',
      requiresTournament: true
    },
    {
      label: 'Standings',
      path: `/tournament/${tournamentSlug}/standings`,
      icon: 'Trophy',
      mobileIcon: 'Trophy',
      requiresTournament: true
    },
    {
      label: 'Settings',
      path: `/tournament/${tournamentSlug}/settings`,
      icon: 'Settings',
      mobileIcon: 'Settings',
      requiresTournament: true
    }
  ];

  const quickActions = [
    {
      label: 'New Tournament',
      icon: 'Plus',
      action: () => navigate('/tournament-setup'),
      mobileOnly: false
    },
    {
      label: 'Profile Settings',
      icon: 'User',
      action: () => navigate('/profile'),
      mobileOnly: false
    },
    {
      label: 'Help & Support',
      icon: 'HelpCircle',
      action: () => window.open('/docs', '_blank'),
      mobileOnly: true
    },
    {
      label: 'Sign Out',
      icon: 'LogOut',
      action: () => {
        // Handle sign out
        console.log('Sign out clicked');
      },
      mobileOnly: false
    }
  ];

  return (
    <header className="mobile-nav-top">
      <div className="container-mobile">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo/Brand */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-primary hover:scale-105 transition-transform focus-ring rounded-lg p-2 touch-target"
            onClick={() => navigate('/')}
            aria-label="Direktor home"
          >
            Direktor
          </motion.button>

          {/* Desktop Navigation */}
          {isDesktop && (
            <nav className="flex items-center space-x-1" role="navigation" aria-label="Desktop navigation">
              {navigationTabs.map((tab) => {
                if (!activeTournamentSlug && tab.requiresTournament) return null;

                const isDashboardActive = tab.label === 'Dashboard' && !!tournamentSlug;
                const isLobbyActive = tab.label === 'Lobby' && location.pathname === '/lobby';
                const isActive = isDashboardActive || isLobbyActive;
                
                return (
                  <motion.button
                    key={tab.label}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    onClick={() => navigate(tab.path)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 touch-target",
                      isActive
                        ? 'text-primary bg-primary/10 shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon name={tab.icon} size={16} aria-hidden="true" />
                    <span className="ml-2">{tab.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav-indicator" 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" 
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          )}

          {/* Mobile Navigation & Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* Mobile Navigation Tabs */}
            {isMobile && (
              <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-hide" role="navigation" aria-label="Mobile navigation">
                {navigationTabs.map((tab) => {
                  if (!activeTournamentSlug && tab.requiresTournament) return null;

                  const isDashboardActive = tab.label === 'Dashboard' && !!tournamentSlug;
                  const isLobbyActive = tab.label === 'Lobby' && location.pathname === '/lobby';
                  const isActive = isDashboardActive || isLobbyActive;
                  
                  return (
                    <motion.button
                      key={tab.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      onClick={() => navigate(tab.path)}
                      className={cn(
                        "relative p-2 text-xs font-medium rounded-lg transition-all duration-200 touch-target",
                        isActive
                          ? 'text-primary bg-primary/10' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon name={tab.mobileIcon} size={16} aria-hidden="true" />
                      {isActive && (
                        <motion.div 
                          layoutId="mobile-active-nav-indicator" 
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" 
                        />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            )}

            {/* Quick Actions Menu */}
            <div className="relative" ref={menuRef}>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                onClick={() => setQuickMenuOpen(!quickMenuOpen)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-lg transition-colors touch-target"
                aria-label="Quick actions menu"
              >
                <Icon name="MoreHorizontal" size={20} />
              </motion.button>

              <AnimatePresence>
                {quickMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/20 rounded-lg shadow-mobile-lg z-50"
                  >
                    <div className="p-2 space-y-1">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            action.action();
                            setQuickMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-muted/10 rounded-md transition-colors touch-target"
                        >
                          <Icon name={action.icon} size={16} />
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;