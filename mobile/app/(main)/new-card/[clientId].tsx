import React from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
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
import { useThemeColor } from '@/components/Themed';

export default function NewCardScreen() {
  const { clientName } = useLocalSearchParams();
  const hook = useNewCard();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');

  return (
    <DefaultView style={[styles.container, { backgroundColor }]}>
      {/* HEADER */}
      <DefaultView style={[styles.header, { borderBottomColor: borderColor }]}>
        <DefaultView style={{ flex: 1 }}>
          <DefaultText style={[styles.title, { color: textColor }]}>Nova Ficha</DefaultText>
          <DefaultText style={[styles.subtitle, { color: primaryColor }]} numberOfLines={1}>{clientName || 'Cliente'}</DefaultText>
        </DefaultView>
        <DefaultView style={[styles.cartBadge, { backgroundColor: primaryColor + '10' }]}>
          <ShoppingCart size={20} color={primaryColor} />
          {hook.items.length > 0 && (
            <DefaultView style={[styles.badge, { backgroundColor: errorColor, borderColor: backgroundColor }]}>
              <DefaultText style={styles.badgeText}>{hook.items.length}</DefaultText>
            </DefaultView>
          )}
        </DefaultView>
      </DefaultView>

      {/* ITEMS LIST */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {hook.items.length === 0 ? (
          <DefaultView style={styles.emptyContainer}>
            <Package size={64} color={borderColor} />
            <DefaultText style={[styles.emptyText, { color: textColor }]}>Nenhum produto adicionado</DefaultText>
            <DefaultText style={[styles.emptySubtext, { color: secondaryColor }]}>Clique no (+) para começar</DefaultText>
          </DefaultView>
        ) : (
          hook.items.map(item => (
            <DefaultView key={item.id} style={[styles.itemCard, { backgroundColor: cardColor, borderColor }]}>
              <DefaultView style={{ flex: 1 }}>
                <DefaultText style={[styles.itemName, { color: textColor }]}>{item.name}</DefaultText>
                <DefaultView style={styles.itemMeta}>
                  <DefaultText style={[styles.itemType, { color: item.type === 'BRINDE' ? errorColor : primaryColor }]}>
                    {item.type}
                  </DefaultText>
                  <DefaultText style={[styles.itemDetails, { color: secondaryColor }]}>
                    {formatCurrencyBRL(item.unitPrice)} x {item.quantity}
                  </DefaultText>
                </DefaultView>
              </DefaultView>
              <DefaultView style={styles.itemRight}>
                <DefaultText style={[styles.itemSubtotal, { color: textColor }]}>{formatCurrencyBRL(item.subtotal)}</DefaultText>
                <TouchableOpacity onPress={() => hook.removeItem(item.id)}>
                  <Trash2 size={18} color={secondaryColor} />
                </TouchableOpacity>
              </DefaultView>
            </DefaultView>
          ))
        )}
      </ScrollView>

      {/* FOOTER */}
      {hook.items.length > 0 && (
        <DefaultView style={[styles.footer, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
          <DefaultView style={styles.totalInfo}>
            <DefaultText style={[styles.totalLabel, { color: secondaryColor }]}>TOTAL</DefaultText>
            <DefaultText style={[styles.totalValue, { color: textColor }]}>{formatCurrencyBRL(hook.totalCard)}</DefaultText>
          </DefaultView>
          <TouchableOpacity 
            style={[styles.finalizeBtn, { backgroundColor: primaryColor }]} 
            activeOpacity={0.8}
            onPress={hook.handleFinalize}
            disabled={hook.loading}
          >
            {hook.loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <DefaultText style={[styles.finalizeText, { color: '#fff' }]}>FINALIZAR</DefaultText>
                <CheckCircle2 size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </DefaultView>
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: primaryColor, shadowColor: primaryColor, bottom: hook.items.length > 0 ? 115 : 30 }]} 
        activeOpacity={0.8}
        onPress={() => hook.setModalVisible(true)}
      >
        <Plus size={32} color="#fff" />
      </TouchableOpacity>

      <ProductSelectionModal 
        visible={hook.modalVisible}
        onClose={() => hook.setModalVisible(false)}
        onAdd={hook.addItem}
        sellerId={hook.seller?.id}
        currentCartItems={hook.items}
      />
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  subtitle: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  cartBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  list: { flex: 1 },
  listContent: { padding: 24, paddingBottom: 120 },
  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.3 },
  emptyText: { fontSize: 16, fontWeight: '800', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  itemCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  itemType: { fontSize: 10, fontWeight: '900' },
  itemDetails: { fontSize: 12 },
  itemRight: { alignItems: 'flex-end', gap: 8 },
  itemSubtotal: { fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
  fab: {
    position: 'absolute',
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalInfo: { flex: 1 },
  totalLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  totalValue: { fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  finalizeBtn: {
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  finalizeText: { fontSize: 14, fontWeight: '900' },
});
