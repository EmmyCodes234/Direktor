/**
 * Direktor Design System - Component Patterns
 * 
 * This file defines standard component patterns, variants, and configurations
 * used throughout the application to ensure consistency.
 */

import { cva } from 'class-variance-authority';

// Button Component Patterns
export const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none mobile-tap-highlight touch-manipulation",
  {
    variants: {
      variant: {
        // Primary actions
        default: "bg-hero-gradient text-white hover:shadow-glow-md rounded-lg shadow-sm",
        primary: "bg-hero-gradient text-white hover:shadow-glow-md rounded-lg shadow-sm",
        
        // Secondary actions
        secondary: "bg-hero-zinc/20 text-hero-primary hover:bg-hero-zinc/30 dark:bg-hero-zinc/20 dark:text-hero-primary dark:hover:bg-hero-zinc/30 rounded-lg shadow-sm",
        outline: "border border-hero-purple/30 bg-white text-hero-primary hover:bg-hero-purple/10 dark:border-hero-purple/30 dark:bg-background dark:text-hero-primary dark:hover:bg-hero-purple/10 rounded-lg",
        
        // Semantic actions
        success: "bg-success-500 text-white hover:bg-success-600 rounded-lg shadow-sm",
        warning: "bg-warning-500 text-white hover:bg-warning-600 rounded-lg shadow-sm",
        error: "bg-error-500 text-white hover:bg-error-600 rounded-lg shadow-sm",
        destructive: "bg-error-500 text-white hover:bg-error-600 rounded-lg shadow-sm",
        
        // Special styles
        ghost: "hover:bg-hero-purple/10 hover:text-hero-primary dark:hover:bg-hero-purple/20 dark:hover:text-hero-primary rounded-lg",
        link: "text-hero-primary underline-offset-4 hover:underline hover:text-hero-purple/80 rounded-sm",
        glass: "glass-card hover:bg-white/95 hover:shadow-glow-sm border-hero-purple/30 rounded-lg",
        glow: "bg-hero-gradient text-white shadow-glow-sm hover:shadow-glow-md animate-pulse-glow rounded-lg",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-base",
        xl: "h-11 px-8 text-lg",
        "2xl": "h-12 px-10 text-xl",
        
        // Icon-only sizes
        "icon-xs": "h-7 w-7 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-md": "h-9 w-9 p-0",
        "icon-lg": "h-10 w-10 p-0",
        "icon-xl": "h-11 w-11 p-0",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      rounded: "lg",
    },
  }
);

// Input Component Patterns
export const inputVariants = cva(
  // Base styles
  "flex w-full rounded-lg border border-hero-purple/30 bg-white px-3 py-2 text-sm text-hero-primary placeholder:text-hero-secondary focus:border-hero-purple focus:outline-none focus:ring-1 focus:ring-hero-purple/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-hero-purple/30 dark:bg-background dark:text-hero-primary dark:placeholder:text-hero-secondary dark:focus:border-hero-purple dark:focus:ring-hero-purple/20",
  {
    variants: {
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-9 px-3 text-sm",
        lg: "h-10 px-4 text-base",
        xl: "h-11 px-5 text-lg",
      },
      variant: {
        default: "",
        error: "border-error-500 focus:border-error-500 focus:ring-error-500",
        success: "border-success-500 focus:border-success-500 focus:ring-success-500",
        warning: "border-warning-500 focus:border-warning-500 focus:ring-warning-500",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

// Card Component Patterns
export const cardVariants = cva(
  // Base styles
  "rounded-lg border border-hero-purple/20 bg-white text-hero-primary shadow-sm dark:border-hero-purple/20 dark:bg-background dark:text-hero-primary",
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-md hover:shadow-lg transition-shadow duration-200",
        interactive: "cursor-pointer hover:shadow-md hover:border-hero-purple/40 transition-all duration-200",
        glass: "glass-card border-hero-purple/30",
        glow: "shadow-glow-sm hover:shadow-glow-md transition-shadow duration-200",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

// Badge Component Patterns
export const badgeVariants = cva(
  // Base styles
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-hero-zinc/20 text-hero-primary dark:bg-hero-zinc/20 dark:text-hero-primary",
        primary: "bg-hero-purple/20 text-hero-primary dark:bg-hero-purple/20 dark:text-hero-primary",
        secondary: "bg-hero-zinc/20 text-hero-primary dark:bg-hero-zinc/20 dark:text-hero-primary",
        success: "bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100",
        warning: "bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-100",
        error: "bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-100",
        destructive: "bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-100",
        outline: "border border-hero-purple/30 bg-transparent text-hero-primary dark:border-hero-purple/30 dark:text-hero-primary",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// Status Badge Patterns for Tournament Statuses
export const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        setup: "border-hero-purple/30 bg-hero-purple/20 text-hero-primary",
        draft: "border-hero-zinc/30 bg-hero-zinc/20 text-hero-secondary",
        active: "border-success/30 bg-success/20 text-success",
        in_progress: "border-warning/30 bg-warning/20 text-warning",
        running: "border-hero-purple/30 bg-hero-purple/20 text-hero-primary",
        paused: "border-warning/30 bg-warning/20 text-warning",
        stopped: "border-error/30 bg-error/20 text-error",
        completed: "border-success/30 bg-success/20 text-success",
        finished: "border-hero-purple/30 bg-hero-purple/20 text-hero-primary",
        error: "border-error/30 bg-error/20 text-error",
        cancelled: "border-error/30 bg-error/20 text-error",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      status: "setup",
      size: "md",
    },
  }
);

export const skeletonVariants = cva(
  "animate-pulse rounded bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        primary: "bg-hero-purple/20",
        secondary: "bg-hero-zinc/20",
        accent: "bg-hero-purple/20",
        muted: "bg-muted/60",
      },
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
        "2xl": "h-12 w-12",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded",
        pill: "rounded-full",
        rectangle: "rounded",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      shape: "rectangle",
    },
  }
);

