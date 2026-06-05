import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import { db } from '../../../services/database';
import { SyncService } from '../../../services/syncService';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useNavigationStore } from '../../../stores/useNavigationStore';

export const useOrdersDetail = (cardId: string) => {
  const { navigate, goBack } = useNavigationStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [card, setFicha] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Tenta carregar localmente
      let dbItems = await db.getAllAsync<any>(
        `SELECT ci.*, p.name as product_name, p.price_sc, p.price_cc 
         FROM card_items ci 
         LEFT JOIN products p ON ci.product_id = p.id 
         WHERE ci.card_id = ?`,
        [cardId]
      );
      
      const dbFicha = await db.getFirstAsync<any>(`SELECT * FROM cards WHERE id = ?`, [cardId]);
      
      setItems(dbItems || []);
      setFicha(dbFicha);

      // Sincroniza do servidor para garantir que os itens do Pedido sejam baixados
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const API_URL = require('../../../services/config').CONFIG.API_URL;

      if (token && tenantSlug) {
        const resItems = await fetch(`${API_URL}/api/cards/${cardId}/items`, {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug }
        });
        
        if (resItems.ok) {
          const serverItems = await resItems.json();
          const normalizedItems = serverItems.map((i: any) => ({
            id: i.id,
            card_id: cardId,
            product_id: i.productId || i.product_id,
            product_name: i.productName || i.product?.name || i.name || 'Produto',
            quantity: i.quantity || 0,
            unit_price: i.unitPrice || i.price || 0, // Fallback property for UI
            subtotal: i.subtotal || 0,
            type: (i.commissionType || i.type) === 'com_comissao' ? 'CC' : ((i.commissionType || i.type) === 'sem_comissao' ? 'SC' : (i.commissionType || i.type || 'CC')),
            sold_quantity: i.quantitySold || i.quantity_sold || 0,
            returned_quantity: i.quantityReturned || i.quantity_returned || 0,
            is_informed: !!(i.informed || i.is_informed)
          }));

          // Atualiza SQLite com os itens baixados
          await db.withTransactionAsync(async () => {
            await db.runAsync(`DELETE FROM card_items WHERE card_id = ?`, [cardId]);
            for (const i of normalizedItems) {
              await db.runAsync(
                `INSERT INTO card_items (id, card_id, product_id, product_name, quantity, sold_quantity, returned_quantity, is_informed, price, type, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [i.id, i.card_id, i.product_id, i.product_name, i.quantity, i.sold_quantity, i.returned_quantity, i.is_informed ? 1 : 0, i.unit_price, i.type, i.subtotal]
              );
            }
          });

          setItems(normalizedItems);
        }
      }
    } catch (e) {
      console.error('[OrdersDetail] Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGerarFicha = useCallback(async () => {
    if (isGenerating || !card) return;
    setIsGenerating(true);

    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Buscar Informações da Rota
      let routeCode = '0';
      if (card.route_id) {
        const route = await db.getFirstAsync<{ code: string }>(
          'SELECT code FROM routes WHERE id = ?',
          [card.route_id]
        );
        if (route?.code) routeCode = route.code;
      }

      // 2. Gerar Código da Ficha
      const now = new Date();
      const datestr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      
      const sCode = String(user.sellerCode || '0').padStart(4, '0');
      const rCode = String(routeCode).padStart(4, '0');
      const finalCode = `${sCode}${datestr}${rCode}`;

      // 3. Persistir Localmente a transformação (pedido -> nova)
      await db.runAsync(
        `UPDATE cards SET status = 'nova', type = 1, code = ?, sale_date = ? WHERE id = ?`,
        [finalCode, now.toISOString(), cardId]
      );

      // 4. Adicionar na Fila de Sincronismo
      SyncService.enqueue('PATCH', 'cards', {
        id: cardId,
        payload: { status: 'nova', type: 1, code: finalCode, saleDate: now.toISOString() }
      });

      Alert.alert('Sucesso', 'Ficha gerada com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            // Volta para a tela do cliente e abre a card gerada
            goBack();
            setTimeout(() => {
              navigate('cardDetail', {
                cardId,
                status: 'nova',
                code: finalCode,
                total: card.total
              });
            }, 300);
          }
        }
      ]);
    } catch (e: any) {
      console.error('[OrdersDetail] Erro ao gerar card:', e);
      Alert.alert('Erro', e.message || 'Falha ao transformar pedido em card.');
    } finally {
      setIsGenerating(false);
    }
  }, [cardId, card, isGenerating, navigate, goBack]);

  return {
    items,
    card,
    isGenerating,
    loading,
    handleGerarFicha
  };
};
