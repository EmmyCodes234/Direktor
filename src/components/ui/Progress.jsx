import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const Progress = React.forwardRef(({ 
  className, 
  value = 0, 
  max = 100,
  variant = "default",
  size = "md",
  showLabel = false,
  animated = true,
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variantClasses = {
    default: `bg-${designTokens.colors.primary[500]}`,
    success: `bg-${designTokens.colors.success[500]}`,
    warning: `bg-${designTokens.colors.warning[500]}`,
    error: `bg-${designTokens.colors.error[500]}`,
    info: `bg-${designTokens.colors.accent[500]}`,
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
    xl: "h-4",
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div
        ref={ref}
        className={cn(
          "w-full bg-muted rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        {animated ? (
          <motion.div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              variantClasses[variant]
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ) : (
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
});

Progress.displayName = "Progress";

export default Progress;
