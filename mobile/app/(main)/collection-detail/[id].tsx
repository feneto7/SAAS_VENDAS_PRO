import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
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

export default function CollectionDetailScreen() {
  const { id: tripId } = useLocalSearchParams();
  const { tenantSlug, setActiveTrip, activeTrip } = useTenant();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [routeName, setRouteName] = useState('Carregando...');

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      // We'll need a way to get trip info. For now we use the context routeId if available 
      // or fetch from an endpoint. Let's assume we have a generic fetch or use the data passed.
      // Since we already have routeId in activeTrip context, we can use it.
      
      const res = await fetch(`${apiURL}/api/routes/${activeTrip?.routeId}/cobrancas`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      const data = await res.json();
      
      const tripsArray = Array.isArray(data) ? data : [];
      const current = tripsArray.find((t: any) => t.id === tripId);
      
      if (current) {
        setTripData(current);
        // Fetch route name
        const routeRes = await fetch(`${apiURL}/api/routes?limit=100`, {
          headers: { 'x-tenant-slug': tenantSlug || '' }
        });
        const routeData = await routeRes.json();
        const route = routeData.items?.find((r: any) => r.id === current.routeId);
        if (route) setRouteName(route.name);
      }
    } catch (err) {
      console.error('Failed to fetch trip details:', err);
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

      await setActiveTrip(null);
      Alert.alert('Sucesso', 'Viagem encerrada com sucesso!');
      router.back();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível encerrar a viagem.');
    } finally {
      setEnding(false);
    }
  };

  const ActionButton = ({ icon: Icon, label, onPress, color = '#10b981' }: any) => (
    <TouchableOpacity 
      style={styles.actionButton} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>
          {routeName} - VIAGEM - {tripData?.code}
        </Text>

        <View style={styles.grid}>
          <ActionButton icon={Users} label="Clientes" color="#3b82f6" onPress={() => {}} />
          <ActionButton icon={Receipt} label="Despesas" color="#f59e0b" onPress={() => {}} />
          <ActionButton icon={Container} label="Depósitos" color="#8b5cf6" onPress={() => {}} />
          <ActionButton icon={Package} label="Produtos" color="#ec4899" onPress={() => {}} />
          <ActionButton icon={FileSearch} label="Relatórios" color="#10b981" onPress={() => {}} />
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.endTripButton} 
          onPress={handleEndTrip}
          disabled={ending}
        >
          {ending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Power size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.endTripText}>ENCERRAR VIAGEM</Text>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
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
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    color: '#fff',
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
    backgroundColor: '#050505',
  },
  endTripButton: {
    backgroundColor: '#ef4444',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
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
