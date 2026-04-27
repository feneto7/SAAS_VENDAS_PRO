import React from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Package, MoreVertical } from 'lucide-react-native';
import { Colors, UI } from '../../../theme/theme';
import { CardItem } from '../hooks/useCardItemsData';
import { formatCentsToBRL } from '../../../utils/money';

interface Props {
  items: CardItem[];
  loading: boolean;
  cardStatus: string;
  isLocked?: boolean;
  onItemPress: (item: CardItem) => void;
}

export const ProductsTab = ({ items, loading, cardStatus, isLocked, onItemPress }: Props) => {
  const isPendente = cardStatus === 'pendente';
  const isFichaLocked = !!isLocked;

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'CC': return { color: Colors.success, label: 'CC' };
      case 'SC': return { color: Colors.info, label: 'SC' };
      case 'brinde': return { color: Colors.warning, label: 'Brinde' };
      default: return { color: Colors.textSecondary, label: type };
    }
  };

  const renderProduct = ({ item }: { item: CardItem }) => {
    const { color, label } = getTypeStyle(item.type);
    
    return (
      <TouchableOpacity 
        style={[UI.listItem, isFichaLocked && { opacity: 0.6, backgroundColor: Colors.inputBg }]} 
        activeOpacity={isFichaLocked ? 1 : 0.8}
        disabled={isFichaLocked}
        onPress={() => onItemPress(item)}
      >
        <View style={styles.itemMain}>
          <View style={styles.itemHeader}>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text style={[styles.productType, { color }]}>{label}</Text>
          </View>
          
          <View style={styles.itemFooter}>
            <View style={styles.qtyBox}>
              <Package size={14} color={Colors.textSecondary} />
              <Text style={styles.qtyText}>
                {isPendente 
                  ? `Deixado: ${item.quantity} | Vendeu: ${item.sold_quantity || 0} | Devolveu: ${item.returned_quantity || 0}`
                  : `${item.quantity} un x ${formatCentsToBRL(item.price || 0)}`
                }
              </Text>
            </View>
            {!isPendente && (
              <Text style={styles.subtotalText}>{formatCentsToBRL(item.subtotal || 0)}</Text>
            )}
          </View>
        </View>
        {!isPendente && !isFichaLocked && <MoreVertical size={20} color={Colors.textMuted} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderProduct}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Package size={64} color={Colors.cardBorder} />
          <Text style={styles.emptyText}>Nenhum produto nesta ficha.</Text>
          <Text style={styles.emptySub}>Adicione produtos para começar a venda.</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 100, paddingTop: 20 },
  itemMain: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: '800', color: Colors.white, flex: 1 },
  productType: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  subtotalText: { fontSize: 17, fontWeight: '900', color: Colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.7 },
  emptyText: { color: Colors.white, fontSize: 16, fontWeight: '600', marginTop: 24 },
  emptySub: { color: Colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center' },
});
