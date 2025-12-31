import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import useMediaQuery from '../../hooks/useMediaQuery';
import ThemeToggle from './ThemeToggle';
import { useAppDispatch } from '../../store/hooks';
import { signOut } from '../../store/slices/authSlice';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
      action: () => navigate('/tournament-setup-configuration'),
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
      action: () => navigate('/documentation'),
      mobileOnly: true
    },
    {
      label: 'Sign Out',
      icon: 'LogOut',
      action: async () => {
        try {
          await dispatch(signOut());
          navigate('/');
        } catch (error) {
          console.error('Sign out failed', error);
        }
      },
      mobileOnly: false
    }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#020617]/80 border-b border-white/5 shadow-sm">
      {/* Gradient accent top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

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
            {/* Logo text */}
            <span className="relative text-white font-bold tracking-tight group-hover:text-emerald-400 transition-colors duration-300">
              Direktor
            </span>
          </motion.button>

          {/* Right side utilities */}
          <div className="flex items-center space-x-2">
            {/* Quick Actions Menu */}
            <div className="relative" ref={menuRef}>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                onClick={() => setQuickMenuOpen(!quickMenuOpen)}
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all duration-300 touch-target"
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
                    className="absolute right-0 top-full mt-2 w-56 bg-[#020617] border border-white/10 rounded-lg shadow-xl shadow-emerald-500/10 z-50 backdrop-blur-md"
                  >
                    <div className="p-2 space-y-1">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            action.action();
                            setQuickMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-all duration-300 touch-target"
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