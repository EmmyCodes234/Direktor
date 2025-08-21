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
    { label: 'Lobby', path: '/', icon: 'Home' },
    { label: 'Dashboard', path: `/tournament/${activeTournamentSlug}/dashboard`, icon: 'Monitor' },
  ];

  const handleTabClick = (path) => {
    navigate(path);
    setQuickMenuOpen(false);
  };
  
  const handleQuickAction = (action) => {
    action();
    setQuickMenuOpen(false);
  };

  const quickActions = [
    { label: 'New Tournament', icon: 'Plus', action: () => navigate('/tournament-setup-configuration') }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b border-border/10 safe-area-inset-top">
      <div className="flex items-center justify-between h-16 lg:h-20 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Logo/Brand - Enhanced touch target for mobile */}
        <button
          className="flex items-center space-x-3 touch-target-mobile rounded-lg hover:bg-muted/10 transition-colors focus-ring p-2" 
          onClick={() => navigate('/')}
          aria-label="Go to home page"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-gradient">
            Direktor
          </h1>
        </button>

        {/* Desktop Navigation */}
        {isDesktop && (
          <nav className="flex items-center space-x-1" role="navigation" aria-label="Main navigation">
            {navigationTabs.map((tab) => {
              if (!activeTournamentSlug && tab.label !== 'Lobby') return null;

              const isDashboardActive = tab.label === 'Dashboard' && !!tournamentSlug;
              const isLobbyActive = tab.label === 'Lobby' && location.pathname === '/lobby';
              const isActive = isDashboardActive || isLobbyActive;
              
              return (
                <button
                  key={tab.label}
                  onClick={() => handleTabClick(tab.path)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-out relative group focus-ring",
                    isActive
                      ? 'text-primary bg-primary/10 shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon name={tab.icon} size={16} aria-hidden="true" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav-indicator" 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" 
                    />
                  )}
                </button>
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
                if (!activeTournamentSlug && tab.label !== 'Lobby') return null;

                const isDashboardActive = tab.label === 'Dashboard' && !!tournamentSlug;
                const isLobbyActive = tab.label === 'Lobby' && location.pathname === '/lobby';
                const isActive = isDashboardActive || isLobbyActive;
                
                return (
                  <button
                    key={tab.label}
                    onClick={() => handleTabClick(tab.path)}
                    className={cn(
                      "flex items-center space-x-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ease-out touch-target-mobile whitespace-nowrap focus-ring",
                      isActive
                        ? 'text-primary bg-primary/10 shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon name={tab.icon} size={16} aria-hidden="true" />
                    <span className="hidden xs:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Quick Actions Menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuickMenuOpen(!quickMenuOpen)}
              className="touch-target-mobile focus-ring"
              aria-label="Open menu"
              aria-expanded={quickMenuOpen}
              aria-haspopup="true"
            >
              <Icon name={quickMenuOpen ? "X" : "Menu"} size={20} />
            </Button>

            <AnimatePresence>
              {quickMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={cn(
                    "absolute right-0 top-full mt-2 glass-card shadow-glass-xl origin-top-right z-50 min-w-[200px]",
                    isMobile ? "w-64" : "w-56"
                  )}
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="p-2">
                    {!isDesktop && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Navigation
                        </div>
                        {navigationTabs.map((tab) => {
                          if (!activeTournamentSlug && tab.label !== 'Lobby') return null;
                          const isDashboardActive = tab.label === 'Dashboard' && !!tournamentSlug;
                          const isLobbyActive = tab.label === 'Lobby' && location.pathname === '/lobby';
                          const isActive = isDashboardActive || isLobbyActive;
                          
                          return (
                            <button
                              key={tab.label}
                              onClick={() => handleTabClick(tab.path)}
                              className={cn(
                                "w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left hover:bg-muted/10 transition-colors duration-200 text-sm touch-target-mobile focus-ring",
                                isActive && "text-primary bg-primary/10"
                              )}
                              role="menuitem"
                            >
                              <Icon name={tab.icon} size={16} aria-hidden="true" />
                              <span>{tab.label}</span>
                            </button>
                          )
                        })}
                        <div className="h-px bg-border/50 my-2" />
                      </>
                    )}
                    
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </div>
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.action)}
                        className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left hover:bg-muted/10 transition-colors duration-200 text-sm touch-target-mobile focus-ring"
                        role="menuitem"
                      >
                        <Icon name={action.icon} size={16} aria-hidden="true" />
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
    </header>
  );
};

export default Header;