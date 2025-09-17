import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';
import usePullToRefresh from '../../hooks/usePullToRefresh';

const PullToRefresh = ({ 
  onRefresh, 
  children, 
  className,
  enabled = true,
  threshold = 100,
  triggerDistance = 80
}) => {
  const {
    containerRef,
    isRefreshing,
    pullDistance,
    isPulling,
    isTriggered
  } = usePullToRefresh(onRefresh, { 
    threshold, 
    triggerDistance, 
    enabled 
  });

  const refreshIndicatorVariants = {
    initial: { 
      scale: 0,
      opacity: 0,
      rotate: 0
    },
    pulling: { 
      scale: Math.min(pullDistance / 60, 1),
      opacity: Math.min(pullDistance / 40, 1),
      rotate: pullDistance * 2
    },
    triggered: {
      scale: 1,
      opacity: 1,
      rotate: 180
    },
    refreshing: {
      scale: 1,
      opacity: 1,
      rotate: 360,
      transition: {
        rotate: {
          duration: 1,
          ease: "linear",
          repeat: Infinity
        }
      }
    }
  };

  const getVariant = () => {
    if (isRefreshing) return 'refreshing';
    if (isTriggered) return 'triggered';
    if (isPulling) return 'pulling';
    return 'initial';
  };

  return (
    <div className={cn("relative", className)}>
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-4"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 40)}px)`
        }}
      >
        <motion.div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm border shadow-lg",
            isTriggered ? "border-primary/30 bg-primary/10" : "border-border"
          )}
          variants={refreshIndicatorVariants}
          animate={getVariant()}
          initial="initial"
        >
          <Icon 
            name={isRefreshing ? "Loader2" : "ArrowDown"} 
            size={20} 
            className={cn(
              "transition-colors duration-200",
              isTriggered ? "text-primary" : "text-muted-foreground"
            )}
          />
        </motion.div>
      </div>

      {/* Scrollable content */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto mobile-scroll"
        style={{
          transform: `translateY(${Math.max(0, pullDistance / 3)}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;