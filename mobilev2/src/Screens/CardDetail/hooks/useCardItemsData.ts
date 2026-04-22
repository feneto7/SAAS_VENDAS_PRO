import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { db } from '../../../services/database';

export interface CardItem {
  id: string;
  card_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  type: 'CC' | 'SC' | 'brinde';
  subtotal: number;
  isNew?: boolean; // Flag for local-first handling
}

export const useCardItemsData = (cardId: string | undefined) => {
  const [items, setItems] = useState<CardItem[]>([]);
  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    if (!cardId) return;
    
    // Set initial loading only if we have NO data yet for this card
    if (items.length === 0) setLoading(true);
    
    try {
      // 1. CARREGAMENTO LOCAL (SQlite) - PRIORIDADE ZERO 
      const localItems = await db.getAllAsync<CardItem>(
        `SELECT * FROM card_items WHERE card_id = ?`,
        [cardId]
      );
      setItems(localItems);

      const localFicha = await db.getFirstAsync<any>(
        `SELECT * FROM cards WHERE id = ?`,
        [cardId]
      );
      setFicha(localFicha);

      // Se já temos dados locais, já desativamos o loading inicial para a tela abrir rápido!
      if (localItems.length > 0 || localFicha) {
        setLoading(false);
      }

      // 2. SINCRONISMO (API) - SEGUNDO PLANO
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const userId = useAuthStore.getState().user?.id;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

      if (token && tenantSlug) {
        // Envolvemos em um bloco separado para não travar o loop principal em caso de timeout
        (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const [resItems, resFicha] = await Promise.all([
              fetch(`${API_URL}/api/fichas/${cardId}/items`, {
                headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug },
                signal: controller.signal
              }),
              fetch(`${API_URL}/api/fichas/${cardId}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug },
                signal: controller.signal
              })
            ]);
            clearTimeout(timeoutId);

            if (resItems.ok && resFicha.ok) {
              const serverItems = await resItems.json();
              const serverFicha = await resFicha.json();
              
              const normalizedItems = serverItems.map((i: any) => ({
                id: i.id,
                card_id: cardId,
                product_id: i.productId || i.product_id || 'unknown',
                product_name: i.name || i.productName || i.product_name || i.product?.name || 'Produto s/ Nome',
                quantity: i.quantity || 0,
                price: i.unitPrice || i.price || 0,
                type: (i.commissionType || i.type || 'CC') === 'com_comissao' ? 'CC' : ((i.commissionType || i.type) === 'sem_comissao' ? 'SC' : (i.commissionType || i.type || 'CC')),
                subtotal: i.subtotal || 0
              }));

              // Persistir localmente e atualizar estado
              await db.withTransactionAsync(async () => {
                await db.runAsync(
                  `UPDATE cards SET total = ?, status = ?, code = ? WHERE id = ?`,
                  [serverFicha.total || 0, serverFicha.status, serverFicha.code, cardId]
                );
                await db.runAsync(`DELETE FROM card_items WHERE card_id = ?`, [cardId]);
                for (const i of normalizedItems) {
                  await db.runAsync(
                    `INSERT INTO card_items (id, card_id, product_id, product_name, quantity, price, type, subtotal)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [i.id, i.card_id, i.product_id, i.product_name, i.quantity, i.price, i.type, i.subtotal]
                  );
                }
              });
              
              setItems(normalizedItems);
              setFicha(serverFicha);
              
              // Sincroniza produtos globais
              fetchGlobalProducts(token, tenantSlug, API_URL);
            }
          } catch (syncErr) {
            console.log('[DEBUG] Background refresh failed for card:', cardId, syncErr);
          } finally {
            setLoading(false); // Garante que o loading sai mesmo que a API demore
          }
        })();
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.log(`[DEBUG] Critical failure in loadItems:`, e);
      setLoading(false);
    }
  };

  const fetchGlobalProducts = async (token: string, slug: string, baseUrl: string) => {
    try {
      const sellerId = useAuthStore.getState().user?.id;
      const url = `${baseUrl}/api/products?limit=1000${sellerId ? `&sellerId=${sellerId}` : ''}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug }
      });
      if (res.ok) {
        const { items: pList } = await res.json();

        await db.withTransactionAsync(async () => {
          for (const p of pList) {
            // Only sync products that the seller actually has in stock
            // to keep the app light and avoid deposit stock leak.
            if (p.stock > 0) {
              await db.runAsync(
                `INSERT OR REPLACE INTO products (id, sku, name, price_cc, price_sc, active) VALUES (?, ?, ?, ?, ?, ?)`,
                [p.id, p.sku, p.name, p.priceCC, p.priceSC, p.active ? 1 : 0]
              );
              if (sellerId) {
                await db.runAsync(
                  `INSERT OR REPLACE INTO seller_inventory (id, seller_id, product_id, stock) VALUES (?, ?, ?, ?)`,
                  [`${sellerId}-${p.id}`, sellerId, p.id, p.stock]
                );
              }
            } else {
              // Optionally remove items that no longer have stock
              // await db.runAsync(`DELETE FROM products WHERE id = ?`, [p.id]);
            }
          }
        });
      }
    } catch (e) {
      console.log('Global products sync failed:', e);
    }
  };

  useEffect(() => {
    loadItems();
  }, [cardId]);

  return { items, ficha, loading, reload: loadItems };
};
