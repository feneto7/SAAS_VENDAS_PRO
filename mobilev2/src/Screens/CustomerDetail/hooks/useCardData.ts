import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { db } from '../../../services/database';
import { CONFIG } from '../../../services/config';

export interface Card {
  id: string;
  code: string;
  type: number;
  status: string;
  total: number;
  sale_date: string;
  client_id: string;
  created_at: string;
  gross_total?: number;
}

export const useCardData = (clientId: string | undefined, status: string) => {
  const [items, setItems] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefreshing = false) => {
    if (!clientId) return;
    
    // Only set loading if list is empty
    if (!isRefreshing && items.length === 0) setLoading(true);
    if (isRefreshing) setRefreshing(true);
    
    const targetType = status === 'pedido' ? 2 : 1;

    try {
      // 1. CARREGAMENTO LOCAL (Garante exibição instantânea)
      const localData = await db.getAllAsync<Card>(
        `SELECT c.*, 
          (SELECT COALESCE(SUM(
            CASE WHEN (c.status = 'pendente' OR c.status = 'paga') AND ci.is_informed = 1 
            THEN ci.sold_quantity * ci.price
            ELSE ci.quantity * ci.price END
          ), 0) FROM card_items ci WHERE ci.card_id = c.id) as gross_total
         FROM cards c 
         WHERE c.client_id = ? AND c.status = ? AND c.type = ? ORDER BY c.created_at DESC`,
        [clientId, status, targetType]
      );
      setItems(localData);
      
      // Libera o loading se já temos algo local
      if (localData.length > 0) setLoading(false);

      // 2. SINCRONISMO BACKGROUND
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const API_URL = CONFIG.API_URL;

      if (token && tenantSlug && clientId) {
        (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          try {
            const res = await fetch(`${API_URL}/api/cards?clientId=${clientId}&limit=500`, {
              headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug },
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              const serverItems = data.items || [];
              
              // Normalizar dados da API (camelCase para snake_case)
              const normalizedItems = serverItems.map((f: any) => ({
                id: f.id,
                code: f.code ? String(f.code) : f.id.split('-')[0].toUpperCase(),
                type: f.type ?? (f.status === 'pedido' ? 2 : 1),
                status: f.status,
                total: f.total,
                sale_date: f.saleDate || f.sale_date,
                client_id: f.clientId || f.client_id,
                seller_id: f.sellerId || f.seller_id,
                route_id: f.routeId || f.route_id,
                charge_id: f.collectionId || f.cobranca_id,
                created_at: f.createdAt || f.created_at || new Date().toISOString()
              }));

              // --- SYNC GUARD: Proteger total local recalculado ---
              const pendingSync = await db.getAllAsync<any>(
                `SELECT data FROM sync_queue WHERE status = 'pending'`
              );

              // Salvar localmente apenas cards que NÃO têm edições locais pendentes
              await db.withTransactionAsync(async () => {
                for (const f of normalizedItems) {
                  const isCardPending = pendingSync.some(s => {
                    try {
                      const d = JSON.parse(s.data);
                      const cid = d.card_id || d.id || d.cardId;
                      return cid === f.id;
                    } catch (e) { return false; }
                  });

                  const [localCard] = await db.getAllAsync<any>(`SELECT items_locked FROM cards WHERE id = ?`, [f.id]);
                  const finalLocked = (f.itemsLocked || (localCard && localCard.items_locked)) ? 1 : 0;

                  if (!isCardPending) {
                    await db.runAsync(
                      `INSERT OR REPLACE INTO cards (id, code, type, status, total, sale_date, client_id, seller_id, route_id, charge_id, created_at, items_locked, commission_percent, discount, last_manual_update)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [f.id, f.code, f.type, f.status, f.total, f.sale_date, f.client_id, f.seller_id, f.route_id, f.charge_id, f.created_at, finalLocked, f.commissionPercent || 30, f.discount || 0, new Date().toISOString()]
                    );
                  } else {
                     console.log(`[SYNC] Skipping update for card ${f.id} due to pending local changes`);
                  }
                }
              });

              // RE-CARREGA DO BANCO PARA PEGAR O TOTAL CALCULADO VIA TRIGGER OU QUERY LOCAL
              const updatedLocalData = await db.getAllAsync<Card>(
                `SELECT c.*, 
                  (SELECT COALESCE(SUM(
                    CASE WHEN (c.status = 'pendente' OR c.status = 'paga') AND ci.is_informed = 1 
                    THEN ci.sold_quantity * ci.price
                    ELSE ci.quantity * ci.price END
                  ), 0) FROM card_items ci WHERE ci.card_id = c.id) as gross_total
                 FROM cards c 
                 WHERE c.client_id = ? AND c.status = ? AND c.type = ? ORDER BY c.created_at DESC`,
                [clientId, status, targetType]
              );
              setItems(updatedLocalData);
            }
          } catch (syncErr) {
            console.log('[DEBUG] Background sync failed (cards):', syncErr);
          } finally {
            setLoading(false);
            setRefreshing(false);
          }
        })();
      } else {
        setLoading(false);
        setRefreshing(false);
      }
    } catch (e) {
      console.log(`[DEBUG] Critical failure in loadData:`, e);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId, status]);

  return { items, loading, refreshing, refresh: () => loadData(true) };
};
