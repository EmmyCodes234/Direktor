import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Sheet = forwardRef(({
  className,
  children,
  open = false,
  onOpenChange,
  side = "bottom",
  size = "md",
  variant = "default",
  overlay = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  snapPoints = [],
  defaultSnap = 0,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(open);
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const sheetRef = useRef(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && closeOnEscape) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, closeOnEscape]);

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      handleClose();
    }
  };

  const handleDragStart = (event, info) => {
    dragStartY.current = info.point.y;
    dragStartHeight.current = sheetRef.current?.offsetHeight || 0;
  };

  const handleDragEnd = (event, info) => {
    const dragDistance = info.point.y - dragStartY.current;
    const threshold = 100;

    if (dragDistance > threshold) {
      handleClose();
    } else {
      // Snap to nearest snap point
      if (snapPoints.length > 0) {
        const currentHeight = sheetRef.current?.offsetHeight || 0;
        const nearestSnap = snapPoints.reduce((nearest, point, index) => {
          const distance = Math.abs(point - currentHeight);
          return distance < Math.abs(nearest - currentHeight) ? point : nearest;
        });
        setCurrentSnap(snapPoints.indexOf(nearestSnap));
      }
    }
  };

  const sizeClasses = {
    sm: "h-64",
    md: "h-96",
    lg: "h-[32rem]",
    xl: "h-[40rem]",
    full: "h-full",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]}`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]}`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]}`,
  };

  const sideClasses = {
    top: "top-0",
    bottom: "bottom-0",
    left: "left-0",
    right: "right-0",
  };

  const slideVariants = {
    top: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '-100%' },
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
    },
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
    },
  };

  const getHeight = () => {
    if (snapPoints.length > 0) {
      return snapPoints[currentSnap];
    }
    return sizeClasses[size];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          {overlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={handleOverlayClick}
            />
          )}

          {/* Sheet */}
          <motion.div
            ref={ref}
            initial={slideVariants[side].initial}
            animate={slideVariants[side].animate}
            exit={slideVariants[side].exit}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "fixed z-50 flex flex-col border shadow-xl",
              side === "top" || side === "bottom" ? "left-0 right-0" : "top-0 bottom-0",
              side === "top" ? "border-b" : side === "bottom" ? "border-t" : side === "left" ? "border-r" : "border-l",
              variantClasses[variant],
              sideClasses[side],
              className
            )}
            style={{ height: getHeight() }}
            drag={side === "bottom" ? "y" : side === "top" ? "y" : side === "left" ? "x" : "x"}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            dragElastic={0.1}
            {...props}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

const SheetHeader = forwardRef(({
  className,
  children,
  showClose = true,
  onClose,
  showHandle = true,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between border-b p-4",
        `border-${designTokens.colors.neutral[200]} bg-${designTokens.colors.neutral[100]}`
      )}
      {...props}
    >
      {showHandle && (
        <div className="flex-1 flex justify-center">
          <div className="w-12 h-1 rounded-full bg-neutral-300" />
        </div>
      )}
      <div className="flex-1">{children}</div>
      {showClose && (
        <button
          onClick={onClose}
          className={cn(
            "rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            `text-${designTokens.colors.neutral[500]} hover:text-${designTokens.colors.neutral[700]}`
          )}
        >
          <Icon name="X" size={20} />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  );
});

const SheetTitle = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h2>
  );
});

const SheetDescription = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
});

const SheetContent = forwardRef(({
  className,
  children,
  padding = "default",
  ...props
}, ref) => {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    default: "p-4",
    lg: "p-6",
    xl: "p-8",
  };

  return (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto", paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
});

const SheetFooter = forwardRef(({
  className,
  children,
  padding = "default",
  ...props
}, ref) => {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    default: "p-4",
    lg: "p-6",
    xl: "p-8",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col-reverse gap-2 border-t sm:flex-row sm:justify-end sm:space-x-2",
        `border-${designTokens.colors.neutral[200]} bg-${designTokens.colors.neutral[50]}`,
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const SheetTrigger = forwardRef(({
  className,
  children,
  onClick,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("inline-block", className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
});

const SheetClose = forwardRef(({
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
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        `bg-${designTokens.colors.neutral[100]} text-${designTokens.colors.neutral[900]} hover:bg-${designTokens.colors.neutral[200]}`,
        "h-10 px-4 py-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

const SheetSection = forwardRef(({
  className,
  children,
  title,
  padding = "default",
  ...props
}, ref) => {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    default: "p-4",
    lg: "p-6",
    xl: "p-8",
  };

  return (
    <div
      ref={ref}
      className={cn("border-b last:border-b-0", `border-${designTokens.colors.neutral[200]}`, className)}
      {...props}
    >
      {title && (
        <div className={cn("font-medium mb-2", `text-${designTokens.colors.neutral[700}`)}>
          {title}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
});

const useSheet = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

Sheet.displayName = "Sheet";
SheetHeader.displayName = "SheetHeader";
SheetTitle.displayName = "SheetTitle";
SheetDescription.displayName = "SheetDescription";
SheetContent.displayName = "SheetContent";
SheetFooter.displayName = "SheetFooter";
SheetTrigger.displayName = "SheetTrigger";
SheetClose.displayName = "SheetClose";
SheetSection.displayName = "SheetSection";

export {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetContent,
  SheetFooter,
  SheetTrigger,
  SheetClose,
  SheetSection,
  useSheet,
};
export default Sheet;
