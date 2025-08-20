import React from 'react';
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import Icon from '../AppIcon';

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none",
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
                xs: "h-8 px-3 text-xs min-w-[2rem]",
                sm: "h-9 px-4 text-sm min-w-[2.25rem]",
                default: "h-10 px-6 text-sm min-w-[2.5rem]",
                lg: "h-11 px-8 text-base min-w-[2.75rem]",
                xl: "h-12 px-10 text-base min-w-[3rem]",
                icon: "h-10 w-10 p-0",
                "icon-sm": "h-8 w-8 p-0",
                "icon-lg": "h-12 w-12 p-0",
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
    children,
    loading = false,
    iconName = null,
    iconPosition = 'left',
    iconSize = null,
    fullWidth = false,
    disabled = false,
    tooltip = null,
    'aria-label': ariaLabel,
    pressed = false,
    expanded = false,
    hasPopup = false,
    controls = null,
    describedBy = null,
    ...props
}, ref) => {
    const Comp = asChild ? Slot : "button";

    // Enhanced icon size mapping
    const iconSizeMap = {
        xs: 12,
        sm: 14,
        default: 16,
        lg: 18,
        xl: 20,
        icon: 16,
        "icon-sm": 14,
        "icon-lg": 20,
    };

    const calculatedIconSize = iconSize || iconSizeMap[size] || 16;

    // Enhanced loading spinner with better animation
    const LoadingSpinner = () => (
        <svg 
            className="animate-spin h-4 w-4 mr-2" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
            />
            <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
        </svg>
    );

    // Enhanced icon rendering with better spacing
    const renderIcon = () => {
        if (!iconName) return null;

        const iconSpacing = children ? (iconPosition === 'left' ? "mr-2" : "ml-2") : "";
        
        return (
            <Icon
                name={iconName}
                size={calculatedIconSize}
                className={cn(iconSpacing, "flex-shrink-0")}
                aria-hidden="true"
            />
        );
    };

    // Determine if this is an icon-only button for accessibility
    const isIconOnly = iconName && !children;
    const buttonAriaLabel = ariaLabel || (isIconOnly ? iconName : undefined);

    return (
        <Comp
            className={cn(
                buttonVariants({ variant, size }),
                fullWidth && "w-full",
                loading && "cursor-wait",
                className
            )}
            ref={ref}
            disabled={disabled || loading}
            aria-label={buttonAriaLabel}
            aria-pressed={pressed}
            aria-expanded={expanded}
            aria-haspopup={hasPopup}
            aria-controls={controls}
            aria-describedby={describedBy}
            title={tooltip}
            type={props.type || "button"}
            {...props}
        >
            {loading && <LoadingSpinner />}
            {!loading && iconName && iconPosition === 'left' && renderIcon()}
            {children && (
                <span className={cn(loading && "opacity-0")}>
                    {children}
                </span>
            )}
            {!loading && iconName && iconPosition === 'right' && renderIcon()}
        </Comp>
    );
});

Button.displayName = "Button";

export default Button;