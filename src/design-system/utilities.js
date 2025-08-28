/**
 * Direktor Design System - Utilities
 * 
 * This file provides utility functions for working with the design system,
 * including color manipulation, responsive helpers, and common operations.
 */

import { cn } from '../utils/cn';

/**
 * Generate CSS custom properties for design tokens
 * @param {Object} tokens - Design tokens object
 * @returns {Object} CSS custom properties
 */
export function generateCSSVariables(tokens) {
  const cssVars = {};
  
  // Convert design tokens to CSS custom properties
  Object.entries(tokens).forEach(([category, values]) => {
    if (typeof values === 'object' && values !== null) {
      Object.entries(values).forEach(([key, value]) => {
        if (typeof value === 'string' && value.includes('hsl')) {
          // Convert HSL values to CSS custom properties
          const cssVarName = `--${category}-${key}`;
          cssVars[cssVarName] = value;
        }
      });
    }
  });
  
  return cssVars;
}

/**
 * Apply CSS custom properties to a DOM element
 * @param {HTMLElement} element - Target DOM element
 * @param {Object} cssVars - CSS custom properties object
 */
export function applyCSSVariables(element, cssVars) {
  Object.entries(cssVars).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
}

/**
 * Get responsive value based on breakpoint
 * @param {Object} values - Object with breakpoint keys and values
 * @param {string} currentBreakpoint - Current breakpoint
 * @returns {any} Value for current breakpoint
 */
export function getResponsiveValue(values, currentBreakpoint) {
  const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
  const currentIndex = breakpoints.indexOf(currentBreakpoint);
  
  // Find the closest available breakpoint value
  for (let i = currentIndex; i >= 0; i--) {
    if (values[breakpoints[i]] !== undefined) {
      return values[breakpoints[i]];
    }
  }
  
  // Fallback to default or first available value
  return values.default || Object.values(values)[0];
}

/**
 * Generate color palette variations
 * @param {string} baseColor - Base color in HSL format
 * @param {number} steps - Number of variations to generate
 * @returns {Object} Color palette variations
 */
