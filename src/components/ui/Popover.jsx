import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const Popover = forwardRef(({
  className,
  children,
  trigger,
  content,
  open,
  defaultOpen = false,
  onOpenChange,
  side = "top",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  size = "md",
  variant = "default",
  disabled = false,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const contentRef = useRef(null);
  const timeoutRef = useRef(null);

  const currentOpen = open !== undefined ? open : isOpen;

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

  const handleTriggerClick = () => {
    if (disabled) return;
    const newOpen = !currentOpen;
    if (open === undefined) {
      setIsOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const handleClickOutside = (event) => {
    if (
      triggerRef.current &&
      !triggerRef.current.contains(event.target) &&
      contentRef.current &&
      !contentRef.current.contains(event.target)
    ) {
      if (open === undefined) {
        setIsOpen(false);
      }
      onOpenChange?.(false);
    }
  };

  const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
      if (open === undefined) {
        setIsOpen(false);
      }
      onOpenChange?.(false);
    }
  };

  useEffect(() => {
    if (currentOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [currentOpen]);

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
      {...props}
    >
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className="inline-block cursor-pointer"
      >
        {trigger}
      </div>

      <AnimatePresence>
        {currentOpen && (
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
            style={{
              marginTop: side === "bottom" ? sideOffset : undefined,
              marginBottom: side === "top" ? sideOffset : undefined,
              marginLeft: side === "right" ? sideOffset : undefined,
              marginRight: side === "left" ? sideOffset : undefined,
              transform: `translate(${alignOffset}px, 0px)`,
            }}
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

const PopoverTrigger = forwardRef(({
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

const PopoverContent = forwardRef(({
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

const PopoverClose = forwardRef(({
  className,
  children,
  onClick,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

const PopoverArrow = forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("", className)}
      {...props}
    />
  );
});

const PopoverAnchor = forwardRef(({
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

Popover.displayName = "Popover";
PopoverTrigger.displayName = "PopoverTrigger";
PopoverContent.displayName = "PopoverContent";
PopoverClose.displayName = "PopoverClose";
PopoverArrow.displayName = "PopoverArrow";
PopoverAnchor.displayName = "PopoverAnchor";

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverArrow,
  PopoverAnchor,
};
export default Popover;
