import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useTenant } from '@/lib/TenantContext';
import { parseBRLToCents } from '@/lib/utils/money';
import { queryAll, queryFirst, execute } from '@/lib/db';
import { SyncService } from '@/lib/sync/syncService';

export type Tab = 'produtos' | 'fechamento';

export function useCardDetail(id: string) {
  const { tenantSlug, activeTrip } = useTenant();
  
  const [activeTab, setActiveTab] = useState<Tab>('produtos');
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // Settlement State
  const [items, setItems] = useState<any[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  // Modal State for Item Settlement
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [soldQty, setSoldQty] = useState('');
  const [itemModalVisible, setItemModalVisible] = useState(false);

  // Modal State for Payment
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
 
  // Modal State for Add/Edit Product
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAppending, setIsAppending] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Read from Local DB first
      const localCard = await queryFirst<any>('SELECT * FROM fichas WHERE id = ?', [id]);
      if (localCard) {
        const localItems = await queryAll<any>('SELECT * FROM ficha_items WHERE ficha_id = ?', [id]);
        const localPayments = await queryAll<any>(
          `SELECT p.*, pm.name as methodName 
           FROM payments p 
           LEFT JOIN payment_methods pm ON p.method_id = pm.id 
           WHERE p.ficha_id = ?`, 
          [id]
        );

        // Map snake_case to camelCase
        setCard({
          ...localCard,
          commissionPercent: localCard.commission_percent,
          saleDate: localCard.sale_date,
          payments: localPayments.map(p => ({ ...p, methodName: p.methodName, amount: p.amount }))
        });
        setItems(localItems.map(i => ({ 
          ...i, 
          productId: i.product_id, 
          unitPrice: i.unit_price,
          commissionType: i.commission_type
        })));
        
        setLoading(false);
      }

      // 2. Refresh from server in background if possible
      try {
        const apiURL = process.env.EXPO_PUBLIC_API_URL;
        const [res, resPm] = await Promise.all([
          fetch(`${apiURL}/api/fichas/${id}`, {
            headers: { 'x-tenant-slug': tenantSlug || '' }
          }),
          fetch(`${apiURL}/api/settings/payments`, {
            headers: { 'x-tenant-slug': tenantSlug || '' }
          })
        ]);

        if (res.ok) {
          const data = await res.json();
          setCard(data || null);
          setItems(data?.items || []);
        }
        
        if (resPm.ok) {
          const dataPm = await resPm.json();
          setPaymentMethods(dataPm || []);
          if (dataPm && dataPm.length > 0 && !selectedMethodId) {
            setSelectedMethodId(dataPm[0].id);
          }
        }
      } catch (err) {
        console.log('Background fetch failed, offline mode');
      }
    } catch (err) {
      console.error('Fetch card failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id, tenantSlug]);

  const handleOpenItemModal = (item: any) => {
    setSelectedItem(item);
    setSoldQty(String(item.quantitySold || 0));
    setItemModalVisible(true);
  };

  const handleSaveItemQty = async () => {
    const sold = parseInt(soldQty) || 0;
    if (sold > selectedItem.quantity) {
      Alert.alert("Erro", "Quantidade vendida não pode ser maior que a deixada");
      return;
    }
    
    // Update locally
    const updatedItems = items.map(i => {
      if (i.id === selectedItem.id) {
        return {
          ...i,
          quantitySold: sold,
          quantityReturned: i.quantity - sold
        };
      }
      return i;
    });
    
    setItems(updatedItems);
    setItemModalVisible(false);
    setSelectedItem(null);
  };

  const handleAppendItem = async (productData: any) => {
    try {
      setIsAppending(true);
      const itemId = editingItem ? editingItem.id : SyncService.generateUUID();
      
      const payload = {
        productId: productData.productId,
        quantity: productData.quantity,
        unitPrice: productData.unitPrice,
        commissionType: productData.type
      };

      // 1. Local Update
      if (editingItem) {
        // Calculate difference for stock adjustment
        const diff = productData.quantity - editingItem.quantity;
        if (diff !== 0) {
          console.log(`[Sync] Adjusting local stock for product ${productData.productId} by ${diff} (Edit Item)`);
          await execute('UPDATE products SET stock = stock - ? WHERE id = ?', [diff, productData.productId]);
        }

        await execute(
          `UPDATE ficha_items SET product_id = ?, quantity = ?, unit_price = ?, subtotal = ?, commission_type = ? WHERE id = ?`,
          [productData.productId, productData.quantity, productData.unitPrice, productData.subtotal, productData.type, editingItem.id]
        );
      } else {
        await execute(
          `INSERT INTO ficha_items (id, ficha_id, product_id, quantity, unit_price, subtotal, commission_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [itemId, id, productData.productId, productData.quantity, productData.unitPrice, productData.subtotal, productData.type]
        );
        // Decrease stock for new item
        console.log(`[Sync] Lowering local stock for product ${productData.productId} by ${productData.quantity} (Append)`);
        await execute('UPDATE products SET stock = stock - ? WHERE id = ?', [productData.quantity, productData.productId]);
      }

      // 2. Sync Queue
      const endpoint = editingItem ? `/api/fichas/${id}/items/${editingItem.id}` : `/api/fichas/${id}/items`;
      const method = editingItem ? 'PATCH' : 'POST';
      await SyncService.enqueue(editingItem ? 'UPDATE_ITEM' : 'ADD_ITEM', endpoint, method, payload);

      setAddProductModalVisible(false);
      setEditingItem(null);
      fetchData(); // Refresh UI from DB
    } catch (err) {
       Alert.alert("Erro", "Falha ao salvar item localmente");
    } finally {
      setIsAppending(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Deseja remover este item do cartão?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              const item = items.find(i => i.id === itemId);
              if (item) {
                console.log(`[Sync] Restoring local stock for product ${item.product_id || item.productId} by ${item.quantity} (Delete Item)`);
                await execute('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id || item.productId]);
              }
              await execute('DELETE FROM ficha_items WHERE id = ?', [itemId]);
              await SyncService.enqueue('DELETE_ITEM', `/api/fichas/${id}/items/${itemId}`, 'DELETE', {});
              fetchData();
            } catch (err) {
              Alert.alert("Erro", "Falha ao excluir item localmente");
            }
          }
        }
      ]
    );
  };

  const handleCancelPayment = async (paymentId: string) => {
    Alert.alert(
      'Cancelar Pagamento',
      'Tem certeza que deseja cancelar este pagamento? Esta ação não pode ser desfeita.',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim', 
          style: 'destructive',
          onPress: async () => {
            try {
              await execute('UPDATE payments SET cancelled = 1 WHERE id = ?', [paymentId]);
              await SyncService.enqueue('CANCEL_PAYMENT', `/api/payments/${paymentId}/cancel`, 'PATCH', {});
              fetchData();
            } catch (err) {
              Alert.alert('Erro', 'Falha ao cancelar localmente');
            }
          }
        }
      ]
    );
  };

  const handleSaveSettlement = async () => {
    try {
      setSaveLoading(true);
      const payload = { 
        items,
        discount: Number(card?.discount || 0),
        commissionPercent: Number(card?.commissionPercent || 30)
      };

      // 1. Local Update (Simplified: assuming background sync will handle full reconciliation)
      await execute('UPDATE fichas SET status = ?, discount = ?, commission_percent = ? WHERE id = ?', 
        ['acerto_pendente', payload.discount, payload.commissionPercent, id]);
      
      for (const item of items) {
        await execute('UPDATE ficha_items SET quantity_sold = ?, quantity_returned = ? WHERE id = ?',
          [item.quantitySold, item.quantityReturned, item.id]);
      }

      // 2. Sync Queue
      await SyncService.enqueue('SETTLE_FICHA', `/api/fichas/${id}/settle`, 'PATCH', payload);

      Alert.alert("Sucesso", "Acerto salvo localmente!");
      fetchData();
    } catch (err) {
      console.error('Save settlement failed:', err);
      Alert.alert("Erro", "Falha ao salvar");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddPayment = async () => {
    const amountCents = parseBRLToCents(payAmount);
    if (amountCents <= 0 || !selectedMethodId) return;

    if (card?.status === 'nova') {
       if (totals.totalPaid + amountCents > totals.totalSoldSC) {
          Alert.alert("Limite Excedido", `Cartões NOVOS só aceitam pagamento até o total de produtos sem comissão`);
          return;
       }
    }

    try {
      setPaymentLoading(true);
      const paymentId = SyncService.generateUUID();
      
      // 1. Local Update
      await execute(
        'INSERT INTO payments (id, ficha_id, method_id, amount, payment_date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [paymentId, id, selectedMethodId, amountCents, new Date().toISOString(), new Date().toISOString()]
      );

      // 2. Sync Queue
      await SyncService.enqueue('ADD_PAYMENT', `/api/fichas/${id}/payments`, 'POST', {
        id: paymentId,
        amount: amountCents,
        methodId: selectedMethodId
      });

      Alert.alert("Sucesso", "Pagamento registrado localmente!");
      setPaymentModalVisible(false);
      setPayAmount('');
      fetchData();
    } catch (err) {
      console.error('Add payment failed:', err);
      Alert.alert("Erro", "Falha ao registrar");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Calculations
  const calcTotalVendido = items.reduce((acc, i) => acc + (Number(i.quantitySold || 0) * Number(i.unitPrice || 0)), 0);
  const calcTotalDevolvido = items.reduce((acc, i) => acc + (Number(i.quantityReturned || 0) * Number(i.unitPrice || 0)), 0);
  const totalCardOriginal = items.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
  
  const isPaga = card?.status === 'paga';
  const qField = isPaga ? 'quantitySold' : (card?.status === 'nova' ? 'quantity' : 'quantitySold');

  const totalSoldCC = items.filter(i => i.commissionType === 'CC').reduce((acc, i) => acc + (Number(i[qField] || 0) * Number(i.unitPrice || 0)), 0);
  const totalSoldSC = items.filter(i => i.commissionType !== 'CC').reduce((acc, i) => acc + (Number(i[qField] || 0) * Number(i.unitPrice || 0)), 0);
  const commissionPercent = Number(card?.commissionPercent || 30); 
  const commissionVal = totalSoldCC * (commissionPercent / 100);
  const netCC = totalSoldCC - commissionVal;
 
  const totalToPay = netCC + totalSoldSC;
  const totalPaid = card?.payments?.filter((p: any) => !p.cancelled).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0) || 0;
  
  const balance = card?.stats?.balance !== undefined 
    ? card.stats.balance 
    : Math.max(0, totalToPay - totalPaid - Number(card?.discount || 0));

  const totals = {
    calcTotalVendido,
    calcTotalDevolvido,
    totalCardOriginal,
    totalSoldCC,
    totalSoldSC,
    commissionPercent,
    commissionVal,
    netCC,
    totalToPay,
    totalPaid,
    balance
  };

  return {
    activeTab, setActiveTab,
    loading,
    card,
    paymentMethods,
    items,
    saveLoading,
    selectedItem,
    soldQty, setSoldQty,
    itemModalVisible, setItemModalVisible,
    paymentModalVisible, setPaymentModalVisible,
    payAmount, setPayAmount,
    selectedMethodId, setSelectedMethodId,
    paymentLoading,
    addProductModalVisible, setAddProductModalVisible,
    editingItem, setEditingItem,
    isAppending,
    totals,
    isPaga,
    fetchData,
    handleOpenItemModal,
    handleSaveItemQty,
    handleAppendItem,
    handleDeleteItem,
    handleCancelPayment,
    handleSaveSettlement,
    handleAddPayment
  };
}
