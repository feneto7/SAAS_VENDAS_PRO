import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Plus, 
  Minus, 
  Search, 
  ShoppingCart, 
  ChevronRight,
  Package,
  CheckCircle2,
  Trash2,
  X
} from 'lucide-react-native';
import { useTenant } from '@/lib/TenantContext';
import { formatCurrencyBRL, centsToReais, reaisToCents, applyCurrencyMask, parseBRLToCents } from '@/lib/utils/money';
import dayjs from 'dayjs';
import { ProductSelectionModal } from '@/components/ProductSelectionModal';

interface FichaItem {
  id: string; // Internal unique ID for the list
  productId: string;
  name: string;
  type: 'CC' | 'SC' | 'BRINDE';
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export default function NewFichaScreen() {
  const { clientId, clientName } = useLocalSearchParams();
  const { tenantSlug, activeTrip, seller } = useTenant();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FichaItem[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);

  const addItem = (item: any) => {
    const newItem: FichaItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
    };
    setItems(prev => [...prev, newItem]);
    setModalVisible(false);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const totalFicha = items.reduce((acc, i) => acc + i.subtotal, 0);

  const handleFinalize = async () => {
    if (items.length === 0) return;

    Alert.alert(
      "Confirmar Ficha",
      `Deseja finalizar esta ficha no valor de ${formatCurrencyBRL(totalFicha)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            try {
              setLoading(true);
              const apiURL = process.env.EXPO_PUBLIC_API_URL;
              
              const payload = {
                clientId,
                sellerId: seller?.id,
                routeId: activeTrip?.routeId,
                cobrancaId: activeTrip?.id,
                total: totalFicha,
                notes: "",
                items: items.map(i => ({
                  productId: i.productId,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  commissionType: i.type // Pass directly (CC, SC, or BRINDE)
                }))
              };

              const res = await fetch(`${apiURL}/api/fichas`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'x-tenant-slug': tenantSlug || ''
                },
                body: JSON.stringify(payload)
              });

              if (res.ok) {
                Alert.alert("Sucesso", "Ficha criada com sucesso!");
                router.back();
              } else {
                const errData = await res.json();
                Alert.alert("Erro", errData.error || "Erro ao criar ficha");
              }
            } catch (err) {
              console.error('Finalize ficha failed:', err);
              Alert.alert("Erro", "Falha de conexão com o servidor");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Nova Ficha</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{clientName || 'Cliente'}</Text>
        </View>
        <View style={styles.cartBadge}>
          <ShoppingCart size={20} color="#A78BFA" />
          {items.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{items.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ITEMS LIST */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color="#1F2937" />
            <Text style={styles.emptyText}>Nenhum produto adicionado</Text>
            <Text style={styles.emptySubtext}>Clique no (+) para começar</Text>
          </View>
        ) : (
          items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemType, { color: item.type === 'BRINDE' ? '#EF4444' : '#60A5FA' }]}>
                    {item.type}
                  </Text>
                  <Text style={styles.itemDetails}>
                    {formatCurrencyBRL(item.unitPrice)} x {item.quantity}
                  </Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemSubtotal}>{formatCurrencyBRL(item.subtotal)}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Trash2 size={18} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FOOTER */}
      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>{formatCurrencyBRL(totalFicha)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.finalizeBtn} 
            activeOpacity={0.8}
            onPress={handleFinalize}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.finalizeText}>FINALIZAR</Text>
                <CheckCircle2 size={20} color="#000" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: items.length > 0 ? 115 : 30 }]} 
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={32} color="#000" />
      </TouchableOpacity>

      <ProductSelectionModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addItem}
        sellerId={seller?.id}
      />
    </View>
  );
}

function RadioButton({ label, selected, onPress }: any) {
  return (
    <TouchableOpacity style={styles.radioItem} onPress={onPress}>
      <View style={[styles.radioCircle, selected && styles.radioActive]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={[styles.radioLabel, selected && styles.radioLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  subtitle: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  cartBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    opacity: 0.3,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  itemName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  itemType: {
    fontSize: 10,
    fontWeight: '900',
  },
  itemDetails: {
    color: '#6B7280',
    fontSize: 12,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  itemSubtotal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 30,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0A0A',
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  finalizeBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  finalizeText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F1117',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 52,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
  },
  modalBody: {
    flex: 1,
  },
  productOption: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stockBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  stockLabel: {
    color: 'rgba(167, 139, 250, 0.5)',
    fontSize: 8,
    fontWeight: '900',
  },
  stockVal: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '900',
  },
  optionName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  optionPrices: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  optionPriceLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  optionPriceVal: {
    color: '#A78BFA',
    fontWeight: '700',
  },
  configBody: {
    gap: 16,
  },
  selectedName: {
    color: '#A78BFA',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  fieldLabel: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  radioGroup: {
    gap: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#A78BFA',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A78BFA',
  },
  radioLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  radioLabelActive: {
    color: '#FFF',
  },
  priceInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: 56,
    borderRadius: 16,
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    paddingHorizontal: 20,
  },
  disabledInput: {
    opacity: 0.3,
    backgroundColor: '#000',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyVal: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  addBtn: {
    backgroundColor: '#A78BFA',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  addBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtnText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  }
});
