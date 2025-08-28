import React from 'react';
import { cn } from '../../utils/cn';
import Icon from '../AppIcon';

const Loading = ({ 
  size = 'default', 
  variant = 'skeleton',
  text = null,
  className = '',
  fullScreen = false,
  overlay = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const Spinner = () => (
    <svg 
      className={cn("animate-spin", sizeClasses[size])} 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
      />
    </svg>
  );

  const Dots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-current",
            size === 'sm' ? 'h-1 w-1' : 
            size === 'lg' ? 'h-3 w-3' : 
            size === 'xl' ? 'h-4 w-4' : 'h-2 w-2'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  const Pulse = () => (
    <div className={cn(
      "rounded-full bg-primary/20 animate-ping",
      sizeClasses[size]
    )} />
  );

  const renderLoader = () => {
    switch (variant) {
      case 'skeleton':
        return <Skeleton />;
      case 'dots':
        return <Dots />;
      case 'pulse':
        return <Pulse />;
      case 'spinner':
        return <Spinner />;
      default:
        return <Skeleton />;
    }
  };

  const content = (
    <div className={cn(
      "flex items-center justify-center",
      text && "flex-col space-y-2",
      className
    )}>
      <div className="text-primary">
        {renderLoader()}
      </div>
      {text && (
        <p className="text-sm text-muted-foreground">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        overlay && "bg-background/80 backdrop-blur-sm"
      )}>
        {content}
      </div>
    );
  }

  return content;
};

// Simple loading placeholder - now uses skeleton styling
export const Skeleton = ({ className, ...props }) => (
  <div
    className={cn(
      "animate-pulse bg-muted rounded",
      className
    )}
    {...props}
  />
);

// Card loading state - now uses skeleton styling
export const CardSkeleton = () => (
  <div className="glass-card p-6">
    <div className="space-y-4">
      <div className="h-6 bg-muted rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
      <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
      <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
    </div>
  </div>
);

export default Loading;