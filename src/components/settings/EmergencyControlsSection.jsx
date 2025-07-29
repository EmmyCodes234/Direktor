import React from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';

const EmergencyControlsSection = ({ onDeleteTournament }) => {
  return (
    <div className="glass-card p-6 border border-destructive/20">
      <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2 text-destructive">
        <Icon name="AlertTriangle" size={20} />
        <span>Emergency Controls</span>
      </h3>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Perform critical, high-risk actions on the tournament. Use with caution.</p>
        <div className="flex space-x-2">
            <Button variant="destructive" onClick={onDeleteTournament}>
                Delete Tournament
            </Button>
            <Button variant="outline">Pause Tournament</Button>
        </div>
      </div>
    </div>
  );
};
export default EmergencyControlsSection;