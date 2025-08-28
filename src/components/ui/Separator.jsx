import React from "react";
import { cn } from "../../utils/cn";
import { designTokens } from "../../design-system";

const Separator = React.forwardRef(
  ({ 
    className, 
    orientation = "horizontal", 
    decorative = true,
    variant = "default",
    size = "md",
    ...props 
  }, ref) => {
    const variantClasses = {
      default: `bg-${designTokens.colors.neutral[200]}`,
      muted: `bg-${designTokens.colors.neutral[100]}`,
      primary: `bg-${designTokens.colors.primary[200]}`,
      secondary: `bg-${designTokens.colors.secondary[200]}`,
      accent: `bg-${designTokens.colors.accent[200]}`,
      strong: `bg-${designTokens.colors.neutral[300]}`,
    };

    const sizeClasses = {
      sm: orientation === "horizontal" ? "h-[0.5px]" : "w-[0.5px]",
      md: orientation === "horizontal" ? "h-[1px]" : "w-[1px]",
      lg: orientation === "horizontal" ? "h-[2px]" : "w-[2px]",
      xl: orientation === "horizontal" ? "h-[3px]" : "w-[3px]",
    };

    return (
      <div
        ref={ref}
        role={decorative ? "none" : "separator"}
        aria-orientation={orientation}
        className={cn(
          "shrink-0",
          variantClasses[variant],
          sizeClasses[size],
          orientation === "horizontal" ? "w-full" : "h-full",
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";

export { Separator };