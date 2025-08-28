import React from 'react';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const RadioGroup = React.forwardRef(({
  className,
  value,
  onValueChange,
  disabled = false,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      role="radiogroup"
      className={cn("space-y-2", className)}
      {...props}
    />
  );
});

RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef(({
  className,
  value,
  id,
  disabled = false,
  size = "md",
  variant = "default",
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-7 w-7",
  };

  const variantClasses = {
    default: `border-${designTokens.colors.neutral[300]} text-${designTokens.colors.primary[500]}`,
    primary: `border-${designTokens.colors.primary[300]} text-${designTokens.colors.primary[500]}`,
    secondary: `border-${designTokens.colors.secondary[300]} text-${designTokens.colors.secondary[500]}`,
    success: `border-${designTokens.colors.success[300]} text-${designTokens.colors.success[500]}`,
    warning: `border-${designTokens.colors.warning[300]} text-${designTokens.colors.warning[500]}`,
    error: `border-${designTokens.colors.error[300]} text-${designTokens.colors.error[500]}`,
  };

  return (
    <input
      ref={ref}
      type="radio"
      id={id}
      value={value}
      disabled={disabled}
      className={cn(
        "rounded-full border-2 transition-colors focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[size],
        variantClasses[variant],
        `focus:ring-${designTokens.colors.primary[500]}/50 focus:ring-offset-${designTokens.colors.neutral[50]}`,
        className
      )}
      {...props}
    />
  );
});

RadioGroupItem.displayName = "RadioGroupItem";

const RadioGroupIndicator = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center w-full h-full rounded-full bg-current",
        className
      )}
      {...props}
    >
      <div className="w-1/2 h-1/2 rounded-full bg-white" />
    </div>
  );
});

RadioGroupIndicator.displayName = "RadioGroupIndicator";

// Radio Group with Label Component
const RadioGroupWithLabel = React.forwardRef(({
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

RadioGroupWithLabel.displayName = "RadioGroupWithLabel";

export { RadioGroup, RadioGroupItem, RadioGroupIndicator, RadioGroupWithLabel };
export default RadioGroup;
