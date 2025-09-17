import { useEffect, useRef, useState } from 'react';

const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 100,
    resistance = 2.5,
    enabled = true,
    triggerDistance = 80
  } = options;
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    
    const container = containerRef.current;
    let isScrolling = false;
    
    const handleTouchStart = (e) => {
      // Only trigger if at the top of the page
      if (container.scrollTop > 0) return;
      
      startY.current = e.touches[0].clientY;
      setIsPulling(false);
      isScrolling = false;
    };
    
    const handleTouchMove = (e) => {
      if (container.scrollTop > 0) return;
      
      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;
      
      // Only pull down
      if (deltaY > 0) {
        // Prevent default scroll behavior when pulling
        if (deltaY > 10) {
          e.preventDefault();
          isScrolling = true;
        }
        
        // Apply resistance
        const distance = Math.min(deltaY / resistance, threshold);
        setPullDistance(distance);
        setIsPulling(distance > 10);
      }
    };
    
    const handleTouchEnd = () => {
      if (pullDistance >= triggerDistance && !isRefreshing) {
        setIsRefreshing(true);
        onRefresh().finally(() => {
          setIsRefreshing(false);
        });
      }
      
      setPullDistance(0);
      setIsPulling(false);
      isScrolling = false;
    };
    
    // Add event listeners with passive: false to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onRefresh, pullDistance, threshold, triggerDistance, resistance, isRefreshing]);
  
  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isPulling,
    isTriggered: pullDistance >= triggerDistance
  };
};

export default usePullToRefresh;