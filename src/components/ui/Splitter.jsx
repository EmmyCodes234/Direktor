import React, { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Splitter = forwardRef(({
  className,
  children,
  direction = "horizontal",
  size = "md",
  variant = "default",
  disabled = false,
  onSplit,
  ...props
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50); // percentage
  const startPosition = useRef(0);
  const startSplit = useRef(50);

  const handleDragStart = useCallback((event, info) => {
    if (disabled) return;
    
    setIsDragging(true);
    startPosition.current = direction === "horizontal" ? info.point.x : info.point.y;
    startSplit.current = splitPosition;
    
    document.body.style.cursor = direction === "horizontal" ? "ew-resize" : "ns-resize";
    document.body.style.userSelect = "none";
  }, [disabled, direction, splitPosition]);

  const handleDrag = useCallback((event, info) => {
    if (disabled || !isDragging) return;
    
    const currentPosition = direction === "horizontal" ? info.point.x : info.point.y;
    const delta = currentPosition - startPosition.current;
    
    // Calculate new split position based on container size
    const container = event.currentTarget.parentElement;
    if (container) {
      const containerSize = direction === "horizontal" ? container.offsetWidth : container.offsetHeight;
      const deltaPercent = (delta / containerSize) * 100;
      const newSplit = Math.max(10, Math.min(90, startSplit.current + deltaPercent));
      
      setSplitPosition(newSplit);
      onSplit?.(newSplit);
    }
  }, [disabled, isDragging, direction, onSplit]);

  const handleDragEnd = useCallback(() => {
    if (disabled) return;
    
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [disabled]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const sizeClasses = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[300]} hover:bg-${designTokens.colors.neutral[400]}`,
    primary: `bg-${designTokens.colors.primary[300]} hover:bg-${designTokens.colors.primary[400]}`,
    secondary: `bg-${designTokens.colors.secondary[300]} hover:bg-${designTokens.colors.secondary[400]}`,
    muted: `bg-${designTokens.colors.neutral[200]} hover:bg-${designTokens.colors.neutral[300]}`,
  };

  const directionClasses = {
    horizontal: "cursor-ew-resize",
    vertical: "cursor-ns-resize",
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-colors",
        sizeClasses[size],
        variantClasses[variant],
        directionClasses[direction],
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      drag={direction}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      dragElastic={0}
      dragMomentum={false}
      whileDrag={{ scale: 1.2 }}
      {...props}
    />
  );
});

const SplitterGroup = forwardRef(({
  className,
  children,
  direction = "horizontal",
  splitPosition = 50,
  minSplit = 10,
  maxSplit = 90,
  onSplitChange,
  ...props
}, ref) => {
  const [currentSplit, setCurrentSplit] = useState(splitPosition);

  const handleSplitChange = useCallback((newSplit) => {
    const clampedSplit = Math.max(minSplit, Math.min(maxSplit, newSplit));
    setCurrentSplit(clampedSplit);
    onSplitChange?.(clampedSplit);
  }, [minSplit, maxSplit, onSplitChange]);

  const directionClasses = {
    horizontal: "flex",
    vertical: "flex flex-col",
  };

  const splitStyle = {
    [direction === "horizontal" ? "width" : "height"]: `${currentSplit}%`,
  };

  const remainingStyle = {
    [direction === "horizontal" ? "width" : "height"]: `${100 - currentSplit}%`,
  };

  const childrenArray = React.Children.toArray(children);
  if (childrenArray.length < 2) {
    return (
      <div
        ref={ref}
        className={cn("relative", directionClasses[direction], className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  const [firstChild, ...remainingChildren] = childrenArray;

  return (
    <div
      ref={ref}
      className={cn("relative", directionClasses[direction], className)}
      {...props}
    >
      {/* First Panel */}
      <div style={splitStyle} className="relative">
        {firstChild}
      </div>

      {/* Splitter */}
      <Splitter
        direction={direction}
        onSplit={handleSplitChange}
        className="z-10"
      />

      {/* Remaining Panels */}
      <div style={remainingStyle} className="relative">
        {remainingChildren}
      </div>
    </div>
  );
});

const SplitterPanel = forwardRef(({
  className,
  children,
  size,
  minSize,
  maxSize,
  collapsible = false,
  collapsedSize = 0,
  onCollapse,
  ...props
}, ref) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapse = useCallback(() => {
    if (!collapsible) return;
    
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapse?.(newCollapsedState);
  }, [collapsible, isCollapsed, onCollapse]);

  const panelStyle = {
    width: size ? `${size}px` : undefined,
    minWidth: minSize ? `${minSize}px` : undefined,
    maxWidth: maxSize ? `${maxSize}px` : undefined,
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col",
        className
      )}
      style={panelStyle}
      {...props}
    >
      {children}
      
      {collapsible && (
        <button
          onClick={handleCollapse}
          className={cn(
            "absolute -right-3 top-1/2 transform -translate-y-1/2 z-10",
            "flex h-6 w-6 items-center justify-center rounded-full",
            `bg-${designTokens.colors.neutral[200]} hover:bg-${designTokens.colors.neutral[300]}`,
            "shadow-md transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
          aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          <Icon
            name={isCollapsed ? "ChevronRight" : "ChevronLeft"}
            size={16}
            className={`text-${designTokens.colors.neutral[600]}`}
          />
        </button>
      )}
    </div>
  );
});

const SplitterHandle = forwardRef(({
  className,
  direction = "horizontal",
  size = "md",
  variant = "default",
  disabled = false,
  onSplit,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: direction === "horizontal" ? "w-1 h-8" : "h-1 w-8",
    md: direction === "horizontal" ? "w-2 h-12" : "h-2 w-12",
    lg: direction === "horizontal" ? "w-3 h-16" : "h-3 w-16",
    xl: direction === "horizontal" ? "w-4 h-20" : "h-4 w-20",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[200]} hover:bg-${designTokens.colors.neutral[300]}`,
    primary: `bg-${designTokens.colors.primary[200]} hover:bg-${designTokens.colors.primary[300]}`,
    secondary: `bg-${designTokens.colors.secondary[200]} hover:bg-${designTokens.colors.secondary[300]}`,
    muted: `bg-${designTokens.colors.neutral[100]} hover:bg-${designTokens.colors.neutral[200]}`,
  };

  const directionClasses = {
    horizontal: "cursor-ew-resize",
    vertical: "cursor-ns-resize",
  };

  return (
    <Splitter
      ref={ref}
      direction={direction}
      size={size}
      variant={variant}
      disabled={disabled}
      onSplit={onSplit}
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        directionClasses[direction],
        className
      )}
      {...props}
    />
  );
});

const useSplitter = (initialSplit = 50, minSplit = 10, maxSplit = 90) => {
  const [splitPosition, setSplitPosition] = useState(initialSplit);

  const setSplit = useCallback((newSplit) => {
    const clampedSplit = Math.max(minSplit, Math.min(maxSplit, newSplit));
    setSplitPosition(clampedSplit);
    return clampedSplit;
  }, [minSplit, maxSplit]);

  const adjustSplit = useCallback((delta) => {
    return setSplit(splitPosition + delta);
  }, [splitPosition, setSplit]);

  const reset = useCallback(() => {
    setSplitPosition(initialSplit);
  }, [initialSplit]);

  return {
    splitPosition,
    setSplit,
    adjustSplit,
    reset,
    isAtMin: splitPosition <= minSplit,
    isAtMax: splitPosition >= maxSplit,
  };
};

Splitter.displayName = "Splitter";
SplitterGroup.displayName = "SplitterGroup";
SplitterPanel.displayName = "SplitterPanel";
SplitterHandle.displayName = "SplitterHandle";

export {
  Splitter,
  SplitterGroup,
  SplitterPanel,
  SplitterHandle,
  useSplitter,
};
export default Splitter;
