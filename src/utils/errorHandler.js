import { toast } from 'sonner';

// Error types for different scenarios
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

// Error messages for different scenarios
const ErrorMessages = {
  [ErrorTypes.NETWORK]: 'Network error. Please check your connection and try again.',
  [ErrorTypes.AUTHENTICATION]: 'Authentication failed. Please log in again.',
  [ErrorTypes.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
  [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
  [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorTypes.SERVER]: 'Server error. Please try again later.',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

// Function to classify errors
export const classifyError = (error) => {
  if (!error) return ErrorTypes.UNKNOWN;

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return ErrorTypes.NETWORK;
  }

  // Authentication errors
  if (error.message?.includes('auth') || error.message?.includes('login')) {
    return ErrorTypes.AUTHENTICATION;
  }

  // Authorization errors
  if (error.message?.includes('permission') || error.message?.includes('access')) {
    return ErrorTypes.AUTHORIZATION;
  }

  // Validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return ErrorTypes.VALIDATION;
  }

  // Not found errors
  if (error.message?.includes('not found') || error.message?.includes('404')) {
    return ErrorTypes.NOT_FOUND;
  }

  // Server errors
  if (error.message?.includes('server') || error.message?.includes('500')) {
    return ErrorTypes.SERVER;
  }

  return ErrorTypes.UNKNOWN;
};

// Function to get user-friendly error message
export const getErrorMessage = (error, context = '') => {
  const errorType = classifyError(error);
  const baseMessage = ErrorMessages[errorType];
  
  // If we have a specific error message, use it
  if (error?.message && error.message !== 'Unknown error') {
    return error.message;
  }
  
  // Add context if provided
  if (context) {
    return `${context}: ${baseMessage}`;
  }
  
  return baseMessage;
};

// Main error handler function
export const handleError = (error, context = '', options = {}) => {
  const {
    showToast = true,
    logError = true,
    redirect = null,
    fallbackMessage = null,
  } = options;

  // Log error for debugging
  if (logError) {
    console.error(`Error in ${context}:`, error);
  }

  // Get error message
  const message = fallbackMessage || getErrorMessage(error, context);

  // Show toast notification
  if (showToast) {
    const errorType = classifyError(error);
    
    switch (errorType) {
      case ErrorTypes.AUTHENTICATION:
        toast.error(message, {
          action: {
            label: 'Login',
            onClick: () => window.location.href = '/login',
          },
        });
        break;
      case ErrorTypes.AUTHORIZATION:
        toast.error(message, {
          action: {
            label: 'Go Home',
            onClick: () => window.location.href = '/',
          },
        });
        break;
      default:
        toast.error(message);
    }
  }

  // Handle redirects
  if (redirect) {
    setTimeout(() => {
      window.location.href = redirect;
    }, 2000);
  }

  return {
    type: classifyError(error),
    message,
    originalError: error,
  };
};

// Async error wrapper for functions
export const withErrorHandling = (fn, context = '', options = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, options);
      throw error;
    }
  };
};

// Error boundary error handler
export const handleErrorBoundaryError = (error, errorInfo) => {
  console.error('Error Boundary caught an error:', error, errorInfo);
  
  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    console.error('Production error:', { error, errorInfo });
  }
  
  return {
    type: ErrorTypes.UNKNOWN,
    message: 'Something went wrong. Please refresh the page.',
    originalError: error,
  };
};

// Validation error handler
export const handleValidationError = (errors, context = '') => {
  const errorMessages = Object.values(errors).filter(Boolean);
  
  if (errorMessages.length === 0) return;
  
  const message = errorMessages.length === 1 
    ? errorMessages[0] 
    : `Please fix the following errors: ${errorMessages.join(', ')}`;
  
  toast.error(context ? `${context}: ${message}` : message);
  
  return {
    type: ErrorTypes.VALIDATION,
    message,
    errors,
  };
}; 