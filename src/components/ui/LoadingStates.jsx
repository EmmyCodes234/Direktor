import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

// Loading types
export const LoadingTypes = {
  SPINNER: 'spinner',
  DOTS: 'dots',
  PULSE: 'pulse',
  SKELETON: 'skeleton',
  BAR: 'bar',
};

// Loading sizes
export const LoadingSizes = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
};

// Spinner component
const Spinner = ({ size = LoadingSizes.MD, className }) => {
  const sizeClasses = {
    [LoadingSizes.SM]: 'h-4 w-4',
    [LoadingSizes.MD]: 'h-6 w-6',
    [LoadingSizes.LG]: 'h-8 w-8',
    [LoadingSizes.XL]: 'h-12 w-12',
  };

  return (
    <div className={cn('animate-spin', sizeClasses[size], className)}>
      <Icon name="Loader2" className="text-primary" />
    </div>
  );
};

// Dots loading component
const Dots = ({ size = LoadingSizes.MD, className }) => {
  const sizeClasses = {
    [LoadingSizes.SM]: 'h-1 w-1',
    [LoadingSizes.MD]: 'h-2 w-2',
    [LoadingSizes.LG]: 'h-3 w-3',
    [LoadingSizes.XL]: 'h-4 w-4',
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('bg-primary rounded-full', sizeClasses[size])}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

// Pulse loading component
const Pulse = ({ size = LoadingSizes.MD, className }) => {
  const sizeClasses = {
    [LoadingSizes.SM]: 'h-4 w-4',
    [LoadingSizes.MD]: 'h-6 w-6',
    [LoadingSizes.LG]: 'h-8 w-8',
    [LoadingSizes.XL]: 'h-12 w-12',
  };

  return (
    <div className={cn('animate-pulse', sizeClasses[size], className)}>
      <div className="h-full w-full bg-muted rounded" />
    </div>
  );
};

// Bar loading component
const Bar = ({ className }) => {
  return (
    <div className={cn('w-full bg-muted rounded-full h-2', className)}>
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// Skeleton components
export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse bg-muted rounded', className)}
      {...props}
    />
  );
};

export const CardSkeleton = ({ className }) => {
  return (
    <div className={cn('glass-card p-6 space-y-4', className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-2">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Main loading component
const Loading = ({ 
  type = LoadingTypes.SPINNER, 
  size = LoadingSizes.MD, 
  text = 'Loading...',
  className,
  fullScreen = false,
  overlay = false,
}) => {
  const renderLoader = () => {
    switch (type) {
      case LoadingTypes.SPINNER:
        return <Spinner size={size} />;
      case LoadingTypes.DOTS:
        return <Dots size={size} />;
      case LoadingTypes.PULSE:
        return <Pulse size={size} />;
      case LoadingTypes.BAR:
        return <Bar />;
      default:
        return <Spinner size={size} />;
    }
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      {renderLoader()}
      {text && (
        <p className="text-sm text-muted-foreground text-center">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

// Loading wrapper component
export const LoadingWrapper = ({ 
  loading, 
  children, 
  type = LoadingTypes.SPINNER,
  size = LoadingSizes.MD,
  text = 'Loading...',
  skeleton = false,
  skeletonProps = {},
  className,
}) => {
  if (loading) {
    if (skeleton) {
      return <Skeleton {...skeletonProps} className={className} />;
    }
    return (
      <Loading 
        type={type} 
        size={size} 
        text={text} 
        className={className} 
      />
    );
  }

  return children;
};

// Page loading component
export const PageLoading = ({ text = 'Loading page...' }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loading type={LoadingTypes.SPINNER} size={LoadingSizes.LG} text={text} />
    </div>
  );
};

// Inline loading component
export const InlineLoading = ({ text = 'Loading...' }) => {
  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Spinner size={LoadingSizes.SM} />
      <span>{text}</span>
    </div>
  );
};

export default Loading;
export { Spinner, Dots, Pulse, Bar }; 