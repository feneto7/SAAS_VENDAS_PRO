import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import { SearchX, Plus } from 'lucide-react-native';
import { getUIStyles, Shadows } from '../../../theme/theme';
import { useTheme } from '../../../stores/useThemeStore';
import { formatCentsToBRL } from '../../../utils/money';
import { useNavigationStore } from '../../../stores/useNavigationStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useCardData, Card } from '../hooks/useCardData';
import { db } from '../../../services/database';
import { formatStatus } from '../../../utils/status';

interface Props {
  clientId: string;
  clientName?: string;
  routeId?: string;
  collectionId?: string;
}

export const NewTab = ({ clientId, clientName, routeId, collectionId }: Props) => {
  const { navigate } = useNavigationStore();
  const { items, loading, refreshing, refresh } = useCardData(clientId, 'nova');
  const [creating, setCreating] = useState(false);

  const { colors, isDark } = useTheme();
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const handleCreateFicha = async () => {
    console.log('[DEBUG] handleCreateFicha clicked');
    if (creating) {
      console.log('[DEBUG] Already creating, ignoring click');
      return;
    }
    setCreating(true);

    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Buscar Informações da Rota (para pegar o code)
      let routeCode = '0';
      if (routeId) {
        const route = await db.getFirstAsync<{ code: string }>(
          'SELECT code FROM routes WHERE id = ?',
          [routeId]
        );
        if (route?.code) routeCode = route.code;
      }

      // 2. Gerar Código da Ficha (Seller(4) + DDMMHHmm + Route(4))
      const now = new Date();
      const datestr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      
      console.log('[DEBUG] sellerCode in store:', user.sellerCode);
      console.log('[DEBUG] route code in db:', routeCode);

      const sCode = String(user.sellerCode || '0').padStart(4, '0');
      const rCode = String(routeCode).padStart(4, '0');
      const finalCode = `${sCode}${datestr}${rCode}`;
      console.log('[DEBUG] GEN CODE VALUES:', { sellerCode: user.sellerCode, routeCode, sCode, rCode, finalCode });
      
      const newId = Crypto.randomUUID();
      console.log('[DEBUG] NEW ID:', newId);

      // 3. Persistir Localmente
      await db.runAsync(
        `INSERT INTO cards (id, code, status, total, sale_date, client_id, seller_id, route_id, charge_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, finalCode, 'nova', 0, now.toISOString(), clientId, user.id, routeId || null, collectionId || null]
      );

      // 4. Adicionar na Fila de Sincronismo
      await db.runAsync(
        `INSERT INTO sync_queue (id, action, table_name, data) VALUES (?, ?, ?, ?)`,
        [
          `f-${newId}`,
          'POST_FICHA',
          'cards',
          JSON.stringify({
            id: newId,
            code: finalCode,
            clientId,
            sellerId: user.id,
            routeId,
            collectionId,
            total: 0,
            status: 'nova',
            saleDate: now.toISOString()
          })
        ]
      );

      // 5. Navegar e dar refresh
      await refresh();
      navigate('cardDetail', {
        cardId: newId,
        status: 'nova',
        code: finalCode,
        total: 0,
        clientName
      });
    } catch (e: any) {
      console.error('[DEBUG] Create Ficha Error:', e);
      Alert.alert('Erro ao criar card', e.message || 'Erro inesperado.');
    } finally {
      setCreating(false);
    }
  };

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
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.itemTotal}>{formatCentsToBRL((item.gross_total || item.total) || 0)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.info }]}>
            <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <SearchX size={64} color={colors.border} />
              <Text style={styles.emptyText}>Nenhuma card nova encontrada.</Text>
            </View>
          }
        />
      )}

      {/* FAB - Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleCreateFicha}
        disabled={creating}
        activeOpacity={0.7}
      >
        {creating ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Plus size={32} color={colors.white} strokeWidth={2.5} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  list: { paddingBottom: 100, paddingHorizontal: 20, paddingTop: 16 },
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
  emptyText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 24 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.neumorphic(isDark),
    elevation: 10,
    zIndex: 9999,
  }
});
