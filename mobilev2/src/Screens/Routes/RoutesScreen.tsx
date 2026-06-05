import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { getGlobalStyles, getUIStyles } from '../../theme/theme';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTheme } from '../../stores/useThemeStore';
import { ChevronLeft, Search, MapPin, ArrowRight, Map } from 'lucide-react-native';
import { db } from '../../services/database';

export const RoutesScreen = () => {
  const { navigate, goBack } = useNavigationStore();
  const user = useAuthStore((state) => state.user);
  
  const [routes, setRoutes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { colors, isDark } = useTheme();
  const GlobalStyles = useMemo(() => getGlobalStyles(colors), [colors]);
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);

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
          const res = await fetch(`${API_URL}/api/routes?limit=100&sellerId=${user.id}`, {
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
            
            await db.withTransactionAsync(async () => {
              const serverIds: string[] = [];
              for (const r of serverRoutes) {
                serverIds.push(r.id);
                await db.runAsync(
                  'INSERT INTO routes (id, code, name, active) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET code=excluded.code, name=excluded.name, active=excluded.active',
                  [r.id, r.code ? String(r.code) : null, r.name, r.active ? 1 : 0]
                );
              }
              
              // Remove rotas que não pertencem mais ao vendedor
              if (serverIds.length > 0) {
                const placeholders = serverIds.map(() => '?').join(',');
                await db.runAsync(`DELETE FROM routes WHERE id NOT IN (${placeholders})`, serverIds);
              } else {
                await db.runAsync('DELETE FROM routes');
              }
            });
            const updatedLocalData = await db.getAllAsync('SELECT * FROM routes WHERE active = 1 ORDER BY name ASC');
            setRoutes(updatedLocalData);
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} /> 
      
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <TouchableOpacity onPress={goBack} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
            <ChevronLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5, textTransform: 'uppercase' }}>Minhas Rotas</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 16, borderWidth: 1.5, borderColor: colors.inputBorder, paddingHorizontal: 16, height: 52, marginBottom: 24 }}>
          <Search size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
          <TextInput
            placeholder="Buscar rota..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, fontSize: 16, color: colors.textInput }}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredRoutes}
            keyExtractor={(item, index) => item.id || String(index)}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 80, opacity: 0.7 }}>
                <Map size={48} color={colors.border} />
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 16 }}>Nenhuma rota offline encontrada.</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>As rotas serão carregadas no próximo{'\n'}sincronismo com o servidor.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={UI.listItem} 
                activeOpacity={0.8} 
                onPress={() => navigate('charges', { routeId: item.id, routeName: item.name })}
              >
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: colors.borderSubtle }}>
                  <MapPin size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>{item.name}</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>Toque para ver os clientes</Text>
                </View>
                <ArrowRight size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
