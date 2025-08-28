import React from "react";
import { cn } from "../../utils/cn";
import { designTokens } from "../../design-system";

const Avatar = React.forwardRef(({ 
  className, 
  size = "md",
  variant = "default",
  ...props 
}, ref) => {
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
    "2xl": "h-20 w-20",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[100]}`,
    primary: `bg-${designTokens.colors.primary[100]}`,
    secondary: `bg-${designTokens.colors.secondary[100]}`,
    success: `bg-${designTokens.colors.success[100]}`,
    warning: `bg-${designTokens.colors.warning[100]}`,
    error: `bg-${designTokens.colors.error[100]}`,
    accent: `bg-${designTokens.colors.accent[100]}`,
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef(({ 
  className, 
  variant = "default",
  size = "md",
  ...props 
}, ref) => {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
    "2xl": "text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[700]}`,
    primary: `bg-${designTokens.colors.primary[200]} text-${designTokens.colors.primary[700]}`,
    secondary: `bg-${designTokens.colors.secondary[200]} text-${designTokens.colors.secondary[700]}`,
    success: `bg-${designTokens.colors.success[200]} text-${designTokens.colors.success[700]}`,
    warning: `bg-${designTokens.colors.warning[200]} text-${designTokens.colors.warning[700]}`,
    error: `bg-${designTokens.colors.error[200]} text-${designTokens.colors.error[700]}`,
    accent: `bg-${designTokens.colors.accent[200]} text-${designTokens.colors.accent[700]}`,
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full font-medium",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };