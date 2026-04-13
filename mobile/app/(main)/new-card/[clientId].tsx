import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { 
  Plus, 
  ShoppingCart, 
  Package,
  CheckCircle2,
  Trash2,
} from 'lucide-react-native';
import { formatCurrencyBRL } from '@/lib/utils/money';
import { ProductSelectionModal } from '@/components/ProductSelectionModal';
import { useNewCard } from '@/hooks/useNewCard';

export default function NewCardScreen() {
  const { clientName } = useLocalSearchParams();
  const hook = useNewCard();

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
          {hook.items.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{hook.items.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ITEMS LIST */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {hook.items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color="#1F2937" />
            <Text style={styles.emptyText}>Nenhum produto adicionado</Text>
            <Text style={styles.emptySubtext}>Clique no (+) para começar</Text>
          </View>
        ) : (
          hook.items.map(item => (
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
                <TouchableOpacity onPress={() => hook.removeItem(item.id)}>
                  <Trash2 size={18} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FOOTER */}
      {hook.items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>{formatCurrencyBRL(hook.totalCard)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.finalizeBtn} 
            activeOpacity={0.8}
            onPress={hook.handleFinalize}
            disabled={hook.loading}
          >
            {hook.loading ? (
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
        style={[styles.fab, { bottom: hook.items.length > 0 ? 115 : 30 }]} 
        activeOpacity={0.8}
        onPress={() => hook.setModalVisible(true)}
      >
        <Plus size={32} color="#000" />
      </TouchableOpacity>

      <ProductSelectionModal 
        visible={hook.modalVisible}
        onClose={() => hook.setModalVisible(false)}
        onAdd={hook.addItem}
        sellerId={hook.seller?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
  title: { color: '#FFF', fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  subtitle: { color: '#A78BFA', fontSize: 14, fontWeight: '700', marginTop: 2 },
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
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  list: { flex: 1 },
  listContent: { padding: 24, paddingBottom: 120 },
  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.3 },
  emptyText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 16 },
  emptySubtext: { color: '#9CA3AF', fontSize: 14, marginTop: 4 },
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
  itemName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  itemType: { fontSize: 10, fontWeight: '900' },
  itemDetails: { color: '#6B7280', fontSize: 12 },
  itemRight: { alignItems: 'flex-end', gap: 8 },
  itemSubtotal: { color: '#FFF', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
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
  totalInfo: { flex: 1 },
  totalLabel: { color: '#6B7280', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  totalValue: { color: '#FFF', fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  finalizeBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  finalizeText: { color: '#000', fontSize: 14, fontWeight: '900' },
});
