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
  isNew?: boolean; 
}

export interface CardPayment {
  id: string;
  card_id: string;
  method_id: string;
  method_name?: string;
  amount: number;
  payment_date: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
}

export const useCardItemsData = (cardId: string | undefined) => {
  const [items, setItems] = useState<CardItem[]>([]);
  const [payments, setPayments] = useState<CardPayment[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    if (!cardId) return;
    
    if (items.length === 0) setLoading(true);
    
    try {
      // 1. CARREGAMENTO LOCAL (SQlite)
      const localItems = await db.getAllAsync<CardItem>(
        `SELECT ci.*, p.name as product_name 
         FROM card_items ci 
         JOIN products p ON ci.product_id = p.id 
         WHERE ci.card_id = ?`,
        [cardId]
      );
      setItems(localItems);

      const localPayments = await db.getAllAsync<CardPayment>(
        `SELECT p.*, m.name as method_name 
         FROM card_payments p 
         LEFT JOIN payment_methods m ON p.method_id = m.id 
         WHERE p.card_id = ? 
         ORDER BY p.payment_date DESC`,
        [cardId]
      );
      setPayments(localPayments);

      const localMethods = await db.getAllAsync<PaymentMethod>(
        `SELECT * FROM payment_methods WHERE active = 1 ORDER BY name ASC`
      );
      setMethods(localMethods);

      const localFicha = await db.getFirstAsync<any>(
        `SELECT id, code, status, total, commission_percent as commissionPercent, discount FROM cards WHERE id = ?`,
        [cardId]
      );
      setFicha(localFicha);

      if (localItems.length > 0 || localFicha) {
        setLoading(false);
      }

      // 2. SINCRONISMO (API)
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

      if (token && tenantSlug) {
        (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          try {
            const [resItems, resFicha, resMethods] = await Promise.all([
              fetch(`${API_URL}/api/fichas/${cardId}/items`, {
                headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug },
                signal: controller.signal
              }),
              fetch(`${API_URL}/api/fichas/${cardId}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug },
                signal: controller.signal
              }),
              fetch(`${API_URL}/api/settings/payments`, {
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
                product_id: i.productId || i.product_id,
                product_name: i.productName || i.product?.name || i.name || 'Produto',
                quantity: i.quantity || 0,
                price: i.unitPrice || i.price || 0,
                type: (i.commissionType || i.type) === 'com_comissao' ? 'CC' : ((i.commissionType || i.type) === 'sem_comissao' ? 'SC' : (i.commissionType || i.type || 'CC')),
                subtotal: i.subtotal || 0
              }));

              const serverPayments = (serverFicha.payments || []).map((p: any) => ({
                id: p.id,
                card_id: cardId,
                method_id: p.methodId || p.method_id,
                method_name: p.methodName || p.method?.name || 'Método',
                amount: p.amount,
                payment_date: p.paymentDate || p.payment_date || p.createdAt || p.created_at
              }));

              // Persistir localmente
              await db.withTransactionAsync(async () => {
                // Sincronizar Ficha
                await db.runAsync(
                  `UPDATE cards SET total = ?, status = ?, code = ?, commission_percent = ?, discount = ? WHERE id = ?`,
                  [
                    serverFicha.total || 0, 
                    serverFicha.status, 
                    serverFicha.code, 
                    serverFicha.commissionPercent ?? serverFicha.commission_percent ?? 30,
                    serverFicha.discount ?? 0,
                    cardId
                  ]
                );
                
                // Sincronizar Itens - APENAS SE NÃO HOUVER PENDÊNCIAS NA FILA PARA ESTA FICHA
                // Isso evita que um produto recém adicionado (offline) seja apagado pelo sync 
                // antes mesmo de ser enviado ao servidor.
                const pendingSync = await db.getAllAsync<any>(
                  `SELECT id, data FROM sync_queue WHERE table_name = 'card_items' AND action IN ('POST_ITEM', 'PATCH_ITEM', 'DELETE_ITEM')`
                );
                
                const hasPendingThisCard = pendingSync.some(s => {
                  try {
                    const d = JSON.parse(s.data);
                    return d.card_id === cardId || d.cardId === cardId || (d.payload && d.payload.cardId === cardId);
                  } catch (e) { return false; }
                });

                if (!hasPendingThisCard) {
                  await db.runAsync(`DELETE FROM card_items WHERE card_id = ?`, [cardId]);
                  for (const i of normalizedItems) {
                    await db.runAsync(
                      `INSERT INTO card_items (id, card_id, product_id, product_name, quantity, price, type, subtotal)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                      [i.id, i.card_id, i.product_id, i.product_name, i.quantity, i.price, i.type, i.subtotal]
                    );
                  }
                  setItems(normalizedItems);
                } else {
                  console.log(`[SYNC] Pula overwrite de itens pois existem alterações pendentes para card ${cardId}`);
                }
                // Sincronizar Pagamentos - MESMA LÓGICA DE PROTEÇÃO
                const pendingPayments = await db.getAllAsync<any>(
                  `SELECT id, data FROM sync_queue WHERE action = 'POST_PAYMENT'`
                );
                
                const hasPendingPaymentsThisCard = pendingPayments.some(s => {
                  try {
                    const d = JSON.parse(s.data);
                    return d.card_id === cardId || d.cardId === cardId;
                  } catch (e) { return false; }
                });

                if (!hasPendingPaymentsThisCard) {
                  await db.runAsync(`DELETE FROM card_payments WHERE card_id = ?`, [cardId]);
                  for (const p of serverPayments) {
                    await db.runAsync(
                      `INSERT INTO card_payments (id, card_id, method_id, amount, payment_date)
                       VALUES (?, ?, ?, ?, ?)`,
                      [p.id, p.card_id, p.method_id, p.amount, p.payment_date]
                    );
                  }
                } else {
                  console.log(`[SYNC] Pula overwrite de pagamentos pois existem alterações pendentes para card ${cardId}`);
                }

                // Sincronizar Métodos se recebemos 200
                if (resMethods.ok) {
                    const methodsList = await resMethods.json();
                    for (const m of methodsList) {
                        await db.runAsync(
                            `INSERT OR REPLACE INTO payment_methods (id, name, active) VALUES (?, ?, ?)`,
                            [m.id, m.name, m.active ? 1 : 0]
                        );
                    }
                    setMethods(methodsList.filter((m: any) => m.active));
                }
              });
              
              setItems(normalizedItems);
              setPayments(serverPayments);
              setFicha(serverFicha);
              fetchGlobalProducts(token, tenantSlug, API_URL);
            }
          } catch (syncErr) {
            console.log('[DEBUG] Sync failed:', syncErr);
          } finally {
            setLoading(false);
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
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug } });
      if (res.ok) {
        const { items: pList } = await res.json();
        await db.withTransactionAsync(async () => {
          for (const p of pList) {
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
            }
          }
        });
      }
    } catch (e) {}
  };

  useEffect(() => { loadItems(); }, [cardId]);

  return { items, payments, methods, ficha, loading, reload: loadItems };
};
