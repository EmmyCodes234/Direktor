import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Dialog = forwardRef(({
  className,
  children,
  open = false,
  onOpenChange,
  size = "md",
  variant = "default",
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(open);
  const dialogRef = useRef(null);

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

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onOpenChange?.(false);
    }
  };

  const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
      onOpenChange?.(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
            className
          )}
          onClick={handleBackdropClick}
          {...props}
        >
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const DialogTrigger = forwardRef(({
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

const DialogContent = forwardRef(({
  className,
  children,
  size = "md",
  variant = "default",
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]}`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]}`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]}`,
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      className={cn(
        "relative w-full rounded-lg border bg-background p-6 shadow-lg",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const DialogHeader = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const DialogFooter = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const DialogTitle = forwardRef(({
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

const DialogDescription = forwardRef(({
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

const DialogClose = forwardRef(({
  className,
  onClick,
  size = "md",
  variant = "default",
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-12 w-12",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[500]} hover:text-${designTokens.colors.neutral[700]} hover:bg-${designTokens.colors.neutral[100]}`,
    primary: `text-${designTokens.colors.primary[500]} hover:text-${designTokens.colors.primary[700]} hover:bg-${designTokens.colors.primary[100]}`,
    secondary: `text-${designTokens.colors.secondary[500]} hover:text-${designTokens.colors.secondary[700]} hover:bg-${designTokens.colors.secondary[100]}`,
    muted: `text-${designTokens.colors.neutral[400]} hover:text-${designTokens.colors.neutral[600]} hover:bg-${designTokens.colors.neutral[200]}`,
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <Icon name="X" size={size === "sm" ? 16 : size === "lg" ? 20 : size === "xl" ? 24 : 18} />
      <span className="sr-only">Close</span>
    </button>
  );
});

const DialogPortal = forwardRef(({
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

const DialogOverlay = forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  );
});

Dialog.displayName = "Dialog";
DialogTrigger.displayName = "DialogTrigger";
DialogContent.displayName = "DialogContent";
DialogHeader.displayName = "DialogHeader";
DialogFooter.displayName = "DialogFooter";
DialogTitle.displayName = "DialogTitle";
DialogDescription.displayName = "DialogDescription";
DialogClose.displayName = "DialogClose";
DialogPortal.displayName = "DialogPortal";
DialogOverlay.displayName = "DialogOverlay";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogPortal,
  DialogOverlay,
};
export default Dialog;
