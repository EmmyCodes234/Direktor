import React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "../../utils/cn";
import { designTokens } from "../../design-system";

const Checkbox = React.forwardRef(({
    className,
    id,
    checked,
    indeterminate = false,
    disabled = false,
    required = false,
    label,
    description,
    error,
    size = "md",
    onCheckedChange, // Destructure the onCheckedChange prop
    ...props
}, ref) => {
    // Generate unique ID if not provided
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    // Size variants using design tokens
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-4 w-4",
        lg: "h-5 w-5",
        xl: "h-6 w-6"
    };

    return (
        <div className={cn("flex items-start space-x-2", className)}>
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    ref={ref}
                    id={checkboxId}
                    checked={!!checked} // Ensure value is a boolean
                    disabled={disabled}
                    required={required}
                    className="sr-only"
                    // Use the onCheckedChange prop to handle the native onChange event
                    onChange={(e) => onCheckedChange?.(e.target.checked)}
                    {...props}
                />

                <label
                    htmlFor={checkboxId}
                    className={cn(
                        "peer shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground cursor-pointer transition-colors flex items-center justify-center",
                        // Use design tokens for colors
                        `border-${designTokens.colors.primary[500]}`,
                        `focus-visible:ring-${designTokens.colors.primary[500]}/50`,
                        `focus-visible:ring-offset-${designTokens.colors.neutral[50]}`,
                        sizeClasses[size],
                        checked && `bg-${designTokens.colors.primary[500]} text-white border-${designTokens.colors.primary[500]}`,
                        indeterminate && `bg-${designTokens.colors.primary[500]} text-white border-${designTokens.colors.primary[500]}`,
                        error && `border-${designTokens.colors.error[500]}`,
                        disabled && "cursor-not-allowed opacity-50"
                    )}
                >
                    {checked && !indeterminate && (
                        <Check className="h-3.5 w-3.5 text-current" />
                    )}
                    {indeterminate && (
                        <Minus className="h-3.5 w-3.5 text-current" />
                    )}
                </label>
            </div>

            {(label || description || error) && (
                <div className="flex-1 space-y-1">
                    {label && (
                        <label
                            htmlFor={checkboxId}
                            className={cn(
                                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                                error ? `text-${designTokens.colors.error[500]}` : "text-foreground"
                            )}
                        >
                            {label}
                            {required && <span className={`text-${designTokens.colors.error[500]} ml-1`}>*</span>}
                        </label>
                    )}

                    {description && !error && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}

                    {error && (
                        <p className={`text-sm text-${designTokens.colors.error[500]}`}>
                            {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
});

Checkbox.displayName = "Checkbox";

// Checkbox Group component
const CheckboxGroup = React.forwardRef(({
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

CheckboxGroup.displayName = "CheckboxGroup";

export { Checkbox, CheckboxGroup };
export default Checkbox;