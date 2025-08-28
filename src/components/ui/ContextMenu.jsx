import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const ContextMenu = forwardRef(({
  className,
  children,
  trigger,
  size = "md",
  variant = "default",
  position = "bottom-right",
  disabled = false,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]} shadow-lg`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]} shadow-lg`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]} shadow-lg`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]} shadow-lg`,
  };

  const positionClasses = {
    "top-left": "bottom-full right-0 mb-2",
    "top-right": "bottom-full left-0 mb-2",
    "bottom-left": "top-full right-0 mt-2",
    "bottom-right": "top-full left-0 mt-2",
  };

  const handleContextMenu = (event) => {
    if (disabled) return;
    
    event.preventDefault();
    const rect = triggerRef.current.getBoundingClientRect();
    
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    
    // Adjust position to keep menu within viewport
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      if (x + menuRect.width > window.innerWidth) {
        x = window.innerWidth - menuRect.width - 10;
      }
      if (y + menuRect.height > window.innerHeight) {
        y = window.innerHeight - menuRect.height - 10;
      }
    }
    
    setMenuPosition({ x, y });
    setIsOpen(true);
  };

  const handleClickOutside = (event) => {
    if (triggerRef.current && !triggerRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, []);

  return (
    <div ref={ref} className="relative inline-block" {...props}>
      <div
        ref={triggerRef}
        onContextMenu={handleContextMenu}
        className="inline-block"
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className={cn(
              "absolute z-50 min-w-[200px] rounded-md border py-1",
              sizeClasses[size],
              variantClasses[variant],
              positionClasses[position],
              className
            )}
            style={{
              left: menuPosition.x,
              top: menuPosition.y,
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const ContextMenuTrigger = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("inline-block", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const ContextMenuContent = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("py-1", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const ContextMenuItem = forwardRef(({
  className,
  children,
  icon,
  iconPosition = "left",
  disabled = false,
  size = "md",
  variant = "default",
  onClick,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "px-2 py-1.5 text-sm",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
    xl: "px-5 py-3 text-lg",
  };

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[700]} hover:bg-${designTokens.colors.neutral[100]} hover:text-${designTokens.colors.neutral[900]}`,
    primary: `text-${designTokens.colors.primary[700]} hover:bg-${designTokens.colors.primary[100]} hover:text-${designTokens.colors.primary[900]}`,
    secondary: `text-${designTokens.colors.secondary[700]} hover:bg-${designTokens.colors.secondary[100]} hover:text-${designTokens.colors.secondary[900]}`,
    muted: `text-${designTokens.colors.neutral[600]} hover:bg-${designTokens.colors.neutral[100]} hover:text-${designTokens.colors.neutral[800]}`,
  };

  const disabledClasses = `opacity-50 cursor-not-allowed`;

  const handleClick = (event) => {
    if (disabled) return;
    onClick?.(event);
  };

  const iconElement = icon && (
    <Icon
      name={icon}
      size={iconSizeClasses[size]}
      className={cn(
        iconPosition === "left" ? "mr-2" : "ml-2",
        "text-current"
      )}
    />
  );

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center px-3 py-2 text-sm outline-none transition-colors",
        sizeClasses[size],
        variantClasses[variant],
        disabled && disabledClasses,
        !disabled && "hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {iconPosition === "left" && iconElement}
      <span className="flex-1">{children}</span>
      {iconPosition === "right" && iconElement}
    </div>
  );
});

const ContextMenuSeparator = forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "my-1 h-px",
        `bg-${designTokens.colors.neutral[200]}`,
        className
      )}
      {...props}
    />
  );
});

const ContextMenuLabel = forwardRef(({
  className,
  children,
  size = "md",
  variant = "default",
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[500]}`,
    primary: `text-${designTokens.colors.primary[500]}`,
    secondary: `text-${designTokens.colors.secondary[500]}`,
    muted: `text-${designTokens.colors.neutral[400]}`,
  };

  return (
    <div
      ref={ref}
      className={cn(
        "px-3 py-2 font-medium",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const ContextMenuGroup = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("py-1", className)}
      {...props}
    >
      {children}
    </div>
  );
});

ContextMenu.displayName = "ContextMenu";
ContextMenuTrigger.displayName = "ContextMenuTrigger";
ContextMenuContent.displayName = "ContextMenuContent";
ContextMenuItem.displayName = "ContextMenuItem";
ContextMenuSeparator.displayName = "ContextMenuSeparator";
ContextMenuLabel.displayName = "ContextMenuLabel";
ContextMenuGroup.displayName = "ContextMenuGroup";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuGroup,
};
export default ContextMenu;
