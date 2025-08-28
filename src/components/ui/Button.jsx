import React from 'react';
import { Slot } from "@radix-ui/react-slot";
import { buttonVariants } from "../../design-system";
import { cn } from "../../utils/cn";
import Icon from '../AppIcon';

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
    
    // Map old size names to new design system sizes
    const mapSize = (oldSize) => {
        if (!oldSize) return 'md';
        
        const sizeMap = {
            'xs': 'xs',
            'sm': 'sm', 
            'default': 'md',
            'lg': 'lg',
            'xl': 'xl',
            '2xl': '2xl',
            'icon': 'icon-md',
            'icon-sm': 'icon-sm',
            'icon-lg': 'icon-lg',
            'mobile-sm': 'sm',
            'mobile-default': 'md',
            'mobile-lg': 'lg',
            'mobile-xl': 'xl',
            'mobile-icon': 'icon-md',
            'mobile-icon-lg': 'icon-lg'
        };
        
        return sizeMap[oldSize] || 'md';
    };
    
    const mappedSize = mapSize(size);
    
    return (
        <Comp
            className={cn(
                buttonVariants({ variant, size: mappedSize }),
                loading && "opacity-70 cursor-not-allowed",
                className
            )}
            ref={ref}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <div 
                    className="mr-2 h-4 w-4 bg-muted rounded animate-pulse" 
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
export default Button;