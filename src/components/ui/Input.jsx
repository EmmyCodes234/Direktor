import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { inputVariants } from '../../design-system';
import Icon from '../AppIcon';

const Input = forwardRef(({
  className,
  type = "text",
  size = "md",
  variant = "default",
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
  // Map old size names to new design system sizes
  const mapSize = (oldSize) => {
    if (!oldSize) return 'md';
    
    const sizeMap = {
      'sm': 'sm',
      'default': 'md', 
      'lg': 'lg',
      'xl': 'xl',
      'mobile-sm': 'sm',
      'mobile-default': 'md',
      'mobile-lg': 'lg'
    };
    
    return sizeMap[oldSize] || 'md';
  };

  // Map old variant names to new design system variants
  const mapVariant = (oldVariant) => {
    if (!oldVariant) return 'default';
    
    const variantMap = {
      'default': 'default',
      'error': 'error',
      'success': 'success',
      'warning': 'warning'
    };
    
    return variantMap[oldVariant] || 'default';
  };

  const mappedSize = mapSize(size);
  const mappedVariant = error ? 'error' : mapVariant(variant);

  const inputClasses = cn(
    inputVariants({ size: mappedSize, variant: mappedVariant }),
    // Icon positioning
    (icon || leftIcon) && (iconPosition === "left" || leftIcon) && "pl-10",
    icon && iconPosition === "right" && "pr-10",
    // Right icon positioning
    rightIcon && "pr-10",
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
    mappedSize === "sm" && "h-4 w-4",
    mappedSize === "md" && "h-5 w-5",
    mappedSize === "lg" && "h-6 w-6",
    mappedSize === "xl" && "h-6 w-6"
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
              mappedSize === "sm" && "h-4 w-4",
              mappedSize === "md" && "h-5 w-5",
              mappedSize === "lg" && "h-6 w-6",
              mappedSize === "xl" && "h-6 w-6"
            )}
          >
            <Icon name={rightIcon} className="h-full w-full" />
          </button>
        )}
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
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