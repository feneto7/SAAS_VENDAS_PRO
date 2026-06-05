import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SearchX } from 'lucide-react-native';
import { useTheme } from '../../../stores/useThemeStore';
import { getUIStyles } from '../../../theme/theme';
import { formatCentsToBRL } from '../../../utils/money';
import { useNavigationStore } from '../../../stores/useNavigationStore';
import { useCardData, Card } from '../hooks/useCardData';
import { formatStatus } from '../../../utils/status';

interface Props {
  clientId: string;
  clientName?: string;
  collectionId?: string;
}

export const OrdersTab = ({ clientId, clientName, collectionId }: Props) => {
  const { colors, isDark } = useTheme();
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const { navigate } = useNavigationStore();
  const { items, loading, refreshing, refresh } = useCardData(clientId, 'pedido');

  const renderItem = ({ item }: { item: Card }) => (
    <TouchableOpacity 
      style={UI.listItem} 
      activeOpacity={0.8}
      onPress={() => navigate('ordersDetail', { 
        cardId: item.id, 
        status: item.status,
        code: item.code,
        total: item.total,
        clientName,
        collectionId
      })}
    >
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemCode}>Pedido #{item.code}</Text>
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.itemTotal}>{formatCentsToBRL((item.gross_total || item.total) || 0)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.warning }]}>
            <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && items.length === 0) {
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
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      onRefresh={refresh}
      refreshing={refreshing}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <SearchX size={64} color={colors.cardBorder} />
          <Text style={styles.emptyText}>Nenhum pedido encontrado.</Text>
        </View>
      }
    />
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  list: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  itemInfo: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemCode: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  itemDate: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTotal: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900', color: colors.white },
  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.7 },
  emptyText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 24 }});
