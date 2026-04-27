import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { db } from '../../../services/database';
import { CardService } from '../../../services/cardService';
import { roundCents } from '../../../utils/money';
import { SyncService } from '../../../services/syncService';
import { CONFIG } from '../../../services/config';
import { calculateFichaTotals } from '../../../utils/calculations';

export interface CardItem {
  id: string;
  card_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  sold_quantity: number;
  returned_quantity: number;
  is_informed: boolean;
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
  cancelled?: boolean;
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

  // --- DERIVED STATS (Instant UI) ---
  const stats = useMemo(() => {
    return calculateFichaTotals(ficha, items, payments);
  }, [items, payments, ficha]);

  const normalizeFicha = (f: any) => {
    if (!f) return null;
    const norm = {
      ...f,
      id: f.id ?? f.card_id,
      code: f.code,
      status: f.status,
      total: f.total || 0,
      commissionPercent: f.commissionPercent ?? f.commission_percent ?? 30,
      discount: f.discount ?? f.discount ?? 0,
      items_locked: !!(f.itemsLocked || f.items_locked)
    };
    return norm;
  };

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
      const itemsMapped = localItems.map(i => ({
        ...i,
        is_informed: !!i.is_informed
      }));
      setItems(itemsMapped);

      const localPayments = await db.getAllAsync<CardPayment>(
        `SELECT p.*, m.name as method_name 
         FROM card_payments p 
         LEFT JOIN payment_methods m ON p.method_id = m.id 
         WHERE p.card_id = ? 
         ORDER BY p.payment_date DESC`,
        [cardId]
      );
      const paymentsMapped = localPayments.map(p => ({
        ...p,
        cancelled: !!p.cancelled
      }));
      setPayments(paymentsMapped);

      const localMethods = await db.getAllAsync<PaymentMethod>(
        `SELECT * FROM payment_methods WHERE active = 1 ORDER BY name ASC`
      );
      setMethods(localMethods);

      const localFichaRaw = await db.getFirstAsync<any>(
        `SELECT id, code, status, total, commission_percent, discount, items_locked FROM cards WHERE id = ?`,
        [cardId]
      );
      
      const normalizedFicha = normalizeFicha(localFichaRaw);
      setFicha(normalizedFicha);
      setItems(itemsMapped);
      setPayments(paymentsMapped);
      setMethods(localMethods);

      // NOVO: Desativa o loading logo após o carregamento local
      // Assim o usuário vê os itens instantaneamente enquanto o sync corre em background
      setLoading(false);
      console.log(`[Sync] Dados locais carregados para ficha ${cardId}`);

