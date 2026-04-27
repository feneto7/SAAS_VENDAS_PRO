import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SearchX } from 'lucide-react-native';
import { Colors, UI } from '../../../theme/theme';
import { formatCentsToBRL } from '../../../utils/money';
import { useNavigationStore } from '../../../stores/useNavigationStore';
import { useCardData, Card } from '../hooks/useCardData';
import { formatStatus } from '../../../utils/status';

interface Props {
  clientId: string;
  clientName?: string;
}

export const PaidTab = ({ clientId, clientName }: Props) => {
  const { navigate } = useNavigationStore();
  const { items, loading, refreshing, refresh } = useCardData(clientId, 'paga');

  const renderItem = ({ item }: { item: Card }) => (
    <TouchableOpacity 
      style={UI.listItem} 
      activeOpacity={0.8}
      onPress={() => navigate('cardDetail', { 
        cardId: item.id, 
        status: item.status,
        code: item.code,
        total: item.total,
        clientName
      })}
    >
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemCode}>Ficha #{item.code}</Text>
          <Text style={styles.itemDate}>
            {item.sale_date ? new Date(item.sale_date).toLocaleDateString('pt-BR') : '---'}
          </Text>
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.itemTotal}>{formatCentsToBRL(item.total || 0)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: Colors.success }]}>
            <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && items.length === 0) {
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
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      onRefresh={refresh}
      refreshing={refreshing}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <SearchX size={64} color={Colors.cardBorder} />
          <Text style={styles.emptyText}>Nenhuma ficha paga encontrada.</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  itemInfo: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemCode: { fontSize: 16, fontWeight: '800', color: Colors.white },
  itemDate: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTotal: { fontSize: 18, fontWeight: '900', color: Colors.white },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900', color: Colors.white },
  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.7 },
  emptyText: { color: Colors.white, fontSize: 16, fontWeight: '600', marginTop: 24 },
});
