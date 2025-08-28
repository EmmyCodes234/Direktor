import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

const MobileOptimizer = ({ children, className, ...props }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    // Check for reduced motion preference
    const checkReducedMotion = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsReducedMotion(prefersReducedMotion);
    };

    // Initial check
    checkMobile();
    checkReducedMotion();

    // Listen for resize events
    const handleResize = () => {
      checkMobile();
    };

    // Listen for motion preference changes
    const handleMotionChange = (e) => {
      setIsReducedMotion(e.matches);
    };

    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    window.addEventListener('resize', handleResize);
    motionMediaQuery.addEventListener('change', handleMotionChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      motionMediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Apply mobile-specific classes
  const mobileClasses = cn(
    // Base mobile optimization classes
    'mobile-layout-stable',
    // Conditional classes based on device and preferences
    {
      'mobile-reduce-motion': isReducedMotion,
      'mobile-performance': isMobile,
      'mobile-touch-optimized': isMobile,
    },
    className
  );

  // Apply mobile-specific styles
  useEffect(() => {
    if (isMobile) {
      // Add mobile-specific body classes
      document.body.classList.add('mobile-optimized');
      
      // Prevent mobile layout shifts
      const style = document.createElement('style');
      style.textContent = `
        .mobile-optimized {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          text-size-adjust: 100%;
          overflow-x: hidden;
          max-width: 100vw;
        }
        
        .mobile-optimized * {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        .mobile-optimized button,
        .mobile-optimized [role="button"] {
          min-height: 44px;
          min-width: 44px;
        }
        
        .mobile-optimized input,
        .mobile-optimized textarea,
        .mobile-optimized select {
          font-size: 16px;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.body.classList.remove('mobile-optimized');
        document.head.removeChild(style);
      };
    }
  }, [isMobile]);

  return (
    <div className={mobileClasses} {...props}>
      {children}
    </div>
  );
};

export { MobileOptimizer };
