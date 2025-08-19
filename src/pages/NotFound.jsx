import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Icon from '../components/AppIcon';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 safe-area-inset-top safe-area-inset-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* 404 Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mb-8"
        >
          <div className="relative">
            <h1 className="text-8xl sm:text-9xl font-bold text-gradient opacity-30 select-none">
              404
            </h1>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="Search" size={32} className="text-primary" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-4 mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Oops! The page you're looking for seems to have wandered off. 
            Don't worry, even the best tournaments sometimes have missing pieces.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={handleGoBack}
            iconName="ArrowLeft"
            iconPosition="left"
            variant="outline"
            size="lg"
            className="shadow-sm"
          >
            Go Back
          </Button>

          <Button
            onClick={handleGoHome}
            iconName="Home"
            iconPosition="left"
            size="lg"
            className="shadow-glow"
          >
            Back to Home
          </Button>
        </motion.div>

        {/* Help Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 pt-8 border-t border-border/50"
        >
          <p className="text-sm text-muted-foreground mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button
              onClick={() => navigate('/lobby')}
              className="text-primary hover:text-primary/80 transition-colors focus-ring rounded px-2 py-1"
            >
              Tournament Lobby
            </button>
            <button
              onClick={() => navigate('/documentation')}
              className="text-primary hover:text-primary/80 transition-colors focus-ring rounded px-2 py-1"
            >
              Documentation
            </button>
            <button
              onClick={() => navigate('/tournament-setup-configuration')}
              className="text-primary hover:text-primary/80 transition-colors focus-ring rounded px-2 py-1"
            >
              Create Tournament
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
