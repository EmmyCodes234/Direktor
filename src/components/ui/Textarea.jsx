import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const Textarea = forwardRef(({
  className,
  size = "md",
  variant = "default",
  error,
  disabled = false,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "h-20 px-3 py-2 text-sm",
    md: "h-24 px-4 py-3 text-base",
    lg: "h-32 px-5 py-4 text-lg",
    xl: "h-40 px-6 py-5 text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[900]} placeholder:text-${designTokens.colors.neutral[500]} focus:border-${designTokens.colors.primary[500]} focus:ring-${designTokens.colors.primary[500]}/20`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]} text-${designTokens.colors.primary[900]} placeholder:text-${designTokens.colors.primary[500]} focus:border-${designTokens.colors.primary[600]} focus:ring-${designTokens.colors.primary[600]}/20`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]} text-${designTokens.colors.secondary[900]} placeholder:text-${designTokens.colors.secondary[500]} focus:border-${designTokens.colors.secondary[600]} focus:ring-${designTokens.colors.secondary[600]}/20`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]} text-${designTokens.colors.neutral[800]} placeholder:text-${designTokens.colors.neutral[400]} focus:border-${designTokens.colors.neutral[500]} focus:ring-${designTokens.colors.neutral[500]}/20`,
  };

  const errorClasses = `border-${designTokens.colors.error[500]} text-${designTokens.colors.error[900]} placeholder:text-${designTokens.colors.error[400]} focus:border-${designTokens.colors.error[600]} focus:ring-${designTokens.colors.error[600]}/20`;

  const disabledClasses = `opacity-50 cursor-not-allowed bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[500]}`;

  return (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full resize-none rounded-md border bg-transparent font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed",
        sizeClasses[size],
        error ? errorClasses : variantClasses[variant],
        disabled && disabledClasses,
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
});

const TextareaGroup = forwardRef(({
  className,
  children,
  label,
  description,
  error,
  required = false,
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
        <label className={cn(
          "block font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          sizeClasses[size],
          error ? errorClasses : variantClasses[variant]
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
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

const TextareaWithLabel = forwardRef(({
  className,
  label,
  description,
  error,
  required = false,
  size = "md",
  variant = "default",
  disabled = false,
  ...props
}, ref) => {
  return (
    <TextareaGroup
      ref={ref}
      label={label}
      description={description}
      error={error}
      required={required}
      size={size}
      variant={variant}
      className={className}
    >
      <Textarea
        size={size}
        variant={variant}
        error={error}
        disabled={disabled}
        {...props}
      />
    </TextareaGroup>
  );
});

Textarea.displayName = "Textarea";
TextareaGroup.displayName = "TextareaGroup";
TextareaWithLabel.displayName = "TextareaWithLabel";

export { Textarea, TextareaGroup, TextareaWithLabel };
export default Textarea;
