import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { getGlobalStyles, getUIStyles } from '../../theme/theme';
import { useTheme } from '../../stores/useThemeStore';
import { Map, PackageSearch, LogOut, Sun, Moon } from 'lucide-react-native';
import { SellerInventoryModal } from './components/SellerInventoryModal';

export const HomeScreen = () => {
  const navigate = useNavigationStore((state) => state.navigate);
  const user = useAuthStore((state) => state.user);
  const tenant = useAuthStore((state) => state.tenant);
  const logout = useAuthStore((state) => state.logout);
  const { colors, isDark, toggleTheme } = useTheme();

  const [isInventoryVisible, setIsInventoryVisible] = React.useState(false);

  const GlobalStyles = useMemo(() => getGlobalStyles(colors), [colors]);
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48, flexGrow: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>Olá, {user?.name}</Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4, fontWeight: '500' }}>{tenant?.name || tenant?.slug}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={toggleTheme}
            activeOpacity={0.7}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.surfaceRaised,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDark ? (
              <Sun size={24} color={colors.textPrimary} />
            ) : (
              <Moon size={24} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={{ gap: 20 }}>
          <TouchableOpacity style={UI.actionCard} activeOpacity={0.8} onPress={() => navigate('routes')}>
            <Map size={36} color={colors.accent} strokeWidth={2.2} />
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, marginTop: 12 }}>Minhas Rotas</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, fontWeight: '500' }}>Inicie suas vendas e visitas programadas para hoje.</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={UI.actionCard} 
            activeOpacity={0.8} 
            onPress={() => setIsInventoryVisible(true)}
          >
            <PackageSearch size={36} color={colors.accent} strokeWidth={2.2} />
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, marginTop: 12 }}>Produtos</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, fontWeight: '500' }}>Consulte o catálogo, tabela de preços e saldo do estoque.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} 
          onPress={logout} 
          activeOpacity={0.7}
        >
          <LogOut size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>Sair</Text>
        </TouchableOpacity>
      </View>

      <SellerInventoryModal 
        visible={isInventoryVisible} 
        onClose={() => setIsInventoryVisible(false)} 
      />

    </SafeAreaView>
  );
};
