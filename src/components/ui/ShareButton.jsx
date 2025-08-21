import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Icon from '../AppIcon';
import Button from './Button';
import { cn } from '../../utils/cn';
import { socialPlatforms } from '../../utils/socialSharing';
import useMediaQuery from '../../hooks/useMediaQuery';

const ShareButton = ({ 
  variant = 'default',
  size = 'default',
  className,
  children,
  shareData,
  platforms = ['twitter', 'facebook', 'whatsapp', 'copy', 'native'],
  position = 'bottom-right',
  showLabel = false,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Filter platforms based on device
  const availablePlatforms = platforms.filter(platform => {
    if (platform === 'native' && !navigator.share) return false;
    if (socialPlatforms[platform]?.mobileOnly && !isMobile) return false;
    return socialPlatforms[platform];
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleShare = async (platform) => {
    try {
      if (!shareData) {
        toast.error('No share data provided');
        return;
      }

      const { type, data, url } = shareData;
      let shareFunction;

      switch (type) {
        case 'tournament':
          shareFunction = data.shareTournament;
          break;
        case 'standings':
          shareFunction = data.shareStandings;
          break;
        case 'result':
          shareFunction = data.shareResult;
          break;
        case 'pairings':
          shareFunction = data.sharePairings;
          break;
        default:
          shareFunction = data.shareTournament;
      }

      if (platform === 'copy') {
        const success = await shareFunction().copy();
        if (success) {
          setCopied(true);
          toast.success('Link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        } else {
          toast.error('Failed to copy link');
        }
      } else if (platform === 'native') {
        const success = await shareFunction().native();
        if (!success) {
          toast.error('Native sharing not supported');
        }
      } else {
        shareFunction()[platform]();
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share');
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-full right-0 mb-3',
    'bottom-left': 'bottom-full left-0 mb-3',
    'top-right': 'top-full right-0 mt-3',
    'top-left': 'top-full left-0 mt-3',
    'right': 'left-full top-0 ml-3',
    'left': 'right-full top-0 mr-3'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant={variant}
        size={size}
        className={cn("touch-target", className)}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        <Icon name="Share2" size={size === 'sm' ? 16 : 18} className="mr-2" />
        {showLabel && children}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                "absolute z-50 glass-card border border-border/10 shadow-glass-xl rounded-xl p-3 min-w-[220px]",
                positionClasses[position]
              )}
            >
              <div className="space-y-1">
                {availablePlatforms.map((platform, index) => {
                  const platformConfig = socialPlatforms[platform];
                  if (!platformConfig) return null;

                  return (
                    <motion.button
                      key={platform}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleShare(platform)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left hover:bg-muted/20 transition-all duration-200 touch-target group",
                        platform === 'copy' && copied && "bg-success/10 text-success"
                      )}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                        style={{ backgroundColor: platformConfig.color + '20' }}
                      >
                        <Icon 
                          name={platformConfig.icon} 
                          size={16} 
                          style={{ color: platformConfig.color }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {platform === 'copy' && copied ? 'Copied!' : platformConfig.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareButton; 