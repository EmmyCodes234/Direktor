import React from "react";
import { cn } from "../../utils/cn";
import { cardVariants } from "../../design-system";

const Card = React.forwardRef(({ className, variant = "default", padding = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      cardVariants({ variant, padding }),
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, padding = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      padding === "none" && "p-0",
      padding === "sm" && "p-4",
      padding === "default" && "p-6",
      padding === "lg" && "p-8",
      padding === "xl" && "p-10",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, padding = "default", ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      padding === "none" && "p-0",
      padding === "sm" && "p-4",
      padding === "default" && "p-6 pt-0",
      padding === "lg" && "p-8 pt-0",
      padding === "xl" && "p-10 pt-0",
      className
    )} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, padding = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center",
      padding === "none" && "p-0",
      padding === "sm" && "p-4",
      padding === "default" && "p-6 pt-0",
      padding === "lg" && "p-8 pt-0",
      padding === "xl" && "p-10 pt-0",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };