/**
 * Direktor Design System - Design Tokens
 * 
 * This file contains all the design tokens used throughout the application.
 * These tokens ensure consistency across all components and pages.
 */

export const designTokens = {
  // Color System
  colors: {
    // Primary Brand Colors
    primary: {
      50: 'hsl(250, 95%, 98%)',
      100: 'hsl(250, 95%, 95%)',
      200: 'hsl(250, 95%, 90%)',
      300: 'hsl(250, 95%, 80%)',
      400: 'hsl(250, 95%, 70%)',
      500: 'hsl(262, 83%, 58%)', // Main brand color
      600: 'hsl(262, 83%, 48%)',
      700: 'hsl(262, 83%, 38%)',
      800: 'hsl(262, 83%, 28%)',
      900: 'hsl(262, 83%, 18%)',
      950: 'hsl(262, 83%, 8%)',
    },
    
    // Secondary Colors
    secondary: {
      50: 'hsl(221, 83%, 98%)',
      100: 'hsl(221, 83%, 95%)',
      200: 'hsl(221, 83%, 90%)',
      300: 'hsl(221, 83%, 80%)',
      400: 'hsl(221, 83%, 70%)',
      500: 'hsl(221, 83%, 53%)', // Secondary brand color
      600: 'hsl(221, 83%, 43%)',
      700: 'hsl(221, 83%, 33%)',
      800: 'hsl(221, 83%, 23%)',
      900: 'hsl(221, 83%, 13%)',
      950: 'hsl(221, 83%, 3%)',
    },
    
    // Accent Colors
    accent: {
      50: 'hsl(200, 98%, 98%)',
      100: 'hsl(200, 98%, 95%)',
      200: 'hsl(200, 98%, 90%)',
      300: 'hsl(200, 98%, 80%)',
      400: 'hsl(200, 98%, 70%)',
      500: 'hsl(200, 98%, 39%)', // Accent brand color
      600: 'hsl(200, 98%, 29%)',
      700: 'hsl(200, 98%, 19%)',
      800: 'hsl(200, 98%, 9%)',
      900: 'hsl(200, 98%, 4%)',
      950: 'hsl(200, 98%, 2%)',
    },
    
    // Semantic Colors
    success: {
      50: 'hsl(142, 76%, 95%)',
      100: 'hsl(142, 76%, 90%)',
      200: 'hsl(142, 76%, 80%)',
      300: 'hsl(142, 76%, 70%)',
      400: 'hsl(142, 76%, 60%)',
      500: 'hsl(142, 76%, 50%)',
      600: 'hsl(142, 76%, 40%)',
      700: 'hsl(142, 76%, 30%)',
      800: 'hsl(142, 76%, 20%)',
      900: 'hsl(142, 76%, 10%)',
    },
    
    warning: {
      50: 'hsl(38, 92%, 95%)',
      100: 'hsl(38, 92%, 90%)',
      200: 'hsl(38, 92%, 80%)',
      300: 'hsl(38, 92%, 70%)',
      400: 'hsl(38, 92%, 60%)',
      500: 'hsl(38, 92%, 50%)',
      600: 'hsl(38, 92%, 40%)',
      700: 'hsl(38, 92%, 30%)',
      800: 'hsl(38, 92%, 20%)',
      900: 'hsl(38, 92%, 10%)',
    },
    
    error: {
      50: 'hsl(0, 84%, 95%)',
      100: 'hsl(0, 84%, 90%)',
      200: 'hsl(0, 84%, 80%)',
      300: 'hsl(0, 84%, 70%)',
      400: 'hsl(0, 84%, 60%)',
      500: 'hsl(0, 84%, 50%)',
      600: 'hsl(0, 84%, 40%)',
      700: 'hsl(0, 84%, 30%)',
      800: 'hsl(0, 84%, 20%)',
      900: 'hsl(0, 84%, 10%)',
    },
    
    // Neutral Colors
    neutral: {
      50: 'hsl(0, 0%, 98%)',
      100: 'hsl(0, 0%, 96%)',
      200: 'hsl(0, 0%, 90%)',
      300: 'hsl(0, 0%, 83%)',
      400: 'hsl(0, 0%, 64%)',
      500: 'hsl(0, 0%, 45%)',
      600: 'hsl(0, 0%, 32%)',
      700: 'hsl(0, 0%, 25%)',
      800: 'hsl(0, 0%, 15%)',
      900: 'hsl(0, 0%, 9%)',
      950: 'hsl(0, 0%, 4%)',
    },
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      heading: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },

  // Spacing Scale
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

  // Border Radius Scale
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

  // Shadow Scale
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
    
    // Custom glow shadows
    'glow-sm': '0 0 20px hsl(262 83% 58% / 0.3)',
    'glow-md': '0 0 40px hsl(262 83% 58% / 0.4)',
    'glow-lg': '0 0 60px hsl(262 83% 58% / 0.5)',
  },

  // Animation Durations
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

  // Z-Index Scale
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
};

// Export individual token categories for easier imports
export const colors = designTokens.colors;
export const typography = designTokens.typography;
export const spacing = designTokens.spacing;
export const borderRadius = designTokens.borderRadius;
export const shadows = designTokens.shadows;
export const animation = designTokens.animation;
export const zIndex = designTokens.zIndex;
export const breakpoints = designTokens.breakpoints;
