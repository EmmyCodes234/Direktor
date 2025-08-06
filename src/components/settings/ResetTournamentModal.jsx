import React from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const ResetTournamentModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass-card w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
                    <Icon name="RefreshCw" className="h-6 w-6 text-destructive" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold leading-6 text-foreground">Reset Tournament Data</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Please choose which data you would like to permanently erase. This action cannot be undone.
                    </p>
                </div>
              </div>
              <div className="space-y-4">
                  <button onClick={() => onConfirm('results_only')} className="w-full text-left p-4 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border">
                      <p className="font-semibold text-foreground">Erase All Results Only</p>
                      <p className="text-xs text-muted-foreground">Keeps your generated pairings and matches, but clears all entered scores. Ideal for correcting widespread scoring errors.</p>
                  </button>
                  <button onClick={() => onConfirm('full_reset')} className="w-full text-left p-4 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border">
                      <p className="font-semibold text-foreground">Erase All Results & Matches</p>
                      <p className="text-xs text-muted-foreground">Deletes all scores, pairings, and generated league matches. This will fully reset the tournament to its pre-start state.</p>
                  </button>
              </div>
            </div>
            <div className="bg-muted/10 px-6 py-3 flex justify-end">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResetTournamentModal;