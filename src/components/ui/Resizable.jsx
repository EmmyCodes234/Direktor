import React, { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Resizable = forwardRef(({
  className,
  children,
  direction = "horizontal",
  minSize = 100,
  maxSize = 800,
  defaultSize = 200,
  onResize,
  disabled = false,
  handleClassName,
  ...props
}, ref) => {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const startSize = useRef(defaultSize);
  const startPosition = useRef(0);

  const handleResizeStart = useCallback((event, info) => {
    if (disabled) return;
    
    setIsResizing(true);
    startSize.current = size;
    startPosition.current = direction === "horizontal" ? info.point.x : info.point.y;
    
    document.body.style.cursor = direction === "horizontal" ? "ew-resize" : "ns-resize";
    document.body.style.userSelect = "none";
  }, [disabled, size, direction]);

  const handleResize = useCallback((event, info) => {
    if (disabled || !isResizing) return;
    
    const currentPosition = direction === "horizontal" ? info.point.x : info.point.y;
    const delta = currentPosition - startPosition.current;
    const newSize = Math.max(minSize, Math.min(maxSize, startSize.current + delta));
    
    setSize(newSize);
    onResize?.(newSize);
  }, [disabled, isResizing, direction, minSize, maxSize, onResize]);

  const handleResizeEnd = useCallback(() => {
    if (disabled) return;
    
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [disabled]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const sizeStyle = {
    [direction === "horizontal" ? "width" : "height"]: `${size}px`,
  };

  const handleClasses = cn(
    "relative flex items-center justify-center",
    "bg-border hover:bg-border/80 transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    direction === "horizontal" ? "w-1 cursor-ew-resize" : "h-1 cursor-ns-resize",
    handleClassName
  );

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      style={sizeStyle}
      {...props}
    >
      {children}
      
      {/* Resize Handle */}
      <motion.div
        className={handleClasses}
        drag={direction}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        onDragStart={handleResizeStart}
        onDrag={handleResize}
        onDragEnd={handleResizeEnd}
        dragElastic={0}
        dragMomentum={false}
        whileDrag={{ scale: 1.1 }}
      >
        <div className={cn(
          "rounded-full",
          direction === "horizontal" ? "w-1 h-6" : "h-1 w-6",
          `bg-${designTokens.colors.neutral[400]}`
        )} />
      </motion.div>
    </div>
  );
});

const ResizableGroup = forwardRef(({
  className,
  children,
  direction = "horizontal",
  ...props
}, ref) => {
  const directionClasses = {
    horizontal: "flex",
    vertical: "flex flex-col",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative",
        directionClasses[direction],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const ResizablePanel = forwardRef(({
  className,
  children,
  defaultSize = 200,
  minSize = 100,
  maxSize = 800,
  collapsible = false,
  collapsedSize = 0,
  onCollapse,
  ...props
}, ref) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [size, setSize] = useState(defaultSize);

  const handleCollapse = useCallback(() => {
    if (!collapsible) return;
    
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapse?.(newCollapsedState);
  }, [collapsible, isCollapsed, onCollapse]);

  const currentSize = isCollapsed ? collapsedSize : size;
  const sizeStyle = {
    width: `${currentSize}px`,
    minWidth: `${minSize}px`,
    maxWidth: `${maxSize}px`,
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col",
        className
      )}
      style={sizeStyle}
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

const ResizableHandle = forwardRef(({
  className,
  direction = "horizontal",
  disabled = false,
  onResize,
  ...props
}, ref) => {
  const [isResizing, setIsResizing] = useState(false);
  const startPosition = useRef(0);
  const startSizes = useRef([]);

  const handleResizeStart = useCallback((event, info) => {
    if (disabled) return;
    
    setIsResizing(true);
    startPosition.current = direction === "horizontal" ? info.point.x : info.point.y;
    
    // Get current sizes of adjacent panels
    const parent = event.currentTarget.parentElement;
    if (parent) {
      const panels = Array.from(parent.children).filter(child => 
        child.classList.contains('resizable-panel')
      );
      startSizes.current = panels.map(panel => 
        direction === "horizontal" ? panel.offsetWidth : panel.offsetHeight
      );
    }
    
    document.body.style.cursor = direction === "horizontal" ? "ew-resize" : "ns-resize";
    document.body.style.userSelect = "none";
  }, [disabled, direction]);

  const handleResize = useCallback((event, info) => {
    if (disabled || !isResizing) return;
    
    const currentPosition = direction === "horizontal" ? info.point.x : info.point.y;
    const delta = currentPosition - startPosition.current;
    
    // Calculate new sizes for adjacent panels
    const parent = event.currentTarget.parentElement;
    if (parent && startSizes.current.length >= 2) {
      const [leftSize, rightSize] = startSizes.current;
      const newLeftSize = Math.max(100, leftSize + delta);
      const newRightSize = Math.max(100, rightSize - delta);
      
      onResize?.({ left: newLeftSize, right: newRightSize, delta });
    }
  }, [disabled, isResizing, direction, onResize]);

  const handleResizeEnd = useCallback(() => {
    if (disabled) return;
    
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [disabled]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const handleClasses = cn(
    "relative flex items-center justify-center",
    "bg-border hover:bg-border/80 transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    direction === "horizontal" ? "w-1 cursor-ew-resize" : "h-1 cursor-ns-resize",
    className
  );

  return (
    <motion.div
      ref={ref}
      className={handleClasses}
      drag={direction}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={handleResizeStart}
      onDrag={handleResize}
      onDragEnd={handleResizeEnd}
      dragElastic={0}
      dragMomentum={false}
      whileDrag={{ scale: 1.1 }}
      {...props}
    >
      <div className={cn(
        "rounded-full",
        direction === "horizontal" ? "w-1 h-6" : "h-1 w-6",
        `bg-${designTokens.colors.neutral[400]}`
      )} />
    </motion.div>
  );
});

const useResizable = (defaultSize = 200, minSize = 100, maxSize = 800) => {
  const [size, setSize] = useState(defaultSize);

  const resizeTo = useCallback((newSize) => {
    const clampedSize = Math.max(minSize, Math.min(maxSize, newSize));
    setSize(clampedSize);
    return clampedSize;
  }, [minSize, maxSize]);

  const resizeBy = useCallback((delta) => {
    return resizeTo(size + delta);
  }, [size, resizeTo]);

  const reset = useCallback(() => {
    setSize(defaultSize);
  }, [defaultSize]);

  return {
    size,
    resizeTo,
    resizeBy,
    reset,
    isAtMin: size <= minSize,
    isAtMax: size >= maxSize,
  };
};

Resizable.displayName = "Resizable";
ResizableGroup.displayName = "ResizableGroup";
ResizablePanel.displayName = "ResizablePanel";
ResizableHandle.displayName = "ResizableHandle";

export {
  Resizable,
  ResizableGroup,
  ResizablePanel,
  ResizableHandle,
  useResizable,
};
export default Resizable;
