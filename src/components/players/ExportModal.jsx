import React from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';

const ExportModal = ({ isOpen, onClose, playerCount }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-heading font-semibold mb-4">Export Players</h2>
        <p className="text-muted-foreground mb-4">Export {playerCount} players in your desired format.</p>
        <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button>Export</Button>
        </div>
      </div>
    </div>
  );
};
export default ExportModal;