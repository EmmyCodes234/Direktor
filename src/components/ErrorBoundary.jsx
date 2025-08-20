import React from "react";
import { motion } from "framer-motion";
import Icon from "./AppIcon";
import Button from "./ui/Button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    error.__ErrorBoundary = true;
    window.__COMPONENT_ERROR__?.(error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error:', { error, errorInfo });
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="glass-card p-8">
              {/* Error Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                <Icon name="AlertTriangle" size={32} className="text-destructive" />
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-foreground mb-3">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We encountered an unexpected error. Don't worry, our team has been notified and we're working on a fix.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRefresh}
                  iconName="RefreshCw"
                  iconPosition="left"
                  className="shadow-sm"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  iconName="Home"
                  iconPosition="left"
                >
                  Go Home
                </Button>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Show Error Details
                  </summary>
                  <div className="mt-3 p-4 bg-muted/10 rounded-lg text-xs font-mono text-muted-foreground overflow-auto max-h-40">
                    <div className="mb-2 font-semibold text-destructive">
                      {this.state.error.toString()}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {this.state.errorInfo?.componentStack}
                    </div>
                  </div>
                </details>
              )}
            </div>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground mt-4">
              If this problem persists, please contact support with the error details above.
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced Error Boundary with better error handling
export const withErrorBoundary = (Component, fallback = null) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Component error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return fallback || (
          <div className="p-4 text-center">
            <Icon name="AlertTriangle" size={32} className="mx-auto text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">Something went wrong with this component.</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
};

// Error boundary hook for functional components
export const useErrorBoundary = () => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      setError(error);
      console.error('Error caught by hook:', error);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => handleError(event.reason));

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const resetError = () => {
    setHasError(false);
    setError(null);
  };

  return { hasError, error, resetError };
};

export default ErrorBoundary;