import { useState, useEffect } from 'react';
import * as Network from 'expo-network';
import { SyncService } from '../lib/sync/syncService';
import { queryFirst } from '../lib/db';
import { useTenant } from '../lib/TenantContext';

export function useSync() {
  const { tenantSlug, seller } = useTenant();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const online = !!state.isConnected && !!state.isInternetReachable;
      
      // If we were offline and now we are online, trigger a background sync
      if (!isOnline && online && tenantSlug) {
        console.log('[Sync] Reconnected! Triggering master data refresh...');
        SyncService.downloadMasterData(tenantSlug, seller?.id).catch(() => {});
      }
      
      setIsOnline(online);

      const res = await queryFirst<{ total: number }>('SELECT COUNT(*) as total FROM sync_queue');
      setPendingCount(res?.total || 0);

      const syncTime = await SyncService.getLocalSetting('lastSync');
      setLastSync(syncTime);
    } catch (err) {
      console.error('Failed to check sync status:', err);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Check every 15 seconds for sync/status
    const interval = setInterval(() => {
      checkStatus();
      if (isOnline && pendingCount > 0) {
        SyncService.processQueue().then(() => checkStatus());
      }
    }, 15000);

    // Periodically refresh master data every 5 minutes if online
    const masterSyncInterval = setInterval(() => {
        if (isOnline && tenantSlug) {
            SyncService.downloadMasterData(tenantSlug, seller?.id).catch(() => {});
        }
    }, 5 * 60 * 1000);

    return () => {
        clearInterval(interval);
        clearInterval(masterSyncInterval);
    };
  }, [isOnline, pendingCount, tenantSlug, seller?.id]);

  const forceSync = async () => {
    await SyncService.processQueue();
    await checkStatus();
  };

  return {
    isOnline,
    pendingCount,
    lastSync,
    forceSync,
    checkStatus
  };
}
