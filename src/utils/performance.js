// Performance optimization utilities

// Debounce function to limit function calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function to limit function calls
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization utility for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

// Virtual scrolling helper for large lists
export const createVirtualScroller = (items, itemHeight, containerHeight) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;
  
  return {
    getVisibleRange: (scrollTop) => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleCount, items.length);
      return { startIndex, endIndex };
    },
    getVisibleItems: (scrollTop) => {
      const { startIndex, endIndex } = this.getVisibleRange(scrollTop);
      return items.slice(startIndex, endIndex);
    },
    getOffsetY: (index) => index * itemHeight,
    totalHeight,
  };
};

// Lazy loading utility
export const lazyLoad = (importFunc) => {
  return React.lazy(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(importFunc());
      }, 100); // Small delay to show loading state
    });
  });
};

// Image lazy loading
export const lazyLoadImage = (src, placeholder = '/placeholder.png') => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Performance monitoring
export const performanceMonitor = {
  marks: new Map(),
  
  start: (name) => {
    const startTime = performance.now();
    performanceMonitor.marks.set(name, { startTime });
  },
  
  end: (name) => {
    const mark = performanceMonitor.marks.get(name);
    if (mark) {
      const endTime = performance.now();
      const duration = endTime - mark.startTime;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      performanceMonitor.marks.delete(name);
      return duration;
    }
    return 0;
  },
  
  measure: async (name, fn) => {
    performanceMonitor.start(name);
    try {
      const result = await fn();
      performanceMonitor.end(name);
      return result;
    } catch (error) {
      performanceMonitor.end(name);
      throw error;
    }
  },
};

// Bundle size optimization helper
export const bundleOptimizer = {
  // Check if code splitting is working
  checkCodeSplitting: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const entries = performance.getEntriesByType('navigation');
      if (entries.length > 0) {
        const navigation = entries[0];
        console.log('Page load time:', navigation.loadEventEnd - navigation.loadEventStart);
      }
    }
  },
  
  // Preload critical resources
  preloadResource: (href, as = 'script') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },
};

// Memory management utilities
export const memoryManager = {
  // Clear unused event listeners
  clearEventListeners: (element, eventType) => {
    if (element && element.removeEventListener) {
      element.removeEventListener(eventType, null);
    }
  },
  
  // Clear intervals and timeouts
  clearTimers: () => {
    const highestTimeoutId = setTimeout(() => {}, 0);
    const highestIntervalId = setInterval(() => {}, 0);
    
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
  },
  
  // Force garbage collection (if available)
  forceGC: () => {
    if (window.gc) {
      window.gc();
    }
  },
};

// React performance optimizations
export const reactOptimizations = {
  // Memo wrapper for expensive components
  memo: (Component, propsAreEqual) => {
    return React.memo(Component, propsAreEqual);
  },
  
  // Callback memoization
  useCallback: (callback, deps) => {
    return React.useCallback(callback, deps);
  },
  
  // Value memoization
  useMemo: (factory, deps) => {
    return React.useMemo(factory, deps);
  },
  
  // Ref optimization
  useRef: (initialValue) => {
    return React.useRef(initialValue);
  },
};

// Network optimization
export const networkOptimizer = {
  // Retry failed requests
  retry: async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  },
  
  // Cache API responses
  cache: new Map(),
  
  cachedFetch: async (url, options = {}) => {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    if (networkOptimizer.cache.has(cacheKey)) {
      return networkOptimizer.cache.get(cacheKey);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    networkOptimizer.cache.set(cacheKey, data);
    return data;
  },
  
  // Clear cache
  clearCache: () => {
    networkOptimizer.cache.clear();
  },
};

// Export all utilities
export default {
  debounce,
  throttle,
  memoize,
  createVirtualScroller,
  lazyLoad,
  lazyLoadImage,
  createIntersectionObserver,
  performanceMonitor,
  bundleOptimizer,
  memoryManager,
  reactOptimizations,
  networkOptimizer,
}; 