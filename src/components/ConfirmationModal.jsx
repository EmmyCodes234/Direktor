import React from 'react';
import Icon from './AppIcon';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardFooter } from './ui/Card';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
import { cn } from '../utils/cn';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isLoading = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card variant="glass" padding="none" className="overflow-hidden">
              <CardHeader className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
                    <Icon name="AlertTriangle" className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="mt-0 text-left">
                    <h3 className="text-lg font-semibold leading-6 text-foreground" id="modal-title">
                      {title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="bg-muted/10 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg">
                <Button variant="destructive" onClick={onConfirm} loading={isLoading} className="w-full sm:ml-3 sm:w-auto">
                  {confirmText}
                </Button>
                <Button variant="outline" onClick={onCancel} disabled={isLoading} className="mt-3 w-full sm:mt-0 sm:w-auto">
                  {cancelText}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;