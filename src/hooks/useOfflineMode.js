import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const useOfflineMode = (tournamentId) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState({});
  const [pendingActions, setPendingActions] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored! Syncing offline data...');
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are now in offline mode. Changes will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, [tournamentId]);

  // Cache data to localStorage
  const cacheData = useCallback((key, data) => {
    try {
      const cacheKey = `tournament_${tournamentId}_${key}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      setOfflineData(prev => ({
        ...prev,
        [key]: data
      }));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }, [tournamentId]);

  // Load cached data from localStorage
  const loadCachedData = useCallback(() => {
    try {
      const keys = [
        'players',
        'results',
        'matches',
        'pairings',
        'announcements',
        'tournament_info'
      ];

      const cached = {};
      keys.forEach(key => {
        const cacheKey = `tournament_${tournamentId}_${key}`;
        const cachedItem = localStorage.getItem(cacheKey);
        if (cachedItem) {
          const parsed = JSON.parse(cachedItem);
          // Check if cache is less than 24 hours old
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            cached[key] = parsed.data;
          }
        }
      });

      setOfflineData(cached);
      return cached;
    } catch (error) {
      console.error('Failed to load cached data:', error);
      return {};
    }
  }, [tournamentId]);

  // Add pending action for offline mode
  const addPendingAction = useCallback((action) => {
    const pendingAction = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...action
    };

    setPendingActions(prev => [...prev, pendingAction]);
    
    // Store in localStorage
    try {
      const cacheKey = `tournament_${tournamentId}_pending_actions`;
      const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      existing.push(pendingAction);
      localStorage.setItem(cacheKey, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to store pending action:', error);
    }

    toast.info('Action queued for sync when online');
  }, [tournamentId]);

  // Sync offline data when back online
  const syncOfflineData = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      // Load pending actions
      const cacheKey = `tournament_${tournamentId}_pending_actions`;
      const pendingActionsData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      
      if (pendingActionsData.length === 0) {
        setIsSyncing(false);
        return;
      }

      toast.info(`Syncing ${pendingActionsData.length} offline actions...`);

      // Process each pending action
      for (const action of pendingActionsData) {
        try {
          await processPendingAction(action);
        } catch (error) {
          console.error('Failed to process pending action:', action, error);
          // Keep failed actions for retry
          continue;
        }
      }

      // Clear pending actions after successful sync
      localStorage.removeItem(cacheKey);
      setPendingActions([]);
      
      toast.success('Offline data synced successfully!');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      toast.error('Failed to sync offline data. Will retry later.');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, tournamentId]);

  // Process individual pending action
  const processPendingAction = async (action) => {
    // This would integrate with your actual API calls
    // For now, we'll simulate the processing
    switch (action.type) {
      case 'ADD_RESULT':
        // await supabase.from('results').insert(action.data);
        break;
      case 'UPDATE_RESULT':
        // await supabase.from('results').update(action.data).eq('id', action.id);
        break;
      case 'ADD_ANNOUNCEMENT':
        // await supabase.from('announcements').insert(action.data);
        break;
      case 'UPDATE_PLAYER_STATUS':
        // await supabase.from('tournament_players').update(action.data).eq('player_id', action.playerId);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  };

  // Get cached data
  const getCachedData = useCallback((key) => {
    return offlineData[key] || null;
  }, [offlineData]);

  // Check if data is available (online or cached)
  const isDataAvailable = useCallback((key) => {
    return isOnline || offlineData[key] !== undefined;
  }, [isOnline, offlineData]);

  // Force sync (manual trigger)
  const forceSync = useCallback(() => {
    if (isOnline) {
      syncOfflineData();
    } else {
      toast.error('Cannot sync while offline');
    }
  }, [isOnline, syncOfflineData]);

  // Clear all cached data
  const clearCache = useCallback(() => {
    try {
      const keys = [
        'players',
        'results',
        'matches',
        'pairings',
        'announcements',
        'tournament_info',
        'pending_actions'
      ];

      keys.forEach(key => {
        const cacheKey = `tournament_${tournamentId}_${key}`;
        localStorage.removeItem(cacheKey);
      });

      setOfflineData({});
      setPendingActions([]);
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  }, [tournamentId]);

  return {
    isOnline,
    isSyncing,
    offlineData,
    pendingActions,
    cacheData,
    getCachedData,
    isDataAvailable,
    addPendingAction,
    syncOfflineData,
    forceSync,
    clearCache,
    loadCachedData
  };
};

export default useOfflineMode;
