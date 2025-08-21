import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Icon from '../AppIcon';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
  preventScroll = true,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Size variants
  const sizeClasses = {
    sm: 'max-w-md',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      modalRef.current?.focus();
      
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (preventScroll) {
        document.body.style.overflow = '';
      }
      previousActiveElement.current?.focus();
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = '';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute inset-0 bg-background/90 backdrop-blur-md",
              overlayClassName
            )}
            onClick={handleOverlayClick}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              "relative w-full glass-card shadow-glass-xl",
              sizeClasses[size],
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            tabIndex={-1}
            {...props}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 lg:p-8 border-b border-border/10">
                {title && (
                  <h2 id="modal-title" className="text-lg lg:text-xl font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClose}
                    className="ml-auto"
                    aria-label="Close modal"
                  >
                    <Icon name="X" size={16} />
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={cn(
              "p-6 lg:p-8",
              (title || showCloseButton) && "pt-0"
            )}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Confirmation Modal variant
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  ...props
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      {...props}
    >
      <div className="space-y-4">
        <p className="text-muted-foreground">{message}</p>
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;