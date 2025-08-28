import React, { forwardRef } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = forwardRef(({ 
  className, 
  variant = "default",
  ...props 
}, ref) => {
  const variantClasses = {
    default: `border-${designTokens.colors.neutral[200]}`,
    muted: `border-${designTokens.colors.neutral[100]}`,
    primary: `border-${designTokens.colors.primary[200]}`,
    secondary: `border-${designTokens.colors.secondary[200]}`,
    accent: `border-${designTokens.colors.accent[200]}`,
  };

  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(
        "border-b",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = forwardRef(({ 
  className, 
  children, 
  size = "md",
  variant = "default",
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: "py-3 text-base",
    md: "py-4 text-lg",
    lg: "py-5 text-xl",
    xl: "py-6 text-2xl",
  };

  const variantClasses = {
    default: `text-foreground hover:text-${designTokens.colors.primary[600]}/80`,
    primary: `text-${designTokens.colors.primary[700]} hover:text-${designTokens.colors.primary[800]}`,
    secondary: `text-${designTokens.colors.secondary[700]} hover:text-${designTokens.colors.secondary[800]}`,
    muted: `text-${designTokens.colors.neutral[600]} hover:text-${designTokens.colors.neutral[800]}`,
  };

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between font-heading font-semibold transition-smooth [&[data-state=open]>svg]:rotate-180",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
        <Icon
          name="ChevronDown"
          size={size === "sm" ? 16 : size === "lg" ? 24 : size === "xl" ? 28 : 20}
          className={`text-${designTokens.colors.primary[500]} transition-transform duration-200 shrink-0 ml-4`}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = forwardRef(({ 
  className, 
  children, 
  size = "md",
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: "pb-3 pt-0 text-sm",
    md: "pb-4 pt-0 text-sm",
    lg: "pb-5 pt-0 text-base",
    xl: "pb-6 pt-0 text-base",
  };

  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn(sizeClasses[size], className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };