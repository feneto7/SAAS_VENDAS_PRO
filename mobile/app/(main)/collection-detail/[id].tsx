import React, { useState, useEffect } from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTenant } from '../../../lib/TenantContext';
import { 
  Users, 
  Receipt, 
  Container, 
  Package, 
  FileSearch,
  LogOut,
  Power
} from 'lucide-react-native';
import { useThemeColor } from '../../../components/Themed';
import { queryAll, queryFirst } from '../../../lib/db';
import { SyncService } from '../../../lib/sync/syncService';

export default function CollectionDetailScreen() {
  const { id: tripId, routeName: initialRouteName, code: initialCode } = useLocalSearchParams();
  const { tenantSlug, setActiveTrip, activeTrip } = useTenant();
  const router = useRouter();
  const [loading, setLoading] = useState(!initialCode);
  const [ending, setEnding] = useState(false);
  const [tripData, setTripData] = useState<any>(initialCode ? { code: initialCode } : null);
  const [routeName, setRouteName] = useState((initialRouteName as string) || 'Carregando...');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const infoColor = useThemeColor({}, 'primary');
  const placeholderColor = useThemeColor({}, 'placeholder');

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      
      // 1. Local
      const localTrip = await queryFirst<any>('SELECT * FROM cobrancas WHERE id = ?', [tripId]);
      if (localTrip) {
        setTripData({
          ...localTrip,
          routeId: localTrip.route_id
        });
        
        const localRoute = await queryFirst<any>('SELECT name FROM routes WHERE id = ?', [localTrip.route_id]);
        if (localRoute) setRouteName(localRoute.name);
        
        setLoading(false);
      }

      // 2. Remote fallback/refresh
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const [tripsRes, routesRes] = await Promise.all([
        fetch(`${apiURL}/api/routes/${localTrip?.route_id || activeTrip?.routeId}/cobrancas`, {
          headers: { 'x-tenant-slug': tenantSlug || '' }
        }),
        initialRouteName ? Promise.resolve(null) : fetch(`${apiURL}/api/routes?limit=100`, {
          headers: { 'x-tenant-slug': tenantSlug || '' }
        })
      ]);

      if (tripsRes.ok) {
        const data = await tripsRes.json();
        const tripsArray = Array.isArray(data) ? data : [];
        const current = tripsArray.find((t: any) => t.id === tripId);
        if (current) setTripData(current);
      }
      
      if (routesRes && routesRes.ok) {
        const routeData = await routesRes.json();
        const tripRouteId = localTrip?.route_id || activeTrip?.routeId;
        const route = routeData.items?.find((r: any) => r.id === tripRouteId);
        if (route) setRouteName(route.name);
      }
    } catch (err) {
      console.warn('[CollectionDetail] Failed to fetch trip details in background:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    Alert.alert(
      'Encerrar Viagem',
      'Deseja realmente encerrar esta viagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Encerrar', 
          style: 'destructive',
          onPress: performEndTrip
        }
      ]
    );
  };

  const performEndTrip = async () => {
    setEnding(true);
    try {
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/cobrancas/${tripId}/close`, {
        method: 'PATCH',
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });

      if (!res.ok) throw new Error('Falha ao encerrar viagem');
      
      const routeId = tripData?.routeId || activeTrip?.routeId;

      await setActiveTrip(null);
      
      Alert.alert(
        'Sucesso', 
        'Viagem encerrada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (routeId) {
                router.replace(`/(main)/collections/${routeId}` as any);
              } else {
                router.replace('/(main)/routes' as any);
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error('End trip error:', err);
      Alert.alert('Erro', 'Não foi possível encerrar a viagem.');
    } finally {
      setEnding(false);
    }
  };

  const ActionButton = ({ icon: Icon, label, onPress, color = primaryColor }: any) => (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: cardColor, borderColor }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <DefaultView style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={24} color={color} />
      </DefaultView>
      <DefaultText style={[styles.actionLabel, { color: textColor }]}>{label}</DefaultText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <DefaultView style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </DefaultView>
    );
  }

  return (
    <DefaultView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <DefaultText style={[styles.pageTitle, { color: textColor }]}>
          {routeName} - VIAGEM - {tripData?.code}
        </DefaultText>

        <DefaultView style={styles.grid}>
          <ActionButton 
            icon={Users} 
            label="Clientes" 
            color="#3b82f6" 
            onPress={() => router.push({
              pathname: '/(main)/clients',
              params: { routeName }
            } as any)} 
          />
          <ActionButton icon={Receipt} label="Despesas" color="#f59e0b" onPress={() => {}} />
          <ActionButton icon={Container} label="Depósitos" color="#8b5cf6" onPress={() => {}} />
          <ActionButton icon={Package} label="Produtos" color="#ec4899" onPress={() => {}} />
          <ActionButton icon={FileSearch} label="Relatórios" color="#10b981" onPress={() => {}} />
        </DefaultView>
      </ScrollView>

      {/* FOOTER */}
      <DefaultView style={[styles.footer, { backgroundColor }]}>
        <TouchableOpacity 
          style={[styles.endTripButton, { backgroundColor: errorColor, shadowColor: errorColor }]} 
          onPress={handleEndTrip}
          disabled={ending}
        >
          {ending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Power size={20} color="#fff" style={{ marginRight: 8 }} />
              <DefaultText style={styles.endTripText}>ENCERRAR VIAGEM</DefaultText>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 32,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  endTripButton: {
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
  endTripText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
