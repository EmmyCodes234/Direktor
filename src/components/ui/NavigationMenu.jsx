import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const NavigationMenu = forwardRef(({
  className,
  children,
  orientation = "horizontal",
  size = "md",
  variant = "default",
  ...props
}, ref) => {
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
    horizontal: "flex-row",
    vertical: "flex-col",
  };

  return (
    <nav
      ref={ref}
      className={cn(
        "flex items-center space-x-1",
        sizeClasses[size],
        variantClasses[variant],
        orientationClasses[orientation],
        className
      )}
      {...props}
    >
      {children}
    </nav>
  );
});

const NavigationMenuList = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <ul
      ref={ref}
      className={cn("flex items-center space-x-1", className)}
      {...props}
    >
      {children}
    </ul>
  );
});

const NavigationMenuItem = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <li
      ref={ref}
      className={cn("relative", className)}
      {...props}
    >
      {children}
    </li>
  );
});

const NavigationMenuTrigger = forwardRef(({
  className,
  children,
  onClick,
  isOpen = false,
  disabled = false,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        `text-${designTokens.colors.neutral[700]} hover:text-${designTokens.colors.neutral[900]}`,
        className
      )}
      {...props}
    >
      {children}
      <Icon
        name="ChevronDown"
        size={16}
        className={cn(
          "ml-1 h-4 w-4 transition duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
});

const NavigationMenuContent = forwardRef(({
  className,
  children,
  isOpen = false,
  ...props
}, ref) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute top-full left-0 z-50 mt-1 w-screen max-w-xs rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
            className
          )}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const NavigationMenuLink = forwardRef(({
  className,
  children,
  href,
  isActive = false,
  disabled = false,
  ...props
}, ref) => {
  const Component = href ? 'a' : 'button';
  
  return (
    <Component
      ref={ref}
      href={href}
      disabled={disabled}
      className={cn(
        "block w-full rounded-sm px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive 
          ? `bg-${designTokens.colors.primary[100]} text-${designTokens.colors.primary[700]}`
          : `text-${designTokens.colors.neutral[700]} hover:text-${designTokens.colors.neutral[900]}`,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

const NavigationMenuIndicator = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full left-0 z-50 mt-1 flex h-1.5 w-1.5 items-center justify-center",
        className
      )}
      {...props}
    >
      <div className="h-1.5 w-1.5 rotate-45 rounded-sm bg-border" />
    </div>
  );
});

const NavigationMenuViewport = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 top-full z-50 mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg",
        `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const NavigationMenuSub = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("grid w-[400px] grid-cols-2 gap-1 p-1", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const NavigationMenuSubList = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <ul
      ref={ref}
      className={cn("grid w-[200px] gap-1 p-1", className)}
      {...props}
    >
      {children}
    </ul>
  );
});

const NavigationMenuSubTrigger = forwardRef(({
  className,
  children,
  onClick,
  isOpen = false,
  disabled = false,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        `text-${designTokens.colors.neutral[700]} hover:text-${designTokens.colors.neutral[900]}`,
        className
      )}
      {...props}
    >
      {children}
      <Icon
        name="ChevronRight"
        size={16}
        className={cn(
          "ml-auto h-4 w-4 transition duration-200",
          isOpen && "rotate-90"
        )}
      />
    </button>
  );
});

const NavigationMenuSubContent = forwardRef(({
  className,
  children,
  isOpen = false,
  ...props
}, ref) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute left-full top-0 z-50 ml-1 w-screen max-w-xs rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
            className
          )}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const useNavigationMenu = () => {
  const [openMenus, setOpenMenus] = useState(new Set());

  const openMenu = (menuId) => {
    setOpenMenus(prev => new Set([...prev, menuId]));
  };

  const closeMenu = (menuId) => {
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      newSet.delete(menuId);
      return newSet;
    });
  };

  const toggleMenu = (menuId) => {
    if (openMenus.has(menuId)) {
      closeMenu(menuId);
    } else {
      openMenu(menuId);
    }
  };

  const closeAllMenus = () => {
    setOpenMenus(new Set());
  };

  const isMenuOpen = (menuId) => openMenus.has(menuId);

  return {
    openMenus,
    openMenu,
    closeMenu,
    toggleMenu,
    closeAllMenus,
    isMenuOpen,
  };
};

NavigationMenu.displayName = "NavigationMenu";
NavigationMenuList.displayName = "NavigationMenuList";
NavigationMenuItem.displayName = "NavigationMenuItem";
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";
NavigationMenuContent.displayName = "NavigationMenuContent";
NavigationMenuLink.displayName = "NavigationMenuLink";
NavigationMenuIndicator.displayName = "NavigationMenuIndicator";
NavigationMenuViewport.displayName = "NavigationMenuViewport";
NavigationMenuSub.displayName = "NavigationMenuSub";
NavigationMenuSubList.displayName = "NavigationMenuSubList";
NavigationMenuSubTrigger.displayName = "NavigationMenuSubTrigger";
NavigationMenuSubContent.displayName = "NavigationMenuSubContent";

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  NavigationMenuSub,
  NavigationMenuSubList,
  NavigationMenuSubTrigger,
  NavigationMenuSubContent,
  useNavigationMenu,
};
export default NavigationMenu;
