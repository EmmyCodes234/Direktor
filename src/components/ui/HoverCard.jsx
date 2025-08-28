import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const HoverCard = forwardRef(({
  className,
  children,
  trigger,
  content,
  openDelay = 200,
  closeDelay = 300,
  side = "top",
  align = "center",
  size = "md",
  variant = "default",
  disabled = false,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);
  const timeoutRef = useRef(null);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]} shadow-lg`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]} shadow-lg`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]} shadow-lg`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]} shadow-lg`,
  };

  const sideClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0",
  };

  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-t-current",
    bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-b-current",
    left: "left-full top-1/2 transform -translate-y-1/2 border-l-current",
    right: "right-full top-1/2 transform -translate-y-1/2 border-r-current",
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, openDelay);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setIsHovered(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, closeDelay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div ref={triggerRef} className="inline-block">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95, y: side === "top" ? 8 : side === "bottom" ? -8 : 0, x: side === "left" ? 8 : side === "right" ? -8 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: side === "top" ? 8 : side === "bottom" ? -8 : 0, x: side === "left" ? 8 : side === "right" ? -8 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 w-80 rounded-lg border p-4",
              sizeClasses[size],
              variantClasses[variant],
              sideClasses[side],
              alignClasses[align],
              className
            )}
          >
            {content}
            
            {/* Arrow */}
            <div
              className={cn(
                "absolute w-0 h-0 border-4 border-transparent",
                arrowClasses[side],
                `border-t-${designTokens.colors.neutral[200]}`,
                side === "bottom" && `border-b-${designTokens.colors.neutral[200]}`,
                side === "left" && `border-l-${designTokens.colors.neutral[200]}`,
                side === "right" && `border-r-${designTokens.colors.neutral[200]}`
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const HoverCardTrigger = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("inline-block", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const HoverCardContent = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  );
});

HoverCard.displayName = "HoverCard";
HoverCardTrigger.displayName = "HoverCardTrigger";
HoverCardContent.displayName = "HoverCardContent";

export { HoverCard, HoverCardTrigger, HoverCardContent };
export default HoverCard;
