import React, { useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Package, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../../stores/useThemeStore';
import { getUIStyles } from '../../../theme/theme';
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
  const { colors, isDark } = useTheme();
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const isPendente = cardStatus === 'pendente';
  const isPostSale = cardStatus === 'pendente' || cardStatus === 'paga';
  const isFichaLocked = !!isLocked;

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'CC': return { color: colors.success, label: 'CC' };
      case 'SC': return { color: colors.info, label: 'SC' };
      case 'brinde': return { color: colors.warning, label: 'Brinde' };
      default: return { color: colors.textSecondary, label: type };
    }
  };

  const renderProduct = ({ item }: { item: CardItem }) => {
    const { color, label } = getTypeStyle(item.type);
    
    const displaySubtotal = (isPostSale && item.is_informed) 
      ? (item.sold_quantity || 0) * (item.price || 0) 
      : (item.quantity || 0) * (item.price || 0);

    return (
      <TouchableOpacity 
        style={[UI.listItem, isFichaLocked && { opacity: 0.6, backgroundColor: colors.inputBg }]} 
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
              <Package size={14} color={colors.textSecondary} />
              <Text style={styles.qtyText}>
                {isPostSale 
                  ? `Deixado: ${item.quantity} | Vend: ${item.sold_quantity || 0} | Dev: ${item.returned_quantity || 0}`
                  : `${item.quantity} un x ${formatCentsToBRL(item.price || 0)}`
                }
              </Text>
            </View>
            <Text style={styles.subtotalText}>{formatCentsToBRL(displaySubtotal)}</Text>
          </View>
        </View>
        {!isPostSale && !isFichaLocked && <MoreVertical size={20} color={colors.textMuted} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
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
          <Package size={64} color={colors.cardBorder} />
          <Text style={styles.emptyText}>Nenhum produto nesta card.</Text>
          <Text style={styles.emptySub}>Adicione produtos para começar a venda.</Text>
        </View>
      }
    />
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  list: { paddingBottom: 100, paddingTop: 20 },
  itemMain: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  productType: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  subtotalText: { fontSize: 17, fontWeight: '900', color: colors.accent },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.7 },
  emptyText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 24 },
  emptySub: { color: colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center' }
});
