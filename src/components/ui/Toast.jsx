import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Toast = forwardRef(({
  className,
  children,
  variant = "default",
  size = "md",
  duration = 5000,
  onClose,
  show = true,
  position = "top-right",
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  useEffect(() => {
    if (duration && duration > 0 && !isHovered) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, isHovered]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (duration && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }
  };

  const sizeClasses = {
    sm: "p-2 text-sm",
    md: "p-3 text-base",
    lg: "p-4 text-lg",
    xl: "p-5 text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[900]}`,
    success: `bg-${designTokens.colors.success[50]} border-${designTokens.colors.success[200]} text-${designTokens.colors.success[900]}`,
    warning: `bg-${designTokens.colors.warning[50]} border-${designTokens.colors.warning[200]} text-${designTokens.colors.warning[900]}`,
    error: `bg-${designTokens.colors.error[50]} border-${designTokens.colors.error[200]} text-${designTokens.colors.error[900]}`,
    info: `bg-${designTokens.colors.info[50]} border-${designTokens.colors.info[200]} text-${designTokens.colors.info[900]}`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]} text-${designTokens.colors.primary[900]}`,
  };

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "fixed z-50 max-w-sm rounded-lg border shadow-lg",
            sizeClasses[size],
            variantClasses[variant],
            positionClasses[position],
            className
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...props}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">{children}</div>
            <button
              onClick={handleClose}
              className={cn(
                "ml-3 rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                `text-${designTokens.colors.neutral[500]} hover:text-${designTokens.colors.neutral[700]}`
              )}
            >
              <Icon name="X" size={size === "sm" ? 14 : size === "lg" ? 18 : size === "xl" ? 20 : 16} />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const ToastTitle = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("font-semibold", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const ToastDescription = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("mt-1 text-sm opacity-90", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const ToastAction = forwardRef(({
  className,
  children,
  onClick,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "mt-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        `bg-${designTokens.colors.primary[100]} text-${designTokens.colors.primary[700]} hover:bg-${designTokens.colors.primary[200]}`,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

const ToastProvider = ({ children, position = "top-right" }) => {
  return (
    <div className="relative">
      {children}
    </div>
  );
};

const ToastContainer = ({ toasts, position = "top-right", className }) => {
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2",
        positionClasses[position],
        className
      )}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          size={toast.size}
          duration={toast.duration}
          onClose={toast.onClose}
          show={toast.show}
          position={position}
        >
          {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
          {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
          {toast.action && (
            <ToastAction onClick={toast.action.onClick}>
              {toast.action.label}
            </ToastAction>
          )}
        </Toast>
      ))}
    </div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id, show: true };
    setToasts((prev) => [...prev, newToast]);

    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const updateToast = (id, updates) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    updateToast,
    clearToasts,
  };
};

Toast.displayName = "Toast";
ToastTitle.displayName = "ToastTitle";
ToastDescription.displayName = "ToastDescription";
ToastAction.displayName = "ToastAction";
ToastProvider.displayName = "ToastProvider";
ToastContainer.displayName = "ToastContainer";

export {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastProvider,
  ToastContainer,
  useToast,
};
export default Toast;