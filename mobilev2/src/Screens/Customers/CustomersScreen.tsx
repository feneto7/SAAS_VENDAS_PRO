import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ActivityIndicator, SafeAreaView, StatusBar 
} from 'react-native';
import { Colors, GlobalStyles, UI } from '../../theme/theme';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  ChevronLeft, Search, User, MapPin, 
  Phone, Hash, FilterX 
} from 'lucide-react-native';
import { db } from '../../services/database';

const PAGE_SIZE = 20;

export const CustomersScreen = () => {
  const { navigate, goBack, currentParams } = useNavigationStore();
  const { routeId, routeName } = currentParams || {};

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Carregar inicial ao montar ou trocar rota
  useEffect(() => {
    if (routeId) {
      loadCustomers(1, true);
    }
  }, [routeId]);

  const loadCustomers = async (pageToLoad: number, isInitial: boolean = false, searchQuery: string = search) => {
    // Prevent multiple simultaneous loads
    if (pageToLoad > 1 && loadingMore) return;
    
    if (isInitial) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = (pageToLoad - 1) * PAGE_SIZE;
      
      // 1. CARREGAMENTO LOCAL IMEDIATO
      const query = searchQuery 
        ? `SELECT * FROM clients WHERE route_id = ? AND name LIKE ? ORDER BY name COLLATE NOCASE LIMIT ? OFFSET ?`
        : `SELECT * FROM clients WHERE route_id = ? ORDER BY name COLLATE NOCASE LIMIT ? OFFSET ?`;
      
      const fetchLocal = async () => {
        const p = searchQuery 
          ? [routeId, `%${searchQuery}%`, PAGE_SIZE, offset] 
          : [routeId, PAGE_SIZE, offset];
        return await db.getAllAsync<any>(query, p);
      };

      const localData = await fetchLocal();

      if (isInitial) {
        setCustomers(localData);
        // Se temos dados locais, já podemos liberar o loading principal
        if (localData.length > 0) setLoading(false);
      } else {
        setCustomers(prev => [...prev, ...localData]);
      }

      // 2. SINCRONISMO EM BACKGROUND
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

      if (token && tenantSlug && routeId) {
        try {
          const res = await fetch(`${API_URL}/api/clients?routeId=${routeId}&name=${searchQuery}&page=${pageToLoad}&limit=${PAGE_SIZE}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-tenant-slug': tenantSlug
            }
          });

          if (res.ok) {
            const data = await res.json();
            const serverItems = data.items || [];
            
            if (serverItems.length > 0) {
              await db.withTransactionAsync(async () => {
                for (const c of serverItems) {
                  await db.runAsync(
                    `INSERT INTO clients (id, code, name, cpf, phone, street, number, neighborhood, city, state, zip_code, route_id, active) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                     ON CONFLICT(id) DO UPDATE SET 
                     name=excluded.name, phone=excluded.phone, active=excluded.active, 
                     street=excluded.street, neighborhood=excluded.neighborhood, city=excluded.city, code=excluded.code`,
                    [c.id, String(c.code), c.name, c.cpf, c.phone, c.street, c.number, c.neighborhood, c.city, c.state, c.zipCode, routeId, c.active ? 1 : 0]
                  );
                }
              });

              // RE-READ FROM LOCAL DB AFTER SYNC
              const updatedLocalData = await fetchLocal();
              
              if (isInitial) {
                setCustomers(updatedLocalData);
              } else {
                setCustomers(prev => {
                  const head = prev.slice(0, offset);
                  const ids = new Set(head.map(p => p.id));
                  const filtered = updatedLocalData.filter((s: any) => !ids.has(s.id));
                  return [...head, ...filtered];
                });
              }
              
              setHasMore(data.pagination.page < data.pagination.pages);
            } else {
              if (isInitial && localData.length === 0) setCustomers([]);
              setHasMore(false);
            }
          }
        } catch (fetchErr) {
           console.log('[DEBUG] Background sync failed (clients):', fetchErr);
           // Suprimimos o erro se já temos dados locais
           if (isInitial && localData.length === 0) {
             // Opcional: mostrar mensagem amigável de offline no futuro
           }
        }
      }
    } catch (e) {
      console.log('[DEBUG] Critical error in loadCustomers:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    // Debounce manual simplificado: aguarda 500ms
    const timeoutId = setTimeout(() => {
      loadCustomers(1, true, text);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [routeId]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadCustomers(nextPage);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={UI.listItem} 
      activeOpacity={0.8}
      onPress={() => navigate('customerDetail', { 
        clientId: item.id, 
        clientName: item.name,
        routeId: item.routeId || routeId,
        routeName
      })}
    >
      <View style={styles.clientInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.clientName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.clientCode}>#{item.code || '---'}</Text>
        </View>
        
        <View style={styles.addressBox}>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.city || 'Cidade N/I'} - {item.neighborhood || 'Bairro N/I'}
          </Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.street || 'Rua não informada'}{item.number ? `, ${item.number}` : ''}
          </Text>
        </View>

        {item.phone && (
          <View style={styles.phoneRow}>
            <Phone size={12} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.phoneText}>{item.phone}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={GlobalStyles.glowTop} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color={Colors.white} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.title}>Clientes da Rota</Text>
            <Text style={styles.subtitle}>{routeName || 'Rota'}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Search color={Colors.textMuted} size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => loadCustomers(1, true, search)}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Carregando clientes...</Text>
          </View>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FilterX size={64} color={Colors.cardBorder} />
                <Text style={styles.emptyText}>Nenhum cliente encontrado.</Text>
                <Text style={styles.emptySub}>Tente ajustar sua busca ou verifique se há clientes vinculados a esta rota.</Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator color={Colors.primary} />
                </View>
              ) : null
            }
          />
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
  
  searchContainer: { marginBottom: 24 },
  searchInputWrapper: {
    height: 52,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchIcon: { marginRight: 12 },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },

  listContent: { paddingBottom: 40 },
  clientInfo: { flex: 1 },
  nameRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  clientName: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: Colors.textPrimary, 
    flex: 1 
  },
  clientCode: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: Colors.textSecondary, 
    marginLeft: 12 
  },
  addressBox: { 
    gap: 4,
    marginBottom: 8
  },
  addressText: { 
    fontSize: 14, 
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 20
  },
  phoneRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4
  },
  phoneText: { 
    fontSize: 14, 
    color: Colors.textSecondary, 
    fontWeight: '600' 
  },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.7 },
  emptyText: { color: Colors.white, fontSize: 16, fontWeight: '600', marginTop: 24 },
  emptySub: { color: Colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 40 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' }
});
