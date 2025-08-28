import React, { forwardRef, useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const CollapsibleContext = createContext({
  open: false,
  onOpenChange: () => {},
  size: 'md',
  variant: 'default',
});

const useCollapsibleContext = () => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('Collapsible components must be used within a Collapsible component');
  }
  return context;
};

const Collapsible = forwardRef(({
  className,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  size = "md",
  variant = "default",
  ...props
}, ref) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const currentOpen = open !== undefined ? open : internalOpen;

  const handleOpenChange = (newOpen) => {
    if (open === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const contextValue = {
    open: currentOpen,
    onOpenChange: handleOpenChange,
    size,
    variant,
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

  return (
    <CollapsibleContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={cn(
          "w-full",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        data-state={currentOpen ? "open" : "closed"}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
});

const CollapsibleTrigger = forwardRef(({
  className,
  children,
  disabled = false,
  ...props
}, ref) => {
  const { open, onOpenChange, size, variant } = useCollapsibleContext();

  const sizeClasses = {
    sm: "px-2 py-1.5 text-sm",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
    xl: "px-5 py-3 text-lg",
  };

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-7 w-7",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[700]} hover:text-${designTokens.colors.neutral[900]} hover:bg-${designTokens.colors.neutral[100]}`,
    primary: `text-${designTokens.colors.primary[700]} hover:text-${designTokens.colors.primary[900]} hover:bg-${designTokens.colors.primary[100]}`,
    secondary: `text-${designTokens.colors.secondary[700]} hover:text-${designTokens.colors.secondary[900]} hover:bg-${designTokens.colors.secondary[100]}`,
    muted: `text-${designTokens.colors.neutral[600]} hover:text-${designTokens.colors.neutral[800]} hover:bg-${designTokens.colors.neutral[200]}`,
  };

  const disabledClasses = `opacity-50 cursor-not-allowed`;

  const handleClick = () => {
    if (!disabled) {
      onOpenChange(!open);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left font-medium transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        sizeClasses[size],
        variantClasses[variant],
        disabled && disabledClasses,
        className
      )}
      data-state={open ? "open" : "closed"}
      {...props}
    >
      <span className="flex-1">{children}</span>
      <Icon
        name="ChevronDown"
        size={iconSizeClasses[size]}
        className={cn(
          "transition-transform duration-200",
          open && "rotate-180",
          `text-${designTokens.colors.neutral[500]}`
        )}
      />
    </button>
  );
});

const CollapsibleContent = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  const { open } = useCollapsibleContext();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={cn("overflow-hidden", className)}
          data-state={open ? "open" : "closed"}
          {...props}
        >
          <div className="pb-4 pt-0">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const CollapsibleItem = forwardRef(({
  className,
  children,
  title,
  defaultOpen = false,
  size = "md",
  variant = "default",
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-7 w-7",
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "border rounded-md",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          sizeClasses[size]
        )}
      >
        <span>{title}</span>
        <Icon
          name="ChevronDown"
          size={iconSizeClasses[size]}
          className={cn(
            "transition-transform duration-200",
            isOpen && "rotate-180",
            `text-${designTokens.colors.neutral[500]}`
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const CollapsibleGroup = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-2", className)}
      {...props}
    >
      {children}
    </div>
  );
});

Collapsible.displayName = "Collapsible";
CollapsibleTrigger.displayName = "CollapsibleTrigger";
CollapsibleContent.displayName = "CollapsibleContent";
CollapsibleItem.displayName = "CollapsibleItem";
CollapsibleGroup.displayName = "CollapsibleGroup";

export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleItem, CollapsibleGroup };
export default Collapsible;
