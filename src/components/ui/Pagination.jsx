import React from 'react';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Pagination = React.forwardRef(({
  className,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  size = "md",
  variant = "default",
  disabled = false,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const buttonSizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-14 w-14",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[700]} hover:bg-${designTokens.colors.neutral[100]} hover:border-${designTokens.colors.neutral[300]}`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]} text-${designTokens.colors.primary[700]} hover:bg-${designTokens.colors.primary[100]} hover:border-${designTokens.colors.primary[300]}`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]} text-${designTokens.colors.secondary[700]} hover:bg-${designTokens.colors.secondary[100]} hover:border-${designTokens.colors.secondary[300]}`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]} text-${designTokens.colors.neutral[600]} hover:bg-${designTokens.colors.neutral[200]} hover:border-${designTokens.colors.neutral[400]}`,
  };

  const activeClasses = {
    default: `bg-${designTokens.colors.primary[500]} border-${designTokens.colors.primary[500]} text-white hover:bg-${designTokens.colors.primary[600]} hover:border-${designTokens.colors.primary[600]}`,
    primary: `bg-${designTokens.colors.primary[500]} border-${designTokens.colors.primary[500]} text-white hover:bg-${designTokens.colors.primary[600]} hover:border-${designTokens.colors.primary[600]}`,
    secondary: `bg-${designTokens.colors.secondary[500]} border-${designTokens.colors.secondary[500]} text-white hover:bg-${designTokens.colors.secondary[600]} hover:border-${designTokens.colors.secondary[600]}`,
    muted: `bg-${designTokens.colors.neutral[500]} border-${designTokens.colors.neutral[500]} text-white hover:bg-${designTokens.colors.neutral[600]} hover:border-${designTokens.colors.neutral[600]}`,
  };

  const disabledClasses = `opacity-50 cursor-not-allowed bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[400]}`;

  const handlePageChange = (page) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) return;
    onPageChange?.(page);
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      ref={ref}
      role="navigation"
      aria-label="Pagination"
      className={cn("flex items-center justify-center space-x-1", className)}
      {...props}
    >
      {/* First Page */}
      {showFirstLast && (
        <PaginationButton
          onClick={() => handlePageChange(1)}
          disabled={disabled || currentPage === 1}
          size={size}
          variant={variant}
          variantClasses={variantClasses}
          buttonSizeClasses={buttonSizeClasses}
          disabledClasses={disabledClasses}
          aria-label="Go to first page"
        >
          <Icon name="ChevronDoubleLeft" size={size === "sm" ? 14 : size === "lg" ? 18 : size === "xl" ? 20 : 16} />
        </PaginationButton>
      )}

      {/* Previous Page */}
      {showPrevNext && (
        <PaginationButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          size={size}
          variant={variant}
          variantClasses={variantClasses}
          buttonSizeClasses={buttonSizeClasses}
          disabledClasses={disabledClasses}
          aria-label="Go to previous page"
        >
          <Icon name="ChevronLeft" size={size === "sm" ? 14 : size === "lg" ? 18 : size === "xl" ? 20 : 16} />
        </PaginationButton>
      )}

      {/* Page Numbers */}
      {getVisiblePages().map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className={cn(
              "flex items-center justify-center",
              buttonSizeClasses[size],
              sizeClasses[size],
              `text-${designTokens.colors.neutral[500]}`
            )}>
              ...
            </span>
          ) : (
            <PaginationButton
              onClick={() => handlePageChange(page)}
              disabled={disabled}
              size={size}
              variant={variant}
              variantClasses={variantClasses}
              activeClasses={activeClasses}
              buttonSizeClasses={buttonSizeClasses}
              disabledClasses={disabledClasses}
              isActive={page === currentPage}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </PaginationButton>
          )}
        </React.Fragment>
      ))}

      {/* Next Page */}
      {showPrevNext && (
        <PaginationButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          size={size}
          variant={variant}
          variantClasses={variantClasses}
          buttonSizeClasses={buttonSizeClasses}
          disabledClasses={disabledClasses}
          aria-label="Go to next page"
        >
          <Icon name="ChevronRight" size={size === "sm" ? 14 : size === "lg" ? 18 : size === "xl" ? 20 : 16} />
        </PaginationButton>
      )}

      {/* Last Page */}
      {showFirstLast && (
        <PaginationButton
          onClick={() => handlePageChange(totalPages)}
          disabled={disabled || currentPage === totalPages}
          size={size}
          variant={variant}
          variantClasses={variantClasses}
          buttonSizeClasses={buttonSizeClasses}
          disabledClasses={disabledClasses}
          aria-label="Go to last page"
        >
          <Icon name="ChevronDoubleRight" size={size === "sm" ? 14 : size === "lg" ? 18 : size === "xl" ? 20 : 16} />
        </PaginationButton>
      )}
    </nav>
  );
});

const PaginationButton = React.forwardRef(({
  children,
  onClick,
  disabled = false,
  size = "md",
  variant = "default",
  variantClasses,
  activeClasses,
  buttonSizeClasses,
  disabledClasses,
  isActive = false,
  className,
  ...props
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center border rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  
  const buttonClasses = cn(
    baseClasses,
    buttonSizeClasses[size],
    isActive ? activeClasses[variant] : variantClasses[variant],
    disabled && disabledClasses,
    !disabled && !isActive && "hover:shadow-sm",
    className
  );

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      {...props}
    >
      {children}
    </button>
  );
});

Pagination.displayName = "Pagination";
PaginationButton.displayName = "PaginationButton";

export default Pagination;
