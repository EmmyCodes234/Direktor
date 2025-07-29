import React from 'react';
import Icon from '../AppIcon';
import Input from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';

const ScoringParametersSection = ({ settings, onSettingsChange }) => {
  return (
    <div className="glass-card p-6">
      <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2">
        <Icon name="Trophy" size={20} className="text-primary" />
        <span>Scoring & Tiebreakers</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
          label="Win Points"
          type="number"
          step="0.5"
          value={settings.win_points ?? 1}
          onChange={(e) => onSettingsChange('win_points', parseFloat(e.target.value))}
        />
        <Input
          label="Loss Points"
          type="number"
          step="0.5"
          value={settings.loss_points ?? 0}
          onChange={(e) => onSettingsChange('loss_points', parseFloat(e.target.value))}
        />
        <Input
          label="Tie Points"
          type="number"
          step="0.5"
          value={settings.tie_points ?? 0.5}
          onChange={(e) => onSettingsChange('tie_points', parseFloat(e.target.value))}
        />
        <Input
          label="Maximum Spread"
          type="number"
          value={settings.max_spread || ''}
          onChange={(e) => onSettingsChange('max_spread', parseInt(e.target.value, 10))}
          description="Set a limit for the point spread in a single game."
        />
      </div>
       <Checkbox
          label="Use Spread as Primary Tiebreaker"
          checked={settings.spread_tiebreaker ?? true}
          onCheckedChange={(checked) => onSettingsChange('spread_tiebreaker', checked)}
          description="Use point spread to break ties between players with equal wins."
        />
    </div>
  );
};
export default ScoringParametersSection;