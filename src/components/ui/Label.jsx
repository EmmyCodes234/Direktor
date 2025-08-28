import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const Label = forwardRef(({
  className,
  children,
  htmlFor,
  required = false,
  size = "md",
  variant = "default",
  disabled = false,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[700]}`,
    primary: `text-${designTokens.colors.primary[700]}`,
    secondary: `text-${designTokens.colors.secondary[700]}`,
    muted: `text-${designTokens.colors.neutral[600]}`,
    error: `text-${designTokens.colors.error[600]}`,
    success: `text-${designTokens.colors.success[600]}`,
    warning: `text-${designTokens.colors.warning[600]}`,
    info: `text-${designTokens.colors.info[600]}`,
  };

  const disabledClasses = `opacity-50 cursor-not-allowed text-${designTokens.colors.neutral[400]}`;

  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={cn(
        "block font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        sizeClasses[size],
        disabled ? disabledClasses : variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className={cn(
          "ml-1",
          `text-${designTokens.colors.error[500]}`
        )}>
          *
        </span>
      )}
    </label>
  );
});

const LabelGroup = forwardRef(({
  className,
  children,
  label,
  description,
  error,
  required = false,
  size = "md",
  variant = "default",
  disabled = false,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[700]}`,
    primary: `text-${designTokens.colors.primary[700]}`,
    secondary: `text-${designTokens.colors.secondary[700]}`,
    muted: `text-${designTokens.colors.neutral[600]}`,
  };

  const errorClasses = `text-${designTokens.colors.error[600]}`;

  return (
    <div
      ref={ref}
      className={cn("space-y-2", className)}
      {...props}
    >
      {label && (
        <Label
          size={size}
          variant={variant}
          required={required}
          disabled={disabled}
        >
          {label}
        </Label>
      )}
      
      {children}
      
      {description && !error && (
        <p className={cn(
          "text-sm",
          `text-${designTokens.colors.neutral[500]}`
        )}>
          {description}
        </p>
      )}
      
      {error && (
        <p className={cn(
          "text-sm",
          `text-${designTokens.colors.error[600]}`
        )}>
          {error}
        </p>
      )}
    </div>
  );
});

const LabelWithDescription = forwardRef(({
  className,
  children,
  description,
  size = "md",
  variant = "default",
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[500]}`,
    primary: `text-${designTokens.colors.primary[500]}`,
    secondary: `text-${designTokens.colors.secondary[500]}`,
    muted: `text-${designTokens.colors.neutral[400]}`,
  };

  return (
    <div
      ref={ref}
      className={cn("space-y-1", className)}
      {...props}
    >
      {children}
      
      {description && (
        <p className={cn(
          sizeClasses[size],
          variantClasses[variant]
        )}>
          {description}
        </p>
      )}
    </div>
  );
});

const LabelRequired = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "ml-1 font-medium",
        `text-${designTokens.colors.error[500]}`,
        className
      )}
      {...props}
    >
      {children || "*"}
    </span>
  );
});

const LabelOptional = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "ml-1 text-sm font-normal",
        `text-${designTokens.colors.neutral[500]}`,
        className
      )}
      {...props}
    >
      {children || "(optional)"}
    </span>
  );
});

Label.displayName = "Label";
LabelGroup.displayName = "LabelGroup";
LabelWithDescription.displayName = "LabelWithDescription";
LabelRequired.displayName = "LabelRequired";
LabelOptional.displayName = "LabelOptional";

export {
  Label,
  LabelGroup,
  LabelWithDescription,
  LabelRequired,
  LabelOptional,
};
export default Label;