      // 2. SINCRONISMO (API)
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const API_URL = CONFIG.API_URL;

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
                sold_quantity: i.quantitySold || i.quantity_sold || 0,
                returned_quantity: i.quantityReturned || i.quantity_returned || 0,
                is_informed: !!(i.informed || i.is_informed),
                price: i.unitPrice || i.price || 0,
                type: (i.commissionType || i.type) === 'com_comissao' ? 'CC' : ((i.commissionType || i.type) === 'sem_comissao' ? 'SC' : (i.commissionType || i.type || 'CC')),
                subtotal: roundCents(i.subtotal || 0)
              }));

              const serverPayments = (serverFicha.payments || []).map((p: any) => ({
                id: p.id,
                card_id: cardId,
                method_id: p.methodId || p.method_id,
                method_name: p.methodName || p.method?.name || 'Método',
                amount: p.amount,
                payment_date: p.paymentDate || p.payment_date || p.createdAt || p.created_at,
                cancelled: !!p.cancelled
              }));

              // Persistir localmente com Sync Guard (Robusto)
              await db.withTransactionAsync(async () => {
                const pendingSyncItems = await db.getAllAsync<any>(
                  `SELECT data FROM sync_queue WHERE status = 'pending'`
                );
                
                const hasPendingThisFicha = pendingSyncItems.some(s => {
                  try {
                    const d = JSON.parse(s.data);
                    return d.card_id === cardId || d.cardId === cardId || d.id === cardId;
                  } catch (e) { return false; }
                });

                const lastManualRecord = await db.getFirstAsync<any>(
                    `SELECT last_manual_update FROM cards WHERE id = ?`,
                    [cardId]
                );
                const lastUpdate = lastManualRecord?.last_manual_update ? new Date(lastManualRecord.last_manual_update).getTime() : 0;
                const now = Date.now();
                const isRecentlyUpdatedLocally = (now - lastUpdate) < 30000; 

                if (!hasPendingThisFicha && !isRecentlyUpdatedLocally) {
                  // 1. Atualizar Itens
                  await db.runAsync(`DELETE FROM card_items WHERE card_id = ?`, [cardId]);
                  for (const i of normalizedItems) {
                    await db.runAsync(
                      `INSERT INTO card_items (id, card_id, product_id, product_name, quantity, sold_quantity, returned_quantity, is_informed, price, type, subtotal)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [i.id, i.card_id, i.product_id, i.product_name, i.quantity, i.sold_quantity, i.returned_quantity, i.is_informed ? 1 : 0, i.price, i.type, i.subtotal]
                    );
                  }

                  // 2. Atualizar Outros Campos da Ficha (menos total/status que o CardService resolve)
                  await db.runAsync(
                    `UPDATE cards SET code = ?, commission_percent = ?, discount = ?, items_locked = ? WHERE id = ?`,
                    [
                      serverFicha.code, 
                      serverFicha.commissionPercent ?? serverFicha.commission_percent ?? 30,
                      serverFicha.discount ?? 0,
                      (serverFicha.itemsLocked ?? serverFicha.items_locked) ? 1 : 0,
                      cardId
                    ]
                  );

                  // 3. Sincronizar Total e Status Localmente (Aplica a Regra de Ouro)
                  await CardService.syncLocalTotal(cardId);
                  
                  // 4. Recarregar Ficha Final do DB (Garante que o estado no React é o que salvamos no DB)
                  const [finalFicha] = await db.getAllAsync<any>(
                    `SELECT c.*, cl.name as clientName, cl.neighborhood as clientNeighborhood 
                     FROM cards c 
                     LEFT JOIN clients cl ON c.client_id = cl.id 
                     WHERE c.id = ?`,
                    [cardId]
                  );

                  setItems(normalizedItems);
                  setFicha(normalizeFicha(finalFicha));
                }
                
                // 2. Sincronizar Pagamentos
                const pendingPaymentIds = new Set<string>();
                const hasPendingPaymentsForThisCard = pendingSyncItems.some(s => {
                  try {
                    const d = JSON.parse(s.data);
                    if (d.card_id === cardId || d.cardId === cardId) {
                      // Se for cancelamento, guardamos o ID pra marcar no UI
                      const action = s.action || '';
                      if (action === 'PATCH_CANCEL_PAYMENT' && d.id) pendingPaymentIds.add(d.id);
                      return true;
                    }
                    return false;
                  } catch (e) { return false; }
                });

                if (!hasPendingPaymentsForThisCard) {
                  await db.runAsync(`DELETE FROM card_payments WHERE card_id = ?`, [cardId]);
                  for (const p of serverPayments) {
                    const isCancelledLocally = pendingPaymentIds.has(p.id);
                    await db.runAsync(
                      `INSERT INTO card_payments (id, card_id, method_id, amount, payment_date, cancelled)
                       VALUES (?, ?, ?, ?, ?, ?)`,
                      [p.id, p.card_id, p.method_id, p.amount, p.payment_date, (p.cancelled || isCancelledLocally) ? 1 : 0]
                    );
                  }
                  const finalPayments = serverPayments.map((p: CardPayment) => ({
                    ...p,
                    cancelled: p.cancelled || pendingPaymentIds.has(p.id)
                  }));
                  setPayments(finalPayments);
                }

                if (resMethods.ok) {
                    const methodsList = await resMethods.json();
                    for (const m of methodsList) {
                        await db.runAsync(`INSERT OR REPLACE INTO payment_methods (id, name, active) VALUES (?, ?, ?)`, [m.id, m.name, m.active ? 1 : 0]);
                    }
                    setMethods(methodsList.filter((m: any) => m.active));
                }
              });
              fetchGlobalProducts(token, tenantSlug, API_URL);
            }
          } catch (syncErr) {} finally { setLoading(false); }
        })();
      } else { setLoading(false); }
    } catch (e) { setLoading(false); }
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
              await db.runAsync(`INSERT OR REPLACE INTO products (id, sku, name, price_cc, price_sc, active) VALUES (?, ?, ?, ?, ?, ?)`, [p.id, p.sku, p.name, p.priceCC, p.priceSC, p.active ? 1 : 0]);
              if (sellerId) { await db.runAsync(`INSERT OR REPLACE INTO seller_inventory (id, seller_id, product_id, stock) VALUES (?, ?, ?, ?)`, [`${sellerId}-${p.id}`, sellerId, p.id, p.stock]); }
            }
          }
        });
      }
    } catch (e) {}
  };

  useEffect(() => { loadItems(); }, [cardId]);

  return { items, payments, methods, ficha, stats, loading, reload: loadItems };
};
