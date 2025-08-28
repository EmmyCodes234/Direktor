import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Menubar = forwardRef(({
  className,
  children,
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

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
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

const MenubarMenu = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const MenubarTrigger = forwardRef(({
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
        "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none",
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        isOpen 
          ? `bg-${designTokens.colors.primary[100]} text-${designTokens.colors.primary[700]}`
          : `text-${designTokens.colors.neutral[700]} hover:text-${designTokens.colors.neutral[900]}`,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

const MenubarContent = forwardRef(({
  className,
  children,
  isOpen = false,
  align = "start",
  alignOffset = -4,
  side = "bottom",
  sideOffset = 8,
  ...props
}, ref) => {
  const alignClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0",
  };

  const sideClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
            alignClasses[align],
            sideClasses[side],
            className
          )}
          style={{
            marginLeft: alignOffset,
            marginTop: sideOffset,
          }}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const MenubarItem = forwardRef(({
  className,
  children,
  onClick,
  disabled = false,
  inset = false,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "disabled:pointer-events-none disabled:opacity-50",
        inset && "pl-8",
        `text-${designTokens.colors.neutral[700]} hover:text-${designTokens.colors.neutral[900]}`,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

const MenubarCheckboxItem = forwardRef(({
  className,
  children,
  checked = false,
  onClick,
  disabled = false,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "disabled:pointer-events-none disabled:opacity-50",
        `text-${designTokens.colors.neutral[700]} hover:text-${designTokens.colors.neutral[900]}`,
        className
      )}
      {...props}
    >
      <div className="mr-2 flex h-4 w-4 items-center justify-center">
        {checked && (
          <Icon 
            name="Check" 
            size={16} 
            className={`text-${designTokens.colors.primary[600]}`}
          />
        )}
      </div>
      {children}
    </button>
  );
});

const MenubarRadioItem = forwardRef(({
  className,
  children,
  checked = false,
  onClick,
  disabled = false,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "disabled:pointer-events-none disabled:opacity-50",
        `text-${designTokens.colors.neutral[700]} hover:text-${designTokens.colors.neutral[900]}`,
        className
      )}
      {...props}
    >
      <div className="mr-2 flex h-4 w-4 items-center justify-center">
        {checked && (
          <div className={`h-2 w-2 rounded-full bg-${designTokens.colors.primary[600]}`} />
        )}
      </div>
      {children}
    </button>
  );
});

const MenubarLabel = forwardRef(({
  className,
  children,
  inset = false,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        `text-${designTokens.colors.neutral[600]}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const MenubarSeparator = forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "mx-1 my-1 h-px",
        `bg-${designTokens.colors.neutral[200]}`,
        className
      )}
      {...props}
    />
  );
});

const MenubarShortcut = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "ml-auto text-xs tracking-widest",
        `text-${designTokens.colors.neutral[500]}`,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

const MenubarSub = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const MenubarSubTrigger = forwardRef(({
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
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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
          "ml-auto h-4 w-4",
          isOpen && "rotate-90"
        )}
      />
    </button>
  );
});

const MenubarSubContent = forwardRef(({
  className,
  children,
  isOpen = false,
  sideOffset = 8,
  ...props
}, ref) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute left-full top-0 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
            className
          )}
          style={{ marginLeft: sideOffset }}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const useMenubar = () => {
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

Menubar.displayName = "Menubar";
MenubarMenu.displayName = "MenubarMenu";
MenubarTrigger.displayName = "MenubarTrigger";
MenubarContent.displayName = "MenubarContent";
MenubarItem.displayName = "MenubarItem";
MenubarCheckboxItem.displayName = "MenubarCheckboxItem";
MenubarRadioItem.displayName = "MenubarRadioItem";
MenubarLabel.displayName = "MenubarLabel";
MenubarSeparator.displayName = "MenubarSeparator";
MenubarShortcut.displayName = "MenubarShortcut";
MenubarSub.displayName = "MenubarSub";
MenubarSubTrigger.displayName = "MenubarSubTrigger";
MenubarSubContent.displayName = "MenubarSubContent";

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  useMenubar,
};
export default Menubar;
