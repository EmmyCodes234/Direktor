import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import Icon from '../AppIcon';

const Input = forwardRef(({
  className,
  type = "text",
  size = "default",
  icon,
  iconPosition = "left",
  leftIcon,
  rightIcon,
  onRightIconClick,
  error,
  disabled,
  loading = false,
  fullWidth = true,
  label,
  helperText,
  required,
  ...props
}, ref) => {
  const inputClasses = cn(
    "flex w-full rounded-lg border border-border/40 bg-background text-foreground transition-colors",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "mobile-tap-highlight",
    // Size variants
    size === "sm" && "h-9 px-3 text-sm",
    size === "default" && "h-12 px-4 text-base",
    size === "lg" && "h-14 px-6 text-lg",
    // Mobile-specific sizes
    size === "mobile-sm" && "h-10 px-3 text-sm sm:h-9 sm:px-3 sm:text-sm",
    size === "mobile-default" && "h-12 px-4 text-base sm:h-10 sm:px-3 sm:text-sm",
    size === "mobile-lg" && "h-14 px-6 text-lg sm:h-12 sm:px-4 sm:text-base",
      // Icon positioning
  (icon || leftIcon) && (iconPosition === "left" || leftIcon) && "pl-10",
  icon && iconPosition === "right" && "pr-10",
  // Right icon positioning
  rightIcon && "pr-10",
    // Error state
    error && "border-destructive focus-visible:ring-destructive/50",
    // Full width
    fullWidth && "w-full",
    className
  );

  const containerClasses = cn(
    "relative",
    fullWidth && "w-full"
  );

  const iconClasses = cn(
    "absolute top-1/2 transform -translate-y-1/2 text-muted-foreground",
    iconPosition === "left" ? "left-3" : "right-3",
    size === "sm" && "h-4 w-4",
    size === "default" && "h-5 w-5",
    size === "lg" && "h-6 w-6",
    size === "mobile-sm" && "h-4 w-4 sm:h-4 sm:w-4",
    size === "mobile-default" && "h-5 w-5 sm:h-4 sm:w-4",
    size === "mobile-lg" && "h-6 w-6 sm:h-5 sm:w-5"
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {(icon && iconPosition === "left") || leftIcon ? (
          <Icon name={leftIcon || icon} className={iconClasses} />
        ) : null}
        
        <input
          type={type}
          className={inputClasses}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        />
        
        {icon && iconPosition === "right" && (
          <Icon name={icon} className={iconClasses} />
        )}
        
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
              "right-3",
              size === "sm" && "h-4 w-4",
              size === "default" && "h-5 w-5",
              size === "lg" && "h-6 w-6",
              size === "mobile-sm" && "h-4 w-4 sm:h-4 sm:w-4",
              size === "mobile-default" && "h-5 w-5 sm:h-4 sm:w-4",
              size === "mobile-lg" && "h-6 w-6 sm:h-5 sm:w-5"
            )}
          >
            <Icon name={rightIcon} className="h-full w-full" />
          </button>
        )}
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Icon name="Loader2" className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-destructive flex items-center space-x-1">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;