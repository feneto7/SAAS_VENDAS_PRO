import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Colors, GlobalStyles, UI } from '../../theme/theme';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { ChevronLeft, Search, MapPin, ArrowRight, Map } from 'lucide-react-native';
import { db } from '../../services/database';

export const RoutesScreen = () => {
  const { navigate, goBack } = useNavigationStore();
  const user = useAuthStore((state) => state.user);
  
  const [routes, setRoutes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      // 1. Mostrar dados que já estão no SQLite (Instantâneo)
      const localData = await db.getAllAsync('SELECT * FROM routes WHERE active = 1 ORDER BY name ASC');
      setRoutes(localData);
      setLoading(false);
      
      // 2. Sincronismo transparente em background
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

      if (token && tenantSlug && user?.id) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s
        try {
          const res = await fetch(`${API_URL}/api/routes?limit=100`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-tenant-slug': tenantSlug
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json();
            const serverRoutes = data.items || [];
            
            if (serverRoutes.length > 0) {
              await db.withTransactionAsync(async () => {
                for (const r of serverRoutes) {
                  await db.runAsync(
                    'INSERT INTO routes (id, code, name, active) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET code=excluded.code, name=excluded.name, active=excluded.active',
                    [r.id, r.code ? String(r.code) : null, r.name, r.active ? 1 : 0]
                  );
                }
              });
              const updatedLocalData = await db.getAllAsync('SELECT * FROM routes WHERE active = 1 ORDER BY name ASC');
              setRoutes(updatedLocalData);
            }
          } else {

          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);

        }
      }
    } catch (e) {

      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={GlobalStyles.glowTop} pointerEvents="none" />
      <View style={GlobalStyles.glowBottom} pointerEvents="none" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color={Colors.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Minhas Rotas</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar rota..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredRoutes}
            keyExtractor={(item, index) => item.id || String(index)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Map size={48} color={Colors.cardBorder} />
                <Text style={styles.emptyText}>Nenhuma rota offline encontrada.</Text>
                <Text style={styles.emptySub}>As rotas serão carregadas no próximo\nsincronismo com o servidor.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={UI.listItem} 
                activeOpacity={0.8} 
                onPress={() => navigate('charges', { routeId: item.id, routeName: item.name })}
              >
                <View style={styles.routeIconBox}>
                  <MapPin size={22} color={Colors.white} />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{item.name}</Text>
                  <Text style={styles.routeDesc}>Toque para ver os clientes</Text>
                </View>
                <ArrowRight size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.white, letterSpacing: 0.5, textTransform: 'uppercase' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.inputBorder, paddingHorizontal: 16, height: 52, marginBottom: 24 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 40 },
  routeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  routeInfo: { flex: 1 },
  routeName: { fontSize: 17, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  routeDesc: { fontSize: 13, color: Colors.textSecondary },
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.7 },
  emptyText: { color: Colors.white, fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: { color: Colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 }
});
