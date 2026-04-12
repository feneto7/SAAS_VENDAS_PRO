import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
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

  useEffect(() => {
    console.log('Mounting CollectionsScreen for route:', routeId);
    if (routeId) {
      fetchCollections();
      fetchRouteInfo();
    }
  }, [routeId]);

  const fetchRouteInfo = async () => {
     try {
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/routes?limit=100`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      const data = await res.json();
      const current = data.items?.find((r: any) => r.id === routeId);
      if (current) setRouteName(current.name);
    } catch (err) {
      console.error('Failed to fetch route info:', err);
    }
  }

  const fetchCollections = async () => {
    try {
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      
      const res = await fetch(`${apiURL}/api/routes/${routeId}/cobrancas`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setTrips(data);
      } else {
        setTrips([]);
      }
    } catch (err) {
      setTrips([]);
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
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/routes/${routeId}/cobrancas`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug || '' 
        },
        body: JSON.stringify({ sellerId: seller?.id })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create trip');
      }
      
      await setActiveTrip({ id: data.id, routeId: routeId as string, code: data.code });
      await fetchCollections();
      Alert.alert('Sucesso', 'Nova viagem iniciada!');
      router.push(`/(main)/collection-detail/${data.id}` as any);
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>{routeName}</Text>
        
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.card}
                onPress={() => {
                  if (item.status === 'aberta') {
                    setActiveTrip({ id: item.id, routeId: routeId as string, code: item.code });
                    router.push(`/(main)/collection-detail/${item.id}` as any);
                  } else {
                    Alert.alert('Viagem Encerrada', 'Esta viagem já foi finalizada e não pode ser editada.');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.statusHeader, 
                  { backgroundColor: item.status === 'aberta' ? '#10b981' : '#ef4444' }
                ]}>
                   <Text style={styles.statusText}>
                     {item.status === 'aberta' ? 'EM ANDAMENTO' : 'FINALIZADA'}
                   </Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.tripTitle}>VIAGEM - {String(item.code).padStart(2, '0')}</Text>
                  
                  <View style={styles.dateRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>DATA INÍCIO: {formatDate(item.startDate)}</Text>
                    </View>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>DATA FINAL: {formatDate(item.endDate)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <RouteIcon size={48} color="#444" />
                <Text style={styles.emptyText}>Nenhuma viagem registrada.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* FIXED BOTTOM BUTTON */}
      <View style={styles.footerAction}>
        <TouchableOpacity 
          style={styles.newTripButton} 
          onPress={handleNewTrip}
          disabled={creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Plus size={20} color="#000" strokeWidth={3} style={{ marginRight: 8 }} />
              <Text style={styles.newTripText}>NOVA VIAGEM</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#fff',
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
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statusHeader: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  cardBody: {
    padding: 20,
    backgroundColor: '#111111', // Um pouco mais claro que o fundo preto #050505
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  tripTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  dateValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.3,
  },
  emptyText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 14,
  },
  footerAction: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  newTripButton: {
    backgroundColor: '#10b981',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newTripText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
