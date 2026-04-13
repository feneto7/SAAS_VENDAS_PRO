import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle
} from 'react-native';
import { Package, Pencil, Trash2, CheckCircle2 } from 'lucide-react-native';

interface CardProductsTabProps {
  items: any[];
  isPaid: boolean;
  status: string;
  onOpenItemModal: (item: any) => void;
  onEditItem: (item: any) => void;
  onDeleteItem: (itemId: string) => void;
  onSaveSettlement: () => void;
  saveLoading: boolean;
  formatCurrencyBRL: (val: number) => string;
}

export function CardProductsTab({
  items,
  isPaid,
  status,
  onOpenItemModal,
  onEditItem,
  onDeleteItem,
  onSaveSettlement,
  saveLoading,
  formatCurrencyBRL
}: CardProductsTabProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Package size={48} color="#374151" />
        <Text style={styles.emptyText}>Nenhum produto nesta ficha</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.map(item => (
        <View key={item.id} style={[styles.itemCard, isPaid && { opacity: 0.8 }]}>
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

          {status === 'nova' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.itemSubtotal, { color: '#FFF', fontSize: 16, fontWeight: '900' }]}>
                  {formatCurrencyBRL(item.subtotal)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity 
                    onPress={() => onEditItem(item)}
                    style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}
                  >
                    <Pencil size={16} color="#A78BFA" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => onDeleteItem(item.id)}
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
              onPress={() => !isPaid && onOpenItemModal(item)}
              disabled={isPaid}
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
      ))}
      
      {status === 'pendente' && (
        <TouchableOpacity 
          style={styles.saveBtn}
          onPress={onSaveSettlement}
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

      {status === 'nova' && (
        <View style={{ height: 100 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.3 },
  emptyText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 16 },
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
  itemSubtotal: { color: '#FFF', fontSize: 16, fontWeight: '900' },
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
});
