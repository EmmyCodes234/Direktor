import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import useMediaQuery from '../../hooks/useMediaQuery';
import ThemeToggle from './ThemeToggle';

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
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gradient-to-r from-zinc-50/90 via-white/95 to-zinc-100/90 dark:from-zinc-950/90 dark:via-zinc-900/95 dark:to-zinc-950/90 border-b border-hero-purple/20 shadow-lg shadow-hero-purple/5 dark:shadow-hero-purple/10">
      {/* Purple gradient background overlay */}
      <div className="absolute inset-0 bg-hero-purple/5 dark:bg-hero-purple/10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      
      <div className="relative max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo/Brand */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="relative text-xl sm:text-2xl md:text-3xl font-heading font-extrabold hover:scale-105 transition-all duration-300 focus-ring rounded-lg p-2 touch-target group"
            onClick={() => navigate('/')}
            aria-label="Direktor home"
          >
            {/* Logo background with gradient */}
            <div className="absolute inset-0 bg-hero-gradient rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            
            {/* Logo text with gradient */}
            <span className="relative bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent group-hover:text-hero-gradient transition-all duration-300">
              Direktor
            </span>
          </motion.button>

          {/* Right side utilities */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <ThemeToggle variant="simple" />
            
            {/* Quick Actions Menu */}
            <div className="relative" ref={menuRef}>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                onClick={() => setQuickMenuOpen(!quickMenuOpen)}
                className="p-2 text-hero-secondary hover:text-hero-primary hover:bg-hero-purple/10 rounded-lg transition-all duration-300 touch-target"
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
                    className="absolute right-0 top-full mt-2 w-56 bg-gradient-to-br from-zinc-50/95 via-white to-zinc-100/95 dark:from-zinc-900/95 dark:via-zinc-800 dark:to-zinc-900/95 border border-hero-purple/20 rounded-lg shadow-xl shadow-hero-purple/10 dark:shadow-hero-purple/20 z-50 backdrop-blur-md"
                  >
                    <div className="p-2 space-y-1">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            action.action();
                            setQuickMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-hero-secondary hover:text-hero-primary hover:bg-hero-purple/10 rounded-md transition-all duration-300 touch-target"
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