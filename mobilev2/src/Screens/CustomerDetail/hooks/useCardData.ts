import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { db } from '../../../services/database';

export interface Card {
  id: string;
  code: string;
  status: string;
  total: number;
  sale_date: string;
  client_id: string;
  created_at: string;
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
    
    try {
      // 1. CARREGAMENTO LOCAL (Garante exibição instantânea)
      const localData = await db.getAllAsync<Card>(
        `SELECT * FROM cards WHERE client_id = ? AND status = ? ORDER BY created_at DESC`,
        [clientId, status]
      );
      setItems(localData);
      
      // Libera o loading se já temos algo local
      if (localData.length > 0) setLoading(false);

      // 2. SINCRONISMO BACKGROUND
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

      if (token && tenantSlug && clientId) {
        (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const res = await fetch(`${API_URL}/api/clients/${clientId}/fichas`, {
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
                code: String(f.code),
                status: f.status,
                total: f.total,
                sale_date: f.saleDate || f.sale_date,
                client_id: f.clientId || f.client_id,
                seller_id: f.sellerId || f.seller_id,
                route_id: f.routeId || f.route_id,
                charge_id: f.cobrancaId || f.cobranca_id,
                created_at: f.createdAt || f.created_at || new Date().toISOString()
              }));

              // Salvar localmente
              await db.withTransactionAsync(async () => {
                for (const f of normalizedItems) {
                  await db.runAsync(
                    `INSERT INTO cards (id, code, status, total, sale_date, client_id, seller_id, route_id, charge_id, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET 
                     code=excluded.code,
                     status=excluded.status, 
                     total=excluded.total, 
                     sale_date=excluded.sale_date`,
                    [f.id, f.code, f.status, f.total, f.sale_date, f.client_id, f.seller_id, f.route_id, f.charge_id, f.created_at]
                  );
                }
              });

              setItems(normalizedItems);
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
