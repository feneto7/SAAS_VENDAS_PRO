import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator as Spinner
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  X, 
  ChevronLeft, 
  Package, 
  Calculator, 
  CheckCircle2, 
  Plus,
  CreditCard,
  History,
  Pencil,
  Trash2
} from 'lucide-react-native';
import { useTenant } from '@/lib/TenantContext';
import { formatCurrencyBRL, centsToReais, reaisToCents, applyCurrencyMask, parseBRLToCents } from '@/lib/utils/money';
import { ProductSelectionModal } from '@/components/ProductSelectionModal';

type Tab = 'produtos' | 'fechamento';

export default function FichaDetailScreen() {
  const { id } = useLocalSearchParams();
  const { tenantSlug } = useTenant();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<Tab>('produtos');
  const [loading, setLoading] = useState(true);
  const [ficha, setFicha] = useState<any>(null);
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
      setFicha(data || null);
      setItems(data?.items || []);

      // Fetch Payment Methods
      const resPm = await fetch(`${apiURL}/api/settings/payments`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      const dataPm = await resPm.json();
      setPaymentMethods(dataPm || []);
      if (dataPm.length > 0) setSelectedMethodId(dataPm[0].id);

    } catch (err) {
      console.error('Fetch ficha failed:', err);
      Alert.alert("Erro", "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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
      "Deseja remover este item da ficha?",
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
          discount: Number(ficha?.discount || 0),
          commissionPercent: Number(ficha?.commissionPercent || 30)
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
    if (ficha?.status === 'nova') {
       if (totalPaid + amountCents > totalSoldSC) {
          Alert.alert("Limite Excedido", `Fichas NOVAS só aceitam pagamento até o total de produtos sem comissão (Limite: ${formatCurrencyBRL(totalSoldSC)})`);
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
  const totalFichaOriginal = items.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
  
  const isPaga = ficha?.status === 'paga';
  const qField = isPaga ? 'quantitySold' : (ficha?.status === 'nova' ? 'quantity' : 'quantitySold');

  const totalSoldCC = items.filter(i => i.commissionType === 'CC').reduce((acc, i) => acc + (Number(i[qField] || 0) * Number(i.unitPrice || 0)), 0);
  const totalSoldSC = items.filter(i => i.commissionType !== 'CC').reduce((acc, i) => acc + (Number(i[qField] || 0) * Number(i.unitPrice || 0)), 0);
  const commissionPercent = Number(ficha?.commissionPercent || 30); 
  const commissionVal = totalSoldCC * (commissionPercent / 100);
  const netCC = totalSoldCC - commissionVal;
 
  const totalToPay = netCC + totalSoldSC;
  const totalPaid = ficha?.payments?.filter((p: any) => !p.cancelled).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0) || 0;
  
  // Use server balance if available, fallback to local calc
  const balance = ficha?.stats?.balance !== undefined 
    ? ficha.stats.balance 
    : Math.max(0, totalToPay - totalPaid - Number(ficha?.discount || 0));

  useEffect(() => {
    if (!loading && ficha) {
       // Values ready
    }
  }, [loading, ficha, items]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerLabel}> FICHA</Text>
              {ficha?.status && (
                <View style={[
                  styles.statusBadge, 
                  ficha.status === 'paga' && { backgroundColor: '#059669' },
                  ficha.status === 'pendente' && { backgroundColor: '#D97706' },
                  ficha.status === 'nova' && { backgroundColor: '#2563EB' }
                ]}>
                  <Text style={styles.statusBadgeText}>{ficha.status.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.fichaCode}>{ficha?.code}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.headerLabel}>CLIENTE</Text>
            <Text style={styles.clientName}>{ficha?.clientName || ficha?.client?.name}</Text>
          </View>
        </View>
      </View>


      <ScrollView style={styles.content}>
        {activeTab === 'produtos' ? (
          <View style={styles.produtosTab}>
            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Package size={48} color="#374151" />
                <Text style={styles.emptyText}>Nenhum produto nesta ficha</Text>
              </View>
            ) : (
              items.map(item => (
                <View key={item.id} style={[styles.itemCard, isPaga && { opacity: 0.8 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.productName || item.product?.name || 'Produto'}</Text>
                    <View style={styles.itemMeta}>
                      <Text style={[
                        styles.itemType, 
                        { color: item.commissionType === 'BRINDE' ? '#EF4444' : (item.commissionType === 'SC' ? '#60A5FA' : '#A78BFA') }
                      ]}>
                        {item.commissionType}
                      </Text>
                      <Text style={styles.itemPrice}>{formatCurrencyBRL(item.unitPrice)} x {item.quantity}</Text>
                    </View>
                  </View>

                  {ficha?.status === 'nova' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.itemSubtotal, { color: '#FFF', fontSize: 16, fontWeight: '900' }]}>
                          {formatCurrencyBRL(item.subtotal)}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                          <TouchableOpacity 
                            onPress={() => {
                              setEditingItem(item);
                              setAddProductModalVisible(true);
                            }}
                            style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}
                          >
                            <Pencil size={16} color="#A78BFA" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleDeleteItem(item.id)}
                            style={{ padding: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}
                          >
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.itemQuantities}
                      onPress={() => !isPaga && handleOpenItemModal(item)}
                      disabled={isPaga}
                    >
                      <View style={styles.qtyBox}>
                        <Text style={styles.qtyLabel}>DEIXADO</Text>
                        <Text style={styles.qtyVal}>{item.quantity}</Text>
                      </View>
                      <View style={[styles.qtyBox, { borderLeftWidth: 1, borderLeftColor: '#1F2937' }]}>
                        <Text style={styles.qtyLabel}>VENDIDO</Text>
                        <Text style={styles.qtyValPrimary}>{item.quantitySold || 0}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
            
            {ficha?.status === 'pendente' && items.length > 0 && (
              <TouchableOpacity 
                style={styles.saveBtn}
                onPress={handleSaveSettlement}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.saveBtnText}>SALVAR ACERTO</Text>
                    <CheckCircle2 size={20} color="#000" />
                  </>
                )}
              </TouchableOpacity>
            )}

            {ficha?.status === 'nova' && (
              <View style={{ height: 100 }} />
            )}
          </View>
        ) : (
          <View style={styles.fechamentoTab}>
            <SummaryItem label="VALOR TOTAL DA FICHA" value={totalFichaOriginal} />
            <SummaryItem label="PRODUTOS DEVOLVIDOS" value={calcTotalDevolvido} variant="danger" />
            <SummaryItem label="PRODUTOS VENDIDOS" value={calcTotalVendido} variant="success" />
            
            <View style={styles.divider} />
            
            <SummaryItem label="VENDAS COM COMISSÃO" value={totalSoldCC} />
            <SummaryItem label={`COMISSÃO CLIENTE (${commissionPercent}%)`} value={commissionVal} variant="danger" />
            <SummaryItem label="VENDAS CC LÍQUIDAS" value={netCC} isBold />
            <SummaryItem label="VENDAS SEM COMISSÃO" value={totalSoldSC} />
            
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
              <Text style={styles.totalFinal}>{formatCurrencyBRL(totalToPay)}</Text>
            </View>

            <View style={styles.statsRow}>
              <SummaryItem label="PAGAMENTO" value={totalPaid} />
              <SummaryItem label="DESCONTO" value={ficha?.discount || 0} />
            </View>

            <View style={[styles.totalBox, { backgroundColor: 'rgba(167, 139, 250, 0.1)', borderColor: '#A78BFA' }]}>
              <Text style={[styles.totalLabel, { color: '#A78BFA' }]}>RESTANTE</Text>
              <Text style={[styles.totalFinal, { color: '#FFF' }]}>{formatCurrencyBRL(balance)}</Text>
            </View>

            {!isPaga && (
              <View style={styles.paymentActions}>
                 <Text style={styles.sectionTitle}>PAGAMENTOS</Text>
                 <TouchableOpacity 
                   style={styles.addPaymentBtn}
                   onPress={() => setPaymentModalVisible(true)}
                 >
                   <Plus size={20} color="#000" />
                   <Text style={styles.addPaymentText}>PAGAMENTO</Text>
                 </TouchableOpacity>
              </View>
            )}

            {isPaga && (
              <View style={styles.paymentActions}>
                <Text style={styles.sectionTitle}>PAGAMENTOS (BLOQUEADO)</Text>
              </View>
            )}

            {/* List of payments */}
            {ficha?.payments?.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum pagamento lançado</Text>
            ) : (
              ficha?.payments?.map((p: any) => (
                <TouchableOpacity 
                  key={p.id} 
                  style={[styles.paymentCard, isPaga && { opacity: 0.8 }]}
                  onPress={() => !isPaga && !p.cancelled && handleCancelPayment(p.id)}
                  disabled={isPaga || p.cancelled}
                >
                  <CreditCard size={18} color={p.cancelled ? "#EF4444" : "#A78BFA"} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.paymentMethod, p.cancelled && styles.cancelledText]}>{p.methodName}</Text>
                    <Text style={styles.paymentDate}>{new Date(p.paymentDate).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.paymentAmount, p.cancelled && styles.paymentAmountCancelled]}>
                    {formatCurrencyBRL(p.amount)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* TABS AT BOTTOM */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'produtos' && styles.activeTab]}
          onPress={() => setActiveTab('produtos')}
        >
          <Package size={18} color={activeTab === 'produtos' ? '#A78BFA' : '#6B7280'} />
          <Text style={[styles.tabLabel, activeTab === 'produtos' && styles.activeTabLabel]}>Produtos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'fechamento' && styles.activeTab]}
          onPress={() => setActiveTab('fechamento')}
        >
          <Calculator size={18} color={activeTab === 'fechamento' ? '#A78BFA' : '#6B7280'} />
          <Text style={[styles.tabLabel, activeTab === 'fechamento' && styles.activeTabLabel]}>Fechamento</Text>
        </TouchableOpacity>
      </View>

      {/* ITEM SETTLEMENT MODAL */}
      <Modal visible={itemModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
           <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Acerto de Produto</Text>
                <TouchableOpacity onPress={() => setItemModalVisible(false)}>
                  <X size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalItemName}>{selectedItem?.productName}</Text>
              <Text style={styles.modalDeixado}>Deixado com cliente: <Text style={{ color: '#FFF' }}>{selectedItem?.quantity || 0}</Text></Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>QUANTIDADE VENDIDA</Text>
                <TextInput 
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={soldQty}
                  onChangeText={setSoldQty}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DEVOLVIDO (AUTOMÁTICO)</Text>
                <Text style={styles.autoQty}>{Math.max(0, (selectedItem?.quantity || 0) - (parseInt(soldQty) || 0))}</Text>
              </View>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveItemQty}>
                <Text style={styles.confirmBtnText}>CONFIRMAR</Text>
              </TouchableOpacity>
           </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* PAYMENT MODAL */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lançar Pagamento</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>VALOR (R$)</Text>
              <TextInput 
                style={styles.modalInput}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={(val) => setPayAmount(applyCurrencyMask(val))}
                placeholder="0,00"
                placeholderTextColor="#4B5563"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FORMA DE PAGAMENTO</Text>
              <View style={styles.methodsGrid}>
                 {paymentMethods.map(m => (
                   <TouchableOpacity 
                     key={m.id} 
                     style={[styles.methodBtn, selectedMethodId === m.id && styles.selectedMethod]}
                     onPress={() => setSelectedMethodId(m.id)}
                   >
                     <Text style={[styles.methodText, selectedMethodId === m.id && styles.selectedMethodText]}>
                       {m.name}
                     </Text>
                   </TouchableOpacity>
                 ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: '#10B981' }]} 
              onPress={handleAddPayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.confirmBtnText}>LANÇAR</Text>}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ProductSelectionModal 
        visible={addProductModalVisible}
        onClose={() => {
          setAddProductModalVisible(false);
          setEditingItem(null);
        }}
        onAdd={handleAppendItem}
        sellerId={ficha?.sellerId}
        isAppending={true}
        initialItem={editingItem}
      />

      {/* FAB for Add Product (Nova status only) */}
      {ficha?.status === 'nova' && activeTab === 'produtos' && (
        <TouchableOpacity 
          style={styles.fab} 
          activeOpacity={0.8}
          onPress={() => setAddProductModalVisible(true)}
        >
          <Plus size={32} color="#000" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function SummaryItem({ label, value, variant, isBold }: any) {
  const color = variant === 'success' ? '#10B981' : variant === 'danger' ? '#EF4444' : '#9CA3AF';
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryLabel, isBold && { fontWeight: '900', color: '#FFF' }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color }, isBold && { fontWeight: '900', fontSize: 18 }]}>{formatCurrencyBRL(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, marginLeft: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLabel: { color: '#4B5563', fontSize: 10, fontWeight: '900', marginBottom: 2 },
  fichaCode: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  clientName: { color: '#A78BFA', fontSize: 16, fontWeight: '700' },
  
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#0F1117',
    borderTopWidth: 1, 
    borderTopColor: '#1F2937',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  tab: { flex: 1, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  activeTab: { borderTopWidth: 2, borderTopColor: '#A78BFA' },
  tabLabel: { color: '#6B7280', fontSize: 14, fontWeight: '700' },
  activeTabLabel: { color: '#A78BFA' },

  content: { flex: 1, padding: 24 },
  
  produtosTab: { gap: 12, paddingBottom: 100 },
  itemCard: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center'
  },
  itemName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  itemType: { fontSize: 10, fontWeight: '900' },
  itemPrice: { color: '#6B7280', fontSize: 12 },
  itemQuantities: { flexDirection: 'row', gap: 16 },
  qtyBox: { alignItems: 'center', minWidth: 60 },
  qtyLabel: { color: '#4B5563', fontSize: 8, fontWeight: '900' },
  qtyVal: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
  qtyValPrimary: { color: '#A78BFA', fontSize: 18, fontWeight: '900' },

  saveBtn: { 
    marginTop: 20,
    backgroundColor: '#FFF', 
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12 
  },
  saveBtnText: { color: '#000', fontSize: 14, fontWeight: '900' },

  fechamentoTab: { gap: 12, paddingBottom: 120 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#1F2937', marginVertical: 8 },
  
  totalBox: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4
  },
  totalLabel: { color: '#6B7280', fontSize: 12, fontWeight: '900' },
  totalFinal: { color: '#10B981', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', gap: 12 },
  
  paymentActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  addPaymentBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  addPaymentText: { color: '#000', fontSize: 12, fontWeight: '900' },
  
  paymentCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    borderRadius: 12,
    marginBottom: 8
  },
  paymentMethod: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  paymentDate: { color: '#4B5563', fontSize: 11 },
  paymentAmount: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  paymentAmountCancelled: { color: '#EF4444', textDecorationLine: 'line-through' },
  cancelledText: { textDecorationLine: 'line-through', color: '#6B7280' },

  statusBadge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#0F1117', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(167, 139, 250, 0.2)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  modalItemName: { color: '#A78BFA', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  modalDeixado: { color: '#6B7280', fontSize: 14, marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: '#4B5563', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  modalInput: { backgroundColor: '#1F2937', height: 56, borderRadius: 16, color: '#FFF', fontSize: 24, fontWeight: '900', paddingHorizontal: 20 },
  autoQty: { color: '#A78BFA', fontSize: 28, fontWeight: '900' },
  confirmBtn: { backgroundColor: '#FFF', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },

  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'transparent' },
  selectedMethod: { borderColor: '#A78BFA', backgroundColor: 'rgba(167, 139, 250, 0.1)' },
  methodText: { color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
  selectedMethodText: { color: '#A78BFA' },
  itemSubtotal: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 120,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#4B5563', fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 12 }
});
