import React from 'react';
import { toast as sonnerToast } from 'sonner';
import Icon from '../AppIcon';

// Enhanced toast functions with better UX
export const toast = {
  success: (message, options = {}) => {
    return sonnerToast.success(message, {
      duration: 4000,
      icon: <Icon name="CheckCircle" size={16} className="text-success" />,
      className: 'glass-card border-success/20',
      ...options
    });
  },

  error: (message, options = {}) => {
    return sonnerToast.error(message, {
      duration: 6000,
      icon: <Icon name="XCircle" size={16} className="text-destructive" />,
      className: 'glass-card border-destructive/20',
      ...options
    });
  },

  warning: (message, options = {}) => {
    return sonnerToast.warning(message, {
      duration: 5000,
      icon: <Icon name="AlertTriangle" size={16} className="text-warning" />,
      className: 'glass-card border-warning/20',
      ...options
    });
  },

  info: (message, options = {}) => {
    return sonnerToast.info(message, {
      duration: 4000,
      icon: <Icon name="Info" size={16} className="text-primary" />,
      className: 'glass-card border-primary/20',
      ...options
    });
  },

  loading: (message, options = {}) => {
    return sonnerToast.loading(message, {
      icon: <Icon name="Loader2" size={16} className="animate-spin text-muted-foreground" />,
      className: 'glass-card',
      ...options
    });
  },

  promise: (promise, messages, options = {}) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
      className: 'glass-card',
      ...options
    });
  },

  custom: (jsx, options = {}) => {
    return sonnerToast.custom(jsx, {
      className: 'glass-card',
      ...options
    });
  },

  dismiss: (toastId) => {
    return sonnerToast.dismiss(toastId);
  }
};

// Action toast with buttons
export const actionToast = (message, actions = [], options = {}) => {
  return toast.custom(
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-2">
        <Icon name="Info" size={16} className="text-primary flex-shrink-0" />
        <span className="text-sm">{message}</span>
      </div>
      <div className="flex items-center space-x-2 ml-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="px-3 py-1 text-xs font-medium rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>,
    {
      duration: 8000,
      ...options
    }
  );
};

export default toast;