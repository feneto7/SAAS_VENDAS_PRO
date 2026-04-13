import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useTenant } from '@/lib/TenantContext';
import { parseBRLToCents } from '@/lib/utils/money';

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
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/fichas/${id}`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      const data = await res.json();
      setCard(data || null);
      setItems(data?.items || []);

      // Fetch Payment Methods
      const resPm = await fetch(`${apiURL}/api/settings/payments`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      const dataPm = await resPm.json();
      setPaymentMethods(dataPm || []);
      if (dataPm.length > 0 && !selectedMethodId) setSelectedMethodId(dataPm[0].id);

    } catch (err) {
      console.error('Fetch card failed:', err);
      Alert.alert("Erro", "Falha ao carregar dados");
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

  const handleSaveItemQty = () => {
    const sold = parseInt(soldQty) || 0;
    if (sold > selectedItem.quantity) {
      Alert.alert("Erro", "Quantidade vendida não pode ser maior que a deixada");
      return;
    }
    
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

  const handleAppendItem = async (item: any) => {
    try {
      setIsAppending(true);
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      
      const method = editingItem ? 'PATCH' : 'POST';
      const endpoint = editingItem 
        ? `${apiURL}/api/fichas/${id}/items/${editingItem.id}`
        : `${apiURL}/api/fichas/${id}/items`;

      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug || ''
        },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          commissionType: item.type
        })
      });

      if (res.ok) {
        Alert.alert("Sucesso", editingItem ? "Item atualizado!" : "Produto adicionado!");
        setAddProductModalVisible(false);
        setEditingItem(null);
        fetchData(); // Refresh list
      } else {
        const err = await res.json();
        Alert.alert("Erro", err.error || "Erro ao processar item");
      }
    } catch (err) {
       Alert.alert("Erro", "Falha na conexão");
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
              const apiURL = process.env.EXPO_PUBLIC_API_URL;
              const res = await fetch(`${apiURL}/api/fichas/${id}/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'x-tenant-slug': tenantSlug || '' }
              });
              if (res.ok) {
                fetchData();
              } else {
                const err = await res.json();
                Alert.alert("Erro", err.error || "Erro ao excluir");
              }
            } catch (err) {
              Alert.alert("Erro", "Falha na conexão");
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
              const apiURL = process.env.EXPO_PUBLIC_API_URL;
              const res = await fetch(`${apiURL}/api/payments/${paymentId}/cancel`, {
                method: 'PATCH',
                headers: { 'x-tenant-slug': tenantSlug || '' }
              });
              if (res.ok) {
                fetchData();
              } else {
                const err = await res.json();
                Alert.alert('Erro', err.error || 'Não foi possível cancelar o pagamento');
              }
            } catch (err) {
              Alert.alert('Erro', 'Falha na conexão');
            }
          }
        }
      ]
    );
  };

  const handleSaveSettlement = async () => {
    try {
      setSaveLoading(true);
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      
      const res = await fetch(`${apiURL}/api/fichas/${id}/settle`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug || ''
        },
        body: JSON.stringify({ 
          items,
          discount: Number(card?.discount || 0),
          commissionPercent: Number(card?.commissionPercent || 30)
        })
      });

      if (res.ok) {
        Alert.alert("Sucesso", "Acerto salvo com sucesso!");
        fetchData(); // Refresh data
      } else {
        const errData = await res.json();
        Alert.alert("Erro", errData.error || "Erro ao salvar acerto");
      }
    } catch (err) {
      console.error('Save settlement failed:', err);
      Alert.alert("Erro", "Falha de conexão");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddPayment = async () => {
    const amountCents = parseBRLToCents(payAmount);
    if (amountCents <= 0 || !selectedMethodId) return;

    // RULE 1: For 'nova' status, limit payment to total SC
    if (card?.status === 'nova') {
       if (totals.totalPaid + amountCents > totals.totalSoldSC) {
          Alert.alert("Limite Excedido", `Cartões NOVOS só aceitam pagamento até o total de produtos sem comissão`);
          return;
       }
    }

    try {
      setPaymentLoading(true);
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      
      const res = await fetch(`${apiURL}/api/fichas/${id}/payments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug || ''
        },
        body: JSON.stringify({ 
          amount: amountCents,
          methodId: selectedMethodId 
        })
      });

      if (res.ok) {
        Alert.alert("Sucesso", "Pagamento registrado!");
        setPaymentModalVisible(false);
        setPayAmount('');
        fetchData(); // Refresh data
      } else {
        Alert.alert("Erro", "Falha ao lançar pagamento");
      }
    } catch (err) {
      console.error('Add payment failed:', err);
      Alert.alert("Erro", "Falha de conexão");
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