export function generateColorPalette(baseColor, steps = 10) {
  // Parse HSL values
  const hslMatch = baseColor.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
  if (!hslMatch) return {};
  
  const [, h, s, l] = hslMatch;
  const palette = {};
  
  for (let i = 0; i < steps; i++) {
    const lightness = Math.max(5, Math.min(95, l - (i - 5) * 10));
    const key = i === 5 ? '500' : i < 5 ? `${(5 - i) * 100}` : `${(i - 4) * 100}`;
    palette[key] = `hsl(${h}, ${s}%, ${lightness}%)`;
  }
  
  return palette;
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First color (hex or HSL)
 * @param {string} color2 - Second color (hex or HSL)
 * @returns {number} Contrast ratio
 */
export function calculateContrastRatio(color1, color2) {
  // Convert colors to RGB and calculate luminance
  const getLuminance = (color) => {
    // Simplified luminance calculation
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color string
 * @returns {Object|null} RGB object or null if invalid
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Generate spacing scale
 * @param {number} base - Base spacing value in rem
 * @param {number} ratio - Ratio between steps
 * @param {number} steps - Number of steps
 * @returns {Object} Spacing scale
 */
export function generateSpacingScale(base = 0.25, ratio = 1.5, steps = 16) {
  const scale = {};
  
  for (let i = 0; i < steps; i++) {
    const value = base * Math.pow(ratio, i);
    scale[i] = `${value}rem`;
  }
  
  return scale;
}

/**
 * Create responsive class names
 * @param {Object} classes - Object with breakpoint keys and class names
 * @returns {string} Responsive class names string
 */
export function responsiveClasses(classes) {
  const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
  const responsiveClasses = [];
  
  breakpoints.forEach((breakpoint, index) => {
    if (classes[breakpoint]) {
      if (index === 0) {
        // Base classes (no prefix)
        responsiveClasses.push(classes[breakpoint]);
      } else {
        // Responsive classes with breakpoint prefix
        responsiveClasses.push(`${breakpoint}:${classes[breakpoint]}`);
      }
    }
  });
  
  return responsiveClasses.join(' ');
}

/**
 * Generate animation keyframes
 * @param {string} name - Animation name
 * @param {Object} keyframes - Keyframe definitions
 * @returns {string} CSS keyframes string
 */
export function generateKeyframes(name, keyframes) {
  const keyframeString = Object.entries(keyframes)
    .map(([key, value]) => {
      if (typeof value === 'object') {
        const properties = Object.entries(value)
          .map(([prop, val]) => `    ${prop}: ${val};`)
          .join('\n');
        return `  ${key} {\n${properties}\n  }`;
      }
      return `  ${key} {\n    ${value}\n  }`;
    })
    .join('\n');
  
  return `@keyframes ${name} {\n${keyframeString}\n}`;
}

/**
 * Create component variant classes
 * @param {string} baseClasses - Base CSS classes
 * @param {Object} variants - Variant definitions
 * @param {Object} defaultVariants - Default variant values
 * @returns {Function} Function to generate variant classes
 */
export function createVariantClasses(baseClasses, variants, defaultVariants = {}) {
  return (props = {}) => {
    const variantClasses = [];
    
    // Add base classes
    variantClasses.push(baseClasses);
    
    // Add variant classes
    Object.entries(variants).forEach(([variantName, variantOptions]) => {
      const variantValue = props[variantName] || defaultVariants[variantName];
      if (variantValue && variantOptions[variantValue]) {
        variantClasses.push(variantOptions[variantValue]);
      }
    });
    
    return cn(...variantClasses);
  };
}

/**
 * Generate CSS custom properties for theme
 * @param {string} theme - Theme name ('light' or 'dark')
 * @returns {Object} Theme CSS variables
 */
export function generateThemeVariables(theme) {
  const isDark = theme === 'dark';
  
  return {
    '--background': isDark ? 'hsl(224, 71.4%, 4.1%)' : 'hsl(0, 0%, 100%)',
    '--foreground': isDark ? 'hsl(210, 20%, 98%)' : 'hsl(224, 71.4%, 4.1%)',
    '--card': isDark ? 'hsl(224, 71.4%, 4.1%)' : 'hsl(0, 0%, 100%)',
    '--card-foreground': isDark ? 'hsl(210, 20%, 98%)' : 'hsl(224, 71.4%, 4.1%)',
    '--popover': isDark ? 'hsl(224, 71.4%, 4.1%)' : 'hsl(0, 0%, 100%)',
    '--popover-foreground': isDark ? 'hsl(210, 20%, 98%)' : 'hsl(224, 71.4%, 4.1%)',
    '--primary': isDark ? 'hsl(263.4, 70%, 50.4%)' : 'hsl(262.1, 83.3%, 57.8%)',
    '--primary-foreground': isDark ? 'hsl(210, 20%, 98%)' : 'hsl(210, 20%, 98%)',
    '--secondary': isDark ? 'hsl(215, 27.9%, 16.9%)' : 'hsl(220, 14.3%, 95.9%)',
    '--secondary-foreground': isDark ? 'hsl(210, 20%, 98%)' : 'hsl(220.9, 39.3%, 11%)',
    '--muted': isDark ? 'hsl(215, 27.9%, 16.9%)' : 'hsl(220, 14.3%, 95.9%)',
    '--muted-foreground': isDark ? 'hsl(217.9, 10.6%, 64.9%)' : 'hsl(220, 8.9%, 46.1%)',
    '--accent': isDark ? 'hsl(215, 27.9%, 16.9%)' : 'hsl(220, 14.3%, 95.9%)',
    '--accent-foreground': isDark ? 'hsl(210, 20%, 98%)' : 'hsl(220.9, 39.3%, 11%)',
    '--destructive': isDark ? 'hsl(0, 62.8%, 30.6%)' : 'hsl(0, 84.2%, 60.2%)',
    '--destructive-foreground': isDark ? 'hsl(210, 20%, 98%)' : 'hsl(210, 20%, 98%)',
    '--border': isDark ? 'hsl(215, 27.9%, 16.9%)' : 'hsl(220, 13%, 91%)',
    '--input': isDark ? 'hsl(215, 27.9%, 16.9%)' : 'hsl(220, 13%, 91%)',
    '--ring': isDark ? 'hsl(224.3, 76.3%, 94.1%)' : 'hsl(262.1, 83.3%, 57.8%)',
    '--radius': '0.75rem',
  };
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is in viewport
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Generate unique ID
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format number with appropriate suffix
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format date relative to now
 * @param {Date|string} date - Date to format
 * @returns {string} Relative date string
 */
export function formatRelativeDate(date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = Math.abs(now - targetDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
}
