import { execute, queryAll, getDb, queryFirst } from '../db';
import * as Crypto from 'expo-crypto';

export interface SyncQueueItem {
  id: number;
  operation: string;
  endpoint: string;
  method: string;
  payload: string;
  attempts: number;
}

export class SyncService {
  private static isSyncing = false;

  static generateUUID(): string {
    return Crypto.randomUUID();
  }

  /**
   * Add an operation to the sync queue
   */
  static async enqueue(operation: string, endpoint: string, method: string, payload: any) {
    await execute(
      'INSERT INTO sync_queue (operation, endpoint, method, payload) VALUES (?, ?, ?, ?)',
      [operation, endpoint, method, JSON.stringify(payload)]
    );
    // Try to process immediately if online (optional, will be handled by background sync too)
    this.processQueue();
  }

  /**
   * Process all pending items in the sync queue
   */
  static async processQueue() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const items = await queryAll<SyncQueueItem>('SELECT * FROM sync_queue ORDER BY id ASC');
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          const result = await this.syncItem(item);
          if (result.success) {
            await execute('DELETE FROM sync_queue WHERE id = ?', [item.id]);
            
            if (result.data) {
              await this.handleSyncResponse(item.operation, result.data);
            }
          } else {
            console.warn(`[Sync] Item ${item.id} (${item.operation}) failed. Halting queue. Error:`, result.error);
            // Increment attempts and save error
            await execute(
              'UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?',
              [result.error || 'Unknown error', item.id]
            );
            // BREAK the loop to ensure dependencies are respected
            break; 
          }
        } catch (err: any) {
          console.error(`[Sync] Exception syncing item ${item.id}:`, err);
          break; // Stop on unexpected exceptions too
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private static async handleSyncResponse(operation: string, data: any) {
    try {
      if (!data) return;

      if (operation === 'CREATE_CLIENT') {
        const c = data;
        await execute(
          `UPDATE clients SET code = ? WHERE id = ?`,
          [c.code, c.id]
        );
      } else if (operation === 'CREATE_FICHA' || operation === 'SETTLE_FICHA') {
        const f = data;
        await execute(
          `UPDATE fichas SET code = ?, status = ? WHERE id = ?`,
          [f.code, f.status, f.id]
        );
      } else if (operation === 'CREATE_TRIP') {
        const t = data;
        await execute(
          `UPDATE cobrancas SET code = ?, status = ? WHERE id = ?`,
          [t.code, t.status, t.id]
        );
      }
    } catch (err) {
      console.warn('[Sync] Failed to process sync response:', err);
    }
  }

  private static async syncItem(item: SyncQueueItem): Promise<{success: boolean, data?: any, error?: string}> {
    const apiURL = process.env.EXPO_PUBLIC_API_URL;
    const tenantSlug = await this.getLocalSetting('tenantSlug');

    try {
      const res = await fetch(`${apiURL}${item.endpoint}`, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug || ''
        },
        body: item.payload
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      
      const errorText = await res.text();
      return { success: false, error: errorText };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Download master data from server and update local database
   */
  static async downloadMasterData(tenantSlug: string, sellerId?: string) {
    const apiURL = process.env.EXPO_PUBLIC_API_URL;
    console.log(`[Sync] Starting full master data download for ${tenantSlug} (Seller: ${sellerId})`);
    
    try {
      const headers = { 'x-tenant-slug': tenantSlug };
      const query = sellerId ? `&sellerId=${sellerId}` : '';

      // 1. Sync Clients
      console.log('[Sync] Fetching clients...');
      const resClients = await fetch(`${apiURL}/api/clients?limit=1000${query}`, { headers });
      if (resClients.ok) {
        const data = await resClients.json();
        await this.updateLocalClients(data?.items || (Array.isArray(data) ? data : []));
      }

      // 2. Sync Products
      console.log('[Sync] Fetching products...');
      const resProducts = await fetch(`${apiURL}/api/products?limit=1000${query}`, { headers });
      if (resProducts.ok) {
        const data = await resProducts.json();
        await this.updateLocalProducts(data?.items || (Array.isArray(data) ? data : []));
      }

      // 3. Sync Payment Methods
      console.log('[Sync] Fetching payment methods...');
      const resPm = await fetch(`${apiURL}/api/settings/payments`, { headers });
      if (resPm.ok) {
        const pm = await resPm.json();
        await this.updateLocalPaymentMethods(Array.isArray(pm) ? pm : []);
      }

      // 4. Sync Routes
      console.log('[Sync] Fetching routes...');
      const resRoutes = await fetch(`${apiURL}/api/routes`, { headers });
      if (resRoutes.ok) {
        const data = await resRoutes.json();
        await this.updateLocalRoutes(data?.items || (Array.isArray(data) ? data : []));
      }

      // 5. Sync Trips
      console.log('[Sync] Fetching trips...');
      const resTrips = await fetch(`${apiURL}/api/cobrancas`, { headers });
      if (resTrips.ok) {
        const data = await resTrips.json();
        await this.updateLocalTrips(data?.items || (Array.isArray(data) ? data : []));
      }

      // 6. Sync Fichas
      console.log('[Sync] Fetching fichas...');
      const resFichas = await fetch(`${apiURL}/api/fichas?limit=1000${query}`, { headers });
      if (resFichas.ok) {
        const data = await resFichas.json();
        await this.updateLocalFichas(data?.items || (Array.isArray(data) ? data : []));
      }

      // 7. Sync Ficha Items
      console.log('[Sync] Fetching ficha items...');
      const resItems = await fetch(`${apiURL}/api/ficha-items?limit=2000${query}`, { headers });
      if (resItems.ok) {
        const data = await resItems.json();
        await this.updateLocalFichaItems(Array.isArray(data) ? data : []);
      }

      // 8. Sync Payments
      console.log('[Sync] Fetching payments...');
      const resPayments = await fetch(`${apiURL}/api/payments?limit=1000${query}`, { headers });
      if (resPayments.ok) {
        const data = await resPayments.json();
        await this.updateLocalPayments(Array.isArray(data) ? data : []);
      }

      await this.setLocalSetting('lastSync', new Date().toISOString());
      await this.setLocalSetting('tenantSlug', tenantSlug);
      if (sellerId) await this.setLocalSetting('sellerId', sellerId);
      console.log('[Sync] Full synchronization completed successfully');
      
    } catch (err: any) {
      console.warn('[Sync] Master download failed:', err.message || err);
    }
  }

  private static async updateLocalClients(clients: any[]) {
    console.log(`[Sync] Updating ${clients?.length || 0} clients locally`);
    if (!Array.isArray(clients)) return;
    
    for (let i = 0; i < clients.length; i++) {
        const c = clients[i];
        if (!c || !c.id) continue;
        try {
          await execute(
            `INSERT OR REPLACE INTO clients (id, code, name, cpf, phone, street, number, neighborhood, city, state, zip_code, route_id, active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [c.id, c.code, c.name, c.cpf, c.phone, c.street, c.number, c.neighborhood, c.city, c.state, c.zipCode, c.routeId, c.active ? 1 : 0, c.createdAt]
          );
        } catch (err) {
          console.error(`[Sync] Failed to insert client ${c?.id}:`, err);
        }
    }
  }

  private static async updateLocalRoutes(routes: any[]) {
    console.log(`[Sync] Updating ${routes?.length || 0} routes locally`);
    if (!Array.isArray(routes)) return;

    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      try {
        await execute(
          `INSERT OR REPLACE INTO routes (id, code, name, description, periodicity, active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.code, r.name, r.description, r.periodicity, r.active ? 1 : 0, r.createdAt]
        );
      } catch (err) {
        console.error(`[Sync] Failed to insert route ${r?.id}:`, err);
      }
    }
  }

  private static async updateLocalTrips(trips: any[]) {
    console.log(`[Sync] Updating ${trips?.length || 0} trips locally`);
    if (!Array.isArray(trips)) return;

    for (let i = 0; i < trips.length; i++) {
      const t = trips[i];
      try {
        await execute(
          `INSERT OR REPLACE INTO cobrancas (id, code, route_id, seller_id, status, start_date, end_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.code, t.routeId, t.sellerId, t.status, t.startDate, t.endDate, t.createdAt, t.updatedAt]
        );
      } catch (err) {
        console.error(`[Sync] Failed to insert trip ${t?.id}:`, err);
      }
    }
  }

  public static async updateLocalProducts(products: any[]) {
    if (!Array.isArray(products)) return;
    console.log(`[Sync] Updating ${products.length} products locally`);

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        try {
            // Log structure of the first item to verify API keys
            if (i === 0) {
              console.log('[Sync] Product sample keys:', Object.keys(p));
              console.log('[Sync] Product[0] values:', JSON.stringify({
                  id: p.id,
                  stock: p.stock,
                  priceCC: p.priceCC
              }));
            }

            await execute(
                `INSERT OR REPLACE INTO products (id, sku, name, description, category, brand, stock, cost_price, price_cc, price_sc, active, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    p.id, 
                    p.sku || '', 
                    p.name, 
                    p.description || '', 
                    p.category || '', 
                    p.brand || '', 
                    Number(p.stock) || 0, 
                    Number(p.costPrice) || 0, 
                    Number(p.priceCC) || 0, 
                    Number(p.priceSC) || 0, 
                    p.active !== false ? 1 : 0, 
                    p.createdAt || new Date().toISOString()
                ]
            );
        } catch (err) {
            console.error(`[Sync] Failed to insert product ${p?.id}:`, err);
        }
    }
  }

  private static async updateLocalFichas(fichas: any[]) {
    console.log(`[Sync] Updating ${fichas?.length || 0} fichas locally`);
    if (!Array.isArray(fichas)) return;

    for (const f of fichas) {
      if (!f || !f.id) continue;
      try {
        await execute(
          `INSERT OR REPLACE INTO fichas (id, code, status, total, notes, sale_date, client_id, seller_id, route_id, cobranca_id, discount, commission_percent, created_at, updated_at, is_local, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
          [
            f.id, 
            String(f.code || ''), 
            f.status, 
            Number(f.total) || 0, 
            f.notes || '', 
            f.saleDate, 
            f.clientId, 
            f.sellerId, 
            f.routeId, 
            f.cobrancaId || null, 
            Number(f.discount) || 0, 
            Number(f.commissionPercent) || 0, 
            f.createdAt, 
            f.updatedAt
          ]
        );
      } catch (err) {
        console.error(`[Sync] Failed to insert ficha ${f?.id}:`, err);
      }
    }
  }

  private static async updateLocalFichaItems(items: any[]) {
    console.log(`[Sync] Updating ${items?.length || 0} ficha items locally`);
    if (!Array.isArray(items)) return;

    for (const i of items) {
      if (!i || !i.id) continue;
      try {
        await execute(
          `INSERT OR REPLACE INTO ficha_items (id, ficha_id, product_id, quantity, quantity_sold, quantity_returned, unit_price, subtotal, commission_type, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            i.id, 
            i.fichaId, 
            i.productId, 
            Number(i.quantity) || 0, 
            Number(i.quantitySold) || 0, 
            Number(i.quantityReturned) || 0, 
            Number(i.unitPrice) || 0, 
            Number(i.subtotal) || 0, 
            i.commissionType || 'CC', 
            i.createdAt
          ]
        );
      } catch (err) {
        console.error(`[Sync] Failed to insert item ${i?.id}:`, err);
      }
    }
  }

  private static async updateLocalPayments(payments: any[]) {
    console.log(`[Sync] Updating ${payments?.length || 0} payments locally`);
    if (!Array.isArray(payments)) return;

    for (const p of payments) {
      if (!p || !p.id) continue;
      try {
        await execute(
          `INSERT OR REPLACE INTO payments (id, ficha_id, method_id, amount, payment_date, cancelled, created_at, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'synced')`,
          [
            p.id, 
            p.fichaId, 
            p.methodId, 
            Number(p.amount) || 0, 
            p.paymentDate, 
            p.cancelled ? 1 : 0, 
            p.createdAt || new Date().toISOString()
          ]
        );
      } catch (err) {
        console.error(`[Sync] Failed to insert payment ${p?.id}:`, err);
      }
    }
  }

  private static async updateLocalPaymentMethods(methods: any[]) {
    console.log(`Updating ${methods?.length || 0} payment methods locally`);
    if (!Array.isArray(methods)) {
        console.warn('Methods is not an array:', typeof methods);
        return;
    }

    for (let i = 0; i < methods.length; i++) {
      const m = methods[i];
      try {
        await execute(
          `INSERT OR REPLACE INTO payment_methods (id, name, active) VALUES (?, ?, ?)`,
          [m.id, m.name, m.active ? 1 : 0]
        );
      } catch (err) {
        console.error('Failed to insert payment method:', m?.id, err);
      }
    }
  }

  static async getLocalSetting(key: string): Promise<string | null> {
    const res = await queryAll<{value: string}>('SELECT value FROM local_settings WHERE key = ?', [key]);
    return res.length > 0 ? res[0].value : null;
  }

  static async setLocalSetting(key: string, value: string) {
    await execute('INSERT OR REPLACE INTO local_settings (key, value) VALUES (?, ?)', [key, value]);
  }
}
