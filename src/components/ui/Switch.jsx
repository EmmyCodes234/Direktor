import React from 'react';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const Switch = React.forwardRef(({
  className,
  checked = false,
  disabled = false,
  size = "md",
  variant = "default",
  onCheckedChange,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "w-8 h-4",
    md: "w-11 h-6",
    lg: "w-14 h-7",
    xl: "w-16 h-8",
  };

  const thumbSizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  };

  const variantClasses = {
    default: checked 
      ? `bg-${designTokens.colors.primary[500]} hover:bg-${designTokens.colors.primary[600]}` 
      : `bg-${designTokens.colors.neutral[300]} hover:bg-${designTokens.colors.neutral[400]}`,
    success: checked 
      ? `bg-${designTokens.colors.success[500]} hover:bg-${designTokens.colors.success[600]}` 
      : `bg-${designTokens.colors.neutral[300]} hover:bg-${designTokens.colors.neutral[400]}`,
    warning: checked 
      ? `bg-${designTokens.colors.warning[500]} hover:bg-${designTokens.colors.warning[600]}` 
      : `bg-${designTokens.colors.neutral[300]} hover:bg-${designTokens.colors.neutral[400]}`,
    error: checked 
      ? `bg-${designTokens.colors.error[500]} hover:bg-${designTokens.colors.error[600]}` 
      : `bg-${designTokens.colors.neutral[300]} hover:bg-${designTokens.colors.neutral[400]}`,
    secondary: checked 
      ? `bg-${designTokens.colors.secondary[500]} hover:bg-${designTokens.colors.secondary[600]}` 
      : `bg-${designTokens.colors.neutral[300]} hover:bg-${designTokens.colors.neutral[400]}`,
  };

  const handleToggle = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[size],
        variantClasses[variant],
        checked && "focus-visible:ring-primary/50",
        !checked && "focus-visible:ring-neutral/50",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          thumbSizeClasses[size],
          checked 
            ? size === "sm" ? "translate-x-4" : size === "lg" ? "translate-x-7" : size === "xl" ? "translate-x-8" : "translate-x-5"
            : "translate-x-0"
        )}
      />
    </button>
  );
});

Switch.displayName = "Switch";

// Switch Group Component
const SwitchGroup = React.forwardRef(({
  className,
  children,
  label,
  description,
  error,
  required = false,
  disabled = false,
  ...props
}, ref) => {
  return (
    <fieldset
      ref={ref}
      disabled={disabled}
      className={cn("space-y-3", className)}
      {...props}
    >
      {label && (
        <legend className={cn(
          "text-sm font-medium",
          error ? `text-${designTokens.colors.error[500]}` : "text-foreground"
        )}>
          {label}
          {required && <span className={`text-${designTokens.colors.error[500]} ml-1`}>*</span>}
        </legend>
      )}

      {description && !error && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      <div className="space-y-2">
        {children}
      </div>

      {error && (
        <p className={`text-sm text-${designTokens.colors.error[500]}`}>
          {error}
        </p>
      )}
    </fieldset>
  );
});

SwitchGroup.displayName = "SwitchGroup";

export { Switch, SwitchGroup };
export default Switch;
