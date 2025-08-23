import React from 'react';
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import Icon from '../AppIcon';

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none mobile-tap-highlight touch-manipulation",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow rounded-lg shadow-sm",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg shadow-sm",
                outline: "border border-border/40 bg-background hover:bg-muted/10 hover:border-border/60 rounded-lg",
                secondary: "bg-muted/20 text-foreground hover:bg-muted/30 rounded-lg shadow-sm",
                ghost: "hover:bg-muted/10 hover:text-foreground rounded-lg",
                link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 rounded-sm",
                success: "bg-success text-success-foreground hover:bg-success/90 rounded-lg shadow-sm",
                warning: "bg-warning text-warning-foreground hover:bg-warning/90 rounded-lg shadow-sm",
                danger: "bg-error text-error-foreground hover:bg-error/90 rounded-lg shadow-sm",
                glass: "glass-card hover:bg-card/95 hover:shadow-glow border-border/30",
            },
            size: {
                xs: "h-8 px-2 text-xs min-w-[2rem] touch-target",
                sm: "h-10 px-3 text-sm min-w-[2.5rem] touch-target",
                default: "h-12 px-4 text-sm min-w-[3rem] touch-target",
                lg: "h-14 px-6 text-base min-w-[3.5rem] touch-target-lg",
                xl: "h-16 px-8 text-base min-w-[4rem] touch-target-lg",
                icon: "h-12 w-12 p-0 touch-target",
                "icon-sm": "h-10 w-10 p-0 touch-target",
                "icon-lg": "h-16 w-16 p-0 touch-target-lg",
                // Mobile-specific sizes
                "mobile-sm": "h-10 px-3 text-sm min-w-[2.5rem] touch-target sm:h-8 sm:px-2 sm:text-xs",
                "mobile-default": "h-12 px-4 text-sm min-w-[3rem] touch-target sm:h-10 sm:px-3",
                "mobile-lg": "h-14 px-6 text-base min-w-[3.5rem] touch-target-lg sm:h-12 sm:px-4 sm:text-sm",
                "mobile-xl": "h-16 px-8 text-base min-w-[4rem] touch-target-lg sm:h-14 sm:px-6",
                "mobile-icon": "h-12 w-12 p-0 touch-target sm:h-10 sm:w-10",
                "mobile-icon-lg": "h-16 w-16 p-0 touch-target-lg sm:h-12 sm:w-12",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const Button = React.forwardRef(({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    iconName, 
    iconPosition = "left", 
    iconSize = 16,
    loading = false,
    disabled,
    children,
    ...props 
}, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Determine if we should use mobile-specific size
    const isMobileSize = size && size.startsWith('mobile-');
    const actualSize = isMobileSize ? size : size;
    
    return (
        <Comp
            className={cn(
                buttonVariants({ variant, size: actualSize }),
                loading && "opacity-70 cursor-not-allowed",
                className
            )}
            ref={ref}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <Icon 
                    name="Loader2" 
                    size={iconSize} 
                    className="mr-2 animate-spin" 
                />
            )}
            
            {!loading && iconName && iconPosition === "left" && (
                <Icon 
                    name={iconName} 
                    size={iconSize} 
                    className="mr-2" 
                />
            )}
            
            {children}
            
            {!loading && iconName && iconPosition === "right" && (
                <Icon 
                    name={iconName} 
                    size={iconSize} 
                    className="ml-2" 
                />
            )}
        </Comp>
    );
});

Button.displayName = "Button";

export { Button, buttonVariants };