import React from 'react';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const alertVariants = {
  default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[900]}`,
  destructive: `bg-${designTokens.colors.error[50]} border-${designTokens.colors.error[200]} text-${designTokens.colors.error[900]}`,
  success: `bg-${designTokens.colors.success[50]} border-${designTokens.colors.success[200]} text-${designTokens.colors.success[900]}`,
  warning: `bg-${designTokens.colors.warning[50]} border-${designTokens.colors.warning[200]} text-${designTokens.colors.warning[900]}`,
  info: `bg-${designTokens.colors.accent[50]} border-${designTokens.colors.accent[200]} text-${designTokens.colors.accent[900]}`,
  primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]} text-${designTokens.colors.primary[900]}`,
};

const Alert = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "md",
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: "p-3 text-sm",
    md: "p-4 text-base",
    lg: "p-6 text-lg",
  };

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
        alertVariants[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };