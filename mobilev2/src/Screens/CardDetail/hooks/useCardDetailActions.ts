import { useState } from 'react';
import { Alert } from 'react-native';
import { db } from '../../../services/database';
import { SyncService } from '../../../services/syncService';
import { useAuthStore } from '../../../stores/useAuthStore';
import { CardService } from '../../../services/cardService';

export const useCardDetailActions = (
  cardId: string | undefined, 
  displayStatus: string | undefined, 
  displayTotal: number, 
  isFichaLocked: boolean,
  items: any[],
  payments: any[],
  reload: () => Promise<void>
) => {
  // ... state ...
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSaleModalVisible, setIsSaleModalVisible] = useState(false);

  const handleItemPress = (item: any) => {
    if (displayStatus === 'pendente') {
       if (isFichaLocked) {
         Alert.alert('Ficha Bloqueada', 'Esta card já foi conferida e bloqueada. Para editar, peça ao administrador para liberar na web.');
         return;
       }
       setEditingItem(item);
       setIsSaleModalVisible(true);
       return;
    }

    Alert.alert(
      'Opções do Produto',
      `${item.product_name}\nQuantidade: ${item.quantity}`,
      [
        { 
          text: 'Editar', 
          onPress: () => {
            setEditingItem(item);
            setIsEditModalVisible(true);
          } 
        },
        { text: 'Excluir', onPress: () => confirmDelete(item), style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handleProductSelect = (product: any) => {
    setIsAddModalVisible(false);
    setEditingItem({
      card_id: cardId,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      price: product.price_cc,
      type: 'CC',
      subtotal: product.price_cc,
      isNew: true
    });
    setIsEditModalVisible(true);
  };

  const handleSaveSoldQty = async (soldQty: number) => {
    if (!editingItem || !cardId) return;
    
    try {
      const soldNum = Number(soldQty);
      const leftOrOriginal = editingItem.quantity;
      const returnedQty = Math.max(0, leftOrOriginal - soldNum);

      await db.withTransactionAsync(async () => {
        // 1. Update item
        await db.runAsync(
          "UPDATE card_items SET sold_quantity = ?, returned_quantity = ?, is_informed = 1 WHERE id = ?",
          [soldNum, returnedQty, editingItem.id]
        );
        
        // 2. Global Recalculation (Shared Truth)
        await CardService.syncLocalTotal(cardId);
      });

      SyncService.enqueue('PATCH_ITEM', 'card_items', {
        id: editingItem.id,
        card_id: cardId,
        payload: { quantitySold: soldQty, quantityReturned: returnedQty, informed: true }
      });
      
      setIsSaleModalVisible(false);
      await reload();
    } catch (e: any) {
      Alert.alert('Erro', 'Falha ao salvar venda: ' + e.message);
    }
  };

  const handleCloseFicha = async () => {
    if (!cardId || isFichaLocked) return;
    try {
      await db.withTransactionAsync(async () => {
        // 1. Marcar como bloqueada e pendente localmente
        await db.runAsync(
          "UPDATE cards SET items_locked = 1, status = 'pendente', last_manual_update = ? WHERE id = ?", 
          [new Date().toISOString(), cardId]
        );

        // 2. Atualizar estoque do vendedor localmente e tratar items não informados
        const sellerId = useAuthStore.getState().user?.id;
        const allItems = await db.getAllAsync(
          "SELECT id, product_id, quantity, returned_quantity, is_informed FROM card_items WHERE card_id = ?", 
          [cardId]
        ) as any[];

        for (const itm of allItems) {
           const isInf = !!itm.is_informed;
           const qtyRet = isInf ? itm.returned_quantity : itm.quantity;
           
           if (!isInf) {
              await db.runAsync(
                "UPDATE card_items SET sold_quantity = 0, returned_quantity = ?, is_informed = 1 WHERE id = ?",
                [itm.quantity, itm.id]
              );
              
              // Sincronizar o item para o servidor para que o backend saiba que ele foi informado
              SyncService.enqueue('PATCH_ITEM', 'card_items', {
                id: itm.id,
                card_id: cardId,
                payload: { quantitySold: 0, quantityReturned: itm.quantity, informed: true }
              });
           }

           if (sellerId && qtyRet > 0) {
              await db.runAsync(
                "UPDATE seller_inventory SET stock = stock + ? WHERE seller_id = ? AND product_id = ?",
                [qtyRet, sellerId, itm.product_id]
              );
           }
        }
      });

      // 3. Global Sync (Recalcula e verifica se já pode virar PAGA)
      const result = await CardService.syncLocalTotal(cardId);
      const newStatus = result?.newStatus || 'pendente';
      
      SyncService.enqueue('PATCH', 'cards', {
        id: cardId,
        payload: { itemsLocked: true, status: newStatus }
      });

      if (newStatus === 'paga') {
        Alert.alert('Sucesso', 'Ficha quitada e fechada com sucesso!');
      } else {
        Alert.alert('Sucesso', 'Ficha fechada para conferência. A aba de fechamento está liberada.');
      }

      await reload();
      return true;
    } catch (e: any) {
      Alert.alert('Erro', 'Falha ao fechar card: ' + e.message);
      return false;
    }
  };

  const confirmDelete = (item: any) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente remover ${item.product_name}?`,
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim, Excluir', onPress: () => deleteItem(item.id), style: 'destructive' }
      ]
    );
  };

  const deleteItem = async (itemId: string) => {
    Alert.alert('Info', 'Funcionalidade de exclusão em breve.');
  };

  return {
    editingItem,
    setEditingItem,
    isEditModalVisible,
    setIsEditModalVisible,
    isAddModalVisible,
    setIsAddModalVisible,
    isSaleModalVisible,
    setIsSaleModalVisible,
    handleItemPress,
    handleSaveSoldQty,
    handleProductSelect,
    handleCloseFicha,
  };
};
