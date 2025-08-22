import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const OfflineModeIndicator = ({ 
  isOnline, 
  isSyncing, 
  pendingActions, 
  onForceSync, 
  onClearCache,
  onToggleOfflineMode 
}) => {
  const getStatusColor = () => {
    if (isSyncing) return 'text-warning';
    if (isOnline) return 'text-success';
    return 'text-destructive';
  };

  const getStatusIcon = () => {
    if (isSyncing) return 'RefreshCw';
    if (isOnline) return 'Wifi';
    return 'WifiOff';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (isOnline) return 'Online';
    return 'Offline';
  };

  const getPendingActionsText = () => {
    if (pendingActions.length === 0) return 'No pending actions';
    if (pendingActions.length === 1) return '1 pending action';
    return `${pendingActions.length} pending actions`;
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isOnline ? 'bg-success/20' : 'bg-destructive/20'}`}>
            <Icon 
              name={getStatusIcon()} 
              size={20} 
              className={`${getStatusColor()} ${isSyncing ? 'animate-spin' : ''}`}
            />
          </div>
          <div>
            <p className="font-medium text-foreground">{getStatusText()}</p>
            <p className="text-sm text-muted-foreground">
              {isOnline ? 'All changes sync automatically' : 'Changes saved locally'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">
            {getPendingActionsText()}
          </p>
          {pendingActions.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Will sync when online
            </p>
          )}
        </div>
      </div>

      {/* Offline Mode Controls */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 p-4 bg-warning/10 border border-warning/20 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={16} className="text-warning" />
              <h4 className="font-medium text-foreground">Offline Mode Active</h4>
            </div>
            
            <p className="text-sm text-muted-foreground">
              You're currently offline. All changes will be saved locally and synced when you're back online.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onForceSync}
                disabled={!isOnline}
                size="sm"
                variant="outline"
              >
                <Icon name="RefreshCw" size={14} className="mr-1" />
                Sync Now
              </Button>
              
              <Button
                onClick={onClearCache}
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Icon name="Trash2" size={14} className="mr-1" />
                Clear Cache
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Actions List */}
      <AnimatePresence>
        {pendingActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Pending Actions</h4>
              <span className="text-sm text-muted-foreground">
                {pendingActions.length} queued
              </span>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pendingActions.slice(0, 5).map((action, index) => (
                <div key={action.id} className="flex items-center justify-between p-2 bg-background border border-border rounded-md">
                  <div className="flex items-center gap-2">
                    <Icon 
                      name={getActionIcon(action.type)} 
                      size={14} 
                      className="text-muted-foreground"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {getActionText(action.type)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              
              {pendingActions.length > 5 && (
                <div className="text-center p-2">
                  <span className="text-sm text-muted-foreground">
                    +{pendingActions.length - 5} more actions
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Progress */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-primary/10 border border-primary/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Icon name="RefreshCw" size={16} className="text-primary animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Syncing offline data...</p>
                <p className="text-xs text-muted-foreground">
                  Please don't close this page
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Mode Toggle */}
      <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <Icon name="Shield" size={16} className="text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Offline Mode</p>
            <p className="text-sm text-muted-foreground">
              Force offline mode for testing
            </p>
          </div>
        </div>
        
        <Button
          onClick={onToggleOfflineMode}
          variant="outline"
          size="sm"
        >
          <Icon name="ToggleLeft" size={14} className="mr-1" />
          Toggle
        </Button>
      </div>
    </div>
  );
};

// Helper functions
const getActionIcon = (type) => {
  const icons = {
    'ADD_RESULT': 'Plus',
    'UPDATE_RESULT': 'Edit',
    'ADD_ANNOUNCEMENT': 'Megaphone',
    'UPDATE_PLAYER_STATUS': 'User',
    'ADD_PLAYER': 'UserPlus',
    'REMOVE_PLAYER': 'UserMinus'
  };
  return icons[type] || 'Activity';
};

const getActionText = (type) => {
  const texts = {
    'ADD_RESULT': 'Add game result',
    'UPDATE_RESULT': 'Update game result',
    'ADD_ANNOUNCEMENT': 'Add announcement',
    'UPDATE_PLAYER_STATUS': 'Update player status',
    'ADD_PLAYER': 'Add player',
    'REMOVE_PLAYER': 'Remove player'
  };
  return texts[type] || 'Unknown action';
};

export default OfflineModeIndicator;
