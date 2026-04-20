import React, { useState, useEffect } from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTenant } from '../../../lib/TenantContext';
import { 
  Plus, 
  Route as RouteIcon,
  ChevronRight
} from 'lucide-react-native';
import { useThemeColor } from '../../../components/Themed';
import { queryAll, queryFirst, execute } from '../../../lib/db';
import { SyncService } from '../../../lib/sync/syncService';

interface Cobranca {
  id: string;
  code: number;
  status: 'aberta' | 'encerrada';
  startDate: string;
  endDate: string | null;
}

export default function CollectionsScreen() {
  const { id: routeId } = useLocalSearchParams();
  const { tenantSlug, seller, setActiveTrip } = useTenant();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [trips, setTrips] = useState<Cobranca[]>([]);
  const [routeName, setRouteName] = useState('Rota');

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

  useEffect(() => {
    console.log('Mounting CollectionsScreen for route:', routeId);
    if (routeId) {
      fetchCollections();
      fetchRouteInfo();
    }
  }, [routeId]);

  const fetchRouteInfo = async () => {
    try {
      // 1. Try local cache first
      const resLocal = await queryFirst<any>('SELECT name FROM routes WHERE id = ?', [routeId]);
      if (resLocal) setRouteName(resLocal.name);

      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/routes?limit=100`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      if (res.ok) {
        const data = await res.json();
        const current = data.items?.find((r: any) => r.id === routeId);
        if (current) setRouteName(current.name);
      }
    } catch (err) {
      console.warn('[Collections] Failed to fetch route info in background:', err);
    }
  }

  const fetchCollections = async () => {
    try {
      setLoading(true);
      // 1. Local
      const localData = await queryAll<any>('SELECT * FROM cobrancas WHERE route_id = ? ORDER BY start_date DESC', [routeId]);
      if (localData.length > 0) {
        setTrips(localData.map(t => ({
          ...t,
          startDate: t.start_date,
          endDate: t.end_date
        })));
        setLoading(false);
      }

      // 2. Remote
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      await SyncService.downloadMasterData(tenantSlug || '', seller?.id);
      
      const res = await fetch(`${apiURL}/api/routes/${routeId}/cobrancas`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTrips(data);
        }
      }
    } catch (err) {
      console.log('[CollectionsScreen] Fetch collections failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTrip = async () => {
    console.log('handleNewTrip called. Trips state:', trips);
    if (creating) return;
    
    // Check if there is already an open trip
    const hasOpen = (trips || []).some(c => c.status === 'aberta');
    if (hasOpen) {
      Alert.alert(
        'Aviso', 
        'Não é permitido criar um cobrança nova enquanto existir um cobrança em andamento na rota.'
      );
      return;
    }

    setCreating(true);
    try {
      const newTripId = SyncService.generateUUID();
      const now = new Date().toISOString();
      const nextCode = (trips.length > 0 ? (trips[0].code + 1) : 1);

      // 1. Local Persistence
      await execute(
        `INSERT INTO cobrancas (id, code, route_id, seller_id, status, start_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newTripId, nextCode, routeId, seller?.id, 'aberta', now, now, now]
      );

      // 2. Sync Queue
      await SyncService.enqueue('CREATE_TRIP', `/api/routes/${routeId}/cobrancas`, 'POST', {
        id: newTripId,
        sellerId: seller?.id
      });

      await setActiveTrip({ id: newTripId, routeId: routeId as string, code: nextCode });
      
      Alert.alert('Sucesso', 'Nova viagem iniciada localmente!');
      router.push({
        pathname: `/(main)/collection-detail/${newTripId}`,
        params: { routeName, code: String(nextCode) }
      } as any);
      
      fetchCollections(); // Refresh list
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível iniciar a viagem.');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <DefaultView style={[styles.container, { backgroundColor }]}>
      <DefaultView style={styles.content}>
        <DefaultText style={[styles.pageTitle, { color: textColor }]}>{routeName}</DefaultText>
        
        {loading ? (
          <DefaultView style={styles.center}>
            <ActivityIndicator size="large" color={successColor} />
          </DefaultView>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.card, { backgroundColor: cardColor, borderColor }]}
                onPress={() => {
                  if (item.status === 'aberta') {
                    setActiveTrip({ id: item.id, routeId: routeId as string, code: item.code });
                    router.push({
                      pathname: `/(main)/collection-detail/${item.id}`,
                      params: { routeName, code: item.code }
                    } as any);
                  } else {
                    Alert.alert('Viagem Encerrada', 'Esta viagem já foi finalizada e não pode ser editada.');
                  }
                }}
                activeOpacity={0.7}
              >
                <DefaultView style={[
                  styles.statusHeader, 
                  { backgroundColor: item.status === 'aberta' ? successColor : errorColor }
                ]}>
                   <DefaultText style={styles.statusText}>
                     {item.status === 'aberta' ? 'EM ANDAMENTO' : 'FINALIZADA'}
                   </DefaultText>
                </DefaultView>

                <DefaultView style={[styles.cardBody, { backgroundColor: cardColor, borderColor }]}>
                  <DefaultText style={[styles.tripTitle, { color: textColor }]}>VIAGEM - {String(item.code).padStart(2, '0')}</DefaultText>
                  
                  <DefaultView style={[styles.dateRow, { backgroundColor: surfaceColor }]}>
                    <DefaultView style={styles.dateCol}>
                      <DefaultText style={[styles.dateLabel, { color: secondaryColor }]}>DATA INÍCIO: {formatDate(item.startDate)}</DefaultText>
                    </DefaultView>
                    <DefaultView style={styles.dateCol}>
                      <DefaultText style={[styles.dateLabel, { color: secondaryColor }]}>DATA FINAL: {formatDate(item.endDate)}</DefaultText>
                    </DefaultView>
                  </DefaultView>
                </DefaultView>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <DefaultView style={styles.emptyContainer}>
                <RouteIcon size={48} color={borderColor} />
                <DefaultText style={[styles.emptyText, { color: secondaryColor }]}>Nenhuma viagem registrada.</DefaultText>
              </DefaultView>
            }
          />
        )}
      </DefaultView>

      {/* FIXED BOTTOM BUTTON */}
      <DefaultView style={styles.footerAction}>
        <TouchableOpacity 
          style={[styles.newTripButton, { backgroundColor: primaryColor, shadowColor: primaryColor }]} 
          onPress={handleNewTrip}
          disabled={creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Plus size={20} color="#fff" strokeWidth={3} style={{ marginRight: 8 }} />
              <DefaultText style={styles.newTripText}>NOVA VIAGEM</DefaultText>
            </>
          )}
        </TouchableOpacity>
      </DefaultView>
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  statusHeader: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  cardBody: {
    padding: 20,
    borderWidth: 1,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.3,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
  },
  footerAction: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  newTripButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newTripText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