// Animation Patterns
export const animationPatterns = {
  // Page transitions
  pageEnter: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  
  // Card animations
  cardEnter: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
    transition: { duration: 0.2, ease: "easeOut" },
  },
  
  // Staggered animations
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  },
  
  // Hover effects
  hoverLift: {
    whileHover: { y: -4, scale: 1.02 },
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  
  // Focus effects
  focusRing: {
    whileFocus: { scale: 1.02 },
    transition: { duration: 0.1 },
  },
  
  // Loading states
  loadingPulse: {
    animate: { opacity: [1, 0.5, 1] },
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

// Layout Patterns
export const layoutPatterns = {
  // Container layouts
  container: {
    sm: "max-w-3xl mx-auto px-4 sm:px-6",
    md: "max-w-4xl mx-auto px-4 sm:px-6",
    lg: "max-w-5xl mx-auto px-4 sm:px-6",
    xl: "max-w-6xl mx-auto px-4 sm:px-6",
    "2xl": "max-w-7xl mx-auto px-4 sm:px-6",
    full: "w-full px-4 sm:px-6",
  },
  
  // Grid layouts
  grid: {
    "1": "grid grid-cols-1 gap-4",
    "2": "grid grid-cols-1 md:grid-cols-2 gap-4",
    "3": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
    "4": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
    "auto-fit": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
  },
  
  // Flexbox layouts
  flex: {
    center: "flex items-center justify-center",
    between: "flex items-center justify-between",
    start: "flex items-center justify-start",
    end: "flex items-center justify-end",
    col: "flex flex-col",
    row: "flex flex-row",
  },
  
  // Spacing patterns
  spacing: {
    section: "py-8 sm:py-12 lg:py-16",
    sectionSm: "py-6 sm:py-8 lg:py-12",
    sectionLg: "py-12 sm:py-16 lg:py-24",
    content: "space-y-4 sm:space-y-6 lg:space-y-8",
    contentSm: "space-y-2 sm:space-y-4 lg:space-y-6",
    contentLg: "space-y-6 sm:space-y-8 lg:space-y-12",
  },
};

// Form Patterns
export const formPatterns = {
  // Form layouts
  layout: {
    vertical: "space-y-4",
    horizontal: "grid grid-cols-1 md:grid-cols-3 gap-4 items-center",
    inline: "flex items-center space-x-4",
  },
  
  // Form groups
  group: "space-y-2",
  
  // Form sections
  section: "space-y-6 border-b border-neutral-200 dark:border-neutral-700 pb-6",
  
  // Form actions
  actions: "flex items-center justify-end space-x-3 pt-6",
};

// Export all patterns
export default {
  buttonVariants,
  inputVariants,
  cardVariants,
  badgeVariants,
  statusBadgeVariants,
  skeletonVariants,
  animationPatterns,
  layoutPatterns,
  formPatterns,
};
