import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, SafeAreaView, StatusBar 
} from 'react-native';
import { Colors, GlobalStyles, UI } from '../../theme/theme';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { ChevronLeft, Receipt, Calendar, ArrowRight, Plus } from 'lucide-react-native';
import { db } from '../../services/database';
import { Alert } from 'react-native';

export const ChargesScreen = () => {
  const { navigate, goBack, currentParams } = useNavigationStore();
  const { routeId, routeName } = currentParams || {};
  
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (routeId) {
      fetchCharges();
    }
  }, [routeId]);

  const fetchCharges = async () => {
    try {
      // 1. Mostrar dados locais
      const localData = await db.getAllAsync(
        'SELECT * FROM charges WHERE route_id = ? ORDER BY due_date DESC LIMIT 5',
        [routeId]
      );
      setCharges(localData);
      setLoading(false);

      // 2. Sincronismo com API
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

      if (token && tenantSlug && routeId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(`${API_URL}/api/routes/${routeId}/cobrancas`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-tenant-slug': tenantSlug
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const serverCharges = data || [];

            if (serverCharges.length > 0) {
              await db.withTransactionAsync(async () => {
                for (const c of serverCharges) {
                  await db.runAsync(
                    'INSERT INTO charges (id, route_id, client_name, value, status, due_date) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET status=excluded.status, due_date=excluded.due_date',
                    [c.id, routeId, `Cobrança #${c.code}`, 0, c.status, c.startDate]
                  );
                }
              });

              const updatedLocalData = await db.getAllAsync(
                'SELECT * FROM charges WHERE route_id = ? ORDER BY due_date DESC LIMIT 5',
                [routeId]
              );
              setCharges(updatedLocalData);
            }
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          console.log('[DEBUG] Error fetching charges:', fetchErr);
        }
      }
    } catch (e) {
      console.log('[DEBUG] Error in fetchCharges:', e);
      setLoading(false);
    }
  };

  const handleNewCharge = async () => {
    const hasOpen = charges.some(c => c.status === 'aberta');
    if (hasOpen) {
      Alert.alert('Ação Bloqueada', 'Não é permitido criar uma nova cobrança enquanto existir uma em andamento (ABERTA) nesta rota.');
      return;
    }

    setCreating(true);
    try {
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const user = useAuthStore.getState().user;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

      const res = await fetch(`${API_URL}/api/routes/${routeId}/cobrancas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': tenantSlug || ''
        },
        body: JSON.stringify({ sellerId: user?.id })
      });

      if (res.ok) {
        Alert.alert('Sucesso', 'Nova cobrança iniciada com sucesso!');
        fetchCharges();
      } else {
        const err = await res.json();
        Alert.alert('Erro', err.message || 'Não foi possível iniciar a cobrança.');
      }
    } catch (e) {
      Alert.alert('Erro de conexão', 'Verifique sua internet e tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/--/----';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aberta': return Colors.success;
      case 'encerrada': return Colors.textMuted;
      default: return Colors.primary;
    }
  };

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={GlobalStyles.glowTop} />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color={Colors.white} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.title}>Cobranças</Text>
            <Text style={styles.subtitle}>{routeName || 'Rota'}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            <FlatList
              data={charges}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Receipt size={48} color={Colors.cardBorder} />
                  <Text style={styles.emptyText}>Nenhuma cobrança recente.</Text>
                  <Text style={styles.emptySub}>Esta rota ainda não possui histórico de cobranças registradas.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={UI.listItem} 
                  activeOpacity={0.8}
                  onPress={() => navigate('chargeDetail', { 
                    chargeId: item.id, 
                    chargeCode: item.client_name.replace('Cobrança #', ''),
                    routeName,
                    routeId
                  })}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
                  <View style={styles.chargeInfo}>
                    <Text style={styles.chargeName}>{item.client_name}</Text>
                    <View style={styles.dateRow}>
                      <Calendar size={14} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.chargeDate}>{formatDate(item.due_date)}</Text>
                      <View style={styles.dot} />
                      <Text style={[styles.chargeStatus, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity 
              style={[UI.button, styles.newBtn, creating && { opacity: 0.7 }]} 
              onPress={handleNewCharge}
              disabled={creating}
              activeOpacity={0.8}
            >
              {creating ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Plus size={20} color={Colors.white} strokeWidth={3} />
                  <Text style={styles.newBtnText}>Nova Cobrança</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
      <View style={GlobalStyles.glowBottom} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  headerTitleBox: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.white, letterSpacing: 0.5, textTransform: 'uppercase' },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 20 },
  statusIndicator: { width: 4, height: 32, borderRadius: 2, marginRight: 16 },
  chargeInfo: { flex: 1 },
  chargeName: { fontSize: 17, fontWeight: '700', color: Colors.white, marginBottom: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  chargeDate: { fontSize: 13, color: Colors.textSecondary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, marginHorizontal: 8 },
  chargeStatus: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.7 },
  emptyText: { color: Colors.white, fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: { color: Colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 40 },
  newBtn: { marginBottom: 20, gap: 10 },
  newBtnText: { color: Colors.white, fontSize: 17, fontWeight: '800' }
});
