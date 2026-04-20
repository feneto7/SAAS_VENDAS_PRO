import React, { useState, useEffect } from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
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
import { useThemeColor } from '../../components/Themed';
import { queryAll } from '../../lib/db';
import { SyncService } from '../../lib/sync/syncService';

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

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      
      // 1. Try local data first
      const localData = await queryAll<any>('SELECT * FROM routes WHERE active = 1 ORDER BY name ASC');
      let filtered = localData;
      const sRouteIds = seller?.routeIds;
      if (sRouteIds && Array.isArray(sRouteIds)) {
        filtered = localData.filter((r: Route) => sRouteIds.includes(r.id));
      }
      
      if (filtered.length > 0) {
        setRoutes(filtered);
        setLoading(false);
      }

      // 2. Background sync
      try {
        const apiURL = process.env.EXPO_PUBLIC_API_URL;
        await SyncService.downloadMasterData(tenantSlug || '', seller?.id);
        
        const updatedData = await queryAll<any>('SELECT * FROM routes WHERE active = 1 ORDER BY name ASC');
        let updatedFiltered = updatedData;
        if (sRouteIds && Array.isArray(sRouteIds)) {
          updatedFiltered = updatedData.filter((r: Route) => sRouteIds.includes(r.id));
        }
        setRoutes(updatedFiltered);
      } catch (err) {
        console.log('[RoutesScreen] Background sync failed');
      }
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
    <DefaultView style={[styles.container, { backgroundColor }]}>
      <DefaultView style={styles.content}>
        <DefaultText style={[styles.pageTitle, { color: textColor }]}>Minhas Rotas</DefaultText>
        {/* Search Bar */}
        <DefaultView style={[styles.searchContainer, { backgroundColor: surfaceColor, borderColor }]}>
          <Search size={20} color={placeholderColor} style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar rota..."
            placeholderTextColor={placeholderColor}
            style={[styles.searchInput, { color: textColor }]}
            value={search}
            onChangeText={setSearch}
          />
        </DefaultView>

        {loading ? (
          <DefaultView style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
          </DefaultView>
        ) : (
          <FlatList
            data={filteredRoutes}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.routeItem, { backgroundColor: cardColor, borderColor }]}
                onPress={() => router.push({ pathname: '/(main)/collections/[id]', params: { id: item.id } })}
              >
                <LinearGradient
                  colors={[primaryColor + '08', primaryColor + '02']}
                  style={styles.routeGradient}
                >
                  <DefaultView style={[styles.routeIconBox, { backgroundColor: primaryColor + '10' }]}>
                    <MapPin size={22} color={primaryColor} />
                  </DefaultView>
                  <DefaultView style={styles.routeInfo}>
                    <DefaultText style={[styles.routeName, { color: textColor }]}>{item.name}</DefaultText>
                    <DefaultText style={[styles.routeDesc, { color: secondaryColor }]}>Toque para ver clientes</DefaultText>
                  </DefaultView>
                  <ArrowRight size={18} color={borderColor} />
                </LinearGradient>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <DefaultView style={styles.emptyContainer}>
                <Map size={48} color={borderColor} />
                <DefaultText style={[styles.emptyText, { color: secondaryColor }]}>Nenhuma rota encontrada.</DefaultText>
              </DefaultView>
            }
          />
        )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 17,
    fontWeight: '700',
  },
  routeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  }
});
