import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import Button from './Button';
import { Avatar, AvatarFallback, AvatarImage } from './Avatar';
import { Badge } from './Badge';
import { Separator } from './Separator';
import { GlowingEffect } from './GlowingEffect';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isLandingPage = location.pathname === '/';

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || !isLandingPage
          ? "bg-background/80 backdrop-blur-xl border-b border-border/20 shadow-sm"
          : "bg-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-primary via-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Icon name="Trophy" size={20} className="text-white" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Direktor
            </span>
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/lobby')}
                  className="text-sm font-medium"
                >
                  <Icon name="Home" size={16} className="mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/tournaments')}
                  className="text-sm font-medium"
                >
                  <Icon name="Trophy" size={16} className="mr-2" />
                  Tournaments
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/players')}
                  className="text-sm font-medium"
                >
                  <Icon name="Users" size={16} className="mr-2" />
                  Players
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/features')}
                  className="text-sm font-medium"
                >
                  Features
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/pricing')}
                  className="text-sm font-medium"
                >
                  Pricing
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/about')}
                  className="text-sm font-medium"
                >
                  About
                </Button>
              </>
            )}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Badge variant="success" className="hidden sm:inline-flex">
                  <Icon name="Zap" size={12} className="mr-1" />
                  Pro
                </Badge>
                
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 p-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-semibold">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Icon name="ChevronDown" size={16} className="text-muted-foreground" />
                  </Button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 origin-top-right"
                      >
                        <div className="relative">
                          <GlowingEffect spread={30} glow={true} proximity={50}>
                            <div className="bg-card border border-border/20 rounded-xl shadow-lg overflow-hidden">
                              <div className="p-4 border-b border-border/10">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.user_metadata?.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                                      {user.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {user.user_metadata?.full_name || 'User'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate('/profile')}
                                  className="w-full justify-start"
                                >
                                  <Icon name="User" size={16} className="mr-2" />
                                  Profile
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate('/settings')}
                                  className="w-full justify-start"
                                >
                                  <Icon name="Settings" size={16} className="mr-2" />
                                  Settings
                                </Button>
                                <Separator className="my-2" />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSignOut}
                                  className="w-full justify-start text-destructive hover:text-destructive"
                                >
                                  <Icon name="LogOut" size={16} className="mr-2" />
                                  Sign out
                                </Button>
                              </div>
                            </div>
                          </GlowingEffect>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium"
                >
                  Sign in
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  className="text-sm font-medium shadow-glow hover:shadow-glow-lg transition-all duration-300"
                >
                  Get Started
                  <Icon name="ArrowRight" size={16} className="ml-2" />
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              <Icon name={isMenuOpen ? "X" : "Menu"} size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-hero-purple/20 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-6 space-y-4">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/lobby')}
                    className="w-full justify-start"
                  >
                    <Icon name="Home" size={16} className="mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/tournaments')}
                    className="w-full justify-start"
                  >
                    <Icon name="Trophy" size={16} className="mr-2" />
                    Tournaments
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/players')}
                    className="w-full justify-start"
                  >
                    <Icon name="Users" size={16} className="mr-2" />
                    Players
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start text-destructive"
                  >
                    <Icon name="LogOut" size={16} className="mr-2" />
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/features')}
                    className="w-full justify-start"
                  >
                    Features
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/pricing')}
                    className="w-full justify-start"
                  >
                    Pricing
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/about')}
                    className="w-full justify-start"
                  >
                    About
                  </Button>
                  <Separator />
                  <Button
                    onClick={() => navigate('/signup')}
                    className="w-full"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;