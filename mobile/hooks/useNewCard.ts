import { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTenant } from '@/lib/TenantContext';
import { formatCurrencyBRL } from '@/lib/utils/money';

export interface CardItem {
  id: string; 
  productId: string;
  name: string;
  type: 'CC' | 'SC' | 'BRINDE';
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

import { execute } from '@/lib/db';
import { SyncService } from '@/lib/sync/syncService';

export function useNewCard() {
  const { clientId } = useLocalSearchParams();
  const { tenantSlug, activeTrip, seller } = useTenant();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CardItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const addItem = (item: any) => {
    const newItem: CardItem = {
      ...item,
      id: SyncService.generateUUID(),
    };
    setItems(prev => [...prev, newItem]);
    setModalVisible(false);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const totalCard = items.reduce((acc, i) => acc + i.subtotal, 0);

  const handleFinalize = async () => {
    if (items.length === 0) return;

    Alert.alert(
      "Confirmar Ficha",
      `Deseja finalizar esta ficha no valor de ${formatCurrencyBRL(totalCard)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            try {
              setLoading(true);
              
              const fichaId = SyncService.generateUUID();
              const now = new Date().toISOString();

              const payload = {
                id: fichaId,
                clientId,
                sellerId: seller?.id,
                routeId: activeTrip?.routeId,
                cobrancaId: activeTrip?.id,
                total: totalCard,
                notes: "",
                items: items.map(i => ({
                  productId: i.productId,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  commissionType: i.type 
                }))
              };

              // 1. Save Locally
              await execute(
                `INSERT INTO fichas (id, status, total, notes, sale_date, client_id, seller_id, route_id, cobranca_id, is_local, sync_status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending', ?)`,
                [fichaId, 'nova', totalCard, "", now, clientId as string, seller?.id as string, activeTrip?.routeId as string, activeTrip?.id || null, now]
              );

              for (const item of items) {
                const itemId = SyncService.generateUUID();
                await execute(
                  `INSERT INTO ficha_items (id, ficha_id, product_id, quantity, unit_price, subtotal, commission_type, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [itemId, fichaId, item.productId, item.quantity, item.unitPrice, item.subtotal, item.type, now]
                );

                // --- SUBTRACT LOCAL STOCK ---
                console.log(`[Sync] Lowering local stock for product ${item.productId} by ${item.quantity}`);
                await execute(
                  'UPDATE products SET stock = stock - ? WHERE id = ?',
                  [item.quantity, item.productId]
                );
              }

              // 2. Enqueue for Sync
              await SyncService.enqueue('CREATE_FICHA', '/api/fichas', 'POST', payload);

              Alert.alert("Sucesso", "Ficha/Venda salva localmente! Sincronizando...");
              router.back();
            } catch (err) {
              console.error('Finalize card failed:', err);
              Alert.alert("Erro", "Falha ao salvar ficha localmente");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return {
    items,
    loading,
    modalVisible,
    setModalVisible,
    addItem,
    removeItem,
    totalCard,
    handleFinalize,
    seller
  };
}
