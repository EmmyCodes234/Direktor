/**
 * Direktor Design System - Main Index
 * 
 * This file exports all design system components, tokens, and utilities
 * for use throughout the application.
 */

// Design Tokens
export * from './design-tokens';

// Component Patterns
export * from './component-patterns';

// Utilities
export * from './utilities';

// Re-export commonly used utilities
export { default as componentPatterns } from './component-patterns';
export { designTokens } from './design-tokens';
export { skeletonVariants } from './component-patterns';

// Design System Constants
export const DESIGN_SYSTEM = {
  name: 'Direktor Design System',
  version: '1.0.0',
  description: 'A comprehensive design system for the Direktor tournament management application',
  
  // Brand colors
  brand: {
    primary: 'hsl(262, 83%, 58%)',    // Purple
    secondary: 'hsl(221, 83%, 53%)',  // Blue
    accent: 'hsl(200, 98%, 39%)',     // Cyan
  },
  
  // Typography scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      heading: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
    },
  },
  
  // Spacing scale
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  
  // Breakpoints
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1600px',
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
    'glow-sm': '0 0 20px hsl(262 83% 58% / 0.3)',
    'glow-md': '0 0 40px hsl(262 83% 58% / 0.4)',
    'glow-lg': '0 0 60px hsl(262 83% 58% / 0.5)',
  },
  
  // Animation durations
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
      slowest: '700ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1020,
    banner: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    skipLink: 1070,
    toast: 1080,
    tooltip: 1090,
  },
};

// Component Status Mapping
export const COMPONENT_STATUS = {
  // Tournament statuses
  tournament: {
    setup: 'setup',
    draft: 'draft',
    active: 'active',
    in_progress: 'in_progress',
    running: 'running',
    paused: 'paused',
    stopped: 'stopped',
    completed: 'completed',
    finished: 'finished',
    error: 'error',
    cancelled: 'cancelled'
  },
  // Player statuses
  player: {
    active: 'active',
    inactive: 'inactive',
    suspended: 'suspended',
    banned: 'banned'
  },
  // Match statuses
  match: {
    pending: 'pending',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled'
  },
  // Loading states
  loading: {
    idle: 'idle',
    loading: 'loading',
    success: 'success',
    error: 'error'
  }
};

// Layout Templates
export const LAYOUT_TEMPLATES = {
  // Page layouts
  page: {
    default: 'min-h-screen bg-background',
    withHeader: 'min-h-screen bg-background pt-14 sm:pt-16',
    withSidebar: 'min-h-screen bg-background flex',
    centered: 'min-h-screen bg-background flex items-center justify-center',
  },
  
  // Container layouts
  container: {
    sm: 'max-w-3xl mx-auto px-4 sm:px-6',
    md: 'max-w-4xl mx-auto px-4 sm:px-6',
    lg: 'max-w-5xl mx-auto px-4 sm:px-6',
    xl: 'max-w-6xl mx-auto px-4 sm:px-6',
    '2xl': 'max-w-7xl mx-auto px-4 sm:px-6',
    full: 'w-full px-4 sm:px-6',
  },
  
  // Grid layouts
  grid: {
    '1': 'grid grid-cols-1 gap-4',
    '2': 'grid grid-cols-1 md:grid-cols-2 gap-4',
    '3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    '4': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    'auto-fit': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  },
  
  // Flexbox layouts
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    row: 'flex flex-row',
  },
  
  // Spacing patterns
  spacing: {
    section: 'py-8 sm:py-12 lg:py-16',
    sectionSm: 'py-6 sm:py-8 lg:py-12',
    sectionMd: 'py-8 sm:py-10 lg:py-14',
    sectionLg: 'py-12 sm:py-16 lg:py-24',
    content: 'space-y-4 sm:space-y-6 lg:space-y-8',
    contentSm: 'space-y-2 sm:space-y-4 lg:space-y-6',
    contentLg: 'space-y-6 sm:space-y-8 lg:space-y-12',
  },
};

// Form Templates
export const FORM_TEMPLATES = {
  // Form layouts
  layout: {
    vertical: 'space-y-4',
    horizontal: 'grid grid-cols-1 md:grid-cols-3 gap-4 items-center',
    inline: 'flex items-center space-x-4',
  },
  
  // Form groups
  group: 'space-y-2',
  
  // Form sections
  section: 'space-y-6 border-b border-neutral-200 dark:border-neutral-700 pb-6',
  
  // Form actions
  actions: 'flex items-center justify-end space-x-3 pt-6',
  
  // Form fields
  field: {
    label: 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1',
    input: 'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400',
    error: 'mt-1 text-sm text-error-600 dark:text-error-400',
    help: 'mt-1 text-sm text-neutral-500 dark:text-neutral-400',
  },
};

// Animation Templates
export const ANIMATION_TEMPLATES = {
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

// Export everything as a single object for easy access
export default {
  DESIGN_SYSTEM,
  COMPONENT_STATUS,
  LAYOUT_TEMPLATES,
  FORM_TEMPLATES,
  ANIMATION_TEMPLATES,
};
