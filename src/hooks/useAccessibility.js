import { useState, useEffect } from 'react';

export const useAccessibility = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    // Check for dark mode preference
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDarkMode(darkQuery.matches);

    const handleDarkChange = (e) => setPrefersDarkMode(e.matches);
    darkQuery.addEventListener('change', handleDarkChange);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(contrastQuery.matches);

    const handleContrastChange = (e) => setPrefersHighContrast(e.matches);
    contrastQuery.addEventListener('change', handleContrastChange);

    // Detect keyboard users
    const handleKeyDown = () => setIsKeyboardUser(true);
    const handleMouseDown = () => setIsKeyboardUser(false);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      darkQuery.removeEventListener('change', handleDarkChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Utility function to conditionally apply animations
  const shouldAnimate = (defaultValue = true) => {
    return prefersReducedMotion ? false : defaultValue;
  };

  // Utility function to get appropriate animation duration
  const getAnimationDuration = (defaultDuration = 200) => {
    return prefersReducedMotion ? 0 : defaultDuration;
  };

  // Utility function to get appropriate transition timing
  const getTransitionTiming = (defaultTiming = 'ease-out') => {
    return prefersReducedMotion ? 'none' : defaultTiming;
  };

  // Utility function to get appropriate focus styles
  const getFocusStyles = () => {
    return isKeyboardUser ? {
      outline: '2px solid hsl(var(--primary))',
      outlineOffset: '2px',
    } : {
      outline: 'none',
    };
  };

  // Utility function to get appropriate contrast colors
  const getContrastColors = () => {
    if (prefersHighContrast) {
      return {
        primary: 'hsl(var(--primary-600))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
      };
    }
    return {
      primary: 'hsl(var(--primary))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      border: 'hsl(var(--border))',
    };
  };

  return {
    prefersReducedMotion,
    prefersDarkMode,
    prefersHighContrast,
    isKeyboardUser,
    shouldAnimate,
    getAnimationDuration,
    getTransitionTiming,
    getFocusStyles,
    getContrastColors,
  };
};

// Hook for managing focus
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState(null);

  const focusElement = (element) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
      setFocusedElement(element);
    }
  };

  const focusFirstFocusable = (container) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusElement(focusableElements[0]);
    }
  };

  const focusLastFocusable = (container) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusElement(focusableElements[focusableElements.length - 1]);
    }
  };

  const trapFocus = (container) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            focusElement(lastElement);
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            focusElement(firstElement);
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  return {
    focusedElement,
    focusElement,
    focusFirstFocusable,
    focusLastFocusable,
    trapFocus,
  };
};

// Hook for managing ARIA attributes
export const useAriaAttributes = () => {
  const getButtonAriaProps = (props = {}) => ({
    role: 'button',
    tabIndex: 0,
    'aria-pressed': props.pressed,
    'aria-expanded': props.expanded,
    'aria-haspopup': props.hasPopup,
    'aria-controls': props.controls,
    'aria-describedby': props.describedBy,
    ...props,
  });

  const getDialogAriaProps = (props = {}) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': props.labelledBy,
    'aria-describedby': props.describedBy,
    ...props,
  });

  const getListboxAriaProps = (props = {}) => ({
    role: 'listbox',
    'aria-multiselectable': props.multiSelectable,
    'aria-labelledby': props.labelledBy,
    ...props,
  });

  const getOptionAriaProps = (props = {}) => ({
    role: 'option',
    'aria-selected': props.selected,
    'aria-disabled': props.disabled,
    ...props,
  });

  return {
    getButtonAriaProps,
    getDialogAriaProps,
    getListboxAriaProps,
    getOptionAriaProps,
  };
}; 