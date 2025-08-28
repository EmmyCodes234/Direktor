import React from 'react';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Breadcrumb = React.forwardRef(({
  className,
  children,
  separator = "/",
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

  const separatorSizeClasses = {
    sm: "mx-2",
    md: "mx-3",
    lg: "mx-4",
    xl: "mx-5",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[600]}`,
    primary: `text-${designTokens.colors.primary[600]}`,
    secondary: `text-${designTokens.colors.secondary[600]}`,
    muted: `text-${designTokens.colors.neutral[500]}`,
  };

  return (
    <nav
      ref={ref}
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <ol className="flex items-center space-x-1">
        {React.Children.map(children, (child, index) => (
          <li key={index} className="flex items-center">
            {child}
            {index < React.Children.count(children) - 1 && (
              <span className={cn(
                "mx-2 text-muted-foreground",
                separatorSizeClasses[size]
              )}>
                {separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
});

const BreadcrumbItem = React.forwardRef(({
  children,
  href,
  isCurrentPage = false,
  size = "md",
  variant = "default",
  className,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    default: isCurrentPage 
      ? `text-${designTokens.colors.neutral[900]} font-medium` 
      : `text-${designTokens.colors.neutral[600]} hover:text-${designTokens.colors.neutral[900]}`,
    primary: isCurrentPage 
      ? `text-${designTokens.colors.primary[700]} font-medium` 
      : `text-${designTokens.colors.primary[600]} hover:text-${designTokens.colors.primary[700]}`,
    secondary: isCurrentPage 
      ? `text-${designTokens.colors.secondary[700]} font-medium` 
      : `text-${designTokens.colors.secondary[600]} hover:text-${designTokens.colors.secondary[700]}`,
    muted: isCurrentPage 
      ? `text-${designTokens.colors.neutral[800]} font-medium` 
      : `text-${designTokens.colors.neutral[500]} hover:text-${designTokens.colors.neutral[700]}`,
  };

  const baseClasses = cn(
    "transition-colors",
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  if (isCurrentPage) {
    return (
      <span
        ref={ref}
        aria-current="page"
        className={baseClasses}
        {...props}
      >
        {children}
      </span>
    );
  }

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(baseClasses, "hover:underline")}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <span
      ref={ref}
      className={baseClasses}
      {...props}
    >
      {children}
    </span>
  );
});

const BreadcrumbLink = React.forwardRef(({
  children,
  href,
  icon,
  iconPosition = "left",
  size = "md",
  variant = "default",
  className,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[600]} hover:text-${designTokens.colors.neutral[900]}`,
    primary: `text-${designTokens.colors.primary[600]} hover:text-${designTokens.colors.primary[700]}`,
    secondary: `text-${designTokens.colors.secondary[600]} hover:text-${designTokens.colors.secondary[700]}`,
    muted: `text-${designTokens.colors.neutral[500]} hover:text-${designTokens.colors.neutral[700]}`,
  };

  const baseClasses = cn(
    "inline-flex items-center transition-colors hover:underline",
    sizeClasses[size],
    variantClasses[variant],
    className
  );

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
    <a
      ref={ref}
      href={href}
      className={baseClasses}
      {...props}
    >
      {iconPosition === "left" && iconElement}
      {children}
      {iconPosition === "right" && iconElement}
    </a>
  );
});

const BreadcrumbSeparator = React.forwardRef(({
  children,
  size = "md",
  variant = "default",
  className,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    default: `text-${designTokens.colors.neutral[400]}`,
    primary: `text-${designTokens.colors.primary[400]}`,
    secondary: `text-${designTokens.colors.secondary[400]}`,
    muted: `text-${designTokens.colors.neutral[300]}`,
  };

  return (
    <span
      ref={ref}
      className={cn(
        "mx-2",
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

Breadcrumb.displayName = "Breadcrumb";
BreadcrumbItem.displayName = "BreadcrumbItem";
BreadcrumbLink.displayName = "BreadcrumbLink";
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator };
export default Breadcrumb;
