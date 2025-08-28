import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens, cardVariants } from '../../design-system';
import Icon from '../AppIcon';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
  preventScroll = true,
  mobileFullScreen = false,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Size variants with mobile-first approach using design tokens
  const sizeClasses = {
    sm: 'w-full max-w-md mx-4 sm:mx-auto',
    md: 'w-full max-w-lg mx-4 sm:mx-auto',
    lg: 'w-full max-w-2xl mx-4 sm:mx-auto',
    xl: 'w-full max-w-4xl mx-4 sm:mx-auto',
    full: 'w-full max-w-[95vw] max-h-[95vh] mx-4 sm:mx-auto',
  };

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      modalRef.current?.focus();
      
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
        // Prevent iOS Safari bounce scroll
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      }
    } else {
      if (preventScroll) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
      previousActiveElement.current?.focus();
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    };
  }, [isOpen, preventScroll]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }

      // Trap focus within modal
      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements?.length) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Mobile-specific modal positioning
  const isFullScreen = mobileFullScreen || size === 'full';

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className={cn(
            "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4",
            isFullScreen ? "p-0" : "p-4",
            overlayClassName
          )}
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={{ 
              opacity: 0, 
              scale: 0.95,
              y: isFullScreen ? 0 : 20 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              y: isFullScreen ? 0 : 20 
            }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300 
            }}
            className={cn(
              cardVariants({ variant: "elevated", padding: "none" }),
              "relative rounded-t-xl sm:rounded-xl shadow-glow-lg",
              isFullScreen ? "w-full h-full rounded-none" : sizeClasses[size],
              "max-h-[90vh] sm:max-h-[95vh] overflow-hidden",
              className
            )}
            tabIndex={-1}
            {...props}
          >
            {/* Header */}
            {title && (
              <div className={`flex items-center justify-between p-4 sm:p-6 border-b border-${designTokens.colors.neutral[200]}/20`}>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  {title}
                </h2>
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon-md"
                    onClick={onClose}
                    className="h-10 w-10 touch-target"
                    aria-label="Close modal"
                  >
                    <Icon name="X" size={20} />
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto mobile-scroll">
              {children}
            </div>

            {/* Mobile close button for full-screen modals */}
            {isFullScreen && showCloseButton && (
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={onClose}
                  className={`h-12 w-12 touch-target bg-${designTokens.colors.neutral[50]}/80 backdrop-blur-sm border border-${designTokens.colors.neutral[200]}/20`}
                  aria-label="Close modal"
                >
                  <Icon name="X" size={24} />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;