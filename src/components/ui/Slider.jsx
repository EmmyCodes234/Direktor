import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const Slider = React.forwardRef(({
  className,
  min = 0,
  max = 100,
  step = 1,
  value = 50,
  defaultValue,
  onValueChange,
  disabled = false,
  size = "md",
  variant = "default",
  showValue = false,
  showMarks = false,
  marks = [],
  ...props
}, ref) => {
  const [currentValue, setCurrentValue] = useState(defaultValue || value);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const thumbRef = useRef(null);

  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
    xl: "h-5",
  };

  const thumbSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.primary[500]}`,
    primary: `bg-${designTokens.colors.primary[500]}`,
    secondary: `bg-${designTokens.colors.secondary[500]}`,
    success: `bg-${designTokens.colors.success[500]}`,
    warning: `bg-${designTokens.colors.warning[500]}`,
    error: `bg-${designTokens.colors.error[500]}`,
    accent: `bg-${designTokens.colors.accent[500]}`,
  };

  const trackVariantClasses = {
    default: `bg-${designTokens.colors.neutral[200]}`,
    primary: `bg-${designTokens.colors.primary[200]}`,
    secondary: `bg-${designTokens.colors.secondary[200]}`,
    success: `bg-${designTokens.colors.success[200]}`,
    warning: `bg-${designTokens.colors.warning[200]}`,
    error: `bg-${designTokens.colors.error[200]}`,
    accent: `bg-${designTokens.colors.accent[200]}`,
  };

  const percentage = ((currentValue - min) / (max - min)) * 100;

  const handleSliderClick = (event) => {
    if (disabled) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    const newValue = Math.round((percentage / 100) * (max - min) + min);
    const steppedValue = Math.round(newValue / step) * step;
    
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    setCurrentValue(clampedValue);
    onValueChange?.(clampedValue);
  };

  const handleThumbDrag = (event, info) => {
    if (disabled) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const dragX = info.point.x - rect.left;
    const percentage = (dragX / rect.width) * 100;
    const newValue = Math.round((percentage / 100) * (max - min) + min);
    const steppedValue = Math.round(newValue / step) * step;
    
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    setCurrentValue(clampedValue);
    onValueChange?.(clampedValue);
  };

  const handleThumbDragStart = () => {
    setIsDragging(true);
  };

  const handleThumbDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (value !== undefined && value !== currentValue) {
      setCurrentValue(value);
    }
  }, [value]);

  return (
    <div className={cn("w-full", className)} {...props}>
      {showValue && (
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{min}</span>
          <span className="font-medium">{currentValue}</span>
          <span>{max}</span>
        </div>
      )}
      
      <div className="relative">
        {/* Track */}
        <div
          ref={sliderRef}
          className={cn(
            "relative w-full rounded-full cursor-pointer",
            sizeClasses[size],
            trackVariantClasses[variant],
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleSliderClick}
        >
          {/* Progress */}
          <motion.div
            className={cn(
              "absolute top-0 left-0 h-full rounded-full",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
            transition={{ duration: isDragging ? 0 : 0.2 }}
          />
        </div>

        {/* Thumb */}
        <motion.div
          ref={thumbRef}
          drag="x"
          dragConstraints={sliderRef}
          dragElastic={0}
          dragMomentum={false}
          onDrag={handleThumbDrag}
          onDragStart={handleThumbDragStart}
          onDragEnd={handleThumbDragEnd}
          className={cn(
            "absolute top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing",
            thumbSizeClasses[size],
            disabled && "cursor-not-allowed"
          )}
          style={{ left: `${percentage}%` }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div
            className={cn(
              "w-full h-full rounded-full bg-white border-2 shadow-lg",
              `border-${designTokens.colors.neutral[300]}`,
              disabled && "opacity-50"
            )}
          />
        </motion.div>

        {/* Marks */}
        {showMarks && marks.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 flex justify-between">
            {marks.map((mark, index) => (
              <div
                key={index}
                className="flex flex-col items-center space-y-1"
              >
                <div
                  className={cn(
                    "w-1 rounded-full",
                    size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3",
                    mark.value <= currentValue 
                      ? variantClasses[variant]
                      : `bg-${designTokens.colors.neutral[300]}`
                  )}
                />
                {mark.label && (
                  <span className="text-xs text-muted-foreground">
                    {mark.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

Slider.displayName = "Slider";

export default Slider;
