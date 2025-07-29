import React from 'react';
import Icon from '../AppIcon';
import Input from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';

const PlayerManagementSection = ({ settings, onSettingsChange }) => {
  return (
    <div className="glass-card p-6">
      <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2">
        <Icon name="Users" size={20} className="text-primary" />
        <span>Player Management Policies</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
            <Input
              label="Maximum Players"
              type="number"
              value={settings.max_players || 64}
              onChange={(e) => onSettingsChange('max_players', parseInt(e.target.value, 10))}
              description="Max players allowed in the tournament."
            />
        </div>
        <div className="space-y-4">
            <Checkbox
              label="Allow Late Entry"
              checked={settings.allow_late_entry || false}
              onCheckedChange={(checked) => onSettingsChange('allow_late_entry', checked)}
              description="Allow players to join after the tournament starts."
            />
            {settings.allow_late_entry && (
              <Input
                label="Late Entry Deadline (Round #)"
                type="number"
                value={settings.late_entry_deadline || 3}
                onChange={(e) => onSettingsChange('late_entry_deadline', parseInt(e.target.value, 10))}
                className="ml-6"
              />
            )}
        </div>
      </div>
    </div>
  );
};
export default PlayerManagementSection;