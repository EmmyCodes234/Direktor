import React from "react";
import { cn } from "../../utils/cn";
import Icon from "../AppIcon";

const Input = React.forwardRef(({
    className,
    type = "text",
    label,
    description,
    error,
    required = false,
    id,
    leftIcon,
    rightIcon,
    onRightIconClick,
    loading = false,
    success = false,
    ...props
}, ref) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Enhanced base input classes with better focus states
    const baseInputClasses = cn(
        "flex h-11 w-full rounded-lg border bg-background px-4 py-2 text-sm transition-all duration-200",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/10",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Enhanced border states
        error ? "border-destructive focus-visible:ring-destructive/50" :
        success ? "border-success focus-visible:ring-success/50" :
        "border-border/40 hover:border-border/60 focus-visible:border-primary"
    );

    // Checkbox-specific styles with better accessibility
    if (type === "checkbox") {
        return (
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    className={cn(
                        "h-4 w-4 rounded border-2 border-border/40 bg-background text-primary transition-colors",
                        "focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "checked:bg-primary checked:border-primary",
                        className
                    )}
                    ref={ref}
                    id={inputId}
                    {...props}
                />
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium leading-none cursor-pointer select-none"
                    >
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}
            </div>
        );
    }

    // Radio button-specific styles
    if (type === "radio") {
        return (
            <div className="flex items-center space-x-2">
                <input
                    type="radio"
                    className={cn(
                        "h-4 w-4 rounded-full border-2 border-border/40 bg-background text-primary transition-colors",
                        "focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    ref={ref}
                    id={inputId}
                    {...props}
                />
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium leading-none cursor-pointer select-none"
                    >
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}
            </div>
        );
    }

    // Loading spinner for input
    const LoadingSpinner = () => (
        <svg className="animate-spin h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );

    // For regular inputs with enhanced wrapper structure
    return (
        <div className="space-y-2">
            {label && (
                <label
                    htmlFor={inputId}
                    className={cn(
                        "text-sm font-medium leading-none select-none",
                        error ? "text-destructive" : "text-foreground",
                        props.disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {label}
                    {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
                </label>
            )}

            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Icon name={leftIcon} size={16} />
                    </div>
                )}
                
                <input
                    type={type}
                    className={cn(
                        baseInputClasses,
                        leftIcon && "pl-10",
                        (rightIcon || loading || success) && "pr-10",
                        className
                    )}
                    ref={ref}
                    id={inputId}
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={
                        error ? `${inputId}-error` : 
                        description ? `${inputId}-description` : 
                        undefined
                    }
                    {...props}
                />

                {(rightIcon || loading || success) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {loading ? (
                            <LoadingSpinner />
                        ) : success ? (
                            <Icon name="Check" size={16} className="text-success" />
                        ) : rightIcon ? (
                            <button
                                type="button"
                                onClick={onRightIconClick}
                                className={cn(
                                    "text-muted-foreground hover:text-foreground transition-colors",
                                    onRightIconClick && "cursor-pointer"
                                )}
                                tabIndex={onRightIconClick ? 0 : -1}
                            >
                                <Icon name={rightIcon} size={16} />
                            </button>
                        ) : null}
                    </div>
                )}
            </div>

            {description && !error && (
                <p id={`${inputId}-description`} className="text-sm text-muted-foreground">
                    {description}
                </p>
            )}

            {error && (
                <p id={`${inputId}-error`} className="text-sm text-destructive flex items-center gap-1">
                    <Icon name="AlertCircle" size={14} />
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = "Input";

export default Input;