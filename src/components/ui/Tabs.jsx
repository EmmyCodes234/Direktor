import React, { forwardRef, useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const TabsContext = createContext({
  value: '',
  onValueChange: () => {},
  size: 'md',
  variant: 'default',
});

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
};

const Tabs = forwardRef(({
  className,
  value,
  defaultValue,
  onValueChange,
  children,
  size = "md",
  variant = "default",
  orientation = "horizontal",
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const contextValue = {
    value: currentValue,
    onValueChange: handleValueChange,
    size,
    variant,
    orientation,
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]}`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]}`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]}`,
  };

  const orientationClasses = {
    horizontal: "flex-col",
    vertical: "flex-row",
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={cn(
          "w-full",
          sizeClasses[size],
          variantClasses[variant],
          orientationClasses[orientation],
          className
        )}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

const TabsList = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  const { orientation } = useTabsContext();

  const orientationClasses = {
    horizontal: "flex h-10 items-center justify-center rounded-md bg-muted p-1",
    vertical: "flex flex-col h-auto w-40 items-start justify-start rounded-md bg-muted p-1",
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      className={cn(orientationClasses[orientation], className)}
      {...props}
    >
      {children}
    </div>
  );
});

const TabsTrigger = forwardRef(({
  className,
  children,
  value,
  disabled = false,
  ...props
}, ref) => {
  const { value: selectedValue, onValueChange, size, variant } = useTabsContext();
  const isSelected = selectedValue === value;

  const sizeClasses = {
    sm: "px-2 py-1.5 text-sm",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
    xl: "px-5 py-3 text-lg",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[600]} hover:text-${designTokens.colors.neutral[900]} hover:bg-${designTokens.colors.neutral[100]}`,
    primary: `text-${designTokens.colors.primary[600]} hover:text-${designTokens.colors.primary[900]} hover:bg-${designTokens.colors.primary[100]}`,
    secondary: `text-${designTokens.colors.secondary[600]} hover:text-${designTokens.colors.secondary[900]} hover:bg-${designTokens.colors.secondary[100]}`,
    muted: `text-${designTokens.colors.neutral[500]} hover:text-${designTokens.colors.neutral[700]} hover:bg-${designTokens.colors.neutral[200]}`,
  };

  const selectedClasses = {
    default: `bg-${designTokens.colors.neutral[100]} text-${designTokens.colors.neutral[900]} shadow-sm`,
    primary: `bg-${designTokens.colors.primary[100]} text-${designTokens.colors.primary[900]} shadow-sm`,
    secondary: `bg-${designTokens.colors.secondary[100]} text-${designTokens.colors.secondary[900]} shadow-sm`,
    muted: `bg-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[800]} shadow-sm`,
  };

  const disabledClasses = `opacity-50 cursor-not-allowed`;

  const handleClick = () => {
    if (!disabled) {
      onValueChange(value);
    }
  };

  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isSelected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        sizeClasses[size],
        isSelected ? selectedClasses[variant] : variantClasses[variant],
        disabled && disabledClasses,
        className
      )}
      data-state={isSelected ? "active" : "inactive"}
      {...props}
    >
      {children}
    </button>
  );
});

const TabsContent = forwardRef(({
  className,
  children,
  value,
  ...props
}, ref) => {
  const { value: selectedValue } = useTabsContext();
  const isSelected = selectedValue === value;

  if (!isSelected) return null;

  return (
    <motion.div
      ref={ref}
      role="tabpanel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      data-state={isSelected ? "active" : "inactive"}
      {...props}
    >
      {children}
    </motion.div>
  );
});

const TabsIndicator = forwardRef(({
  className,
  ...props
}, ref) => {
  const { variant } = useTabsContext();

  const variantClasses = {
    default: `bg-${designTokens.colors.primary[500]}`,
    primary: `bg-${designTokens.colors.primary[500]}`,
    secondary: `bg-${designTokens.colors.secondary[500]}`,
    muted: `bg-${designTokens.colors.neutral[500]}`,
  };

  return (
    <motion.div
      ref={ref}
      layoutId="tabs-indicator"
      className={cn(
        "absolute rounded-sm transition-all",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});

Tabs.displayName = "Tabs";
TabsList.displayName = "TabsList";
TabsTrigger.displayName = "TabsTrigger";
TabsContent.displayName = "TabsContent";
TabsIndicator.displayName = "TabsIndicator";

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator };
export default Tabs;
