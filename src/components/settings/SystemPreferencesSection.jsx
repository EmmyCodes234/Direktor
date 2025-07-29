import React from 'react';
import Icon from '../AppIcon';
const SystemPreferencesSection = () => {
  return (
    <div className="glass-card p-6">
      <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2">
        <Icon name="Monitor" size={20} className="text-primary" />
        <span>System Preferences</span>
      </h3>
       <p className="text-muted-foreground text-sm">System-wide preferences, such as theme and notifications, will be managed here in a future update.</p>
    </div>
  );
};
export default SystemPreferencesSection;