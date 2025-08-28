import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Command = forwardRef(({
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
        "flex w-full flex-col overflow-hidden rounded-md border",
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

const CommandInput = forwardRef(({
  placeholder = "Type a command or search...",
  value,
  onValueChange,
  size = "md",
  variant = "default",
  className,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-base",
    lg: "h-12 px-5 text-lg",
    xl: "h-14 px-6 text-xl",
  };

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-7 w-7",
  };

  const variantClasses = {
    default: `bg-transparent text-${designTokens.colors.neutral[900]} placeholder:text-${designTokens.colors.neutral[500]}`,
    primary: `bg-transparent text-${designTokens.colors.primary[900]} placeholder:text-${designTokens.colors.primary[500]}`,
    secondary: `bg-transparent text-${designTokens.colors.secondary[900]} placeholder:text-${designTokens.colors.secondary[500]}`,
    muted: `bg-transparent text-${designTokens.colors.neutral[800]} placeholder:text-${designTokens.colors.neutral[400]}`,
  };

  return (
    <div className="flex items-center border-b px-3">
      <Icon
        name="Search"
        size={iconSizeClasses[size]}
        className={cn(
          "mr-2 shrink-0 opacity-50",
          `text-${designTokens.colors.neutral[500]}`
        )}
      />
      <input
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        onChange={(e) => onValueChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    </div>
  );
});

const CommandList = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const CommandEmpty = forwardRef(({
  className,
  children = "No results found.",
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "py-6 text-center text-sm",
        `text-${designTokens.colors.neutral[500]}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const CommandGroup = forwardRef(({
  className,
  heading,
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
    default: `text-${designTokens.colors.neutral[700]}`,
    primary: `text-${designTokens.colors.primary[700]}`,
    secondary: `text-${designTokens.colors.secondary[700]}`,
    muted: `text-${designTokens.colors.neutral[600]}`,
  };

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden p-1 text-foreground", className)}
      {...props}
    >
      {heading && (
        <div
          className={cn(
            "px-2 py-1.5 font-medium",
            sizeClasses[size],
            variantClasses[variant]
          )}
        >
          {heading}
        </div>
      )}
      {children}
    </div>
  );
});

const CommandItem = forwardRef(({
  className,
  children,
  onSelect,
  disabled = false,
  size = "md",
  variant = "default",
  isSelected = false,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "px-2 py-1.5 text-sm",
    md: "px-2 py-1.5 text-sm",
    lg: "px-3 py-2 text-base",
    xl: "px-3 py-2 text-lg",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[700]} hover:bg-${designTokens.colors.neutral[100]} hover:text-${designTokens.colors.neutral[900]}`,
    primary: `text-${designTokens.colors.primary[700]} hover:bg-${designTokens.colors.primary[100]} hover:text-${designTokens.colors.primary[900]}`,
    secondary: `text-${designTokens.colors.secondary[700]} hover:bg-${designTokens.colors.secondary[100]} hover:text-${designTokens.colors.secondary[900]}`,
    muted: `text-${designTokens.colors.neutral[600]} hover:bg-${designTokens.colors.neutral[100]} hover:text-${designTokens.colors.neutral[800]}`,
  };

  const selectedClasses = {
    default: `bg-${designTokens.colors.primary[100]} text-${designTokens.colors.primary[900]}`,
    primary: `bg-${designTokens.colors.primary[100]} text-${designTokens.colors.primary[900]}`,
    secondary: `bg-${designTokens.colors.secondary[100]} text-${designTokens.colors.secondary[900]}`,
    muted: `bg-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[800]}`,
  };

  const disabledClasses = `opacity-50 cursor-not-allowed`;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        sizeClasses[size],
        isSelected ? selectedClasses[variant] : variantClasses[variant],
        disabled && disabledClasses,
        className
      )}
      onSelect={onSelect}
      data-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
});

const CommandSeparator = forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "-mx-1 h-px",
        `bg-${designTokens.colors.neutral[200]}`,
        className
      )}
      {...props}
    />
  );
});

const CommandShortcut = forwardRef(({
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
    <span
      ref={ref}
      className={cn(
        "ml-auto text-xs tracking-widest",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

Command.displayName = "Command";
CommandInput.displayName = "CommandInput";
CommandList.displayName = "CommandList";
CommandEmpty.displayName = "CommandEmpty";
CommandGroup.displayName = "CommandGroup";
CommandItem.displayName = "CommandItem";
CommandSeparator.displayName = "CommandSeparator";
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
};
export default Command;
