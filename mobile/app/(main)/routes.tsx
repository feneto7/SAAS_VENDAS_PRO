import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTenant } from '../../lib/TenantContext';
import { 
  Map, 
  Search, 
  ChevronLeft, 
  ArrowRight,
  MapPin
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Route {
  id: string;
  name: string;
}

export default function RoutesScreen() {
  const { tenantSlug, seller } = useTenant();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/routes?limit=100`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      const data = await res.json();
      
      let filtered = data.items || [];
      const sRouteIds = seller?.routeIds;
      if (sRouteIds && Array.isArray(sRouteIds)) {
        filtered = filtered.filter((r: Route) => sRouteIds.includes(r.id));
      }
      
      setRoutes(filtered);
    } catch (err) {
      console.error('Failed to fetch routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Minhas Rotas</Text>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar rota..."
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : (
          <FlatList
            data={filteredRoutes}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.routeItem}
                onPress={() => router.push({ pathname: '/(main)/collections/[id]', params: { id: item.id } })}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                  style={styles.routeGradient}
                >
                  <View style={styles.routeIconBox}>
                    <MapPin size={22} color="#7c3aed" />
                  </View>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeName}>{item.name}</Text>
                    <Text style={styles.routeDesc}>Toque para ver clientes</Text>
                  </View>
                  <ArrowRight size={18} color="#444" />
                </LinearGradient>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Map size={48} color="#222" />
                <Text style={styles.emptyText}>Nenhuma rota encontrada.</Text>
              </View>
            }
          />
        )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  routeItem: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#111', 
  },
  routeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  routeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  routeDesc: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  emptyText: {
    color: '#666',
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  }
});
