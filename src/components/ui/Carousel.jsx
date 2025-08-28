import React, { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Carousel = forwardRef(({
  className,
  children,
  items = [],
  autoPlay = false,
  autoPlayInterval = 5000,
  showArrows = true,
  showDots = true,
  showIndicators = true,
  loop = true,
  startIndex = 0,
  onSlideChange,
  variant = "default",
  size = "md",
  ...props
}, ref) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [isDragging, setIsDragging] = useState(false);
  const autoPlayRef = useRef(null);
  const containerRef = useRef(null);

  const totalItems = items.length || React.Children.count(children);

  useEffect(() => {
    if (autoPlay && isAutoPlaying && totalItems > 1) {
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, autoPlayInterval);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, isAutoPlaying, autoPlayInterval, totalItems]);

  useEffect(() => {
    onSlideChange?.(currentIndex);
  }, [currentIndex, onSlideChange]);

  const goToSlide = useCallback((index) => {
    if (index < 0) {
      if (loop) {
        setCurrentIndex(totalItems - 1);
      } else {
        setCurrentIndex(0);
      }
    } else if (index >= totalItems) {
      if (loop) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(totalItems - 1);
      }
    } else {
      setCurrentIndex(index);
    }
  }, [totalItems, loop]);

  const goToNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const goToPrevious = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const swipeThreshold = 50;
    
    if (info.offset.x > swipeThreshold) {
      goToPrevious();
    } else if (info.offset.x < -swipeThreshold) {
      goToNext();
    }
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  const handleArrowClick = (direction) => {
    if (direction === 'next') {
      goToNext();
    } else {
      goToPrevious();
    }
  };

  const pauseAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const resumeAutoPlay = () => {
    if (autoPlay && isAutoPlaying && totalItems > 1) {
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, autoPlayInterval);
    }
  };

  const sizeClasses = {
    sm: "h-48",
    md: "h-64",
    lg: "h-80",
    xl: "h-96",
    full: "h-full",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]}`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]}`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]}`,
  };

  if (totalItems === 0) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-lg border",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
      onTouchStart={pauseAutoPlay}
      onTouchEnd={resumeAutoPlay}
      {...props}
    >
      {/* Carousel Container */}
      <motion.div
        ref={containerRef}
        className="relative w-full h-full"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        dragElastic={0.1}
        whileDrag={{ cursor: "grabbing" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {items[currentIndex] || React.Children.toArray(children)[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Navigation Arrows */}
      {showArrows && totalItems > 1 && (
        <>
          <button
            onClick={() => handleArrowClick('previous')}
            className={cn(
              "absolute left-2 top-1/2 transform -translate-y-1/2 z-10",
              "flex items-center justify-center w-10 h-10 rounded-full",
              "bg-white/80 hover:bg-white text-gray-800 hover:text-gray-900",
              "shadow-lg transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
            aria-label="Previous slide"
          >
            <Icon name="ChevronLeft" size={20} />
          </button>
          
          <button
            onClick={() => handleArrowClick('next')}
            className={cn(
              "absolute right-2 top-1/2 transform -translate-y-1/2 z-10",
              "flex items-center justify-center w-10 h-10 rounded-full",
              "bg-white/80 hover:bg-white text-gray-800 hover:text-gray-900",
              "shadow-lg transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
            aria-label="Next slide"
          >
            <Icon name="ChevronRight" size={20} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && totalItems > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
          {Array.from({ length: totalItems }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? `bg-${designTokens.colors.primary[500]}`
                  : `bg-${designTokens.colors.neutral[300]} hover:bg-${designTokens.colors.neutral[400]}`
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {showIndicators && totalItems > 1 && (
        <div className={cn(
          "absolute top-4 right-4 z-10 px-2 py-1 rounded-md text-xs font-medium",
          `bg-${designTokens.colors.neutral[800]/80} text-white`
        )}>
          {currentIndex + 1} / {totalItems}
        </div>
      )}

      {/* Auto-play Controls */}
      {autoPlay && totalItems > 1 && (
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={cn(
            "absolute top-4 left-4 z-10 px-2 py-1 rounded-md text-xs font-medium",
            `bg-${designTokens.colors.neutral[800]/80} text-white hover:bg-${designTokens.colors.neutral[700]/80}`,
            "transition-colors duration-200"
          )}
          aria-label={isAutoPlaying ? "Pause auto-play" : "Resume auto-play"}
        >
          <Icon 
            name={isAutoPlaying ? "Pause" : "Play"} 
            size={12} 
            className="inline mr-1" 
          />
          {isAutoPlaying ? "Pause" : "Play"}
        </button>
      )}
    </div>
  );
});

const CarouselItem = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full h-full flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const CarouselImage = forwardRef(({
  className,
  src,
  alt,
  objectFit = "cover",
  ...props
}, ref) => {
  const objectFitClasses = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
    scaleDown: "object-scale-down",
  };

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={cn(
        "w-full h-full",
        objectFitClasses[objectFit],
        className
      )}
      {...props}
    />
  );
});

const CarouselContent = forwardRef(({
  className,
  children,
  overlay = false,
  overlayOpacity = 0.7,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-full flex items-center justify-center",
        overlay && `bg-${designTokens.colors.neutral[900]/overlayOpacity}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const CarouselCaption = forwardRef(({
  className,
  title,
  description,
  position = "bottom",
  ...props
}, ref) => {
  const positionClasses = {
    top: "top-0 left-0 right-0 p-4",
    bottom: "bottom-0 left-0 right-0 p-4",
    center: "inset-0 flex items-center justify-center p-4",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-10 text-white",
        positionClasses[position],
        className
      )}
      {...props}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm opacity-90">{description}</p>
      )}
    </div>
  );
});

const useCarousel = (initialIndex = 0, totalItems = 0) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToSlide = useCallback((index) => {
    if (index >= 0 && index < totalItems) {
      setCurrentIndex(index);
    }
  }, [totalItems]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  return {
    currentIndex,
    goToSlide,
    goToNext,
    goToPrevious,
  };
};

Carousel.displayName = "Carousel";
CarouselItem.displayName = "CarouselItem";
CarouselImage.displayName = "CarouselImage";
CarouselContent.displayName = "CarouselContent";
CarouselCaption.displayName = "CarouselCaption";

export {
  Carousel,
  CarouselItem,
  CarouselImage,
  CarouselContent,
  CarouselCaption,
  useCarousel,
};
export default Carousel;
