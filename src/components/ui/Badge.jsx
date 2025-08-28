import React from "react";
import { cn } from "../../utils/cn";
import { badgeVariants, statusBadgeVariants } from "../../design-system";

function Badge({ 
  className, 
  variant = "default", 
  size = "md",
  status,
  ...props 
}) {
  // If status is provided, use statusBadgeVariants, otherwise use regular badgeVariants
  const badgeClasses = status 
    ? statusBadgeVariants({ status, size })
    : badgeVariants({ variant, size });

  return (
    <div className={cn(badgeClasses, className)} {...props} />
  );
}

export { Badge, badgeVariants, statusBadgeVariants };