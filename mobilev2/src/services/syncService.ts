import { db } from './database';
import { useAuthStore } from '../stores/useAuthStore';

export interface SyncItem {
  id: string;
  action: string;
  table_name: string;
  data: string;
  status: 'pending' | 'syncing' | 'failed';
  created_at?: string;
}

let isInitialized = false;
let isProcessingQueue = false;

export const SyncService = {
  /**
   * Adds an action to the sync queue
   */
  async enqueue(action: string, tableName: string, data: any) {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const dataStr = JSON.stringify(data);

    try {
      await db.runAsync(
        `INSERT INTO sync_queue (id, action, table_name, data, status) VALUES (?, ?, ?, ?, ?)`,
        [id, action, tableName, dataStr, 'pending']
      );
      // Attempt background sync but don't await it
      this.processQueue().catch(() => {});
    } catch (err: any) {
      console.error('[SERVER ERROR] /api/fichas POST:', err);
      return { 
        error: "Failed to create ficha", 
        detail: err.message,
        stack: err.stack 
      };
    }
  },

  /**
   * Initializes periodic sync check
   */
  init() {
    if (isInitialized) return;
    isInitialized = true;



    // Retry every 30 seconds
    setInterval(() => {
      this.processQueue().catch(() => {});
    }, 30000);
    
    // Initial process
    this.processQueue().catch(() => {});
  },

  /**
   * Processes all pending sync tasks
   */
  async processQueue() {
    if (isProcessingQueue) return;
    
    const token = useAuthStore.getState().token;
    const tenantSlug = useAuthStore.getState().tenant?.slug;
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

    if (!token || !tenantSlug) return;

    isProcessingQueue = true;

    try {
      // Get pending or failed items
      const pending = await db.getAllAsync<SyncItem>(
        `SELECT * FROM sync_queue WHERE status = 'pending' OR status = 'failed' ORDER BY created_at ASC LIMIT 50`
      );

      if (pending.length === 0) {
        isProcessingQueue = false;
        return;
      }

      for (const item of pending) {
        try {
          await db.runSync(`UPDATE sync_queue SET status = 'syncing' WHERE id = ?`, [item.id]);

          const data = JSON.parse(item.data);
          let success = false;

          // Route actions
          if (item.action === 'PATCH_ITEM' && item.table_name === 'card_items') {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s for sync
            
            try {
              const res = await fetch(`${API_URL}/api/ficha-items/${data.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'x-tenant-slug': tenantSlug
                },
                body: JSON.stringify(data.payload),
                signal: controller.signal
              });
              success = res.ok;
            } finally {
              clearTimeout(timeoutId);
            }
          } else if (item.action === 'POST_ITEM' && item.table_name === 'card_items') {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
              const res = await fetch(`${API_URL}/api/fichas/${data.card_id}/items`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'x-tenant-slug': tenantSlug
                },
                body: JSON.stringify({
                  id: data.id,
                  productId: data.product_id,
                  quantity: data.quantity,
                  unitPrice: data.price,
                  subtotal: data.subtotal,
                  commissionType: data.type || 'CC' // Send 'CC', 'SC' or 'brinde' directly
                }),
                signal: controller.signal
              });
              success = res.ok;
            } finally {
              clearTimeout(timeoutId);
            }
          } else if (item.action === 'POST_FICHA' && item.table_name === 'cards') {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {

              const res = await fetch(`${API_URL}/api/fichas`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'x-tenant-slug': tenantSlug
                },
                body: JSON.stringify({
                  id: data.id,
                  clientId: data.clientId,
                  sellerId: data.sellerId,
                  routeId: data.routeId,
                  total: data.total || 0,
                  status: data.status || 'nova',
                  saleDate: data.saleDate,
                  items: data.items || []
                }),
                signal: controller.signal
              });
              success = res.ok;
              if (!success) {
                const errText = await res.text();
                let errDetail = errText;
                try {
                   const errJson = JSON.parse(errText);
                   errDetail = JSON.stringify(errJson, null, 2);
                } catch(e) {}
                console.error(`[SYNC] POST_FICHA failed: ${res.status}`, errDetail);
              }
            } finally {
              clearTimeout(timeoutId);
            }
          } else if (item.action === 'POST_PAYMENT') {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
              const res = await fetch(`${API_URL}/api/fichas/${data.card_id}/payments`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'x-tenant-slug': tenantSlug
                },
                body: JSON.stringify({
                  id: data.id,
                  methodId: data.method_id,
                  amount: data.amount,
                }),
                signal: controller.signal
              });
              success = res.ok;
            } finally {
              clearTimeout(timeoutId);
            }
          } else if (item.action === 'PATCH_FICHA_SETTLE' && item.table_name === 'cards') {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
              const res = await fetch(`${API_URL}/api/fichas/${data.id}/settle`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'x-tenant-slug': tenantSlug
                },
                body: JSON.stringify({
                   commissionPercent: data.commissionPercent,
                   discount: data.discount,
                   items: data.items || []
                }),
                signal: controller.signal
              });
              success = res.ok;
            } finally {
              clearTimeout(timeoutId);
            }
          }

          if (item.action === 'POST_CLIENT') {
            const data = JSON.parse(item.data);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
              const res = await fetch(`${API_URL}/api/clients`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'x-tenant-slug': tenantSlug
                },
                body: JSON.stringify(data),
                signal: controller.signal
              });

              if (res.ok) {
                success = true;
              } else {
                let errDetail = '';
                try {
                   const errText = await res.text();
                   const errJson = JSON.parse(errText);
                   errDetail = JSON.stringify(errJson, null, 2);
                } catch(e) {}
                console.error(`[SYNC] POST_CLIENT failed: ${res.status}`, errDetail);
              }
            } finally {
              clearTimeout(timeoutId);
            }
          }

          if (success) {
            await db.runSync(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);

          } else {
            await db.runSync(`UPDATE sync_queue SET status = 'failed' WHERE id = ?`, [item.id]);
          }
        } catch (e) {
          console.log(`[SYNC] Item ${item.id} failed:`, e);
          await db.runSync(`UPDATE sync_queue SET status = 'failed' WHERE id = ?`, [item.id]);
        }
      }
    } catch (err) {
      console.log('[SYNC] Global loop error:', err);
    } finally {
      isProcessingQueue = false;
    }
  }
};
