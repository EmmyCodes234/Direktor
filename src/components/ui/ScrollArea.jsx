import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const ScrollArea = forwardRef(({
  className,
  children,
  orientation = "vertical",
  scrollHideDelay = 600,
  size = "md",
  variant = "default",
  maxHeight,
  maxWidth,
  ...props
}, ref) => {
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollAreaRef = useRef(null);
  const viewportRef = useRef(null);
  const scrollbarRef = useRef(null);
  const timeoutRef = useRef(null);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]}`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]}`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]}`,
  };

  const scrollbarSizeClasses = {
    sm: "w-1.5",
    md: "w-2",
    lg: "w-2.5",
    xl: "w-3",
  };

  const scrollbarThumbClasses = {
    default: `bg-${designTokens.colors.neutral[400]} hover:bg-${designTokens.colors.neutral[500]}`,
    primary: `bg-${designTokens.colors.primary[400]} hover:bg-${designTokens.colors.primary[500]}`,
    secondary: `bg-${designTokens.colors.secondary[400]} hover:bg-${designTokens.colors.secondary[500]}`,
    muted: `bg-${designTokens.colors.neutral[300]} hover:bg-${designTokens.colors.neutral[400]}`,
  };

  const handleScroll = () => {
    setIsScrolling(true);
    setShowScrollbar(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    timeoutRef.current = setTimeout(() => {
      setShowScrollbar(false);
    }, scrollHideDelay);
  };

  const handleScrollbarMouseDown = (event) => {
    event.preventDefault();
    const scrollbar = scrollbarRef.current;
    const viewport = viewportRef.current;
    
    if (!scrollbar || !viewport) return;

    const startPos = orientation === "vertical" ? event.clientY : event.clientX;
    const startScrollPos = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
    const scrollbarRect = scrollbar.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent) => {
      const currentPos = orientation === "vertical" ? moveEvent.clientY : moveEvent.clientX;
      const delta = currentPos - startPos;
      
      if (orientation === "vertical") {
        const scrollRatio = delta / (viewportRect.height - scrollbarRect.height);
        viewport.scrollTop = startScrollPos + (scrollRatio * (viewport.scrollHeight - viewportRect.height));
      } else {
        const scrollRatio = delta / (viewportRect.width - scrollbarRect.width);
        viewport.scrollLeft = startScrollPos + (scrollRatio * (viewport.scrollWidth - viewportRect.width));
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener('scroll', handleScroll);
      return () => viewport.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isVertical = orientation === "vertical";
  const scrollbarSize = scrollbarSizeClasses[size];

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      style={{
        maxHeight: isVertical ? maxHeight : undefined,
        maxWidth: !isVertical ? maxWidth : undefined,
      }}
      {...props}
    >
      <div
        ref={viewportRef}
        className={cn(
          "h-full w-full overflow-auto",
          isVertical ? "overflow-x-hidden" : "overflow-y-hidden"
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="min-h-full min-w-full">
          {children}
        </div>
      </div>

      <AnimatePresence>
        {showScrollbar && (
          <motion.div
            ref={scrollbarRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute z-10 rounded-full transition-opacity",
              scrollbarSize,
              isVertical ? "right-1 top-1 bottom-1" : "bottom-1 left-1 right-1",
              isVertical ? "h-auto" : "h-2 w-auto"
            )}
            onMouseDown={handleScrollbarMouseDown}
          >
            <div
              className={cn(
                "rounded-full transition-colors",
                scrollbarThumbClasses[variant],
                isVertical ? "w-full" : "h-full"
              )}
              style={{
                height: isVertical ? '20%' : '100%',
                width: isVertical ? '100%' : '20%',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const ScrollBar = forwardRef(({
  className,
  orientation = "vertical",
  size = "md",
  variant = "default",
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "w-1.5",
    md: "w-2",
    lg: "w-2.5",
    xl: "w-3",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[400]} hover:bg-${designTokens.colors.neutral[500]}`,
    primary: `bg-${designTokens.colors.primary[400]} hover:bg-${designTokens.colors.primary[500]}`,
    secondary: `bg-${designTokens.colors.secondary[400]} hover:bg-${designTokens.colors.secondary[500]}`,
    muted: `bg-${designTokens.colors.neutral[300]} hover:bg-${designTokens.colors.neutral[400]}`,
  };

  const isVertical = orientation === "vertical";

  return (
    <div
      ref={ref}
      className={cn(
        "flex touch-none select-none transition-colors",
        sizeClasses[size],
        variantClasses[variant],
        isVertical ? "h-full w-full" : "h-full w-full",
        className
      )}
      {...props}
    />
  );
});

const ScrollAreaViewport = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("h-full w-full overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollArea.displayName = "ScrollArea";
ScrollBar.displayName = "ScrollBar";
ScrollAreaViewport.displayName = "ScrollAreaViewport";

export { ScrollArea, ScrollBar, ScrollAreaViewport };
export default ScrollArea;
