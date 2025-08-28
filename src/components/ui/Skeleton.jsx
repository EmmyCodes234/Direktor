import React from 'react';
import { cn } from '../../utils/cn';
import { skeletonVariants } from '../../design-system';

export const Skeleton = ({ 
  className, 
  variant = "default",
  size = "md",
  shape = "rectangle",
  width,
  height,
  ...props 
}) => {
  return (
    <div
      className={cn(
        skeletonVariants({ variant, size, shape }),
        width && `w-${width}`,
        height && `h-${height}`,
        className
      )}
      {...props}
    />
  );
};

// Card Skeleton Component
export const CardSkeleton = ({ 
  className, 
  lines = 3, 
  showHeader = true,
  showFooter = false,
  padding = "md" 
}) => {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10"
  };

  return (
    <div className={cn(
      "rounded-lg border bg-card shadow-sm",
      paddingClasses[padding],
      className
    )}>
      {showHeader && (
        <div className="space-y-3 mb-6">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      
      {showFooter && (
        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}
    </div>
  );
};

// Table Skeleton Component
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4, 
  className,
  showHeader = true 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {showHeader && (
        <div className="flex space-x-2 pb-2 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      )}
      
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

// Avatar Skeleton Component
export const AvatarSkeleton = ({ 
  size = "md", 
  className 
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <Skeleton 
      shape="circle" 
      className={cn(sizeClasses[size], className)} 
    />
  );
};

// Button Skeleton Component
export const ButtonSkeleton = ({ 
  size = "md", 
  variant = "default",
  className 
}) => {
  const sizeClasses = {
    sm: "h-8 px-3",
    md: "h-10 px-4",
    lg: "h-12 px-6",
    xl: "h-14 px-8"
  };

  return (
    <Skeleton 
      className={cn(
        "rounded-lg",
        sizeClasses[size],
        className
      )} 
    />
  );
};

// Form Skeleton Component
export const FormSkeleton = ({ 
  fields = 4, 
  className,
  showSubmit = true 
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      
      {showSubmit && (
        <div className="flex justify-end space-x-2 pt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
};

// List Skeleton Component
export const ListSkeleton = ({ 
  items = 5, 
  className,
  showAvatars = true,
  showDescriptions = true 
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          {showAvatars && (
            <AvatarSkeleton size="sm" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            {showDescriptions && (
              <Skeleton className="h-3 w-1/2" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
