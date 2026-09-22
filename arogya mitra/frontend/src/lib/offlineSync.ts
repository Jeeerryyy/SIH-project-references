/**
 * Arogya Mitra Offline Sync Engine
 * Buffers frontline mutations in localStorage when disconnected
 * and automatically plays back idempotently to /api/v1/sync/push when reconnected.
 */

import { useState, useEffect } from 'react';
import { api } from './api';

export interface OfflineMutation {
  client_mutation_id: string;
  entity_type: 'PATIENT_REGISTER' | 'ANC_SCREENING' | 'NCD_SCREENING' | 'DISPENSE_MEDICATION';
  payload: Record<string, any>;
  queued_at: string;
}

const STORAGE_KEY = 'arogya_offline_mutations';
const LAST_SYNC_KEY = 'arogya_last_synced_at';
const CACHED_DRUGS_KEY = 'arogya_cached_drugs';
const CACHED_BRANCHES_KEY = 'arogya_cached_branches';

type SyncListener = () => void;
const listeners: Set<SyncListener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function getOfflineQueue(): OfflineMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineMutation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  notifyListeners();
}

export function queueOfflineMutation(
  entity_type: OfflineMutation['entity_type'],
  payload: Record<string, any>
): OfflineMutation {
  const mutation: OfflineMutation = {
    client_mutation_id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    entity_type,
    payload,
    queued_at: new Date().toISOString(),
  };

  const current = getOfflineQueue();
  current.push(mutation);
  saveOfflineQueue(current);

  // If we are online, attempt immediate sync in background
  if (navigator.onLine) {
    replayOfflineQueue().catch(console.error);
  }

  return mutation;
}

export async function replayOfflineQueue(): Promise<{
  applied_count: number;
  failed_count: number;
}> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { applied_count: 0, failed_count: 0 };
  }

  try {
    const response = await api.post('/sync/push', {
      device_id: `WEB-CLIENT-${navigator.userAgent.substring(0, 20)}`,
      worker_role: 'HEALTH_WORKER',
      mutations: queue.map((m) => ({
        client_mutation_id: m.client_mutation_id,
        entity_type: m.entity_type,
        payload: m.payload,
      })),
    });

    if (response && response.results) {
      // Clear out applied mutations from the queue
      const appliedIds = new Set(
        response.results
          .filter((r: any) => r.status === 'APPLIED' || r.status === 'DUPLICATE_SKIPPED')
          .map((r: any) => r.client_mutation_id)
      );

      const remaining = queue.filter((m) => !appliedIds.has(m.client_mutation_id));
      saveOfflineQueue(remaining);
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      notifyListeners();

      return {
        applied_count: response.applied_count || 0,
        failed_count: response.failed_count || 0,
      };
    }
    return { applied_count: 0, failed_count: 0 };
  } catch (err) {
    console.warn('Failed to replay offline queue:', err);
    throw err;
  }
}

export async function fetchDeltaSync(): Promise<any> {
  try {
    const data = await api.get('/sync/pull');
    if (data) {
      if (data.drugs) {
        localStorage.setItem(CACHED_DRUGS_KEY, JSON.stringify(data.drugs));
      }
      if (data.branches) {
        localStorage.setItem(CACHED_BRANCHES_KEY, JSON.stringify(data.branches));
      }
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      notifyListeners();
    }
    return data;
  } catch (err) {
    console.warn('Failed to fetch delta sync:', err);
    throw err;
  }
}

export function useOfflineSyncStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    localStorage.getItem(LAST_SYNC_KEY)
  );

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
      setPendingCount(getOfflineQueue().length);
      setLastSyncedAt(localStorage.getItem(LAST_SYNC_KEY));
    };

    const handleOnline = () => {
      setIsOnline(true);
      replayOfflineQueue()
        .then(() => fetchDeltaSync())
        .catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    listeners.add(updateStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      listeners.delete(updateStatus);
    };
  }, []);

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      await replayOfflineQueue();
      await fetchDeltaSync();
    } finally {
      setIsSyncing(false);
      setPendingCount(getOfflineQueue().length);
      setLastSyncedAt(localStorage.getItem(LAST_SYNC_KEY));
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncedAt,
    triggerSync,
    queueMutation: queueOfflineMutation,
  };
}
