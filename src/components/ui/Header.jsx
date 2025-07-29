import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [activeTournamentId, setActiveTournamentId] = useState(null);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    const idFromUrl = params.tournamentId;
    setActiveTournamentId(idFromUrl);
  }, [location, params.tournamentId]);

  const navigationTabs = [
    { label: 'Lobby', path: '/', icon: 'Home' },
    { label: 'Dashboard', path: `/tournament/${activeTournamentId}/dashboard`, icon: 'Monitor' },
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
    <header className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-2xl font-heading font-bold text-gradient">
            Direktor
          </h1>
        </div>

        {isDesktop && (
          <nav className="flex items-center space-x-1">
            {navigationTabs.map((tab) => {
              if (!activeTournamentId && tab.label !== 'Lobby') return null;

              const isDashboardActive = tab.label === 'Dashboard' && !!params.tournamentId;
              const isLobbyActive = tab.label === 'Lobby' && location.pathname === '/';
              
              return (
                <button
                  key={tab.label}
                  onClick={() => handleTabClick(tab.path)}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-2 rounded-lg font-heading font-medium transition-all duration-200 ease-out relative group",
                    (isDashboardActive || isLobbyActive)
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                  )}
                >
                  <Icon name={tab.icon} size={18} />
                  <span>{tab.label}</span>
                  {(isDashboardActive || isLobbyActive) && (
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

        <div className="flex items-center space-x-2 sm:space-x-4">
           <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuickMenuOpen(!quickMenuOpen)}
              className="relative"
            >
              <Icon name={quickMenuOpen ? "X" : "MoreVertical"} size={20} />
            </Button>

            <AnimatePresence>
              {quickMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-56 glass-card shadow-glass-xl origin-top-right z-50"
                  >
                    <div className="p-2">
                      {!isDesktop && (
                        <>
                          {navigationTabs.map((tab) => {
                            if (!activeTournamentId && tab.label !== 'Lobby') return null;
                            return (
                              <button
                                key={tab.label}
                                onClick={() => handleTabClick(tab.path)}
                                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left hover:bg-muted/20 transition-colors duration-200 text-sm"
                              >
                                <Icon name={tab.icon} size={16} />
                                <span>{tab.label}</span>
                              </button>
                            )
                          })}
                          <div className="h-px bg-border my-2" />
                        </>
                      )}
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(action.action)}
                          className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left hover:bg-muted/20 transition-colors duration-200 text-sm"
                        >
                          <Icon name={action.icon} size={16} />
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                  
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setQuickMenuOpen(false)}
                  />
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;